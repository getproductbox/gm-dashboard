import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TestRequest {
  test: 'locations' | 'payments';
  environment?: 'sandbox' | 'production';
  begin_time?: string;
  limit?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    console.log('=== SQUARE API TEST FUNCTION ===');
    console.log('Request method:', req.method);
    console.log('Current UTC time:', new Date().toISOString());

    // Parse request body
    let testParams: TestRequest = { test: 'locations' };
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        testParams = body;
        console.log('Test parameters:', JSON.stringify(testParams, null, 2));
      } catch (e) {
        console.log('No valid JSON body provided, defaulting to locations test');
      }
    }

    // Determine environment
    const environment = testParams.environment || 'sandbox';
    console.log('Target environment:', environment);
    
    // Get Square API credentials
    const sandboxToken = Deno.env.get('SQUARE_SANDBOX_ACCESS_TOKEN');
    const productionToken = Deno.env.get('SQUARE_PRODUCTION_ACCESS_TOKEN');
    const accessToken = environment === 'production' ? productionToken : sandboxToken;

    if (!accessToken) {
      throw new Error(`No access token configured for ${environment} environment`);
    }

    console.log('Access token configured:', accessToken ? 'YES' : 'NO');

    // Build Square API base URL
    const baseUrl = environment === 'sandbox' 
      ? 'https://connect.squareupsandbox.com'
      : 'https://connect.squareup.com';

    console.log('Base URL:', baseUrl);

    let url: string;
    let description: string;

    // Build the specific test URL
    if (testParams.test === 'locations') {
      url = `${baseUrl}/v2/locations`;
      description = 'List Locations';
    } else if (testParams.test === 'payments') {
      const paymentUrl = new URL(`${baseUrl}/v2/payments`);
      
      // Add query parameters
      if (testParams.begin_time) {
        paymentUrl.searchParams.append('begin_time', testParams.begin_time);
      } else {
        // Default to 30 days ago
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        paymentUrl.searchParams.append('begin_time', thirtyDaysAgo.toISOString());
      }
      
      paymentUrl.searchParams.append('limit', (testParams.limit || 10).toString());
      paymentUrl.searchParams.append('sort_order', 'DESC');
      
      url = paymentUrl.toString();
      description = 'Get Recent Payments';
    } else {
      throw new Error(`Unknown test type: ${testParams.test}`);
    }

    console.log('=== SQUARE API REQUEST ===');
    console.log('Test:', description);
    console.log('Full URL:', url);

    // Make request to Square API
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Square-Version': '2024-12-18',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    console.log('=== SQUARE API RESPONSE ===');
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

    // Build response
    const result = {
      success: response.ok,
      test: testParams.test,
      description,
      environment,
      url,
      status: response.status,
      statusText: response.statusText,
      executionTimeMs: executionTime,
      data: parsedResponse,
      timestamp: new Date().toISOString(),
      headers: {
        'Authorization': 'Bearer [REDACTED]',
        'Square-Version': '2024-12-18',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    if (!response.ok) {
      console.error('❌ Square API Error:', parsedResponse);
      result.success = false;
    } else {
      console.log('✅ Square API Success');
      
      // Log summary of data received
      if (testParams.test === 'locations' && parsedResponse.locations) {
        console.log(`Found ${parsedResponse.locations.length} locations`);
      } else if (testParams.test === 'payments' && parsedResponse.payments) {
        console.log(`Found ${parsedResponse.payments.length} payments`);
      }
    }

    return new Response(JSON.stringify(result, null, 2), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in square-api-test function:', error);
    
    const errorResult = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      executionTimeMs: Date.now() - startTime
    };

    return new Response(JSON.stringify(errorResult, null, 2), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});