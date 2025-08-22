import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

type FinalizeRequest = {
  holdId: string;
  sessionId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  guestCount?: number;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = (await req.json()) as FinalizeRequest;
    if (!body.holdId || !body.sessionId || !body.customerName) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Re-fetch hold and verify ownership/state
    const nowIso = new Date().toISOString();
    const { data: hold, error: holdErr } = await supabase
      .from('karaoke_booth_holds')
      .select('id,booth_id,venue,booking_date,start_time,end_time,status,expires_at')
      .eq('id', body.holdId)
      .eq('session_id', body.sessionId)
      .single();
    if (holdErr || !hold) {
      return new Response(JSON.stringify({ error: 'Hold not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (hold.status !== 'active' || hold.expires_at <= nowIso) {
      return new Response(JSON.stringify({ error: 'Hold expired or inactive' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch booth to calculate price/duration
    const { data: booth, error: boothErr } = await supabase
      .from('karaoke_booths')
      .select('id,hourly_rate')
      .eq('id', hold.booth_id)
      .single();
    if (boothErr || !booth) {
      return new Response(JSON.stringify({ error: 'Booth not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Compute duration hours
    const toMinutes = (t: string) => {
      const [h, m] = t.slice(0,5).split(':').map(Number);
      return h * 60 + m;
    };
    const durationMinutes = Math.max(0, toMinutes(hold.end_time as string) - toMinutes(hold.start_time as string));
    const durationHours = durationMinutes / 60;
    const totalAmount = Number(booth.hourly_rate) * durationHours;

    // Create booking
    const { data: booking, error: bookingErr } = await supabase
      .from('bookings')
      .insert({
        customer_name: body.customerName.trim(),
        customer_email: body.customerEmail?.trim() || null,
        customer_phone: body.customerPhone?.trim() || null,
        booking_type: 'karaoke_booking',
        venue: hold.venue,
        karaoke_booth_id: hold.booth_id,
        booking_date: hold.booking_date,
        start_time: hold.start_time,
        end_time: hold.end_time,
        duration_hours: durationHours,
        guest_count: body.guestCount || 1,
        total_amount: totalAmount,
        status: 'confirmed',
        payment_status: 'unpaid',
        created_by: null,
      })
      .select()
      .single();
    if (bookingErr || !booking) {
      return new Response(JSON.stringify({ error: bookingErr?.message || 'Failed to create booking' }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Mark hold consumed
    const { error: consumeErr } = await supabase
      .from('karaoke_booth_holds')
      .update({ status: 'consumed', booking_id: booking.id })
      .eq('id', body.holdId)
      .eq('session_id', body.sessionId)
      .eq('status', 'active');
    if (consumeErr) {
      // NOTE: booking already created; this is a soft failure but we surface it
      console.error('Warning: booking created but failed to mark hold consumed', consumeErr);
    }

    return new Response(JSON.stringify({ success: true, bookingId: booking.id }), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('karaoke-book error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});


