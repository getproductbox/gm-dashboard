import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Types for the booking API
interface CreateBookingRequest {
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  bookingType: 'venue_hire' | 'vip_tickets';
  venue: 'manor' | 'hippie';
  venueArea?: 'upstairs' | 'downstairs' | 'full_venue';
  bookingDate: string;
  startTime?: string;
  endTime?: string;
  guestCount?: number;
  ticketQuantity?: number;
  specialRequests?: string;
}

interface CreateBookingResponse {
  success: boolean;
  bookingId?: string;
  message: string;
  errors?: Record<string, string>;
}

// Helper function to check if date is a Saturday
const isSaturday = (dateString: string): boolean => {
  const date = new Date(dateString);
  return date.getDay() === 6; // 6 = Saturday
};

// Validation schema
const validateBookingRequest = (data: Partial<CreateBookingRequest>): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  // Required fields
  if (!data.customerName || data.customerName.trim().length === 0) {
    errors.customerName = 'Customer name is required';
  }

  if (!data.venue || !['manor', 'hippie'].includes(data.venue)) {
    errors.venue = 'Valid venue (manor or hippie) is required';
  }

  if (!data.bookingType || !['venue_hire', 'vip_tickets'].includes(data.bookingType)) {
    errors.bookingType = 'Valid booking type is required';
  }

  if (!data.bookingDate) {
    errors.bookingDate = 'Booking date is required';
  } else {
    const bookingDate = new Date(data.bookingDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (bookingDate < today) {
      errors.bookingDate = 'Booking date cannot be in the past';
    }

    // For VIP tickets, validate that the date is a Saturday
    if (data.bookingType === 'vip_tickets' && !isSaturday(data.bookingDate)) {
      errors.bookingDate = 'VIP tickets are only available on Saturdays';
    }
  }

  // Venue area validation for venue hire
  if (data.bookingType === 'venue_hire') {
    if (!data.venueArea || !['upstairs', 'downstairs', 'full_venue'].includes(data.venueArea)) {
      errors.venueArea = 'Valid venue area is required for venue hire bookings';
    }
  }

  // Guest count validation for venue hire
  if (data.bookingType === 'venue_hire') {
    if (!data.guestCount || data.guestCount < 1) {
      errors.guestCount = 'Guest count must be at least 1 for venue hire bookings';
    }
  }

  // Ticket quantity validation for VIP tickets
  if (data.bookingType === 'vip_tickets') {
    if (!data.ticketQuantity || data.ticketQuantity < 1) {
      errors.ticketQuantity = 'Ticket quantity must be at least 1 for VIP ticket bookings';
    }
    if (data.ticketQuantity && data.ticketQuantity > 100) {
      errors.ticketQuantity = 'Ticket quantity cannot exceed 100';
    }
  }

  // At least one contact method required
  if (!data.customerEmail && !data.customerPhone) {
    errors.customerEmail = 'Either email or phone number is required';
  }

  // Email validation if provided
  if (data.customerEmail && !isValidEmail(data.customerEmail)) {
    errors.customerEmail = 'Please provide a valid email address';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Rate limiting (simple in-memory store for demo)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

const checkRateLimit = (ip: string): boolean => {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 10;

  const record = requestCounts.get(ip);
  
  if (!record || now > record.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  // Add CORS headers to all responses
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ success: false, message: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get client IP for rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || 'unknown';
    
    // Check rate limiting
    if (!checkRateLimit(clientIP)) {
      return new Response(
        JSON.stringify({ success: false, message: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const requestData = await req.json();
    
    // Validate request data
    const validation = validateBookingRequest(requestData);
    if (!validation.isValid) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Validation failed',
          errors: validation.errors
        } as CreateBookingResponse),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Prepare booking data based on booking type
    const bookingData: any = {
      customer_name: requestData.customerName.trim(),
      customer_email: requestData.customerEmail?.trim() || null,
      customer_phone: requestData.customerPhone?.trim() || null,
      booking_type: requestData.bookingType,
      venue: requestData.venue,
      booking_date: requestData.bookingDate,
      special_requests: requestData.specialRequests?.trim() || null,
      status: 'pending', // Default status for external bookings
      payment_status: 'unpaid',
      created_by: null, // External booking, no user
    };

    // Add booking type specific fields
    if (requestData.bookingType === 'venue_hire') {
      bookingData.venue_area = requestData.venueArea;
      bookingData.start_time = requestData.startTime || null;
      bookingData.end_time = requestData.endTime || null;
      bookingData.guest_count = requestData.guestCount;
      bookingData.total_amount = null; // Will be calculated later if needed
    } else if (requestData.bookingType === 'vip_tickets') {
      bookingData.ticket_quantity = requestData.ticketQuantity;
      bookingData.total_amount = null; // Pricing handled by marketing site
    }

    // Insert booking into database
    const { data: booking, error } = await supabase
      .from('bookings')
      .insert(bookingData)
      .select()
      .single();

    if (error) {
      console.error('Error creating booking:', error);
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Failed to create booking. Please try again.'
        } as CreateBookingResponse),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        bookingId: booking.id,
        message: 'Booking created successfully'
      } as CreateBookingResponse),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'An unexpected error occurred. Please try again.'
      } as CreateBookingResponse),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}); 