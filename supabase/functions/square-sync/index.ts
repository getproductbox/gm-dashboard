
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting Square payments sync...');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get Square API credentials
    const sandboxToken = Deno.env.get('SQUARE_SANDBOX_ACCESS_TOKEN');
    const productionToken = Deno.env.get('SQUARE_PRODUCTION_ACCESS_TOKEN');

    if (!sandboxToken && !productionToken) {
      throw new Error('No Square API tokens configured');
    }

    // Determine which environment to sync (default to sandbox for safety)
    const environment = req.url.includes('production') ? 'production' : 'sandbox';
    const accessToken = environment === 'production' ? productionToken : sandboxToken;

    if (!accessToken) {
      throw new Error(`No access token configured for ${environment} environment`);
    }

    console.log(`Syncing ${environment} environment...`);

    // Get last successful sync time
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

    // Calculate since time (default to 24 hours ago if no previous sync)
    const sinceTime = syncStatus.last_successful_sync || 
      new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    console.log(`Fetching payments since: ${sinceTime}`);

    // Build Square API URL
    const baseUrl = environment === 'sandbox' 
      ? 'https://connect.squareupsandbox.com'
      : 'https://connect.squareup.com';

    const url = new URL(`${baseUrl}/v2/payments`);
    url.searchParams.append('begin_time', sinceTime);
    url.searchParams.append('sort_order', 'ASC');
    url.searchParams.append('limit', '100');

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
    console.log(`Fetched ${paymentsData.payments?.length || 0} payments`);

    let paymentsProcessed = 0;

    if (paymentsData.payments && paymentsData.payments.length > 0) {
      // Process each payment
      for (const payment of paymentsData.payments) {
        console.log(`Processing payment: ${payment.id}`);

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
          venue: 'default', // You can customize this based on location_id
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
      }
    }

    // Update sync status to success
    await supabase
      .from('square_sync_status')
      .update({
        last_successful_sync: new Date().toISOString(),
        sync_status: 'success',
        payments_synced: paymentsProcessed,
        error_message: null
      })
      .eq('id', syncStatus.id);

    console.log(`Sync completed successfully. Processed ${paymentsProcessed} payments.`);

    return new Response(
      JSON.stringify({
        success: true,
        environment,
        paymentsProcessed,
        message: `Successfully synced ${paymentsProcessed} payments`
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
  
  // Example categorization logic - customize based on your business rules
  if (amount <= 1500) { // $15 or less - likely door charge
    return 'door';
  } else if (amount <= 10000) { // $100 or less - likely bar sale
    return 'bar';
  } else {
    return 'other'; // Large amounts might be special events, etc.
  }
}
