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
    console.log('=== SYNCING SQUARE LOCATIONS ===');
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get request parameters
    const body = await req.json().catch(() => ({}));
    const environment = body.environment || 'sandbox';
    
    console.log('Target environment:', environment);
    
    // Get Square API credentials
    const sandboxToken = Deno.env.get('SQUARE_SANDBOX_ACCESS_TOKEN');
    const productionToken = Deno.env.get('SQUARE_PRODUCTION_ACCESS_TOKEN');
    const accessToken = environment === 'production' ? productionToken : sandboxToken;

    if (!accessToken) {
      throw new Error(`No access token configured for ${environment} environment`);
    }

    // Build Square API base URL
    const baseUrl = environment === 'sandbox' 
      ? 'https://connect.squareupsandbox.com'
      : 'https://connect.squareup.com';

    console.log('Fetching locations from Square API...');
    
    // Fetch locations from Square API
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
      const errorText = await response.text();
      throw new Error(`Square API Error (${response.status}): ${errorText}`);
    }

    const locationsData = await response.json();
    console.log(`Found ${locationsData.locations?.length || 0} locations`);

    let locationsProcessed = 0;

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

        console.log(`Storing location: ${location.name} (${location.id})`);

        const { error } = await supabase
          .from('square_locations')
          .upsert(locationData, {
            onConflict: 'square_location_id'
          });

        if (error) {
          console.error(`Failed to store location ${location.id}:`, error);
          throw new Error(`Failed to store location: ${error.message}`);
        }

        locationsProcessed++;
      }
    }

    console.log(`Successfully processed ${locationsProcessed} locations`);

    return new Response(
      JSON.stringify({
        success: true,
        locationsProcessed,
        environment,
        message: `Successfully synced ${locationsProcessed} locations from ${environment}`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('💥 LOCATION SYNC ERROR:', error);
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