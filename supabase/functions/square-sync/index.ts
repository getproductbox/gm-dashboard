
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
    console.log('=== STARTING ROBUST CURSOR-BASED SQUARE PAYMENTS SYNC ===');
    console.log('Request method:', req.method);
    console.log('Current UTC time:', new Date().toISOString());

    // Parse request body for sync parameters
    let syncParams: SyncRequest = {};
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        syncParams = body;
        console.log('=== SYNC PARAMETERS ===');
        console.log('Raw sync params:', JSON.stringify(syncParams, null, 2));
      } catch (e) {
        console.log('No valid JSON body provided, using defaults');
      }
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Reset any stuck sync states first
    console.log('Resetting any stuck sync states...');
    await supabase.rpc('reset_stuck_sync_states');

    // Determine environment
    const environment = syncParams.environment || 'sandbox';
    console.log('=== ENVIRONMENT CONFIGURATION ===');
    console.log('Target environment:', environment);
    
    // Get Square API credentials
    const sandboxToken = Deno.env.get('SQUARE_SANDBOX_ACCESS_TOKEN');
    const productionToken = Deno.env.get('SQUARE_PRODUCTION_ACCESS_TOKEN');
    const accessToken = environment === 'production' ? productionToken : sandboxToken;

    if (!accessToken) {
      throw new Error(`No access token configured for ${environment} environment`);
    }

    console.log('Access token configured:', accessToken ? 'YES' : 'NO');
    console.log('Token length:', accessToken ? accessToken.length : 0);

    // Get or create sync session
    let syncSession: SyncSession;
    
    if (syncParams.continue_session) {
      console.log('=== CONTINUING EXISTING SESSION ===');
      console.log('Session ID to continue:', syncParams.continue_session);
      
      // Continue existing session
      const { data: existingSession, error: sessionError } = await supabase
        .from('square_sync_status')
        .select('*')
        .eq('sync_session_id', syncParams.continue_session)
        .eq('environment', environment)
        .single();

      if (sessionError || !existingSession) {
        console.error('Cannot find sync session to continue:', sessionError);
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

      console.log('Continuing session progress:', syncSession.progress_percentage + '%');
    } else {
      console.log('=== STARTING NEW SESSION ===');
      
      // Start new session
      const sessionId = crypto.randomUUID();
      console.log('New session ID:', sessionId);
      
      // Clear existing data if requested
      if (syncParams.clear_existing) {
        console.log('CLEARING EXISTING DATA...');
        const { error: clearRevenueError } = await supabase
          .from('revenue_events')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');
        
        const { error: clearRawError } = await supabase
          .from('square_payments_raw')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');

        if (clearRevenueError) console.error('Error clearing revenue_events:', clearRevenueError);
        if (clearRawError) console.error('Error clearing square_payments_raw:', clearRawError);
      }

      // Determine date range with detailed logging
      let beginTime: string;
      let endTime: string | undefined;

      console.log('=== DATE RANGE CALCULATION ===');
      
      if (syncParams.date_range) {
        console.log('Using provided date range');
        beginTime = syncParams.date_range.start;
        endTime = syncParams.date_range.end;
        console.log('Provided start:', beginTime);
        console.log('Provided end:', endTime);
      } else if (syncParams.historical) {
        console.log('Using historical date range (1 year)');
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        beginTime = oneYearAgo.toISOString();
        endTime = new Date().toISOString();
        console.log('Historical start:', beginTime);
        console.log('Historical end:', endTime);
      } else {
        console.log('Using incremental sync from last successful sync');
        
        // Get last successful sync with detailed logging
        const { data: lastSync, error: lastSyncError } = await supabase
          .from('square_sync_status')
          .select('last_successful_sync, last_sync_attempt, sync_status')
          .eq('environment', environment)
          .single();
        
        console.log('Last sync query result:', { data: lastSync, error: lastSyncError });
        
        if (lastSync?.last_successful_sync) {
          beginTime = lastSync.last_successful_sync;
          console.log('Using last successful sync time:', beginTime);
        } else {
          // Default to 30 days ago instead of 24 hours for better coverage
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          beginTime = thirtyDaysAgo.toISOString();
          console.log('No previous sync found, defaulting to 30 days ago:', beginTime);
        }
        
        // For incremental sync, don't set end time to get all payments up to now
        endTime = undefined;
        console.log('End time for incremental sync: current time (no explicit end)');
      }

      // Validate and log final date range
      const beginDate = new Date(beginTime);
      const endDate = endTime ? new Date(endTime) : new Date();
      const daysDifference = Math.ceil((endDate.getTime() - beginDate.getTime()) / (1000 * 60 * 60 * 24));
      
      console.log('=== FINAL DATE RANGE VALIDATION ===');
      console.log('Begin time (ISO):', beginTime);
      console.log('Begin time (parsed):', beginDate.toISOString());
      console.log('End time (ISO):', endTime || 'current time');
      console.log('End time (parsed):', endDate.toISOString());
      console.log('Date range covers', daysDifference, 'days');
      console.log('Time zone offset:', beginDate.getTimezoneOffset(), 'minutes');

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
    }

    // Update sync status with session info
    console.log('=== UPDATING SYNC STATUS ===');
    const { error: updateError } = await supabase
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

    if (updateError) {
      console.error('Error updating sync status:', updateError);
    }

    // Build Square API base URL
    const baseUrl = environment === 'sandbox' 
      ? 'https://connect.squareupsandbox.com'
      : 'https://connect.squareup.com';

    console.log('=== SQUARE API CONFIGURATION ===');
    console.log('Base URL:', baseUrl);

    let totalPaymentsProcessed = syncSession.payments_synced;
    let totalPaymentsFetched = syncSession.payments_fetched;
    let cursor = syncSession.cursor_position;
    let lastHeartbeat = Date.now();
    let requestCount = 0;

    console.log('=== STARTING STREAMING PROCESSING LOOP ===');
    console.log('Initial cursor:', cursor || 'none');
    console.log('Initial payments processed:', totalPaymentsProcessed);
    console.log('Initial payments fetched:', totalPaymentsFetched);

    // Streaming processing loop
    while (true) {
      requestCount++;
      console.log(`\n--- REQUEST ${requestCount} ---`);
      
      // Check timeout
      if (Date.now() - startTime > MAX_EXECUTION_TIME) {
        console.log('⚠️ Approaching timeout, saving progress and stopping...');
        break;
      }

      // Send heartbeat periodically
      if (Date.now() - lastHeartbeat > HEARTBEAT_INTERVAL) {
        console.log('💓 Sending heartbeat...');
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

      // Build API request with detailed logging
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

      console.log('=== SQUARE API REQUEST ===');
      console.log('Full URL:', url.toString());
      console.log('Request headers will include:');
      console.log('- Authorization: Bearer [TOKEN]');
      console.log('- Square-Version: 2024-12-18');

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

      console.log('=== SQUARE API RESPONSE ===');
      console.log('Status:', response.status);
      console.log('Status text:', response.statusText);
      console.log('Headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Square API Error Response:', errorText);
        throw new Error(`Square API Error (${response.status}): ${errorText}`);
      }

      const paymentsData: SquarePaymentsResponse = await response.json();
      
      console.log('=== PAYMENTS DATA ANALYSIS ===');
      console.log('Payments array length:', paymentsData.payments?.length || 0);
      console.log('Has cursor:', !!paymentsData.cursor);
      console.log('Next cursor:', paymentsData.cursor || 'none');
      console.log('Errors in response:', JSON.stringify(paymentsData.errors || [], null, 2));
      
      if (paymentsData.payments && paymentsData.payments.length > 0) {
        console.log('First payment created_at:', paymentsData.payments[0].created_at);
        console.log('Last payment created_at:', paymentsData.payments[paymentsData.payments.length - 1].created_at);
        console.log('Sample payment IDs:', paymentsData.payments.slice(0, 3).map(p => p.id));
      }
      
      if (!paymentsData.payments || paymentsData.payments.length === 0) {
        console.log('🔍 NO PAYMENTS RETURNED - Analysis:');
        console.log('- Date range may not contain any transactions');
        console.log('- All transactions in range may already be synced');
        console.log('- API credentials may not have access to payment data');
        console.log('- Time zone issues may be affecting date filtering');
        
        if (paymentsData.errors && paymentsData.errors.length > 0) {
          console.log('❌ API Errors found:', JSON.stringify(paymentsData.errors, null, 2));
        }
        
        break;
      }

      totalPaymentsFetched += paymentsData.payments.length;
      console.log(`✅ Fetched ${paymentsData.payments.length} payments (total fetched: ${totalPaymentsFetched})`);

      // Process payments in smaller batches
      for (let i = 0; i < paymentsData.payments.length; i += BATCH_SIZE) {
        const batch = paymentsData.payments.slice(i, i + BATCH_SIZE);
        console.log(`Processing batch ${Math.floor(i/BATCH_SIZE) + 1}: ${batch.length} payments`);
        
        for (const payment of batch) {
          try {
            // Store raw payment data
            const { error: rawError } = await supabase
              .from('square_payments_raw')
              .upsert({
                square_payment_id: payment.id,
                raw_response: payment,
                api_version: '2024-12-18',
                sync_timestamp: new Date().toISOString()
              }, {
                onConflict: 'square_payment_id'
              });

            if (rawError) {
              console.error(`Error storing raw payment ${payment.id}:`, rawError);
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

            const { error: revenueError } = await supabase
              .from('revenue_events')
              .upsert(revenueEvent, {
                onConflict: 'square_payment_id'
              });

            if (revenueError) {
              console.error(`Error storing revenue event ${payment.id}:`, revenueError);
              continue;
            }

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
        console.log('✅ Reached end of data - no more cursor');
        break;
      }

      // Small delay to prevent overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Determine final status
    const isComplete = !cursor;
    const finalStatus = isComplete ? 'success' : 'partial';

    console.log('=== SYNC COMPLETION SUMMARY ===');
    console.log('Status:', finalStatus);
    console.log('Total requests made:', requestCount);
    console.log('Total payments fetched:', totalPaymentsFetched);
    console.log('Total payments processed:', totalPaymentsProcessed);
    console.log('Final cursor:', cursor || 'none');
    console.log('Is complete:', isComplete);

    // Update final sync status
    const { error: finalUpdateError } = await supabase
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

    if (finalUpdateError) {
      console.error('Error updating final sync status:', finalUpdateError);
    }

    const executionTime = Math.round((Date.now() - startTime) / 1000);
    console.log(`🎉 Sync completed in ${executionTime}s`);

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
    console.error('💥 SYNC ERROR:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');

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
