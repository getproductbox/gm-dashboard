import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface BackfillRequest {
  start_date?: string; // ISO date string (e.g., "2024-01-01")
  end_date?: string;   // ISO date string (e.g., "2024-12-31")
  dry_run?: boolean;   // If true, don't actually insert data
}

interface BackfillProgress {
  current_date: string;
  total_requests: number;
  completed_requests: number;
  total_payments_fetched: number;
  total_payments_synced: number;
  errors: string[];
}

serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== STARTING SQUARE BACKFILL ===');
    
    // Parse request parameters
    let backfillParams: BackfillRequest = {};
    if (req.method === 'POST') {
      try {
        backfillParams = await req.json();
      } catch (e) {
        console.log('No valid JSON body, using defaults');
      }
    }

    // Set defaults
    const startDate = backfillParams.start_date || new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 2 years ago
    const endDate = backfillParams.end_date || new Date().toISOString().split('T')[0]; // Today
    const dryRun = backfillParams.dry_run || false;

    console.log(`Backfill Parameters:`);
    console.log(`- Start Date: ${startDate}`);
    console.log(`- End Date: ${endDate}`);
    console.log(`- Dry Run: ${dryRun}`);

    const environment = 'production';

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const productionToken = Deno.env.get("SQUARE_PRODUCTION_ACCESS_TOKEN");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    if (!productionToken) {
      throw new Error("No Square production access token configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update backfill status
    await supabase
      .from('square_sync_status')
      .upsert({
        environment,
        sync_status: 'backfill_running',
        last_sync_attempt: new Date().toISOString(),
        last_heartbeat: new Date().toISOString(),
        error_message: null
      }, {
        onConflict: 'environment'
      });

    const progress: BackfillProgress = {
      current_date: startDate,
      total_requests: 0,
      completed_requests: 0,
      total_payments_fetched: 0,
      total_payments_synced: 0,
      errors: []
    };

    // Generate list of months to process
    const monthsToProcess: string[] = [];
    const currentDate = new Date(startDate);
    const endDateObj = new Date(endDate);

    while (currentDate <= endDateObj) {
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      monthsToProcess.push(`${year}-${month}`);
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    console.log(`Processing ${monthsToProcess.length} months: ${monthsToProcess.join(', ')}`);

    // Process each month
    for (const month of monthsToProcess) {
      console.log(`\n=== Processing month: ${month} ===`);
      progress.current_date = month;

      try {
        const monthStart = new Date(`${month}-01`);
        const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
        
        console.log(`Month range: ${monthStart.toISOString()} to ${monthEnd.toISOString()}`);

        // Fetch payments for this month
        const monthPayments = await fetchPaymentsForDateRange(
          productionToken,
          monthStart,
          monthEnd
        );

        progress.total_payments_fetched += monthPayments.length;
        progress.total_requests++;

        if (monthPayments.length > 0) {
          console.log(`Found ${monthPayments.length} payments for ${month}`);

          if (!dryRun) {
            // Insert payments into database
            const paymentsToInsert = monthPayments.map(payment => ({
              square_payment_id: payment.id,
              raw_response: payment
            }));

            const { data: insertedData, error } = await supabase
              .from("square_payments_raw")
              .upsert(paymentsToInsert, { onConflict: "square_payment_id" })
              .select();

            if (error) {
              console.error(`Database error for ${month}:`, error);
              progress.errors.push(`Database error for ${month}: ${error.message}`);
            } else {
              const syncedCount = insertedData?.length || 0;
              progress.total_payments_synced += syncedCount;
              console.log(`✅ Synced ${syncedCount} payments for ${month}`);
            }
          } else {
            console.log(`[DRY RUN] Would sync ${monthPayments.length} payments for ${month}`);
            progress.total_payments_synced += monthPayments.length;
          }
        } else {
          console.log(`No payments found for ${month}`);
        }

        progress.completed_requests++;

        // Update progress in database
        await supabase
          .from('square_sync_status')
          .upsert({
            environment,
            sync_status: 'backfill_running',
            last_heartbeat: new Date().toISOString(),
            error_message: progress.errors.length > 0 ? progress.errors.join('; ') : null
          }, {
            onConflict: 'environment'
          });

        // Small delay to be respectful to Square API
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`Error processing month ${month}:`, error);
        progress.errors.push(`Error processing ${month}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        progress.completed_requests++;
      }
    }

    // Transform the synced data to revenue_events
    console.log('\n=== STARTING TRANSFORMATION STEP ===');
    let transformResult = null;
    
    if (!dryRun && progress.total_payments_synced > 0) {
      try {
        console.log(`Calling transform_backfill_simple(${startDate}, ${endDate})...`);
        
        // Use the new simple transform function that works with date ranges
        const { data: transformData, error: transformError } = await supabase.rpc('transform_backfill_simple', {
          start_date: startDate,
          end_date: endDate
        });

        if (transformError) {
          console.error(`Transform error:`, transformError);
          progress.errors.push(`Transform error: ${transformError.message}`);
        } else {
          transformResult = transformData;
          console.log(`✅ Transform completed successfully`);
          console.log(`- Processed: ${transformData.processed_count} events`);
          console.log(`- Total in range: ${transformData.total_in_range}`);
          console.log(`- Date range: ${transformData.start_date} to ${transformData.end_date}`);
        }
      } catch (transformError) {
        console.error(`Transform exception:`, transformError);
        progress.errors.push(`Transform exception: ${transformError instanceof Error ? transformError.message : 'Unknown error'}`);
      }
    } else if (dryRun) {
      console.log(`[DRY RUN] Would transform ${progress.total_payments_synced} payments to revenue events`);
    } else {
      console.log(`No payments to transform`);
    }

    // Update final status
    const finalStatus = progress.errors.length > 0 ? 'backfill_completed_with_errors' : 'backfill_completed';
    await supabase
      .from('square_sync_status')
      .upsert({
        environment,
        sync_status: finalStatus,
        payments_fetched: progress.total_payments_fetched,
        payments_synced: progress.total_payments_synced,
        last_successful_sync: new Date().toISOString(),
        last_heartbeat: new Date().toISOString(),
        error_message: progress.errors.length > 0 ? progress.errors.join('; ') : null
      }, {
        onConflict: 'environment'
      });

    console.log('=== BACKFILL COMPLETED ===');
    console.log(`Total payments fetched: ${progress.total_payments_fetched}`);
    console.log(`Total payments synced: ${progress.total_payments_synced}`);
    console.log(`Errors: ${progress.errors.length}`);
    if (transformResult) {
      console.log(`Revenue events created: ${transformResult.processed_count}`);
    }

    return new Response(JSON.stringify({
      success: true,
      environment,
      message: "Backfill completed",
      dry_run: dryRun,
      progress,
      transform_result: transformResult,
      summary: {
        months_processed: monthsToProcess.length,
        total_payments_fetched: progress.total_payments_fetched,
        total_payments_synced: progress.total_payments_synced,
        revenue_events_created: transformResult?.processed_count || 0,
        errors_count: progress.errors.length,
        date_range: { start_date: startDate, end_date: endDate }
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });

  } catch (error) {
    console.error('❌ Error in square-sync-backfill function:', error);
    
    // Update sync status with error
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        await supabase
          .from('square_sync_status')
          .upsert({
            environment: 'production',
            sync_status: 'backfill_error',
            error_message: error instanceof Error ? error.message : 'Unknown error',
            last_heartbeat: new Date().toISOString()
          }, {
            onConflict: 'environment'
          });
      }
    } catch (statusError) {
      console.error('Failed to update sync status:', statusError);
    }
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500
    });
  }
});

async function fetchPaymentsForDateRange(
  accessToken: string,
  startDate: Date,
  endDate: Date
): Promise<any[]> {
  const allPayments: any[] = [];
  let cursor: string | null = null;
  let requestCount = 0;

  do {
    requestCount++;
    console.log(`Making request ${requestCount} for date range ${startDate.toISOString()} to ${endDate.toISOString()}`);

    // Build Square API URL
    const url = new URL('https://connect.squareup.com/v2/payments');
    url.searchParams.append('sort_order', 'DESC');
    url.searchParams.append('limit', '100');
    
    // Add date filters
    url.searchParams.append('begin_time', startDate.toISOString());
    url.searchParams.append('end_time', endDate.toISOString());
    
    if (cursor) {
      url.searchParams.append('cursor', cursor);
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Square-Version": "2024-01-17",
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Square API Error Response: ${errorText}`);
      throw new Error(`Square API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const payments = data.payments || [];
    
    console.log(`Received ${payments.length} payments in this request`);
    allPayments.push(...payments);

    // Check if we have more data
    cursor = data.cursor || null;
    
    // For backfill, we want to fetch ALL transactions, so we don't limit by count
    // Only limit by reasonable request count to avoid infinite loops
    if (requestCount >= 50) { // Maximum 50 requests per month (5000 transactions)
      console.log(`Reached maximum requests limit (50) for safety`);
      break;
    }

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));

  } while (cursor);

  console.log(`Total payments fetched for date range: ${allPayments.length}`);
  return allPayments;
} 