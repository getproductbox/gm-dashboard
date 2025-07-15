import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ApiRequestBody {
  provider: string;
  endpoint: string;
  environment: 'sandbox' | 'production';
  query_params?: Record<string, string | number>;
  body?: any;
  custom_headers?: Record<string, string>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    console.log('=== UNIVERSAL API PROXY ===');
    console.log('Request method:', req.method);
    console.log('Current UTC time:', new Date().toISOString());

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    const requestBody: ApiRequestBody = await req.json();
    console.log('Request parameters:', JSON.stringify(requestBody, null, 2));

    const { provider, endpoint, environment, query_params, body, custom_headers } = requestBody;

    // Get provider configuration
    const { data: providerData, error: providerError } = await supabase
      .from('api_providers')
      .select(`
        *,
        api_endpoints(endpoint_key, method, path, description),
        api_configurations(environment, config_data, secret_keys)
      `)
      .eq('name', provider)
      .eq('is_active', true)
      .single();

    if (providerError || !providerData) {
      throw new Error(`Provider '${provider}' not found or inactive`);
    }

    // Find the specific endpoint
    const endpointConfig = providerData.api_endpoints.find(
      (ep: any) => ep.endpoint_key === endpoint
    );

    if (!endpointConfig) {
      throw new Error(`Endpoint '${endpoint}' not found for provider '${provider}'`);
    }

    // Get environment configuration
    const envConfig = providerData.api_configurations.find(
      (config: any) => config.environment === environment
    );

    if (!envConfig) {
      throw new Error(`Environment '${environment}' not configured for provider '${provider}'`);
    }

    console.log('=== API CONFIGURATION ===');
    console.log('Provider:', providerData.display_name);
    console.log('Environment:', environment);
    console.log('Endpoint:', endpointConfig.path);
    console.log('Method:', endpointConfig.method);

    // Build the request URL
    let url = `${providerData.base_url}${endpointConfig.path}`;
    
    // Add query parameters if provided
    if (query_params) {
      const urlObj = new URL(url);
      Object.entries(query_params).forEach(([key, value]) => {
        urlObj.searchParams.append(key, String(value));
      });
      url = urlObj.toString();
    }

    console.log('Full URL:', url);

    // Prepare headers
    const headers: Record<string, string> = {
      ...envConfig.config_data.headers,
      ...custom_headers,
    };

    // Add authentication
    if (providerData.auth_type === 'bearer' && envConfig.secret_keys?.access_token) {
      const tokenKey = envConfig.secret_keys.access_token;
      const token = Deno.env.get(tokenKey);
      if (!token) {
        throw new Error(`Authentication token '${tokenKey}' not found in environment`);
      }
      headers['Authorization'] = `Bearer ${token}`;
    } else if (providerData.auth_type === 'oauth') {
      // Get user from auth header for OAuth
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        throw new Error('No authorization header provided for OAuth request');
      }

      const jwt = authHeader.replace('Bearer ', '');
      const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);
      
      if (userError || !user) {
        throw new Error('Invalid user token for OAuth request');
      }

      // Get OAuth token for this user and provider
      const { data: oauthToken, error: tokenError } = await supabase
        .from('oauth_tokens')
        .select('access_token, expires_at, tenant_id, refresh_token')
        .eq('provider_name', provider)
        .eq('user_id', user.id)
        .eq('environment', environment)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (tokenError) {
        throw new Error(`Failed to fetch OAuth token: ${tokenError.message}`);
      }

      if (!oauthToken) {
        throw new Error(`No OAuth token found for ${provider}. Please authenticate first.`);
      }

      // Check if token is expired and attempt refresh for Xero
      if (oauthToken.expires_at && new Date(oauthToken.expires_at) <= new Date()) {
        if (provider === 'xero' && oauthToken.refresh_token) {
          console.log('Token expired, attempting refresh...');
          
          try {
            const refreshResponse = await supabase.functions.invoke('xero-token-refresh', {
              body: {
                user_id: user.id,
                environment
              }
            });
            
            if (refreshResponse.error || !refreshResponse.data?.success) {
              throw new Error(`Token refresh failed: ${refreshResponse.data?.error || 'Unknown error'}`);
            }
            
            // Get the refreshed token
            const { data: refreshedToken, error: refreshTokenError } = await supabase
              .from('oauth_tokens')
              .select('access_token, expires_at, tenant_id')
              .eq('provider_name', provider)
              .eq('user_id', user.id)
              .eq('environment', environment)
              .order('updated_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            
            if (refreshTokenError || !refreshedToken) {
              throw new Error('Failed to get refreshed token');
            }
            
            // Use the refreshed token
            headers['Authorization'] = `Bearer ${refreshedToken.access_token}`;
            
            // Add Xero-specific tenant header
            if (refreshedToken.tenant_id) {
              headers['Xero-tenant-id'] = refreshedToken.tenant_id;
            }
            
            console.log('✅ Token refreshed successfully');
          } catch (refreshError) {
            console.error('❌ Token refresh failed:', refreshError);
            throw new Error(`OAuth token for ${provider} has expired and refresh failed: ${refreshError.message}`);
          }
        } else {
          throw new Error(`OAuth token for ${provider} has expired. Please re-authenticate.`);
        }
      } else {
        headers['Authorization'] = `Bearer ${oauthToken.access_token}`;
        
        // Add Xero-specific tenant header
        if (provider === 'xero' && oauthToken.tenant_id) {
          headers['Xero-tenant-id'] = oauthToken.tenant_id;
        }
      }

    }

    console.log('=== API REQUEST ===');
    console.log('Headers (auth redacted):', {
      ...headers,
      Authorization: headers.Authorization ? '[REDACTED]' : undefined
    });

    // Make the API request
    const response = await fetch(url, {
      method: endpointConfig.method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    console.log('=== API RESPONSE ===');
    console.log('Status:', response.status);
    console.log('Status text:', response.statusText);

    const responseData = await response.text();
    let parsedResponse;

    try {
      parsedResponse = JSON.parse(responseData);
    } catch {
      parsedResponse = responseData;
    }

    const executionTime = Date.now() - startTime;

    // Build standardized response
    const result = {
      success: response.ok,
      provider,
      endpoint,
      environment,
      url,
      status: response.status,
      statusText: response.statusText,
      execution_time_ms: executionTime,
      data: parsedResponse,
      timestamp: new Date().toISOString(),
      endpoint_config: {
        method: endpointConfig.method,
        description: endpointConfig.description,
      }
    };

    if (!response.ok) {
      console.error('❌ API Error:', parsedResponse);
      result.success = false;
    } else {
      console.log('✅ API Success');
      
      // Log summary of data received for known endpoints
      if (endpoint === 'locations' && parsedResponse.locations) {
        console.log(`Found ${parsedResponse.locations.length} locations`);
      } else if (endpoint === 'payments' && parsedResponse.payments) {
        console.log(`Found ${parsedResponse.payments.length} payments`);
      }
    }

    return new Response(JSON.stringify(result, null, 2), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in universal-api-proxy function:', error);
    
    const errorResult = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      execution_time_ms: Date.now() - startTime
    };

    return new Response(JSON.stringify(errorResult, null, 2), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});