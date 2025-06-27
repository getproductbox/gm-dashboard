
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
  continue_session?: string;
}

interface SyncSession {
  id: string;
  environment: string;
  sync_status: string;
  cursor_position?: string;
  current_date_range_start?: string;
  current_date_range_end?: string;
  total_estimated: number;
  progress_percentage: number;
  payments_fetched: number;
  payments_synced: number;
  is_continuation: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const MAX_EXECUTION_TIME = 7.5 * 60 * 1000; // 7.5 minutes to leave buffer
  const HEARTBEAT_INTERVAL = 30 * 1000; // 30 seconds
  const BATCH_SIZE = 25; // Smaller batches for better progress tracking

  try {
    console.log('Starting robust cursor-based Square payments sync...');

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

    // Reset any stuck sync states first
    await supabase.rpc('reset_stuck_sync_states');

    // Determine environment
    const environment = syncParams.environment || 'sandbox';
    
    // Get Square API credentials
    const sandboxToken = Deno.env.get('SQUARE_SANDBOX_ACCESS_TOKEN');
    const productionToken = Deno.env.get('SQUARE_PRODUCTION_ACCESS_TOKEN');
    const accessToken = environment === 'production' ? productionToken : sandboxToken;

    if (!accessToken) {
      throw new Error(`No access token configured for ${environment} environment`);
    }

    console.log(`Syncing ${environment} environment with cursor-based chunking...`);

    // Get or create sync session
    let syncSession: SyncSession;
    
    if (syncParams.continue_session) {
      // Continue existing session
      const { data: existingSession, error: sessionError } = await supabase
        .from('square_sync_status')
        .select('*')
        .eq('sync_session_id', syncParams.continue_session)
        .eq('environment', environment)
        .single();

      if (sessionError || !existingSession) {
        throw new Error('Cannot find sync session to continue');
      }

      syncSession = {
        id: existingSession.sync_session_id,
        environment: existingSession.environment,
        sync_status: 'running',
        cursor_position: existingSession.cursor_position,
        current_date_range_start: existingSession.current_date_range_start,
        current_date_range_end: existingSession.current_date_range_end,
        total_estimated: existingSession.total_estimated || 0,
        progress_percentage: existingSession.progress_percentage || 0,
        payments_fetched: existingSession.payments_fetched || 0,
        payments_synced: existingSession.payments_synced || 0,
        is_continuation: true
      };

      console.log(`Continuing sync session ${syncSession.id}, progress: ${syncSession.progress_percentage}%`);
    } else {
      // Start new session
      const sessionId = crypto.randomUUID();
      
      // Clear existing data if requested
      if (syncParams.clear_existing) {
        console.log('Clearing existing data...');
        await supabase.from('revenue_events').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('square_payments_raw').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      }

      // Determine date range
      let beginTime: string;
      let endTime: string | undefined;

      if (syncParams.date_range) {
        beginTime = syncParams.date_range.start;
        endTime = syncParams.date_range.end;
      } else if (syncParams.historical) {
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        beginTime = oneYearAgo.toISOString();
        endTime = new Date().toISOString();
      } else {
        // Get last successful sync
        const { data: lastSync } = await supabase
          .from('square_sync_status')
          .select('last_successful_sync')
          .eq('environment', environment)
          .single();
        
        beginTime = lastSync?.last_successful_sync || 
          new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      }

      syncSession = {
        id: sessionId,
        environment,
        sync_status: 'running',
        cursor_position: undefined,
        current_date_range_start: beginTime,
        current_date_range_end: endTime,
        total_estimated: 0,
        progress_percentage: 0,
        payments_fetched: 0,
        payments_synced: 0,
        is_continuation: false
      };

      console.log(`Starting new sync session ${sessionId} from ${beginTime} to ${endTime || 'now'}`);
    }

    // Update sync status with session info
    await supabase
      .from('square_sync_status')
      .upsert({
        environment,
        sync_status: 'running',
        sync_session_id: syncSession.id,
        cursor_position: syncSession.cursor_position,
        current_date_range_start: syncSession.current_date_range_start,
        current_date_range_end: syncSession.current_date_range_end,
        total_estimated: syncSession.total_estimated,
        progress_percentage: syncSession.progress_percentage,
        payments_fetched: syncSession.payments_fetched,
        payments_synced: syncSession.payments_synced,
        is_continuation: syncSession.is_continuation,
        last_sync_attempt: new Date().toISOString(),
        last_heartbeat: new Date().toISOString(),
        error_message: null
      }, {
        onConflict: 'environment',
        ignoreDuplicates: false
      });

    // Build Square API base URL
    const baseUrl = environment === 'sandbox' 
      ? 'https://connect.squareupsandbox.com'
      : 'https://connect.squareup.com';

    let totalPaymentsProcessed = syncSession.payments_synced;
    let totalPaymentsFetched = syncSession.payments_fetched;
    let cursor = syncSession.cursor_position;
    let lastHeartbeat = Date.now();

    // Streaming processing loop
    while (true) {
      // Check timeout
      if (Date.now() - startTime > MAX_EXECUTION_TIME) {
        console.log('Approaching timeout, saving progress and stopping...');
        break;
      }

      // Send heartbeat periodically
      if (Date.now() - lastHeartbeat > HEARTBEAT_INTERVAL) {
        await supabase
          .from('square_sync_status')
          .update({
            last_heartbeat: new Date().toISOString(),
            payments_fetched: totalPaymentsFetched,
            payments_synced: totalPaymentsProcessed
          })
          .eq('environment', environment);
        lastHeartbeat = Date.now();
      }

      // Build API request
      const url = new URL(`${baseUrl}/v2/payments`);
      url.searchParams.append('begin_time', syncSession.current_date_range_start!);
      if (syncSession.current_date_range_end) {
        url.searchParams.append('end_time', syncSession.current_date_range_end);
      }
      url.searchParams.append('sort_order', 'ASC');
      url.searchParams.append('limit', '100');
      if (cursor) {
        url.searchParams.append('cursor', cursor);
      }

      console.log(`Fetching batch with cursor: ${cursor || 'none'}, processed: ${totalPaymentsProcessed}`);

      // Fetch from Square API
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
      
      if (!paymentsData.payments || paymentsData.payments.length === 0) {
        console.log('No more payments to fetch');
        break;
      }

      totalPaymentsFetched += paymentsData.payments.length;
      console.log(`Fetched ${paymentsData.payments.length} payments (total fetched: ${totalPaymentsFetched})`);

      // Process payments in smaller batches
      for (let i = 0; i < paymentsData.payments.length; i += BATCH_SIZE) {
        const batch = paymentsData.payments.slice(i, i + BATCH_SIZE);
        
        for (const payment of batch) {
          try {
            // Store raw payment data
            await supabase
              .from('square_payments_raw')
              .upsert({
                square_payment_id: payment.id,
                raw_response: payment,
                api_version: '2024-12-18',
                sync_timestamp: new Date().toISOString()
              }, {
                onConflict: 'square_payment_id'
              });

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

            await supabase
              .from('revenue_events')
              .upsert(revenueEvent, {
                onConflict: 'square_payment_id'
              });

            totalPaymentsProcessed++;
          } catch (error) {
            console.error(`Error processing payment ${payment.id}:`, error);
            continue;
          }
        }

        // Update progress after each batch
        const progressPercentage = syncSession.total_estimated > 0 
          ? Math.min(95, Math.round((totalPaymentsProcessed / syncSession.total_estimated) * 100))
          : Math.min(95, Math.round((totalPaymentsFetched / 1000) * 100)); // Rough estimate

        await supabase
          .from('square_sync_status')
          .update({
            payments_fetched: totalPaymentsFetched,
            payments_synced: totalPaymentsProcessed,
            progress_percentage: progressPercentage,
            cursor_position: paymentsData.cursor
          })
          .eq('environment', environment);
      }

      cursor = paymentsData.cursor;
      
      // Break if no more data
      if (!cursor) {
        console.log('Reached end of data');
        break;
      }

      // Small delay to prevent overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Determine final status
    const isComplete = !cursor;
    const finalStatus = isComplete ? 'success' : 'partial';

    // Update final sync status
    await supabase
      .from('square_sync_status')
      .update({
        last_successful_sync: isComplete ? new Date().toISOString() : syncSession.current_date_range_start,
        sync_status: finalStatus,
        payments_synced: totalPaymentsProcessed,
        payments_fetched: totalPaymentsFetched,
        progress_percentage: isComplete ? 100 : Math.min(95, Math.round((totalPaymentsFetched / 1000) * 100)),
        cursor_position: cursor,
        sync_session_id: isComplete ? null : syncSession.id,
        is_continuation: false,
        last_heartbeat: new Date().toISOString(),
        error_message: isComplete ? null : `Partial sync: processed ${totalPaymentsProcessed} payments. Use session ${syncSession.id} to continue.`
      })
      .eq('environment', environment);

    const executionTime = Math.round((Date.now() - startTime) / 1000);
    console.log(`Sync completed in ${executionTime}s. Processed ${totalPaymentsProcessed} payments. Status: ${finalStatus}`);

    return new Response(
      JSON.stringify({
        success: true,
        environment,
        paymentsProcessed: totalPaymentsProcessed,
        totalFetched: totalPaymentsFetched,
        cursor: cursor || null,
        isComplete,
        executionTimeSeconds: executionTime,
        sessionId: isComplete ? null : syncSession.id,
        canContinue: !isComplete,
        progressPercentage: isComplete ? 100 : Math.min(95, Math.round((totalPaymentsFetched / 1000) * 100)),
        message: isComplete 
          ? `Successfully synced ${totalPaymentsProcessed} payments`
          : `Partial sync: processed ${totalPaymentsProcessed} payments. Session ${syncSession.id} can be continued.`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Square sync error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Update sync status with error
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      await supabase
        .from('square_sync_status')
        .update({
          sync_status: 'error',
          error_message: errorMessage,
          last_heartbeat: new Date().toISOString()
        })
        .eq('environment', (req as any).environment || 'sandbox');
    } catch (updateError) {
      console.error('Failed to update error status:', updateError);
    }

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
