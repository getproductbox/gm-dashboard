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
    console.log('=== XERO OAUTH INITIATE ===');
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get request parameters
    const { environment = 'production', redirect_uri } = await req.json();
    console.log('OAuth initiate params:', { environment, redirect_uri });

    // Get Xero configuration
    const { data: providerData, error: providerError } = await supabase
      .from('api_providers')
      .select(`
        *,
        api_configurations(environment, config_data, secret_keys)
      `)
      .eq('name', 'xero')
      .eq('is_active', true)
      .single();

    if (providerError || !providerData) {
      throw new Error('Xero provider not found or inactive');
    }

    // Get environment configuration
    const envConfig = providerData.api_configurations.find(
      (config: any) => config.environment === environment
    );

    if (!envConfig) {
      throw new Error(`Environment '${environment}' not configured for Xero`);
    }

    // Get OAuth credentials
    const clientId = Deno.env.get(envConfig.secret_keys.client_id);
    if (!clientId) {
      throw new Error(`Xero Client ID not found in environment`);
    }

    // Build OAuth authorization URL
    const state = crypto.randomUUID(); // CSRF protection
    const scope = 'accounting.transactions accounting.contacts accounting.settings';
    
    const authUrl = new URL('https://login.xero.com/identity/connect/authorize');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirect_uri);
    authUrl.searchParams.set('scope', scope);
    authUrl.searchParams.set('state', state);

    console.log('✅ OAuth URL generated');

    return new Response(JSON.stringify({
      success: true,
      authorization_url: authUrl.toString(),
      state,
      timestamp: new Date().toISOString(),
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in xero-oauth-initiate:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});