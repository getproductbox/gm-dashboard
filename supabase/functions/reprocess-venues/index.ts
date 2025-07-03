import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

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

    // Always use job-based processing for better reliability and timeout handling
    if (rawPayments && rawPayments.length > 0) {
      console.log(`🚀 Creating background job for ${rawPayments.length} payments...`);
      
      // Create a processing job
      const jobId = crypto.randomUUID();
      const { error: jobError } = await supabase
        .from('venue_processing_jobs')
        .insert({
          id: jobId,
          total_payments: rawPayments.length,
          days_back: daysBack,
          status: 'pending',
          created_at: new Date().toISOString()
        });

      if (jobError) {
        throw new Error(`Failed to create processing job: ${jobError.message}`);
      }

      // Start background processing
      const backgroundProcessing = async () => {
        const CHUNK_SIZE = 50;
        let processed = 0;
        let errors = 0;

        for (let i = 0; i < rawPayments.length; i += CHUNK_SIZE) {
          const chunk = rawPayments.slice(i, i + CHUNK_SIZE);
          
          // Update job status
          await supabase
            .from('venue_processing_jobs')
            .update({
              status: 'processing',
              processed_count: processed,
              error_count: errors,
              progress_percentage: Math.round((processed / rawPayments.length) * 100),
              updated_at: new Date().toISOString()
            })
            .eq('id', jobId);

          // Process chunk
          for (const payment of chunk) {
            try {
              const { data: result, error: processError } = await supabase
                .rpc('process_payment_to_revenue', {
                  payment_id: payment.square_payment_id
                });

              if (processError) {
                console.error(`❌ Error processing payment ${payment.square_payment_id}:`, processError.message);
                errors++;
              } else if (result) {
                processed++;
              }
            } catch (error) {
              console.error(`💥 Exception processing payment ${payment.square_payment_id}:`, error);
              errors++;
            }
          }

          console.log(`📊 Chunk complete: ${processed}/${rawPayments.length} processed, ${errors} errors`);
        }

        // Mark job as complete
        await supabase
          .from('venue_processing_jobs')
          .update({
            status: processed === rawPayments.length && errors === 0 ? 'completed' : 'completed_with_errors',
            processed_count: processed,
            error_count: errors,
            progress_percentage: 100,
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', jobId);

        console.log(`🎉 Background job ${jobId} complete: ${processed} processed, ${errors} errors`);
      };

      // Start background processing without blocking response
      backgroundProcessing().catch(error => {
        console.error('Background processing error:', error);
        supabase
          .from('venue_processing_jobs')
          .update({
            status: 'failed',
            error_message: error.message,
            updated_at: new Date().toISOString()
          })
          .eq('id', jobId);
      });

      return new Response(
        JSON.stringify({
          success: true,
          jobId: jobId,
          totalPayments: rawPayments.length,
          message: `Background job created for ${rawPayments.length} payments. Check job status with ID: ${jobId}`
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // If no payments found, return success
    return new Response(
      JSON.stringify({
        success: true,
        message: `No payments found in the last ${daysBack} days`,
        totalPayments: 0
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