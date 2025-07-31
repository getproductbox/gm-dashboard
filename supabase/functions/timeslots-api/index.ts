import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Types for the time slots API
interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
  conflicting_booking_id?: string;
}

interface TimeSlotsResponse {
  success: boolean;
  date: string;
  venue?: string;
  venue_area?: string;
  operating_hours: {
    start: string;
    end: string;
  };
  available_slots: TimeSlot[];
  message?: string;
}

// Generate time slots from start to end time
function generateTimeSlots(startTime: string, endTime: string, intervalMinutes: number = 30): string[] {
  const slots: string[] = [];
  const start = new Date(`2000-01-01T${startTime}`);
  const end = new Date(`2000-01-01T${endTime}`);
  
  let current = new Date(start);
  while (current < end) {
    slots.push(current.toTimeString().slice(0, 5));
    current.setMinutes(current.getMinutes() + intervalMinutes);
  }
  
  return slots;
}

// Check if two time ranges overlap
function isTimeOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
  const s1 = new Date(`2000-01-01T${start1}`);
  const e1 = new Date(`2000-01-01T${end1}`);
  const s2 = new Date(`2000-01-01T${start2}`);
  const e2 = new Date(`2000-01-01T${end2}`);
  
  return s1 < e2 && s2 < e1;
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

    // Get query parameters
    const url = new URL(req.url);
    const date = url.searchParams.get('date');
    const venue = url.searchParams.get('venue');
    const venueArea = url.searchParams.get('venue_area');

    if (!date) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Date parameter is required' 
        } as TimeSlotsResponse),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate date format
    const bookingDate = new Date(date);
    if (isNaN(bookingDate.getTime())) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Invalid date format. Use YYYY-MM-DD' 
        } as TimeSlotsResponse),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get existing bookings for the date and venue
    let query = supabase
      .from('bookings')
      .select('id, venue, venue_area, start_time, end_time, status')
      .eq('booking_date', date)
      .neq('status', 'cancelled');

    if (venue) {
      query = query.eq('venue', venue);
    }

    if (venueArea) {
      query = query.eq('venue_area', venueArea);
    }

    const { data: existingBookings, error } = await query;

    if (error) {
      console.error('Error fetching existing bookings:', error);
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Failed to fetch existing bookings'
        } as TimeSlotsResponse),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine operating hours based on venue
    let operatingHours = { start: '09:00', end: '23:00' };
    if (venue === 'hippie') {
      operatingHours = { start: '10:00', end: '23:00' };
    }

    // Generate all possible time slots
    const allSlots = generateTimeSlots(operatingHours.start, operatingHours.end);
    const timeSlots: TimeSlot[] = [];

    // Check availability for each slot
    for (let i = 0; i < allSlots.length - 1; i++) {
      const start = allSlots[i];
      const end = allSlots[i + 1];
      
      // Check if this slot conflicts with any existing booking
      const conflictingBooking = existingBookings.find(booking => 
        booking.start_time && booking.end_time &&
        isTimeOverlap(start, end, booking.start_time, booking.end_time)
      );

      timeSlots.push({
        start,
        end,
        available: !conflictingBooking,
        conflicting_booking_id: conflictingBooking?.id
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        date,
        venue,
        venue_area: venueArea,
        operating_hours: operatingHours,
        available_slots: timeSlots
      } as TimeSlotsResponse),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'An unexpected error occurred. Please try again.'
      } as TimeSlotsResponse),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}); 