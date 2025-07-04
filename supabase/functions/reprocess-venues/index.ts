import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== REPROCESSING VENUE MAPPING FOR EXISTING PAYMENTS ===');
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get body parameters
    const body = await req.json().catch(() => ({}));
    const daysBack = body.daysBack || 14; // Default to last 2 weeks
    
    // Calculate date filter
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);
    const cutoffISO = cutoffDate.toISOString();
    
    console.log(`Fetching raw payments from the last ${daysBack} days (since ${cutoffISO})...`);
    
    // Get raw payments that need venue reprocessing from the specified date range
    const { data: rawPayments, error: fetchError } = await supabase
      .from('square_payments_raw')
      .select('square_payment_id, raw_response')
      .gte('raw_response->>created_at', cutoffISO)
      .order('synced_at', { ascending: false });

    if (fetchError) {
      throw new Error(`Failed to fetch raw payments: ${fetchError.message}`);
    }

    console.log(`Found ${rawPayments?.length || 0} payments to reprocess`);

    // Use optimized batch processing instead of individual payment processing
    console.log(`🚀 Using optimized batch processing for last ${daysBack} days...`);
    
    // Call the new batch processing function
    const { data: batchResult, error: batchError } = await supabase
      .rpc('reprocess_venues_batch', {
        days_back: daysBack
      });

    if (batchError) {
      throw new Error(`Batch processing failed: ${batchError.message}`);
    }

    console.log(`✅ Batch processing complete:`, batchResult);

    return new Response(
      JSON.stringify({
        success: true,
        processedCount: batchResult.processed_count,
        errorCount: batchResult.error_count,
        totalPayments: batchResult.total_payments,
        message: `Successfully processed ${batchResult.processed_count} of ${batchResult.total_payments} payments in batch`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('💥 REPROCESSING ERROR:', error);
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