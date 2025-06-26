
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SquarePayment {
  id: string;
  created_at: string;
  updated_at: string;
  amount_money: {
    amount: number;
    currency: string;
  };
  status: string;
  delay_duration?: string;
  source_type: string;
  location_id?: string;
  order_id?: string;
  processing_fee?: Array<{
    effective_at: string;
    type: string;
    amount_money: {
      amount: number;
      currency: string;
    };
  }>;
  card_details?: {
    status: string;
    card: {
      card_brand: string;
      last_4: string;
      exp_month: number;
      exp_year: number;
      fingerprint: string;
      card_type: string;
      prepaid_type: string;
      bin: string;
    };
    entry_method: string;
    cvv_status: string;
    avs_status: string;
    auth_result_code: string;
    application_identifier: string;
    application_name: string;
    application_cryptogram: string;
    verification_method: string;
    verification_results: string;
    statement_description: string;
    device_details: {
      device_id: string;
      device_installation_id: string;
      device_name: string;
    };
  };
  bank_account_details?: any;
  external_details?: any;
  wallet_details?: any;
  buy_now_pay_later_details?: any;
  square_account_details?: any;
  additional_recipients?: any[];
  net_amount_due_money?: {
    amount: number;
    currency: string;
  };
  total_money: {
    amount: number;
    currency: string;
  };
  approved_money: {
    amount: number;
    currency: string;
  };
  receipt_number: string;
  receipt_url: string;
  device_details?: {
    device_id: string;
    device_installation_id: string;
    device_name: string;
  };
  application_details?: {
    square_product: string;
    application_id: string;
  };
  version_token?: string;
}

interface SquarePaymentsResponse {
  payments?: SquarePayment[];
  cursor?: string;
  errors?: Array<{
    category: string;
    code: string;
    detail: string;
    field?: string;
  }>;
}

interface SyncRequest {
  environment?: 'sandbox' | 'production';
  date_range?: {
    start: string;
    end: string;
  };
  limit?: number;
  historical?: boolean;
  clear_existing?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const MAX_EXECUTION_TIME = 8 * 60 * 1000; // 8 minutes to leave buffer before 9min timeout

  try {
    console.log('Starting Square payments sync...');

    // Parse request body for sync parameters
    let syncParams: SyncRequest = {};
    if (req.method === 'POST') {
      try {
        syncParams = await req.json();
      } catch (e) {
        console.log('No valid JSON body, using defaults');
      }
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Clear existing data if requested
    if (syncParams.clear_existing) {
      console.log('Clearing existing test data...');
      
      // Clear revenue_events first (due to foreign key constraint)
      const { error: revenueError } = await supabase
        .from('revenue_events')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows
      
      if (revenueError) {
        console.error('Error clearing revenue_events:', revenueError);
      } else {
        console.log('Cleared revenue_events table');
      }

      // Clear square_payments_raw
      const { error: rawError } = await supabase
        .from('square_payments_raw')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows
      
      if (rawError) {
        console.error('Error clearing square_payments_raw:', rawError);
      } else {
        console.log('Cleared square_payments_raw table');
      }
    }

    // Get Square API credentials
    const sandboxToken = Deno.env.get('SQUARE_SANDBOX_ACCESS_TOKEN');
    const productionToken = Deno.env.get('SQUARE_PRODUCTION_ACCESS_TOKEN');

    if (!sandboxToken && !productionToken) {
      throw new Error('No Square API tokens configured');
    }

    // Determine which environment to sync
    const environment = syncParams.environment || (req.url.includes('production') ? 'production' : 'sandbox');
    const accessToken = environment === 'production' ? productionToken : sandboxToken;

    if (!accessToken) {
      throw new Error(`No access token configured for ${environment} environment`);
    }

    console.log(`Syncing ${environment} environment...`);

    // Get sync status
    const { data: syncStatus, error: syncStatusError } = await supabase
      .from('square_sync_status')
      .select('last_successful_sync, id')
      .eq('environment', environment)
      .single();

    if (syncStatusError) {
      console.error('Error fetching sync status:', syncStatusError);
      throw new Error('Failed to fetch sync status');
    }

    // Update sync status to running
    await supabase
      .from('square_sync_status')
      .update({
        sync_status: 'running',
        last_sync_attempt: new Date().toISOString()
      })
      .eq('id', syncStatus.id);

    // Determine sync time range
    let beginTime: string;
    let endTime: string | undefined;

    if (syncParams.date_range) {
      // Historical sync with specific date range
      beginTime = syncParams.date_range.start;
      endTime = syncParams.date_range.end;
      console.log(`Historical sync from ${beginTime} to ${endTime}`);
    } else if (syncParams.historical) {
      // Historical sync for last year
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      beginTime = oneYearAgo.toISOString();
      endTime = new Date().toISOString();
      console.log(`Historical sync for last year: ${beginTime} to ${endTime}`);
    } else {
      // Regular incremental sync
      beginTime = syncStatus.last_successful_sync || 
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      console.log(`Incremental sync since: ${beginTime}`);
    }

    // Build Square API URL
    const baseUrl = environment === 'sandbox' 
      ? 'https://connect.squareupsandbox.com'
      : 'https://connect.squareup.com';

    let allPayments: SquarePayment[] = [];
    let cursor: string | undefined;
    let totalFetched = 0;
    const batchLimit = syncParams.limit || 100;
    const maxPayments = 5000; // Increased from 1000 to handle larger datasets

    // Paginate through all payments
    do {
      // Check if we're approaching timeout
      if (Date.now() - startTime > MAX_EXECUTION_TIME) {
        console.log('Approaching timeout, stopping fetch and processing what we have...');
        break;
      }

      const url = new URL(`${baseUrl}/v2/payments`);
      url.searchParams.append('begin_time', beginTime);
      if (endTime) {
        url.searchParams.append('end_time', endTime);
      }
      url.searchParams.append('sort_order', 'ASC');
      url.searchParams.append('limit', batchLimit.toString());
      if (cursor) {
        url.searchParams.append('cursor', cursor);
      }

      console.log(`Fetching batch with cursor: ${cursor || 'none'}, total so far: ${totalFetched}`);

      // Fetch payments from Square API
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Square-Version': '2024-12-18',
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Square API Error (${response.status}): ${errorText}`);
      }

      const paymentsData: SquarePaymentsResponse = await response.json();
      
      if (paymentsData.payments && paymentsData.payments.length > 0) {
        allPayments.push(...paymentsData.payments);
        totalFetched += paymentsData.payments.length;
        console.log(`Fetched ${paymentsData.payments.length} payments (total: ${totalFetched})`);
      }

      cursor = paymentsData.cursor;
      
      // Reduced delay for faster processing
      if (cursor) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }

    } while (cursor && totalFetched < maxPayments);

    console.log(`Total payments fetched: ${totalFetched}`);

    let paymentsProcessed = 0;
    const batchSize = 50; // Process payments in batches for better performance

    if (allPayments.length > 0) {
      // Process payments in batches
      for (let i = 0; i < allPayments.length; i += batchSize) {
        // Check timeout before each batch
        if (Date.now() - startTime > MAX_EXECUTION_TIME) {
          console.log(`Timeout approaching, processed ${paymentsProcessed} of ${allPayments.length} payments`);
          break;
        }

        const batch = allPayments.slice(i, i + batchSize);
        console.log(`Processing batch ${Math.floor(i / batchSize) + 1}, payments ${i + 1}-${Math.min(i + batchSize, allPayments.length)} of ${allPayments.length}`);

        // Process each payment in the batch
        for (const payment of batch) {
          try {
            // Store raw payment data
            const { error: rawInsertError } = await supabase
              .from('square_payments_raw')
              .upsert({
                square_payment_id: payment.id,
                raw_response: payment,
                api_version: '2024-12-18',
                sync_timestamp: new Date().toISOString()
              }, {
                onConflict: 'square_payment_id'
              });

            if (rawInsertError) {
              console.error(`Error storing raw payment ${payment.id}:`, rawInsertError);
              continue;
            }

            // Transform and store revenue event
            const paymentDate = new Date(payment.created_at);
            const revenueType = categorizePayment(payment);
            
            const revenueEvent = {
              square_payment_id: payment.id,
              venue: 'default',
              revenue_type: revenueType,
              amount_cents: payment.amount_money.amount,
              currency: payment.amount_money.currency,
              payment_date: payment.created_at,
              payment_hour: paymentDate.getHours(),
              payment_day_of_week: paymentDate.getDay(),
              status: payment.status.toLowerCase()
            };

            const { error: revenueInsertError } = await supabase
              .from('revenue_events')
              .upsert(revenueEvent, {
                onConflict: 'square_payment_id'
              });

            if (revenueInsertError) {
              console.error(`Error storing revenue event for payment ${payment.id}:`, revenueInsertError);
              continue;
            }

            paymentsProcessed++;
          } catch (error) {
            console.error(`Error processing payment ${payment.id}:`, error);
            continue;
          }
        }

        // Log progress every batch
        console.log(`Batch complete. Total processed: ${paymentsProcessed}/${allPayments.length}`);
      }
    }

    // Determine final status
    const isComplete = paymentsProcessed === allPayments.length && !cursor;
    const finalStatus = isComplete ? 'success' : 'partial';

    // Update sync status
    await supabase
      .from('square_sync_status')
      .update({
        last_successful_sync: isComplete ? new Date().toISOString() : syncStatus.last_successful_sync,
        sync_status: finalStatus,
        payments_synced: paymentsProcessed,
        error_message: isComplete ? null : `Partial sync: processed ${paymentsProcessed} of ${totalFetched} fetched payments`
      })
      .eq('id', syncStatus.id);

    const executionTime = Math.round((Date.now() - startTime) / 1000);
    console.log(`Sync completed in ${executionTime}s. Processed ${paymentsProcessed} payments. Status: ${finalStatus}`);

    return new Response(
      JSON.stringify({
        success: true,
        environment,
        paymentsProcessed,
        totalFetched,
        cursor: cursor || null,
        isComplete,
        executionTimeSeconds: executionTime,
        message: isComplete 
          ? `Successfully synced ${paymentsProcessed} payments`
          : `Partial sync: processed ${paymentsProcessed} of ${totalFetched} payments. Use cursor to continue.`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Square sync error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

// Helper function to categorize payments
function categorizePayment(payment: SquarePayment): 'bar' | 'door' | 'other' {
  const amount = payment.amount_money.amount;
  
  if (amount <= 1500) { // $15 or less - likely door charge
    return 'door';
  } else if (amount <= 10000) { // $100 or less - likely bar sale
    return 'bar';
  } else {
    return 'other'; // Large amounts might be special events, etc.
  }
}
