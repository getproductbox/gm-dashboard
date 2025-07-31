import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Types for the karaoke booths API
interface KaraokeBooth {
  id: string;
  name: string;
  venue: string;
  capacity: number;
  hourly_rate: number;
  is_available: boolean;
  maintenance_notes?: string;
  operating_hours_start: string;
  operating_hours_end: string;
}

interface KaraokeBoothsResponse {
  success: boolean;
  booths: KaraokeBooth[];
  message?: string;
}

// API key validation
const validateApiKey = (request: Request): boolean => {
  const apiKey = request.headers.get('x-api-key');
  const validApiKey = Deno.env.get('PUBLIC_BOOKING_API_KEY') || 'demo-api-key-2024';
  return apiKey === validApiKey;
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
      },
    });
  }

  // Add CORS headers to all responses
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
  };

  try {
    // Only allow GET requests
    if (req.method !== 'GET') {
      return new Response(
        JSON.stringify({ success: false, message: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate API key
    if (!validateApiKey(req)) {
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get query parameters
    const url = new URL(req.url);
    const venue = url.searchParams.get('venue');
    const availableOnly = url.searchParams.get('available') === 'true';

    // Build query
    let query = supabase
      .from('karaoke_booths')
      .select('*')
      .order('name');

    // Filter by venue if specified
    if (venue) {
      query = query.eq('venue', venue);
    }

    // Filter by availability if requested
    if (availableOnly) {
      query = query.eq('is_available', true);
    }

    // Execute query
    const { data: booths, error } = await query;

    if (error) {
      console.error('Error fetching karaoke booths:', error);
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Failed to fetch karaoke booths'
        } as KaraokeBoothsResponse),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Transform data to match API response format
    const transformedBooths: KaraokeBooth[] = booths.map(booth => ({
      id: booth.id,
      name: booth.name,
      venue: booth.venue,
      capacity: booth.capacity,
      hourly_rate: booth.hourly_rate,
      is_available: booth.is_available,
      maintenance_notes: booth.maintenance_notes,
      operating_hours_start: booth.operating_hours_start,
      operating_hours_end: booth.operating_hours_end
    }));

    return new Response(
      JSON.stringify({
        success: true,
        booths: transformedBooths
      } as KaraokeBoothsResponse),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'An unexpected error occurred. Please try again.'
      } as KaraokeBoothsResponse),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}); 