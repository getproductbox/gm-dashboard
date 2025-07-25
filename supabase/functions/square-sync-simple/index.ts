import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface SyncRequest {
  max_transactions?: number;
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
    console.log('=== STARTING SQUARE SYNC (PRODUCTION ONLY) ===');
    
    // Parse request parameters
    let syncParams: SyncRequest = {};
    if (req.method === 'POST') {
      try {
        syncParams = await req.json();
      } catch (e) {
        console.log('No valid JSON body, using defaults');
      }
    }

    const maxTransactions = syncParams.max_transactions || 1000;
    const environment = 'production'; // Always use production

    console.log(`Environment: ${environment}, Max transactions: ${maxTransactions}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const productionToken = Deno.env.get("SQUARE_PRODUCTION_ACCESS_TOKEN");

    console.log('Environment variables check:');
    console.log('- SUPABASE_URL:', supabaseUrl ? 'SET' : 'MISSING');
    console.log('- SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'SET' : 'MISSING');
    console.log('- SQUARE_PRODUCTION_ACCESS_TOKEN:', productionToken ? 'SET' : 'MISSING');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    if (!productionToken) {
      throw new Error("No Square production access token configured");
    }

    console.log(`Using production access token: ${productionToken.substring(0, 10)}...`);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update sync status to running
    await supabase
      .from('square_sync_status')
      .upsert({
        environment,
        sync_status: 'running',
        last_sync_attempt: new Date().toISOString(),
        last_heartbeat: new Date().toISOString(),
        error_message: null
      }, {
        onConflict: 'environment'
      });

    // Build Square API URL
    const url = new URL('https://connect.squareup.com/v2/payments');
    url.searchParams.append('sort_order', 'DESC'); // Get newest first
    url.searchParams.append('limit', Math.min(100, maxTransactions).toString());

    console.log(`Making request to: ${url.toString()}`);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${productionToken}`,
        "Square-Version": "2024-01-17",
        "Content-Type": "application/json"
      }
    });

    console.log(`Square API Response Status: ${response.status}`);
    console.log(`Square API Response Headers:`, Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Square API Error Response: ${errorText}`);
      throw new Error(`Square API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`Square API Raw Response:`, JSON.stringify(data, null, 2));
    
    const payments = data.payments || [];

    console.log(`Square API Response: ${payments.length} payments found`);

    if (payments.length === 0) {
      console.log('No payments found in Square API response');
      
      // Update sync status for no payments found
      await supabase
        .from('square_sync_status')
        .upsert({
          environment,
          sync_status: 'success',
          payments_fetched: 0,
          payments_synced: 0,
          progress_percentage: 100,
          last_successful_sync: new Date().toISOString(),
          last_heartbeat: new Date().toISOString(),
          error_message: null
        }, {
          onConflict: 'environment'
        });

      return new Response(JSON.stringify({
        success: true,
        environment,
        message: "No payments found",
        payments_fetched: 0,
        payments_synced: 0,
        debug_info: {
          environment,
          api_url: url.toString(),
          response_status: response.status,
          raw_response: data
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      });
    }

    // Process payments
    const paymentsToInsert = payments.map(payment => ({
      square_payment_id: payment.id,
      raw_response: payment
    }));

    console.log(`Attempting to insert ${paymentsToInsert.length} payments into database`);

    const { data: insertedData, error } = await supabase
      .from("square_payments_raw")
      .upsert(paymentsToInsert, { onConflict: "square_payment_id" })
      .select();

    if (error) {
      console.error('Database error:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    const syncedCount = insertedData?.length || 0;
    console.log(`✅ Successfully synced ${syncedCount} payments`);

    // Update sync status with success
    await supabase
      .from('square_sync_status')
      .upsert({
        environment,
        sync_status: 'success',
        payments_fetched: payments.length,
        payments_synced: syncedCount,
        progress_percentage: 100,
        last_successful_sync: new Date().toISOString(),
        last_heartbeat: new Date().toISOString(),
        error_message: null
      }, {
        onConflict: 'environment'
      });

    return new Response(JSON.stringify({
      success: true,
      environment,
      message: "Sync completed successfully",
      payments_fetched: payments.length,
      payments_synced: syncedCount,
      sample_payment: payments[0] ? {
        id: payments[0].id,
        created_at: payments[0].created_at,
        amount: payments[0].amount_money?.amount
      } : null,
      debug_info: {
        api_url: url.toString(),
        response_status: response.status
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });

  } catch (error) {
    console.error('❌ Error in square-sync-simple function:', error);
    
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
            sync_status: 'error',
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