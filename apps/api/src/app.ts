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
  // @ts-ignore
  const { supabaseService } = c.get("clients") as Clients;
  try {
    const overlap = Number(payload.overlap_minutes) >= 0 ? Number(payload.overlap_minutes) : 5;
    const maxLookbackDays = Number(payload.max_lookback_days) > 0 ? Number(payload.max_lookback_days) : 30;
    const dryRun = !!payload.dry_run;
    const now = new Date();
    const endTs = now.toISOString();

    // Get active locations
    const locsRes = await supabaseService
      .from('square_locations')
      .select('square_location_id')
      .eq('is_active', true);
    
    if (locsRes.error || !locsRes.data || locsRes.data.length === 0) {
      return c.json({ 
        success: false, 
        stage: 'setup', 
        error: 'No active locations found' 
      }, 200);
    }

    const locations = locsRes.data.map((r: any) => r.square_location_id);
    const results = [];

    // Process each location with intelligent date range detection
    for (const locationId of locations) {
      try {
        // Determine start time from last sync status
        const statusRes = await supabaseService
          .from('square_location_sync_status')
          .select('last_payment_created_at_seen, last_order_updated_at_seen, orders_upserted')
          .eq('location_id', locationId)
          .maybeSingle();

        // Payment window: use intelligent date range from last payment sync
        const defaultStart = new Date(now.getTime() - maxLookbackDays * 24 * 60 * 60 * 1000);
        const lastPayment = statusRes.data?.last_payment_created_at_seen 
          ? new Date(statusRes.data.last_payment_created_at_seen) 
          : defaultStart;
        const paymentStartTs = new Date(lastPayment.getTime() - overlap * 60 * 1000);
        
        // Order window: if never synced before (null timestamp OR 0 orders), use longer backfill (90 days)
        // Otherwise use intelligent date range from last order sync
        const ordersNeverSynced = !statusRes.data?.last_order_updated_at_seen || 
                                  (statusRes.data?.orders_upserted === 0 || statusRes.data?.orders_upserted === null);
        const ordersBackfillDays = ordersNeverSynced ? 90 : maxLookbackDays;
        const lastOrder = statusRes.data?.last_order_updated_at_seen 
          ? new Date(statusRes.data.last_order_updated_at_seen) 
          : new Date(now.getTime() - ordersBackfillDays * 24 * 60 * 60 * 1000);
        const orderStartTs = new Date(lastOrder.getTime() - overlap * 60 * 1000);
        
        // Use the earlier of the two windows to ensure we sync everything
        const startTs = new Date(Math.min(paymentStartTs.getTime(), orderStartTs.getTime()));

        const window = {
          start: startTs.toISOString(),
          end: endTs
        };
        
        // Separate order window for order-specific sync (uses longer backfill if needed)
        const orderWindow = {
          start: orderStartTs.toISOString(),
          end: endTs
        };

        // 1) Sync payments using square-sync-backfill (which works)
        const backfillUrl = `${env.SUPABASE_URL}/functions/v1/square-sync-backfill`;
        const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY;
        const backfillResp = await fetch(backfillUrl, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${key}`, 
            'apikey': key, 
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify({
            start_time: window.start,
            end_time: window.end,
            overlap_minutes: 0, // Already applied above
            dry_run: dryRun,
            locations: [locationId]
          })
        });

        const backfillText = await backfillResp.text();
        let backfillResult: any = null;
        try {
          backfillResult = backfillText ? JSON.parse(backfillText) : null;
        } catch {}

        if (!backfillResp.ok || !backfillResult?.success) {
          results.push({
            location_id: locationId,
            window,
            payments: {
              error: backfillResult?.error || backfillResp.statusText || 'Unknown error'
            },
            orders: {
              error: 'Skipped due to payment sync failure'
            }
          });
          continue;
        }

        const paymentsFetched = backfillResult?.summary?.total_payments_fetched || 0;
        const paymentsSynced = backfillResult?.summary?.total_payments_synced || 0;

        // 2) Transform payments (if not dry run)
        let transformResult = null;
        if (!dryRun && paymentsSynced > 0) {
          // Use transform_recent_synced_transactions for the window
          const transformWindowMinutes = Math.ceil((now.getTime() - startTs.getTime()) / (1000 * 60));
          const transformRes = await supabaseService.rpc('transform_recent_synced_transactions', {
            minutes_back: transformWindowMinutes + overlap
          });
          if (transformRes.error) {
            console.error(`Transform error for ${locationId}:`, transformRes.error);
          } else {
            transformResult = transformRes.data;
          }
        }

        // 3) Sync orders using backfill-square-orders (date-based API)
        // Use orderWindow which has longer backfill if orders never synced
        let ordersFetched = 0;
        let ordersUpserted = 0;
        try {
          // Convert orderWindow to date strings (YYYY-MM-DD)
          const startDate = new Date(orderWindow.start);
          const endDate = new Date(orderWindow.end);
          const toDateStr = (d: Date) => d.toISOString().slice(0, 10);
          const ordersUrl = `${env.SUPABASE_URL}/functions/v1/backfill-square-orders`;
          const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY;
          const ordersResp = await fetch(ordersUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${key}`,
              'apikey': key,
              'Content-Type': 'application/json',
              // Edge function expects these headers to decide env and location
              'x-square-env': 'production',
              'x-square-location-id': locationId,
            },
            body: JSON.stringify({
              start_date: toDateStr(startDate),
              end_date: toDateStr(endDate),
              limit: 200,
              dryRun: dryRun,
            })
          });
          const ordersText = await ordersResp.text();
          let ordersJson: any = null; try { ordersJson = ordersText ? JSON.parse(ordersText) : null; } catch {}
          if (!ordersResp.ok || !ordersJson?.success) {
            console.error(`Orders backfill failed for ${locationId}:`, ordersJson?.error || ordersResp.statusText);
          } else {
            ordersFetched = ordersJson?.fetchedOrders || 0;
            if (ordersNeverSynced) {
              console.log(`Initial order backfill for ${locationId}: fetched ${ordersFetched} orders from ${toDateStr(startDate)} to ${toDateStr(endDate)}`);
            }
          }
        } catch (orderBackfillErr) {
          console.error(`Orders backfill error for ${locationId}:`, orderBackfillErr);
        }

        // 4) Transform orders window into normalized orders (attendance)
        // Use orderWindow for transform as well
        try {
          if (!dryRun) {
            const tOrders = await supabaseService.rpc('transform_orders_window', {
              p_start_ts: orderWindow.start,
              p_end_ts: orderWindow.end
            });
            if (tOrders.error) {
              console.error(`transform_orders_window error for ${locationId}:`, tOrders.error);
            } else {
              // transform_orders_window returns affected rows
              ordersUpserted = (tOrders.data as number) || 0;
            }
          }
        } catch (ordersTransformErr) {
          console.error(`Orders transform error for ${locationId}:`, ordersTransformErr);
        }

        // 5) Update sync status
        if (!dryRun) {
          await supabaseService
            .from('square_location_sync_status')
            .upsert({
              location_id: locationId,
              last_payment_created_at_seen: window.end,
              last_order_updated_at_seen: window.end, // orders window end
              last_successful_sync_at: now.toISOString(),
              last_heartbeat: now.toISOString(),
              in_progress: false,
              payments_fetched: paymentsFetched,
              payments_upserted: paymentsSynced,
              orders_fetched: ordersFetched,
              orders_upserted: ordersUpserted
            }, {
              onConflict: 'location_id'
            });
        }

        results.push({
          location_id: locationId,
          window,
          payments: {
            fetched: paymentsFetched,
            upserted: paymentsSynced
          },
          orders: {
            fetched: ordersFetched,
            upserted: ordersUpserted
          },
          transform: transformResult
        });

      } catch (locErr) {
        console.error(`Error processing location ${locationId}:`, locErr);
        results.push({
          location_id: locationId,
          window: { start: 'error', end: endTs },
          payments: {
            error: locErr instanceof Error ? locErr.message : String(locErr)
          },
          orders: {
            error: 'Skipped due to location error'
          }
        });
      }
    }

    return c.json({
      success: true,
      results,
      message: 'Sync completed successfully'
    }, 200);
  } catch (e) {
    return c.json({ 
      success: false, 
      error: e instanceof Error ? e.message : String(e) 
    }, 200);
  }
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


