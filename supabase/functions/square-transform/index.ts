import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface TransformRequest {
  minutes_back?: number;
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
    console.log('=== STARTING SQUARE TRANSFORM (RECENT SYNCED) ===');
    
    // Parse request parameters
    let transformParams: TransformRequest = {};
    if (req.method === 'POST') {
      try {
        transformParams = await req.json();
      } catch (e) {
        console.log('No valid JSON body, using defaults');
      }
    }

    const minutesBack = transformParams.minutes_back || 60; // Default to last hour

    console.log(`Transform Type: Recent synced transactions (last ${minutesBack} minutes)`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Call the new function to transform recently synced transactions
    console.log(`Calling transform_recent_synced_transactions(${minutesBack})...`);
    
    const { data: result, error } = await supabase.rpc('transform_recent_synced_transactions', {
      minutes_back: minutesBack
    });

    if (error) {
      console.error(`Database function error:`, error);
      throw new Error(`Database function error: ${error.message}`);
    }

    console.log(`✅ Transform completed successfully`);
    console.log('Transform result:', result);

    return new Response(JSON.stringify({
      success: true,
      transform_type: 'recent_synced',
      minutes_back: minutesBack,
      raw_payments_count: result.total_recent_synced,
      processed_count: result.processed_count,
      cutoff_time: result.cutoff_time,
      sample_events: result.sample_results || [],
      message: result.message
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });

  } catch (error) {
    console.error('❌ Error in square-transform function:', error);
    
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