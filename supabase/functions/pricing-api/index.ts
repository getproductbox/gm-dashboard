import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Types for the pricing API
interface PricingAddon {
  id: string;
  name: string;
  price: number;
  description?: string;
}

interface PricingResponse {
  success: boolean;
  venue: string;
  venue_area: string;
  date: string;
  guest_count: number;
  duration_hours?: number;
  base_price: number;
  per_guest_surcharge: number;
  total_price: number;
  currency: string;
  includes: string[];
  addons: PricingAddon[];
  message?: string;
}

// Pricing configuration
const pricingConfig = {
  manor: {
    upstairs: {
      base_price: 500.00,
      per_guest_surcharge: 25.00,
      max_guests: 50,
      includes: ['Basic setup', 'Staff support', 'Sound system']
    },
    downstairs: {
      base_price: 300.00,
      per_guest_surcharge: 20.00,
      max_guests: 30,
      includes: ['Basic setup', 'Staff support', 'Bar access']
    },
    full_venue: {
      base_price: 800.00,
      per_guest_surcharge: 30.00,
      max_guests: 80,
      includes: ['Complete venue access', 'Full staff support', 'All amenities']
    }
  },
  hippie: {
    upstairs: {
      base_price: 400.00,
      per_guest_surcharge: 20.00,
      max_guests: 40,
      includes: ['Basic setup', 'Staff support', 'Unique atmosphere']
    },
    downstairs: {
      base_price: 250.00,
      per_guest_surcharge: 15.00,
      max_guests: 25,
      includes: ['Basic setup', 'Staff support', 'Intimate space']
    },
    full_venue: {
      base_price: 650.00,
      per_guest_surcharge: 25.00,
      max_guests: 65,
      includes: ['Complete venue access', 'Full staff support', 'All amenities']
    }
  }
};

// Available add-ons
const availableAddons: PricingAddon[] = [
  {
    id: 'catering',
    name: 'Catering Service',
    price: 200.00,
    description: 'Professional catering for your event'
  },
  {
    id: 'dj',
    name: 'DJ Service',
    price: 150.00,
    description: 'Professional DJ for entertainment'
  },
  {
    id: 'photography',
    name: 'Photography',
    price: 300.00,
    description: 'Professional event photography'
  },
  {
    id: 'decorations',
    name: 'Decorations',
    price: 100.00,
    description: 'Custom decorations and setup'
  },
  {
    id: 'security',
    name: 'Security',
    price: 250.00,
    description: 'Professional security staff'
  }
];

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

    // Get query parameters
    const url = new URL(req.url);
    const venue = url.searchParams.get('venue');
    const venueArea = url.searchParams.get('venue_area');
    const date = url.searchParams.get('date');
    const guestCount = parseInt(url.searchParams.get('guests') || '0');
    const durationHours = parseInt(url.searchParams.get('duration') || '4');

    // Validate required parameters
    if (!venue || !venueArea || !date || !guestCount) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Missing required parameters: venue, venue_area, date, guests' 
        } as PricingResponse),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate venue and area
    if (!pricingConfig[venue as keyof typeof pricingConfig]) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: `Invalid venue: ${venue}` 
        } as PricingResponse),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const venuePricing = pricingConfig[venue as keyof typeof pricingConfig];
    if (!venuePricing[venueArea as keyof typeof venuePricing]) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: `Invalid venue area: ${venueArea}` 
        } as PricingResponse),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const areaPricing = venuePricing[venueArea as keyof typeof venuePricing];

    // Check guest count limits
    if (guestCount > areaPricing.max_guests) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: `Maximum ${areaPricing.max_guests} guests allowed for ${venueArea}` 
        } as PricingResponse),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (guestCount < 1) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Guest count must be at least 1' 
        } as PricingResponse),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate pricing
    const basePrice = areaPricing.base_price;
    const guestSurcharge = (guestCount - 1) * areaPricing.per_guest_surcharge;
    const totalPrice = basePrice + guestSurcharge;

    // Apply duration multiplier (if different from default 4 hours)
    const durationMultiplier = durationHours / 4;
    const finalPrice = totalPrice * durationMultiplier;

    return new Response(
      JSON.stringify({
        success: true,
        venue,
        venue_area: venueArea,
        date,
        guest_count: guestCount,
        duration_hours: durationHours,
        base_price: basePrice,
        per_guest_surcharge: areaPricing.per_guest_surcharge,
        total_price: Math.round(finalPrice * 100) / 100, // Round to 2 decimal places
        currency: 'GBP',
        includes: areaPricing.includes,
        addons: availableAddons
      } as PricingResponse),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'An unexpected error occurred. Please try again.'
      } as PricingResponse),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}); 