import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

    // Get all raw payments that need venue reprocessing
    console.log('Fetching raw payments...');
    const { data: rawPayments, error: fetchError } = await supabase
      .from('square_payments_raw')
      .select('square_payment_id, raw_response');

    if (fetchError) {
      throw new Error(`Failed to fetch raw payments: ${fetchError.message}`);
    }

    console.log(`Found ${rawPayments?.length || 0} payments to reprocess`);

    let processedCount = 0;
    let errorCount = 0;

    if (rawPayments && rawPayments.length > 0) {
      for (const rawPayment of rawPayments) {
        try {
          // Use the database function to properly process venue mapping
          const { data: processed, error: processError } = await supabase
            .rpc('process_payment_to_revenue', {
              payment_id: rawPayment.square_payment_id
            });

          if (processError) {
            console.error(`Error processing payment ${rawPayment.square_payment_id}:`, processError);
            errorCount++;
          } else if (processed) {
            processedCount++;
            if (processedCount % 50 === 0) {
              console.log(`Processed ${processedCount} payments...`);
            }
          }
        } catch (error) {
          console.error(`Exception processing payment ${rawPayment.square_payment_id}:`, error);
          errorCount++;
        }
      }
    }

    console.log('=== REPROCESSING COMPLETE ===');
    console.log(`Successfully processed: ${processedCount}`);
    console.log(`Errors encountered: ${errorCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Reprocessed venue mapping for ${processedCount} payments`,
        processedCount,
        errorCount,
        totalPayments: rawPayments?.length || 0
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