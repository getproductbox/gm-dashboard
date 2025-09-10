import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface BackfillRequest {
  start_date?: string; // ISO date string (e.g., "2024-01-01")
  end_date?: string;   // ISO date string (e.g., "2024-12-31")
  dry_run?: boolean;   // If true, don't actually insert data
  location_id?: string; // Optional Square location ID override
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

    // Generate list of months to process (YYYY-MM)
    const monthsToProcess: string[] = [];
    const currentDate = new Date(startDate);
    const endDateObj = new Date(endDate);

    while (currentDate <= endDateObj) {
      const year = currentDate.getUTCFullYear();
      const month = String(currentDate.getUTCMonth() + 1).padStart(2, '0');
      monthsToProcess.push(`${year}-${month}`);
      currentDate.setUTCMonth(currentDate.getUTCMonth() + 1);
    }

    console.log(`Processing ${monthsToProcess.length} months: ${monthsToProcess.join(', ')}`);

    // 🏪 Determine target Square location
    const locationId = backfillParams.location_id || 'LGRBM02D8PCNM';
    console.log(`Found ${locationId} active location: ${locationId}`);

    // Process each location and month
    for (const month of monthsToProcess) {
      console.log(`\n--- Processing month: ${month} for location ${locationId} ---`);
      progress.current_date = `${month} @ ${locationId}`;

      try {
        // Ensure month boundaries in UTC
        const [yearStr, monthStr] = month.split('-');
        const yearNum = Number(yearStr);
        const monthNum = Number(monthStr) - 1; // 0-indexed

        const monthStart = new Date(Date.UTC(yearNum, monthNum, 1, 0, 0, 0, 0));
        const monthEnd = new Date(Date.UTC(yearNum, monthNum + 1, 0, 23, 59, 59, 999));

        console.log(`Month range: ${monthStart.toISOString()} to ${monthEnd.toISOString()}`);

        // Fetch payments for this location & month
        const monthPayments = await fetchPaymentsForDateRange(
          productionToken,
          monthStart,
          monthEnd,
          locationId
        );

        progress.total_payments_fetched += monthPayments.length;
        progress.total_requests++;

        if (monthPayments.length > 0) {
          console.log(`Found ${monthPayments.length} payments for ${month} @ ${locationId}`);

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
              console.error(`Database error for ${month} @ ${locationId}:`, error);
              progress.errors.push(`Database error for ${month} @ ${locationId}: ${error.message}`);
            } else {
              const syncedCount = insertedData?.length || 0;
              progress.total_payments_synced += syncedCount;
              console.log(`✅ Synced ${syncedCount} payments for ${month} @ ${locationId}`);
            }
          } else {
            console.log(`[DRY RUN] Would sync ${monthPayments.length} payments for ${month} @ ${locationId}`);
            progress.total_payments_synced += monthPayments.length;
          }
        } else {
          console.log(`No payments found for ${month} @ ${locationId}`);
        }

        progress.completed_requests++;

        // Update progress heartbeat
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

        // Polite 1-second delay between month pulls
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`Error processing ${month} @ ${locationId}:`, error);
        progress.errors.push(`Error processing ${month} @ ${locationId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        progress.completed_requests++;
      }
    }

    // Note: Transformation is now handled separately via the UI
    console.log('\n=== BACKFILL COMPLETED - TRANSFORM DATA SEPARATELY ===');
    console.log(`Use the "Transform Data" button to convert synced payments to revenue events`);

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

    return new Response(JSON.stringify({
      success: true,
      environment,
      message: "Backfill completed",
      dry_run: dryRun,
      progress,
      summary: {
        months_processed: monthsToProcess.length,
        total_payments_fetched: progress.total_payments_fetched,
        total_payments_synced: progress.total_payments_synced,
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

/**
 * Fetch payments from Square API with automatic retry and exponential backoff
 */
async function fetchPaymentsForDateRange(
  token: string,
  startDate: Date,
  endDate: Date,
  locationId: string,
  maxRetries: number = 3
): Promise<any[]> {
  let cursor: string | null = null;
  let allPayments: any[] = [];
  let requestCount = 0;

  do {
    requestCount++;
    console.log(`Making request ${requestCount} for date range ${startDate.toISOString()} to ${endDate.toISOString()} at location ${locationId}`);

    let retries = 0;
    let response: Response;

    // Retry loop with exponential backoff
    while (retries <= maxRetries) {
      try {
        const url = buildPaymentsUrl(startDate, endDate, cursor, locationId);
        response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Square-Version': '2025-07-16',
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          break; // Success, exit retry loop
        }

        // Handle rate limiting and server errors
        if (response.status === 429 || response.status >= 500) {
          const waitTime = Math.pow(2, retries) * 1000; // Exponential backoff: 1s, 2s, 4s
          console.log(`Rate limit/server error (${response.status}), retrying in ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          retries++;
          continue;
        }

        // For other errors, throw immediately
        throw new Error(`Square API error: ${response.status} ${response.statusText}`);

      } catch (error) {
        if (retries === maxRetries) {
          throw new Error(`Failed after ${maxRetries} retries: ${error.message}`);
        }
        const waitTime = Math.pow(2, retries) * 1000;
        console.log(`Request failed, retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        retries++;
      }
    }

    const data = await response!.json();
    const payments = data.payments || [];

    if (cursor) {
      console.log(`→ Cursor request returned ${payments.length} payments, next cursor: ${data.cursor ? 'present' : 'null'}`);
    } else {
      console.log(`→ Initial request returned ${payments.length} payments`);
    }

    allPayments.push(...payments);
    cursor = data.cursor || null;

    // Polite pause between requests
    if (cursor) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }

  } while (cursor);

  console.log(`Total payments fetched: ${allPayments.length}`);
  return allPayments;
}

/**
 * Build the Square API URL for fetching payments
 */
function buildPaymentsUrl(startDate: Date, endDate: Date, cursor: string | null, locationId: string): string {
  const url = new URL('https://connect.squareup.com/v2/payments');

  // Add required parameters
  url.searchParams.append('begin_time', startDate.toISOString());
  url.searchParams.append('end_time', endDate.toISOString());
  url.searchParams.append('location_id', locationId);

  // Add optional parameters
  if (cursor) {
    url.searchParams.append('cursor', cursor);
  }

  return url.toString();
}

async function listLocations(accessToken: string): Promise<string[]> {
  const allLocations: string[] = [];
  let cursor: string | null = null;
  let requestCount = 0;

  do {
    requestCount++;
    console.log(`Making request ${requestCount} to list Square locations`);

    const url = new URL('https://connect.squareup.com/v2/locations');
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
    const locations = data.locations || [];

    if (cursor) {
      console.log(`→ Cursor request returned ${locations.length} locations, next cursor: ${data.cursor ? 'present' : 'null'}`);
    } else {
      console.log(`→ Initial request returned ${locations.length} locations`);
    }
    console.log(`Received ${locations.length} locations in this request`);
    allLocations.push(...locations.map(loc => loc.id));

    cursor = data.cursor || null;
    await new Promise(resolve => setTimeout(resolve, 500));

  } while (cursor);

  console.log(`Total locations fetched: ${allLocations.length}`);
  return allLocations;
} 