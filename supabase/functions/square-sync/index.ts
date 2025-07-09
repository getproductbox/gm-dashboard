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
  source_type: string;
  location_id?: string;
  order_id?: string;
  card_details?: any;
  receipt_number?: string;
  receipt_url?: string;
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
  max_transactions?: number;
  clear_existing?: boolean;
  location_id?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let environment = 'sandbox';
  
  try {
    console.log('=== STARTING SIMPLIFIED TRANSACTION-BASED SYNC ===');
    
    // Validate environment variables early
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const sandboxToken = Deno.env.get('SQUARE_SANDBOX_ACCESS_TOKEN');
    const productionToken = Deno.env.get('SQUARE_PRODUCTION_ACCESS_TOKEN');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    // Parse request parameters
    let syncParams: SyncRequest = {};
    if (req.method === 'POST') {
      try {
        syncParams = await req.json();
      } catch (e) {
        console.log('No valid JSON body, using defaults');
      }
    }

    environment = syncParams.environment || 'sandbox';
    const accessToken = environment === 'production' ? productionToken : sandboxToken;

    if (!accessToken) {
      throw new Error(`No access token configured for ${environment} environment`);
    }

    const maxTransactions = syncParams.max_transactions || 500;
    const locationId = syncParams.location_id;
    console.log(`Environment: ${environment}, Max transactions: ${maxTransactions}`, locationId ? `, Location: ${locationId}` : '');

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Clear existing data if requested (but return immediately after starting)
    if (syncParams.clear_existing) {
      console.log('Starting data clear...');
      EdgeRuntime.waitUntil(clearExistingData(supabase));
    }

    // Start background sync process
    const syncId = crypto.randomUUID();
    console.log(`Starting background sync with ID: ${syncId}`);
    
    // Update status to show sync is starting
    await supabase
      .from('square_sync_status')
      .upsert({
        environment,
        sync_status: 'running',
        sync_session_id: syncId,
        progress_percentage: 0,
        payments_fetched: 0,
        payments_synced: 0,
        last_sync_attempt: new Date().toISOString(),
        last_heartbeat: new Date().toISOString(),
        error_message: null
      }, {
        onConflict: 'environment'
      });

    // Start background processing
    EdgeRuntime.waitUntil(performBackgroundSync(
      accessToken,
      environment,
      maxTransactions,
      syncId,
      supabase,
      locationId
    ));

    // Return immediate response
    return new Response(
      JSON.stringify({
        success: true,
        environment,
        sessionId: syncId,
        maxTransactions,
        message: `Transaction-based sync started for ${maxTransactions} transactions`,
        status: 'started'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Sync startup error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Try to update error status
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

async function clearExistingData(supabase: any): Promise<void> {
  console.log('Clearing existing raw payments...');
  await supabase
    .from('square_payments_raw')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
}

async function performBackgroundSync(
  accessToken: string,
  environment: string,
  maxTransactions: number,
  syncId: string,
  supabase: any,
  locationId?: string
): Promise<void> {
  const startTime = Date.now();
  let totalFetched = 0;
  let totalProcessed = 0;
  let cursor: string | undefined;
  
  try {
    console.log('=== STARTING BACKGROUND TRANSACTION SYNC ===');
    
    // Sync locations first
    await syncSquareLocations(accessToken, environment, supabase);
    
    const baseUrl = environment === 'sandbox' 
      ? 'https://connect.squareupsandbox.com'
      : 'https://connect.squareup.com';

    // Get last successful sync time for incremental sync
    const { data: syncStatus } = await supabase
      .from('square_sync_status')
      .select('last_successful_sync')
      .eq('environment', environment)
      .single();

    let beginTime: string | undefined;
    if (syncStatus?.last_successful_sync) {
      beginTime = syncStatus.last_successful_sync;
      console.log(`Starting incremental sync from: ${beginTime}`);
    } else {
      // First sync - go back 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      beginTime = thirtyDaysAgo.toISOString();
      console.log(`First sync - starting from 30 days ago: ${beginTime}`);
    }

    // Incremental sync loop with date filtering
    while (totalFetched < maxTransactions) {
      const remaining = maxTransactions - totalFetched;
      const requestLimit = Math.min(100, remaining);
      
      console.log(`Fetching ${requestLimit} payments since ${beginTime} (${totalFetched}/${maxTransactions})`);
      
      // Build API request with incremental date filtering
      const url = new URL(`${baseUrl}/v2/payments`);
      url.searchParams.append('sort_order', 'ASC'); // Get oldest first for proper incremental sync
      url.searchParams.append('limit', requestLimit.toString());
      url.searchParams.append('begin_time', beginTime);
      url.searchParams.append('end_time', new Date().toISOString());
      
      if (locationId) {
        url.searchParams.append('location_id', locationId);
      }
      
      if (cursor) {
        url.searchParams.append('cursor', cursor);
      }

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
        throw new Error(`Square API Error (${response.status}): ${await response.text()}`);
      }

      const paymentsData: SquarePaymentsResponse = await response.json();
      
      if (!paymentsData.payments || paymentsData.payments.length === 0) {
        console.log('No more payments available');
        break;
      }

      // Process payments in batch
      const processed = await processBatch(paymentsData.payments, supabase);
      totalFetched += paymentsData.payments.length;
      totalProcessed += processed;
      
      cursor = paymentsData.cursor;
      
      // Update progress
      const progressPercentage = Math.round((totalFetched / maxTransactions) * 100);
      await supabase
        .from('square_sync_status')
        .update({
          payments_fetched: totalFetched,
          payments_synced: totalProcessed,
          progress_percentage: progressPercentage,
          cursor_position: cursor,
          last_heartbeat: new Date().toISOString()
        })
        .eq('environment', environment);

      console.log(`Progress: ${totalFetched}/${maxTransactions} (${progressPercentage}%)`);
      
      // Stop if we've reached the limit or no more cursor
      if (totalFetched >= maxTransactions || !cursor) {
        break;
      }
      
      // Small delay to prevent API rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Mark as completed
    const executionTime = Math.round((Date.now() - startTime) / 1000);
    await supabase
      .from('square_sync_status')
      .update({
        sync_status: 'success',
        last_successful_sync: new Date().toISOString(),
        payments_fetched: totalFetched,
        payments_synced: totalProcessed,
        progress_percentage: 100,
        sync_session_id: null,
        cursor_position: null,
        last_heartbeat: new Date().toISOString(),
        error_message: null
      })
      .eq('environment', environment);

    console.log(`✅ Sync completed: ${totalProcessed} payments processed in ${executionTime}s`);

  } catch (error) {
    console.error('Background sync error:', error);
    
    await supabase
      .from('square_sync_status')
      .update({
        sync_status: 'error',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        payments_fetched: totalFetched,
        payments_synced: totalProcessed,
        last_heartbeat: new Date().toISOString()
      })
      .eq('environment', environment);
  }
}

async function processBatch(payments: SquarePayment[], supabase: any): Promise<number> {
  try {
    console.log(`Processing batch of ${payments.length} payments...`);
    
    // Get location mappings for venue assignment
    const { data: locations } = await supabase
      .from('square_locations')
      .select('square_location_id, location_name');
    
    const locationMap = new Map(
      locations?.map((loc: any) => [loc.square_location_id, loc.location_name]) || []
    );
    
    // Transform payments directly into revenue events
    const revenueEvents = payments
      .filter(payment => payment.status === 'COMPLETED')
      .map(payment => {
        const paymentDate = new Date(payment.created_at);
        const venue = locationMap.get(payment.location_id) || 'default';
        
        // Simple venue-based revenue type mapping
        const revenueType = venue === 'Hippie Door' ? 'door' : 'bar';
        
        return {
          square_payment_id: payment.id,
          venue,
          revenue_type: revenueType,
          amount_cents: payment.amount_money.amount,
          currency: payment.amount_money.currency || 'USD',
          payment_date: payment.created_at,
          payment_hour: paymentDate.getHours(),
          payment_day_of_week: paymentDate.getDay(),
          status: 'completed',
          processed_at: new Date().toISOString()
        };
      });

    if (revenueEvents.length === 0) {
      console.log('No completed payments to process');
      return 0;
    }

    // Store processed revenue events directly
    const { error } = await supabase
      .from('revenue_events')
      .upsert(revenueEvents, {
        onConflict: 'square_payment_id'
      });

    if (error) {
      console.error('Revenue events upsert error:', error);
      return 0;
    }

    console.log(`✅ Successfully processed ${revenueEvents.length} revenue events`);
    return revenueEvents.length;
    
  } catch (error) {
    console.error('Error processing batch:', error);
    return 0;
  }
}

async function syncSquareLocations(accessToken: string, environment: string, supabase: any): Promise<void> {
  const baseUrl = environment === 'sandbox' 
    ? 'https://connect.squareupsandbox.com'
    : 'https://connect.squareup.com';

  const response = await fetch(`${baseUrl}/v2/locations`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Square-Version': '2024-12-18',
      'Content-Type': 'application/json'
    }
  });

  if (response.ok) {
    const locationsData = await response.json();
    if (locationsData.locations) {
      for (const location of locationsData.locations) {
        await supabase
          .from('square_locations')
          .upsert({
            square_location_id: location.id,
            location_name: location.name || 'Unknown Location',
            address: location.address ? [
              location.address.address_line_1,
              location.address.locality,
              location.address.administrative_district_level_1
            ].filter(Boolean).join(', ') : null,
            business_name: location.business_name,
            country: location.country,
            currency: location.currency,
            environment: environment,
            is_active: location.status === 'ACTIVE',
            synced_at: new Date().toISOString()
          }, {
            onConflict: 'square_location_id'
          });
      }
    }
  }
}
