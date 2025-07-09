
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    console.log('Square cron job triggered');

    console.log('Starting scheduled Square sync for both environments');

    // Get the base URL for the edge function
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const functionUrl = `${supabaseUrl}/functions/v1/square-sync`;

    console.log('Triggering square-sync function...');

    // Call the square-sync function for both environments
    const syncPromises = [
      fetch(`${functionUrl}?env=sandbox`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
          'Content-Type': 'application/json'
        }
      }),
      fetch(`${functionUrl}?env=production`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
          'Content-Type': 'application/json'
        }
      })
    ];

    const results = await Promise.allSettled(syncPromises);
    
    const sandboxResult = results[0];
    const productionResult = results[1];

    console.log('Sync results:', {
      sandbox: sandboxResult.status,
      production: productionResult.status
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Cron job completed',
        results: {
          sandbox: sandboxResult.status === 'fulfilled' ? 'success' : 'failed',
          production: productionResult.status === 'fulfilled' ? 'success' : 'failed'
        },
        timestamp: now.toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Cron job error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
