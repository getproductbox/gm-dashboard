import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

type AvailabilityRequest = {
  // Mode 1: per-booth
  boothId?: string;
  // Mode 2: per-venue aggregate
  venue?: 'manor' | 'hippie';
  minCapacity?: number;

  bookingDate: string; // ISO date YYYY-MM-DD
  granularityMinutes?: number; // default 60
  action?: 'boothsForSlot';
  startTime?: string; // For boothsForSlot
  endTime?: string;   // For boothsForSlot
};

type AvailabilitySlot = {
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
  available: boolean;
  blockedBy?: 'booking' | 'hold';
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info, x-action',
};

// Low-effort perf: tiny in-memory cache with short TTL to smooth repeated requests
type CacheEntry = { expiresAt: number; payload: unknown };
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 10_000; // 10s

function makeKey(parts: (string | number | undefined)[]) {
  return parts.join('|');
}

function getCached(key: string) {
  const now = Date.now();
  const entry = cache.get(key);
  if (entry && entry.expiresAt > now) return entry.payload;
  cache.delete(key);
  return null;
}

function setCached(key: string, payload: unknown) {
  cache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, payload });
}

function addMinutes(timeHHMM: string, minutesToAdd: number): string {
  const [h, m] = timeHHMM.split(':').map(Number);
  const total = h * 60 + m + minutesToAdd;
  const hh = Math.floor(total / 60);
  const mm = total % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart < bEnd && aEnd > bStart;
}

serve(async (req) => {
  // CORS preflight
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

    const body = (await req.json()) as AvailabilityRequest;
    const granularity = Math.max(15, body.granularityMinutes ?? 60);

    if (!body.bookingDate) {
      return new Response(JSON.stringify({ error: 'bookingDate is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    // Action: list available booths for a specific slot (post-slot selection)
    if (body.action === 'boothsForSlot') {
      const cacheKey = makeKey(['boothsForSlot', body.venue, body.bookingDate, body.startTime, body.endTime, body.minCapacity]);
      const cached = getCached(cacheKey);
      if (cached) {
        return new Response(JSON.stringify(cached), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (!body.venue || !body.startTime || !body.endTime) {
        return new Response(JSON.stringify({ error: 'venue, startTime, and endTime are required for boothsForSlot' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const minCap = body.minCapacity ?? 1;
      const { data: booths, error: boothListErr } = await supabase
        .from('karaoke_booths')
        .select('id,name,capacity,hourly_rate,operating_hours_start,operating_hours_end')
        .eq('venue', body.venue)
        .eq('is_available', true)
        .gte('capacity', minCap);
      if (boothListErr) {
        return new Response(JSON.stringify({ error: 'Failed to fetch booths' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const boothIds = (booths || []).map((b) => b.id);
      const nowIso = new Date().toISOString();
      const [bookingsAllRes, holdsAllRes] = await Promise.all([
        supabase
          .from('bookings')
          .select('karaoke_booth_id,start_time,end_time,status')
          .in('karaoke_booth_id', boothIds.length ? boothIds : ['00000000-0000-0000-0000-000000000000'])
          .eq('booking_date', body.bookingDate)
          .neq('status', 'cancelled'),
        supabase
          .from('karaoke_booth_holds')
          .select('booth_id,start_time,end_time,expires_at,status')
          .in('booth_id', boothIds.length ? boothIds : ['00000000-0000-0000-0000-000000000000'])
          .eq('booking_date', body.bookingDate)
          .eq('status', 'active')
          .gt('expires_at', nowIso),
      ]);
      const bookingsAll = bookingsAllRes.data;
      const holdsAll = holdsAllRes.data;

      const availableBooths: any[] = [];
      for (const booth of (booths || [])) {
        const bookingsForBooth = (bookingsAll || []).filter(b => b.karaoke_booth_id === booth.id);
        const holdsForBooth = (holdsAll || []).filter(h => h.booth_id === booth.id);
        const hasBooking = bookingsForBooth.some((b) => overlaps(body.startTime!, body.endTime!, (b.start_time as string).slice(0,5), (b.end_time as string).slice(0,5)));
        if (hasBooking) continue;
        const hasHold = holdsForBooth.some((h) => overlaps(body.startTime!, body.endTime!, (h.start_time as string).slice(0,5), (h.end_time as string).slice(0,5)));
        if (hasHold) continue;
        availableBooths.push(booth);
      }

      const payload = { venue: body.venue, bookingDate: body.bookingDate, startTime: body.startTime, endTime: body.endTime, availableBooths };
      setCached(cacheKey, payload);
      return new Response(JSON.stringify(payload), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Mode 1: single booth availability
    if (body.boothId) {
      const { data: booth, error: boothErr } = await supabase
        .from('karaoke_booths')
        .select('*')
        .eq('id', body.boothId)
        .single();
      if (boothErr || !booth) {
        return new Response(JSON.stringify({ error: 'Booth not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const startHH = (booth.operating_hours_start as string)?.slice(0, 5) || '10:00';
      const endHH = (booth.operating_hours_end as string)?.slice(0, 5) || '23:00';
      const { data: bookings, error: bookingsErr } = await supabase
        .from('bookings')
        .select('start_time,end_time,status')
        .eq('karaoke_booth_id', body.boothId)
        .eq('booking_date', body.bookingDate)
        .neq('status', 'cancelled');
      if (bookingsErr) {
        return new Response(JSON.stringify({ error: 'Failed to fetch bookings' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const nowIso = new Date().toISOString();
      const { data: holds, error: holdsErr } = await supabase
        .from('karaoke_booth_holds')
        .select('start_time,end_time,status,expires_at')
        .eq('booth_id', body.boothId)
        .eq('booking_date', body.bookingDate)
        .eq('status', 'active')
        .gt('expires_at', nowIso);
      if (holdsErr) {
        return new Response(JSON.stringify({ error: 'Failed to fetch holds' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const slots: AvailabilitySlot[] = [];
      let cursor = startHH;
      while (cursor < endHH) {
        const next = addMinutes(cursor, granularity);
        if (next > endHH) break;
        const hasBooking = (bookings || []).some((b) => overlaps(cursor, next, (b.start_time as string).slice(0,5), (b.end_time as string).slice(0,5)));
        const hasHold = !hasBooking && (holds || []).some((h) => overlaps(cursor, next, (h.start_time as string).slice(0,5), (h.end_time as string).slice(0,5)));
        slots.push({ startTime: cursor, endTime: next, available: !(hasBooking || hasHold), blockedBy: hasBooking ? 'booking' : hasHold ? 'hold' : undefined });
        cursor = next;
      }
      return new Response(JSON.stringify({ boothId: body.boothId, bookingDate: body.bookingDate, granularityMinutes: granularity, slots }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Mode 2: aggregate by venue/capacity
    if (!body.venue) {
      return new Response(JSON.stringify({ error: 'Either boothId or venue is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const minCap = body.minCapacity ?? 1;
    const cacheKey = makeKey(['venueSlots', body.venue, body.bookingDate, minCap, granularity]);
    const cached = getCached(cacheKey);
    if (cached) {
      return new Response(JSON.stringify(cached), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: booths, error: boothErr2 } = await supabase
      .from('karaoke_booths')
      .select('id,capacity,operating_hours_start,operating_hours_end')
      .eq('venue', body.venue)
      .eq('is_available', true)
      .gte('capacity', minCap);
    if (boothErr2) {
      return new Response(JSON.stringify({ error: 'Failed to fetch booths' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    // Determine venue-wide operating hours based on min/max across booths
    const startHH = (booths || []).length ? (booths![0].operating_hours_start as string).slice(0,5) : '10:00';
    const endHH = (booths || []).length ? (booths![0].operating_hours_end as string).slice(0,5) : '23:00';

    const boothIds = (booths || []).map((b) => b.id);
    const nowIso = new Date().toISOString();
    const [bookingsAllRes, holdsAllRes] = await Promise.all([
      supabase
        .from('bookings')
        .select('karaoke_booth_id,start_time,end_time,status')
        .in('karaoke_booth_id', boothIds.length ? boothIds : ['00000000-0000-0000-0000-000000000000'])
        .eq('booking_date', body.bookingDate)
        .neq('status', 'cancelled'),
      supabase
        .from('karaoke_booth_holds')
        .select('booth_id,start_time,end_time,expires_at,status')
        .in('booth_id', boothIds.length ? boothIds : ['00000000-0000-0000-0000-000000000000'])
        .eq('booking_date', body.bookingDate)
        .eq('status', 'active')
        .gt('expires_at', nowIso),
    ]);
    const bookingsAll = bookingsAllRes.data;
    const holdsAll = holdsAllRes.data;
    const slots: AvailabilitySlot[] = [] as any;
    let cursor = startHH;
    while (cursor < endHH) {
      const next = addMinutes(cursor, granularity);
      if (next > endHH) break;
      let available = false;
      const capacities: number[] = [];
      // Check if any booth is free for this slot using pre-fetched rows
      for (const booth of (booths || [])) {
        const bookingsForBooth = (bookingsAll || []).filter(b => b.karaoke_booth_id === booth.id);
        const holdsForBooth = (holdsAll || []).filter(h => h.booth_id === booth.id);
        const hasBooking = bookingsForBooth.some((b) => overlaps(cursor, next, (b.start_time as string).slice(0,5), (b.end_time as string).slice(0,5)));
        if (hasBooking) continue;
        const hasHold = holdsForBooth.some((h) => overlaps(cursor, next, (h.start_time as string).slice(0,5), (h.end_time as string).slice(0,5)));
        if (!hasHold) {
          available = true;
          capacities.push(booth.capacity as number);
        }
      }
      // Return sorted unique capacities for transparency on what booth sizes are free
      const uniqueCaps = Array.from(new Set(capacities)).sort((a, b) => a - b);
      // @ts-ignore adding capacities field
      slots.push({ startTime: cursor, endTime: next, available, capacities: uniqueCaps });
      cursor = next;
    }

    const payload = { venue: body.venue, bookingDate: body.bookingDate, granularityMinutes: granularity, minCapacity: minCap, slots };
    setCached(cacheKey, payload);
    return new Response(JSON.stringify(payload), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('karaoke-availability error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});


