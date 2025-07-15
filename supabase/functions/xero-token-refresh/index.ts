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
    console.log('=== XERO TOKEN REFRESH ===');
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { user_id, environment = 'production' } = await req.json();

    if (!user_id) {
      throw new Error('User ID is required for token refresh');
    }

    // Get current OAuth token
    const { data: currentToken, error: tokenError } = await supabase
      .from('oauth_tokens')
      .select('*')
      .eq('provider_name', 'xero')
      .eq('user_id', user_id)
      .eq('environment', environment)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (tokenError || !currentToken) {
      throw new Error('No OAuth token found for refresh');
    }

    if (!currentToken.refresh_token) {
      throw new Error('No refresh token available');
    }

    console.log('Refreshing token for user:', user_id);

    // Get Xero client credentials
    const xeroClientId = Deno.env.get('XERO_CLIENT_ID');
    const xeroClientSecret = Deno.env.get('XERO_CLIENT_SECRET');

    if (!xeroClientId || !xeroClientSecret) {
      throw new Error('Xero client credentials not configured');
    }

    // Prepare token refresh request
    const tokenData = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: currentToken.refresh_token,
    });

    const basicAuth = btoa(`${xeroClientId}:${xeroClientSecret}`);

    // Call Xero token endpoint
    const response = await fetch('https://identity.xero.com/connect/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${basicAuth}`,
      },
      body: tokenData.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Token refresh failed:', response.status, errorText);
      throw new Error(`Token refresh failed: ${response.status} ${errorText}`);
    }

    const tokenResponse = await response.json();
    
    // Calculate new expiry time
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + tokenResponse.expires_in);

    // Update the token in database
    const { error: updateError } = await supabase
      .from('oauth_tokens')
      .update({
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token || currentToken.refresh_token,
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', currentToken.id);

    if (updateError) {
      throw new Error(`Failed to update token: ${updateError.message}`);
    }

    console.log('✅ Token refreshed successfully');

    return new Response(JSON.stringify({
      success: true,
      message: 'Token refreshed successfully',
      expires_at: expiresAt.toISOString(),
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Token refresh failed:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Token refresh failed',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});