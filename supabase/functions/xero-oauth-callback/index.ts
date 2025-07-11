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
    console.log('=== XERO OAUTH CALLBACK ===');
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get request parameters
    const { code, state, environment = 'production', redirect_uri } = await req.json();
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      throw new Error('No authorization header provided');
    }

    // Get user from auth header
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);
    
    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    console.log('OAuth callback params:', { code: code ? '[REDACTED]' : null, state, environment });

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
    const clientSecret = Deno.env.get(envConfig.secret_keys.client_secret);
    
    if (!clientId || !clientSecret) {
      throw new Error('Xero OAuth credentials not found in environment');
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://identity.xero.com/connect/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', errorText);
      throw new Error(`Token exchange failed: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    console.log('✅ Token exchange successful');

    // Get Xero tenants/organizations
    const tenantsResponse = await fetch('https://api.xero.com/connections', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    const tenants = await tenantsResponse.json();
    console.log(`Found ${tenants.length} Xero organizations`);

    // Store tokens for each tenant
    const storedTokens = [];
    for (const tenant of tenants) {
      const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));
      
      const { data: tokenRecord, error: tokenError } = await supabase
        .from('oauth_tokens')
        .upsert({
          provider_name: 'xero',
          user_id: user.id,
          environment,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          token_type: tokenData.token_type || 'Bearer',
          expires_at: expiresAt.toISOString(),
          scope: tokenData.scope,
          tenant_id: tenant.tenantId,
        }, {
          onConflict: 'provider_name,user_id,environment,tenant_id'
        })
        .select()
        .single();

      if (tokenError) {
        console.error('Error storing token for tenant', tenant.tenantId, tokenError);
      } else {
        storedTokens.push({
          tenant_id: tenant.tenantId,
          tenant_name: tenant.tenantName,
          tenant_type: tenant.tenantType,
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Successfully connected to ${storedTokens.length} Xero organization(s)`,
      tenants: storedTokens,
      timestamp: new Date().toISOString(),
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in xero-oauth-callback:', error);
    
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