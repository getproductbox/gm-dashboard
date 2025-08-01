import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Define CORS headers inline
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const API_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    // Debug: Log environment variables (remove in production)
    console.log('SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing')
    console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Set' : 'Missing')

    // Check if environment variables are available
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing environment variables')
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Validate API key
    const apiKey = req.headers.get('x-api-key')
    if (!apiKey || apiKey !== API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Invalid API key' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const url = new URL(req.url)
    const date = url.searchParams.get('date')
    const venue = url.searchParams.get('venue')
    const venueArea = url.searchParams.get('venue_area')

    console.log('Request parameters:', { date, venue, venueArea })

    if (!date) {
      return new Response(
        JSON.stringify({ error: 'Date parameter is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get existing bookings for the date
    console.log('Querying bookings for date:', date, 'venue:', venue || 'manor')
    
    const { data: existingBookings, error } = await supabase
      .from('bookings')
      .select('start_time, end_time, venue, venue_area, booking_type, karaoke_booth_id')
      .eq('booking_date', date) // Use booking_date instead of date
      .eq('venue', venue || 'manor')
      .eq('status', 'confirmed') // Only check confirmed bookings

    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({ error: 'Database error', details: error.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Found existing bookings:', existingBookings?.length || 0)

    // Generate time slots (30-minute intervals)
    const timeSlots = []
    const startHour = 10 // 10:00 AM
    const endHour = 26 // 2:00 AM next day (24 + 2)

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        
        // Check if this time slot conflicts with existing bookings
        const isBooked = existingBookings?.some(booking => {
          const bookingStart = booking.start_time
          const bookingEnd = booking.end_time
          const slotTime = time
          
          // Check if the venue area matches (if specified)
          if (venueArea && booking.venue_area !== venueArea) {
            return false
          }
          
          // Only check venue hire bookings for venue area conflicts
          if (booking.booking_type === 'venue_hire') {
            return slotTime >= bookingStart && slotTime < bookingEnd
          }
          
          // For karaoke bookings, we don't need to check venue area conflicts
          // since karaoke booths are separate from venue areas
          return false
        }) || false

        timeSlots.push({
          time,
          available: !isBooked
        })
      }
    }

    console.log('Generated time slots:', timeSlots.length)

    return new Response(
      JSON.stringify({ 
        date,
        venue: venue || 'manor',
        venue_area: venueArea,
        time_slots: timeSlots,
        existing_bookings_count: existingBookings?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 