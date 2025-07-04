
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
  max_transactions?: number; // NEW: Transaction-based limit
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
  max_transactions?: number; // NEW: Track transaction limit
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

  // Environment and request data for error handling
  let environment = 'sandbox';
  let syncParams: SyncRequest = {};

  try {
    console.log('=== STARTING SIMPLIFIED SQUARE PAYMENTS SYNC ===');
    console.log('Request method:', req.method);
    console.log('Current UTC time:', new Date().toISOString());

    // Validate required environment variables early
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const sandboxToken = Deno.env.get('SQUARE_SANDBOX_ACCESS_TOKEN');
    const productionToken = Deno.env.get('SQUARE_PRODUCTION_ACCESS_TOKEN');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    // Parse request body for sync parameters
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

    // Determine environment and validate access token
    environment = syncParams.environment || 'sandbox';
    const accessToken = environment === 'production' ? productionToken : sandboxToken;

    if (!accessToken) {
      throw new Error(`No access token configured for ${environment} environment`);
    }

    console.log('Environment:', environment);
    console.log('Access token configured:', 'YES');

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Reset any stuck sync states first
    console.log('Resetting any stuck sync states...');
    await supabase.rpc('reset_stuck_sync_states');

    // First, sync locations to ensure proper venue mapping
    console.log('=== SYNCING SQUARE LOCATIONS ===');
    try {
      await syncSquareLocations(accessToken, environment, supabase);
    } catch (error) {
      console.warn('Failed to sync locations (continuing with payment sync):', error);
    }

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
        max_transactions: existingSession.max_transactions || syncParams.max_transactions,
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

      // Determine sync approach: transaction-based or date-based
      let beginTime: string;
      let endTime: string | undefined;
      let maxTransactions: number | undefined;

      console.log('=== SYNC APPROACH DETERMINATION ===');
      
      if (syncParams.max_transactions) {
        console.log('Using TRANSACTION-BASED sync');
        maxTransactions = syncParams.max_transactions;
        console.log('Max transactions limit:', maxTransactions);
        
        // For transaction-based sync, use a reasonable time window (30 days back)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        beginTime = thirtyDaysAgo.toISOString();
        endTime = undefined; // No end time, we'll stop based on transaction count
        
        console.log('Time window for transaction search:', beginTime, 'to current');
      } else if (syncParams.date_range) {
        console.log('Using DATE-BASED sync');
        beginTime = syncParams.date_range.start;
        endTime = syncParams.date_range.end;
        console.log('Date range:', beginTime, 'to', endTime);
      } else if (syncParams.historical) {
        console.log('Using HISTORICAL sync (1 year)');
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        beginTime = oneYearAgo.toISOString();
        endTime = new Date().toISOString();
        console.log('Historical range:', beginTime, 'to', endTime);
      } else {
        console.log('Using INCREMENTAL sync');
        
        // Get last successful sync
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
          // Default to 30 days ago
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          beginTime = thirtyDaysAgo.toISOString();
          console.log('No previous sync found, defaulting to 30 days ago:', beginTime);
        }
        
        endTime = undefined;
      }

      syncSession = {
        id: sessionId,
        environment,
        sync_status: 'running',
        cursor_position: undefined,
        current_date_range_start: beginTime,
        current_date_range_end: endTime,
        max_transactions: maxTransactions,
        total_estimated: maxTransactions || 0,
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

    console.log('=== STARTING PROCESSING LOOP ===');
    console.log('Initial cursor:', cursor || 'none');
    console.log('Initial payments processed:', totalPaymentsProcessed);
    console.log('Initial payments fetched:', totalPaymentsFetched);
    console.log('Transaction limit:', syncSession.max_transactions || 'none');

    // Processing loop
    while (true) {
      requestCount++;
      console.log(`\n--- REQUEST ${requestCount} ---`);
      
      // Check timeout
      if (Date.now() - startTime > MAX_EXECUTION_TIME) {
        console.log('⚠️ Approaching timeout, saving progress and stopping...');
        break;
      }

      // Check transaction limit (NEW: Primary stopping condition)
      if (syncSession.max_transactions && totalPaymentsFetched >= syncSession.max_transactions) {
        console.log(`✅ Reached transaction limit: ${totalPaymentsFetched}/${syncSession.max_transactions}`);
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

      // Build API request
      const url = new URL(`${baseUrl}/v2/payments`);
      url.searchParams.append('begin_time', syncSession.current_date_range_start!);
      if (syncSession.current_date_range_end) {
        url.searchParams.append('end_time', syncSession.current_date_range_end);
      }
      url.searchParams.append('sort_order', 'ASC');
      
      // Adjust limit based on remaining transactions
      let requestLimit = 100;
      if (syncSession.max_transactions) {
        const remaining = syncSession.max_transactions - totalPaymentsFetched;
        requestLimit = Math.min(100, remaining);
      }
      url.searchParams.append('limit', requestLimit.toString());
      
      if (cursor) {
        url.searchParams.append('cursor', cursor);
      }

      console.log('=== SQUARE API REQUEST ===');
      console.log('Request limit:', requestLimit);
      console.log('Remaining transactions:', syncSession.max_transactions ? (syncSession.max_transactions - totalPaymentsFetched) : 'unlimited');

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

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Square API Error Response:', errorText);
        throw new Error(`Square API Error (${response.status}): ${errorText}`);
      }

      const paymentsData: SquarePaymentsResponse = await response.json();
      
      console.log('=== PAYMENTS DATA ANALYSIS ===');
      console.log('Payments array length:', paymentsData.payments?.length || 0);
      console.log('Has cursor:', !!paymentsData.cursor);
      
      if (!paymentsData.payments || paymentsData.payments.length === 0) {
        console.log('🔍 NO PAYMENTS RETURNED - stopping sync');
        break;
      }

      // Process payments and update totals
      const fetchedCount = paymentsData.payments.length;
      totalPaymentsFetched += fetchedCount;
      console.log(`✅ Fetched ${fetchedCount} payments (total fetched: ${totalPaymentsFetched})`);

      // Process payments in batches
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
                synced_at: new Date().toISOString()
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
        let progressPercentage = 0;
        if (syncSession.max_transactions) {
          progressPercentage = Math.min(100, Math.round((totalPaymentsFetched / syncSession.max_transactions) * 100));
        } else {
          progressPercentage = Math.min(95, Math.round((totalPaymentsFetched / 1000) * 100));
        }

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
      
      // Check if we've reached our transaction limit
      if (syncSession.max_transactions && totalPaymentsFetched >= syncSession.max_transactions) {
        console.log(`✅ Reached transaction limit: ${totalPaymentsFetched}/${syncSession.max_transactions}`);
        break;
      }
      
      // Break if no more data
      if (!cursor) {
        console.log('✅ Reached end of data - no more cursor');
        break;
      }

      // Small delay to prevent overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Determine final status
    const isComplete = !cursor || (syncSession.max_transactions && totalPaymentsFetched >= syncSession.max_transactions);
    const finalStatus = isComplete ? 'success' : 'partial';

    console.log('=== SYNC COMPLETION SUMMARY ===');
    console.log('Status:', finalStatus);
    console.log('Total requests made:', requestCount);
    console.log('Total payments fetched:', totalPaymentsFetched);
    console.log('Total payments processed:', totalPaymentsProcessed);
    console.log('Transaction limit reached:', syncSession.max_transactions ? (totalPaymentsFetched >= syncSession.max_transactions) : 'N/A');
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
        progress_percentage: isComplete ? 100 : Math.min(95, Math.round((totalPaymentsFetched / (syncSession.max_transactions || 1000)) * 100)),
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
        progressPercentage: isComplete ? 100 : Math.min(95, Math.round((totalPaymentsFetched / (syncSession.max_transactions || 1000)) * 100)),
        message: isComplete 
          ? `Successfully synced ${totalPaymentsProcessed} payments${syncSession.max_transactions ? ` (${totalPaymentsFetched} transactions fetched)` : ''}`
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
        .eq('environment', environment);
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

// Helper function to sync Square locations
async function syncSquareLocations(accessToken: string, environment: string, supabase: any): Promise<void> {
  console.log('Fetching Square locations...');
  
  const baseUrl = environment === 'sandbox' 
    ? 'https://connect.squareupsandbox.com'
    : 'https://connect.squareup.com';

  const response = await fetch(`${baseUrl}/v2/locations`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Square-Version': '2024-12-18',
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch locations: ${response.status}`);
  }

  const locationsData = await response.json();
  console.log(`Found ${locationsData.locations?.length || 0} locations`);

  if (locationsData.locations && locationsData.locations.length > 0) {
    for (const location of locationsData.locations) {
      const locationData = {
        square_location_id: location.id,
        location_name: location.name || 'Unknown Location',
        address: location.address ? [
          location.address.address_line_1,
          location.address.address_line_2,
          location.address.locality,
          location.address.administrative_district_level_1,
          location.address.postal_code
        ].filter(Boolean).join(', ') : null,
        business_name: location.business_name,
        country: location.country,
        currency: location.currency,
        environment: environment,
        is_active: location.status === 'ACTIVE',
        synced_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('square_locations')
        .upsert(locationData, {
          onConflict: 'square_location_id'
        });

      if (error) {
        console.error(`Failed to store location ${location.id}:`, error);
      } else {
        console.log(`Stored location: ${location.name} (${location.id})`);
      }
    }
  }
}

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
