import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SquarePayment {
  id: string;
  created_at: string;
  updated_at: string;
  amount_money: {
    amount: number;
    currency: string;
  };
  status: string;
  source_type: string;
  location_id?: string;
  order_id?: string;
  card_details?: any;
  receipt_number?: string;
  receipt_url?: string;
}

interface SquarePaymentsResponse {
  payments?: SquarePayment[];
  cursor?: string;
  errors?: Array<{
    category: string;
    code: string;
    detail: string;
    field?: string;
  }>;
}

interface SyncRequest {
  environment?: 'sandbox' | 'production';
  max_transactions?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== STARTING TRANSACTION-BASED SYNC TEST ===');
    
    // Validate environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const sandboxToken = Deno.env.get('SQUARE_SANDBOX_ACCESS_TOKEN');
    const productionToken = Deno.env.get('SQUARE_PRODUCTION_ACCESS_TOKEN');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    // Parse request parameters
    let syncParams: SyncRequest = {};
    if (req.method === 'POST') {
      try {
        syncParams = await req.json();
      } catch (e) {
        console.log('No valid JSON body, using defaults');
      }
    }

    const environment = syncParams.environment || 'production';
    const accessToken = environment === 'production' ? productionToken : sandboxToken;
    const maxTransactions = syncParams.max_transactions || 100;

    if (!accessToken) {
      throw new Error(`No access token configured for ${environment} environment`);
    }

    console.log(`Environment: ${environment}, Max transactions: ${maxTransactions}`);

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Test Square API directly - NO DATE FILTERING
    const baseUrl = environment === 'sandbox' 
      ? 'https://connect.squareupsandbox.com'
      : 'https://connect.squareup.com';

    console.log('Testing Square API with NO date filtering...');
    
    const url = new URL(`${baseUrl}/v2/payments`);
    url.searchParams.append('sort_order', 'DESC'); // Get newest first
    url.searchParams.append('limit', Math.min(100, maxTransactions).toString());
    
    console.log(`Making request to: ${url.toString()}`);

    const response = await fetch(url.toString(), {
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

    const paymentsData: SquarePaymentsResponse = await response.json();
    
    console.log(`Square API Response: ${paymentsData.payments?.length || 0} payments found`);
    
    if (paymentsData.payments && paymentsData.payments.length > 0) {
      console.log('Sample payment:', {
        id: paymentsData.payments[0].id,
        created_at: paymentsData.payments[0].created_at,
        amount: paymentsData.payments[0].amount_money.amount,
        status: paymentsData.payments[0].status
      });
    }

    // Process payments if any found
    let processedCount = 0;
    if (paymentsData.payments && paymentsData.payments.length > 0) {
      console.log(`Processing ${paymentsData.payments.length} payments...`);
      
      // Get location mappings
      const { data: locations } = await supabase
        .from('square_locations')
        .select('square_location_id, location_name');
      
      const locationMap = new Map(
        locations?.map((loc: any) => [loc.square_location_id, loc.location_name]) || []
      );

      // Transform payments to revenue events
      const revenueEvents = paymentsData.payments
        .filter(payment => payment.status === 'COMPLETED')
        .map(payment => {
          const paymentDate = new Date(payment.created_at);
          const venue = locationMap.get(payment.location_id) || 'default';
          const revenueType = venue === 'Hippie Door' ? 'door' : 'bar';
          
          return {
            square_payment_id: payment.id,
            venue,
            revenue_type: revenueType,
            amount_cents: payment.amount_money.amount,
            currency: payment.amount_money.currency || 'USD',
            payment_date: payment.created_at,
            payment_hour: paymentDate.getHours(),
            payment_day_of_week: paymentDate.getDay(),
            status: 'completed',
            processed_at: new Date().toISOString()
          };
        });

      if (revenueEvents.length > 0) {
        const { error } = await supabase
          .from('revenue_events')
          .upsert(revenueEvents, {
            onConflict: 'square_payment_id'
          });

        if (error) {
          console.error('Revenue events upsert error:', error);
        } else {
          processedCount = revenueEvents.length;
          console.log(`✅ Successfully processed ${revenueEvents.length} revenue events`);
        }
      }
    }

    // Update sync status
    await supabase
      .from('square_sync_status')
      .upsert({
        environment,
        sync_status: 'success',
        payments_fetched: paymentsData.payments?.length || 0,
        payments_synced: processedCount,
        progress_percentage: 100,
        last_successful_sync: new Date().toISOString(),
        last_heartbeat: new Date().toISOString(),
        error_message: null
      }, {
        onConflict: 'environment'
      });

    return new Response(
      JSON.stringify({
        success: true,
        environment,
        payments_found: paymentsData.payments?.length || 0,
        payments_processed: processedCount,
        message: `Found ${paymentsData.payments?.length || 0} payments, processed ${processedCount}`,
        sample_payment: paymentsData.payments?.[0] ? {
          id: paymentsData.payments[0].id,
          created_at: paymentsData.payments[0].created_at,
          amount: paymentsData.payments[0].amount_money.amount
        } : null
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Error in square-sync-test function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
}); 