import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== XERO DEBUG TEST FUNCTION START ===');
    console.log('Current UTC time:', new Date().toISOString());

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { test_type = 'connection', environment = 'production' } = await req.json().catch(() => ({}));

    let result: any = {};

    switch (test_type) {
      case 'database_check':
        console.log('=== TESTING DATABASE ACCESS ===');
        result = await testDatabaseAccess(supabase);
        break;
        
      case 'token_check':
        console.log('=== TESTING OAUTH TOKEN ===');
        result = await testOAuthToken(supabase, environment);
        break;
        
      case 'direct_api':
        console.log('=== TESTING DIRECT API CALL ===');
        result = await testDirectAPICall(supabase, environment);
        break;
        
      case 'proxy_test':
        console.log('=== TESTING API PROXY ===');
        result = await testApiProxy(supabase, environment);
        break;
        
      default:
        console.log('=== TESTING CONNECTION ===');
        result = await testConnection(supabase, environment);
    }

    return new Response(JSON.stringify({
      success: true,
      test_type,
      result,
      timestamp: new Date().toISOString()
    }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ XERO DEBUG TEST FAILED:', error);
    
    const errorResult = {
      success: false,
      error: error.message,
      error_type: error.constructor.name,
      stack: error.stack,
      timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify(errorResult, null, 2), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function testDatabaseAccess(supabase: any) {
  console.log('Testing database access...');
  
  // Test API providers
  const { data: providers, error: providersError } = await supabase
    .from('api_providers')
    .select('*')
    .eq('name', 'xero');
    
  if (providersError) {
    throw new Error(`Provider query failed: ${providersError.message}`);
  }
  
  // Test API endpoints
  const { data: endpoints, error: endpointsError } = await supabase
    .from('api_endpoints')
    .select('*')
    .eq('provider_id', providers[0]?.id);
    
  if (endpointsError) {
    throw new Error(`Endpoints query failed: ${endpointsError.message}`);
  }
  
  // Test API configurations
  const { data: configs, error: configsError } = await supabase
    .from('api_configurations')
    .select('*')
    .eq('provider_id', providers[0]?.id);
    
  if (configsError) {
    throw new Error(`Configurations query failed: ${configsError.message}`);
  }
  
  return {
    providers_found: providers.length,
    endpoints_found: endpoints.length,
    configurations_found: configs.length,
    provider_data: providers[0],
    endpoint_data: endpoints,
    config_data: configs
  };
}

async function testOAuthToken(supabase: any, environment: string) {
  console.log('Testing OAuth token access...');
  
  const { data: tokens, error: tokensError } = await supabase
    .from('oauth_tokens')
    .select('*')
    .eq('provider_name', 'xero')
    .eq('environment', environment)
    .order('created_at', { ascending: false });
    
  if (tokensError) {
    throw new Error(`Token query failed: ${tokensError.message}`);
  }
  
  const latestToken = tokens[0];
  
  if (!latestToken) {
    throw new Error('No OAuth tokens found');
  }
  
  const now = new Date();
  const expiresAt = new Date(latestToken.expires_at);
  const isExpired = latestToken.expires_at && expiresAt <= now;
  
  return {
    tokens_found: tokens.length,
    latest_token: {
      id: latestToken.id,
      created_at: latestToken.created_at,
      expires_at: latestToken.expires_at,
      is_expired: isExpired,
      has_refresh_token: !!latestToken.refresh_token,
      tenant_id: latestToken.tenant_id,
      scope: latestToken.scope
    }
  };
}

async function testDirectAPICall(supabase: any, environment: string) {
  console.log('Testing direct API call to Xero...');
  
  // Get OAuth token
  const { data: token, error: tokenError } = await supabase
    .from('oauth_tokens')
    .select('access_token, tenant_id, expires_at')
    .eq('provider_name', 'xero')
    .eq('environment', environment)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
    
  if (tokenError || !token) {
    throw new Error(`Failed to get token: ${tokenError?.message || 'No token found'}`);
  }
  
  // Check if expired
  const now = new Date();
  const expiresAt = new Date(token.expires_at);
  const isExpired = token.expires_at && expiresAt <= now;
  
  if (isExpired) {
    throw new Error(`Token is expired. Expires at: ${token.expires_at}, Current time: ${now.toISOString()}`);
  }
  
  // Make direct API call
  const url = 'https://api.xero.com/api.xro/2.0/Accounts';
  const headers = {
    'Authorization': `Bearer ${token.access_token}`,
    'Xero-tenant-id': token.tenant_id,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };
  
  console.log('Making direct call to:', url);
  console.log('Headers:', { ...headers, Authorization: '[REDACTED]' });
  
  const response = await fetch(url, {
    method: 'GET',
    headers
  });
  
  const responseText = await response.text();
  
  let responseData;
  try {
    responseData = JSON.parse(responseText);
  } catch {
    responseData = responseText;
  }
  
  return {
    url,
    status: response.status,
    status_text: response.statusText,
    response_ok: response.ok,
    response_size: responseText.length,
    response_data: response.ok ? responseData : { error: responseData }
  };
}

async function testApiProxy(supabase: any, environment: string) {
  console.log('Testing API proxy function...');
  
  const response = await supabase.functions.invoke('universal-api-proxy', {
    body: {
      provider: 'xero',
      endpoint: 'accounts',
      environment
    }
  });
  
  return {
    proxy_error: response.error,
    proxy_status: response.status,
    proxy_data_type: typeof response.data,
    proxy_data: response.data
  };
}

async function testConnection(supabase: any, environment: string) {
  console.log('Running comprehensive connection test...');
  
  const results: any = {};
  
  try {
    results.database = await testDatabaseAccess(supabase);
  } catch (error) {
    results.database = { error: error.message };
  }
  
  try {
    results.oauth_token = await testOAuthToken(supabase, environment);
  } catch (error) {
    results.oauth_token = { error: error.message };
  }
  
  try {
    results.direct_api = await testDirectAPICall(supabase, environment);
  } catch (error) {
    results.direct_api = { error: error.message };
  }
  
  try {
    results.api_proxy = await testApiProxy(supabase, environment);
  } catch (error) {
    results.api_proxy = { error: error.message };
  }
  
  return results;
}