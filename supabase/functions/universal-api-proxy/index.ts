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
    console.log('Request URL:', req.url);
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));
    
    console.log('=== STEP 1: INITIALIZING SUPABASE CLIENT ===');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    console.log('Supabase URL:', supabaseUrl ? 'Present' : 'Missing');
    console.log('Service Role Key:', supabaseKey ? 'Present' : 'Missing');
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client initialized');

    console.log('=== STEP 2: PARSING REQUEST BODY ===');
    // Parse request body
    const requestBody: ApiRequestBody = await req.json();
    console.log('Request parameters:', JSON.stringify(requestBody, null, 2));

    const { provider, endpoint, environment, query_params, body, custom_headers } = requestBody;

    console.log('=== STEP 3: FETCHING PROVIDER CONFIGURATION ===');
    console.log('Looking for provider:', provider);
    console.log('Endpoint:', endpoint);
    console.log('Environment:', environment);
    
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
      console.error('❌ Provider query error:', providerError);
      console.error('❌ Provider data:', providerData);
      throw new Error(`Provider '${provider}' not found or inactive: ${providerError?.message || 'No data returned'}`);
    }
    
    console.log('✅ Provider configuration loaded');
    console.log('Provider endpoints found:', providerData.api_endpoints?.length);
    console.log('Provider configurations found:', providerData.api_configurations?.length);

    console.log('=== STEP 4: FINDING ENDPOINT CONFIGURATION ===');
    // Find the specific endpoint
    const endpointConfig = providerData.api_endpoints.find(
      (ep: any) => ep.endpoint_key === endpoint
    );

    if (!endpointConfig) {
      console.error('❌ Available endpoints:', providerData.api_endpoints.map((ep: any) => ep.endpoint_key));
      throw new Error(`Endpoint '${endpoint}' not found for provider '${provider}'. Available: ${providerData.api_endpoints.map((ep: any) => ep.endpoint_key).join(', ')}`);
    }
    
    console.log('✅ Endpoint configuration found:', endpointConfig);

    console.log('=== STEP 5: FINDING ENVIRONMENT CONFIGURATION ===');
    // Get environment configuration
    const envConfig = providerData.api_configurations.find(
      (config: any) => config.environment === environment
    );

    if (!envConfig) {
      console.error('❌ Available environments:', providerData.api_configurations.map((c: any) => c.environment));
      throw new Error(`Environment '${environment}' not configured for provider '${provider}'. Available: ${providerData.api_configurations.map((c: any) => c.environment).join(', ')}`);
    }
    
    console.log('✅ Environment configuration found');
    console.log('Environment config data keys:', Object.keys(envConfig.config_data || {}));
    console.log('Environment secret keys:', Object.keys(envConfig.secret_keys || {}));

    console.log('=== STEP 6: BUILDING REQUEST URL ===');
    console.log('Provider:', providerData.display_name);
    console.log('Environment:', environment);
    console.log('Endpoint path:', endpointConfig.path);
    console.log('Method:', endpointConfig.method);
    console.log('Base URL:', providerData.base_url);

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

    console.log('=== STEP 7: PREPARING HEADERS ===');
    // Prepare headers
    const headers: Record<string, string> = {
      ...envConfig.config_data.headers,
      ...custom_headers,
    };
    console.log('Base headers from config:', envConfig.config_data.headers);
    console.log('Custom headers provided:', custom_headers);

    console.log('=== STEP 8: ADDING AUTHENTICATION ===');
    console.log('Auth type:', providerData.auth_type);
    
    // Add authentication
    if (providerData.auth_type === 'bearer' && envConfig.secret_keys?.access_token) {
      const tokenKey = envConfig.secret_keys.access_token;
      const token = Deno.env.get(tokenKey);
      if (!token) {
        throw new Error(`Authentication token '${tokenKey}' not found in environment`);
      }
      headers['Authorization'] = `Bearer ${token}`;
      console.log('✅ Bearer token authentication added');
    } else if (providerData.auth_type === 'oauth') {
      console.log('Setting up OAuth authentication...');
      // Get user from auth header for OAuth
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        throw new Error('No authorization header provided for OAuth request');
      }

      const jwt = authHeader.replace('Bearer ', '');
      const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);
      
      if (userError || !user) {
        console.error('❌ User authentication failed:', userError);
        throw new Error(`Invalid user token for OAuth request: ${userError?.message || 'No user found'}`);
      }
      
      console.log('✅ User authenticated:', user.id);

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
        console.error('❌ OAuth token query error:', tokenError);
        throw new Error(`Failed to fetch OAuth token: ${tokenError.message}`);
      }

      if (!oauthToken) {
        console.error('❌ No OAuth token found for provider:', provider);
        throw new Error(`No OAuth token found for ${provider}. Please authenticate first.`);
      }
      
      console.log('✅ OAuth token retrieved');
      console.log('Token expires at:', oauthToken.expires_at);
      console.log('Token has refresh token:', !!oauthToken.refresh_token);
      console.log('Token tenant ID:', oauthToken.tenant_id);

      // Check if token is expired and attempt refresh for Xero
      const now = new Date();
      const expiresAt = new Date(oauthToken.expires_at);
      const isExpired = oauthToken.expires_at && expiresAt <= now;
      
      console.log('Current time:', now.toISOString());
      console.log('Token expires at:', oauthToken.expires_at);
      console.log('Token is expired:', isExpired);
      
      if (isExpired) {
        if (provider === 'xero' && oauthToken.refresh_token) {
          console.log('🔄 Token expired, attempting refresh...');
          
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
          console.log('✅ Using current OAuth token');
          
          // Add Xero-specific tenant header
          if (provider === 'xero' && oauthToken.tenant_id) {
            headers['Xero-tenant-id'] = oauthToken.tenant_id;
            console.log('✅ Added Xero tenant header:', oauthToken.tenant_id);
          }
        }

    }

    console.log('=== STEP 9: MAKING API REQUEST ===');
    console.log('Final URL:', url);
    console.log('Method:', endpointConfig.method);
    console.log('Headers (auth redacted):', {
      ...headers,
      Authorization: headers.Authorization ? '[REDACTED]' : undefined
    });
    console.log('Body:', body ? 'Present' : 'None');

    // Make the API request
    console.log('🌐 Sending request to external API...');
    const response = await fetch(url, {
      method: endpointConfig.method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    console.log('📥 Response received from external API');

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
    console.error('❌ UNIVERSAL API PROXY ERROR ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Time of error:', new Date().toISOString());
    
    const errorResult = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      error_type: error.constructor.name,
      timestamp: new Date().toISOString(),
      execution_time_ms: Date.now() - startTime
    };

    return new Response(JSON.stringify(errorResult, null, 2), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});