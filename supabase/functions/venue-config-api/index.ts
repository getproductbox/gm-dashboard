import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Types for the venue configuration API
interface VenueArea {
  id: string;
  name: string;
  capacity: number;
  description?: string;
  base_price?: number;
  hourly_rate?: number;
}

interface Venue {
  id: string;
  name: string;
  description?: string;
  areas: VenueArea[];
  operating_hours: {
    start: string;
    end: string;
  };
}

interface VenueConfigResponse {
  success: boolean;
  venues: Venue[];
  message?: string;
}

// Venue configuration data
const venueConfig: Venue[] = [
  {
    id: 'manor',
    name: 'Manor',
    description: 'Our flagship venue with multiple spaces for events',
    operating_hours: {
      start: '09:00',
      end: '23:00'
    },
    areas: [
      {
        id: 'upstairs',
        name: 'Upstairs',
        capacity: 50,
        description: 'Elegant upstairs space perfect for intimate gatherings',
        base_price: 500.00,
        hourly_rate: 100.00
      },
      {
        id: 'downstairs',
        name: 'Downstairs',
        capacity: 30,
        description: 'Cozy downstairs area with bar access',
        base_price: 300.00,
        hourly_rate: 75.00
      },
      {
        id: 'full_venue',
        name: 'Full Venue',
        capacity: 80,
        description: 'Complete venue access including all areas',
        base_price: 800.00,
        hourly_rate: 150.00
      }
    ]
  },
  {
    id: 'hippie',
    name: 'Hippie',
    description: 'Our vibrant alternative venue with unique character',
    operating_hours: {
      start: '10:00',
      end: '23:00'
    },
    areas: [
      {
        id: 'upstairs',
        name: 'Upstairs',
        capacity: 40,
        description: 'Spacious upstairs with great views',
        base_price: 400.00,
        hourly_rate: 80.00
      },
      {
        id: 'downstairs',
        name: 'Downstairs',
        capacity: 25,
        description: 'Intimate downstairs space with character',
        base_price: 250.00,
        hourly_rate: 60.00
      },
      {
        id: 'full_venue',
        name: 'Full Venue',
        capacity: 65,
        description: 'Complete venue access with all amenities',
        base_price: 650.00,
        hourly_rate: 120.00
      }
    ]
  }
];

// API key validation
const validateApiKey = (request: Request): boolean => {
  const apiKey = request.headers.get('x-api-key');
  const validApiKey = Deno.env.get('PUBLIC_BOOKING_API_KEY') || 'demo-api-key-2024';
  return apiKey === validApiKey;
};

// CORS allowlist via env: ALLOWED_ORIGINS=domain1,domain2
const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') || '').split(',').map(s => s.trim()).filter(Boolean);
function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || '';
  const allowOrigin = allowedOrigins.length === 0 ? '*' : (allowedOrigins.includes(origin) ? origin : 'null');
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
  } as Record<string, string>;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: getCorsHeaders(req),
    });
  }

  // Add CORS headers to all responses
  const corsHeaders = getCorsHeaders(req);

  try {
    // Only allow GET requests
    if (req.method !== 'GET') {
      return new Response(
        JSON.stringify({ success: false, message: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate API key (optional for this endpoint, but good practice)
    if (!validateApiKey(req)) {
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get query parameters
    const url = new URL(req.url);
    const venueId = url.searchParams.get('venue');

    let responseData: VenueConfigResponse;

    if (venueId) {
      // Return specific venue
      const venue = venueConfig.find(v => v.id === venueId);
      if (!venue) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: `Venue '${venueId}' not found` 
          } as VenueConfigResponse),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      responseData = {
        success: true,
        venues: [venue]
      };
    } else {
      // Return all venues
      responseData = {
        success: true,
        venues: venueConfig
      };
    }

    return new Response(
      JSON.stringify(responseData),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'An unexpected error occurred. Please try again.'
      } as VenueConfigResponse),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}); 