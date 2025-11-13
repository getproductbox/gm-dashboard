import { Hono } from "hono";
import { cors } from "hono/cors";
import { withSupabase, requireAuth, Clients } from "./middleware/auth";
import { env } from "./env";
import { z } from "zod";
import { xero } from "./xero/routes";

export const app = new Hono();

// CORS
const allowed = (env.API_ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
app.use('/*', cors({
  origin: (origin) => {
    if (!origin) return '*';
    if (allowed.length === 0) return '*';
    return allowed.includes(origin) ? origin : 'null';
  },
}));

// Attach Supabase clients
app.use('/*', withSupabase);

app.get("/health", (c) => c.json({ ok: true }));

// Xero integration routes
app.route('/xero', xero);

app.post("/square/sync", async (c) => {
  const maybe = requireAuth(c);
  if (maybe) return maybe;
  const payload = await c.req.json().catch(() => ({}));
  const url = `${env.SUPABASE_URL}/functions/v1/sync-and-transform`;
  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'apikey': key, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const text = await resp.text();
  let json: any = null; try { json = text ? JSON.parse(text) : null; } catch {}
  return c.json(json ?? { ok: resp.ok }, resp.status as 200);
});

app.post("/square/backfill", async (c) => {
  const maybe = requireAuth(c);
  if (maybe) return maybe;
  const payload = await c.req.json().catch(() => ({}));
  const url = `${env.SUPABASE_URL}/functions/v1/square-sync-backfill`;
  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'apikey': key, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const text = await resp.text();
  let json: any = null; try { json = text ? JSON.parse(text) : null; } catch {}
  return c.json(json ?? { ok: resp.ok }, resp.status as 200);
});

app.post("/karaoke/holds", async (c) => {
  const maybe = requireAuth(c);
  if (maybe) return maybe;
  const actionHeader = c.req.header("x-action") || "";
  const body = await c.req.json().catch(() => ({}));
  const action = (body?.action as string) || actionHeader;
  // @ts-ignore
  const { supabaseUser, supabaseService } = c.get("clients") as Clients;
  const db = supabaseUser ?? supabaseService;
  if (action === "create") {
    const Create = z.object({
      boothId: z.string().uuid(),
      venue: z.enum(["manor", "hippie"]),
      bookingDate: z.string().min(1),
      startTime: z.string().min(1),
      endTime: z.string().min(1),
      sessionId: z.string().min(1),
      customerEmail: z.string().email().optional(),
      ttlMinutes: z.number().int().min(1).max(60).optional(),
    });
    const input = Create.safeParse(body);
    if (!input.success) return c.json({ error: input.error.flatten() }, 400);
    const ttl = Math.max(1, Math.min(60, input.data.ttlMinutes ?? 10));
    const expiresAt = new Date(Date.now() + ttl * 60 * 1000).toISOString();
    const { data: hold, error } = await db
      .from("karaoke_booth_holds")
      .insert({
        booth_id: input.data.boothId,
        venue: input.data.venue,
        booking_date: input.data.bookingDate,
        start_time: input.data.startTime,
        end_time: input.data.endTime,
        session_id: input.data.sessionId,
        customer_email: input.data.customerEmail || null,
        status: "active",
        expires_at: expiresAt,
      })
      .select()
      .single();
    if (error) return c.json({ error: error.message }, 409);
    return c.json({ success: true, hold }, 201);
  }
  if (action === "extend") {
    const Extend = z.object({ holdId: z.string().uuid(), sessionId: z.string(), ttlMinutes: z.number().int().min(1).max(60).optional() });
    const input = Extend.safeParse(body);
    if (!input.success) return c.json({ error: input.error.flatten() }, 400);
    const ttl = Math.max(1, Math.min(60, input.data.ttlMinutes ?? 10));
    const newExpiresAt = new Date(Date.now() + ttl * 60 * 1000).toISOString();
    const { data: updated, error } = await db
      .from("karaoke_booth_holds")
      .update({ expires_at: newExpiresAt })
      .eq("id", input.data.holdId)
      .eq("session_id", input.data.sessionId)
      .eq("status", "active")
      .gt("expires_at", new Date().toISOString())
      .select()
      .single();
    if (error || !updated) return c.json({ error: error?.message || "Hold not extendable" }, 400);
    return c.json({ success: true, hold: updated });
  }
  if (action === "release") {
    const Release = z.object({ holdId: z.string().uuid(), sessionId: z.string() });
    const input = Release.safeParse(body);
    if (!input.success) return c.json({ error: input.error.flatten() }, 400);
    const { data: updated, error } = await db
      .from("karaoke_booth_holds")
      .update({ status: "released" })
      .eq("id", input.data.holdId)
      .eq("session_id", input.data.sessionId)
      .eq("status", "active")
      .select()
      .single();
    if (error || !updated) return c.json({ error: error?.message || "Hold not releasable" }, 400);
    return c.json({ success: true, hold: updated });
  }
  return c.json({ error: "Unknown action" }, 400);
});

app.post("/karaoke/finalize", async (c) => {
  const maybe = requireAuth(c);
  if (maybe) return maybe;
  // @ts-ignore
  const { supabaseUser, supabaseService } = c.get("clients") as Clients;
  const Finalize = z.object({
    holdId: z.string().uuid().optional(),
    sessionId: z.string().optional(),
    customerName: z.string().min(1),
    customerEmail: z.string().email().optional(),
    customerPhone: z.string().optional(),
    guestCount: z.number().int().min(1).optional(),
  }).refine((v) => !!(v.holdId || v.sessionId), { message: 'holdId or sessionId required' });
  const input = Finalize.safeParse(await c.req.json().catch(() => ({})));
  if (!input.success) return c.json({ error: input.error.flatten() }, 400);
  const nowIso = new Date().toISOString();
  let hold: any = null;
  if (input.data.holdId) {
    const { data, error } = await (supabaseUser ?? supabaseService)
      .from("karaoke_booth_holds")
      .select("id,booth_id,venue,booking_date,start_time,end_time,status,expires_at")
      .eq("id", input.data.holdId)
      .single();
    if (!error) hold = data;
  } else if (input.data.sessionId) {
    const { data, error } = await (supabaseUser ?? supabaseService)
      .from("karaoke_booth_holds")
      .select("id,booth_id,venue,booking_date,start_time,end_time,status,expires_at")
      .eq("session_id", input.data.sessionId)
      .eq("status", "active")
      .gt("expires_at", nowIso)
      .order("created_at", { ascending: false })
      .limit(1);
    if (!error && Array.isArray(data) && data.length > 0) hold = data[0];
  }
  if (!hold) return c.json({ error: "Hold not found" }, 404);
  const { data: booth, error: boothErr } = await (supabaseUser ?? supabaseService)
    .from("karaoke_booths")
    .select("id,hourly_rate")
    .eq("id", hold.booth_id)
    .single();
  if (boothErr || !booth) return c.json({ error: "Booth not found" }, 404);
  const toMinutes = (t: string) => { const [h, m] = (t as string).slice(0,5).split(":").map(Number); return h*60+m; };
  const durationMinutes = Math.max(0, toMinutes(hold.end_time as string) - toMinutes(hold.start_time as string));
  const durationHours = durationMinutes / 60;
  const totalAmount = Number(booth.hourly_rate) * durationHours;
  const writeDb = supabaseUser ?? supabaseService;

  // Soft idempotency: return existing booking if it's already confirmed for this slot
  const existing = await writeDb
    .from('bookings')
    .select('id')
    .eq('karaoke_booth_id', hold.booth_id)
    .eq('booking_date', hold.booking_date)
    .eq('start_time', hold.start_time)
    .eq('end_time', hold.end_time)
    .eq('status', 'confirmed')
    .maybeSingle();
  if (!existing.error && existing.data) {
    await (supabaseUser ?? supabaseService)
      .from('karaoke_booth_holds')
      .update({ status: 'consumed', booking_id: existing.data.id })
      .eq('id', hold.id)
      .eq('status', 'active');
    return c.json({ success: true, bookingId: existing.data.id }, 200);
  }

  const { data: booking, error: bookingErr } = await writeDb
    .from("bookings")
    .insert({
      customer_name: input.data.customerName.trim(),
      customer_email: input.data.customerEmail?.trim() || null,
      customer_phone: input.data.customerPhone?.trim() || null,
      booking_type: "karaoke_booking",
      venue: hold.venue,
      karaoke_booth_id: hold.booth_id,
      booking_date: hold.booking_date,
      start_time: hold.start_time,
      end_time: hold.end_time,
      duration_hours: durationHours,
      guest_count: input.data.guestCount || 1,
      total_amount: totalAmount,
      status: "confirmed",
      payment_status: "unpaid",
      created_by: null,
    })
    .select()
    .single();
  if (bookingErr || !booking) {
    const code = (bookingErr as any)?.code;
    if (code === '23505') {
      const dup = await writeDb
        .from('bookings')
        .select('id')
        .eq('karaoke_booth_id', hold.booth_id)
        .eq('booking_date', hold.booking_date)
        .eq('start_time', hold.start_time)
        .eq('end_time', hold.end_time)
        .eq('status', 'confirmed')
        .maybeSingle();
      if (!dup.error && dup.data) {
        await (supabaseUser ?? supabaseService)
          .from('karaoke_booth_holds')
          .update({ status: 'consumed', booking_id: dup.data.id })
          .eq('id', hold.id)
          .eq('status', 'active');
        return c.json({ success: true, bookingId: dup.data.id }, 200);
      }
    }
    return c.json({ error: bookingErr?.message || 'Failed to create booking' }, 409);
  }
  await (supabaseUser ?? supabaseService)
    .from("karaoke_booth_holds")
    .update({ status: "consumed", booking_id: booking.id })
    .eq("id", hold.id)
    .eq("status", "active");
  return c.json({ success: true, bookingId: booking.id }, 201);
});


