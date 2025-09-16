import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: cors,
      status: 204
    });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!SUPABASE_URL || !SERVICE_KEY) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing Supabase configuration'
      }), {
        headers: {
          ...cors,
          'Content-Type': 'application/json'
        },
        status: 200
      });
    }

    const db = createClient(SUPABASE_URL, SERVICE_KEY);
    let body = {};
    
    try {
      if (req.method === 'POST') body = await req.json();
    } catch {}

    const now = new Date();
    const overlap = Number.isFinite(body.overlap_minutes) ? body.overlap_minutes : 5;
    const lookback = Number.isFinite(body.max_lookback_days) ? body.max_lookback_days : 30; // Reduced from 90 to 30 days

    // Resolve end
    const endTs = body.end_ts ? new Date(body.end_ts) : now;

    // Resolve locations
    let locations = [];
    if (Array.isArray(body.locations) && body.locations.length > 0) {
      locations = body.locations;
    } else {
      const locRes = await db.from('square_locations').select('square_location_id').eq('is_active', true);
      if (locRes.error) {
        return new Response(JSON.stringify({
          success: false,
          error: `Failed to load locations: ${locRes.error.message}`
        }), {
          headers: {
            ...cors,
            'Content-Type': 'application/json'
          },
          status: 200
        });
      }
      locations = (locRes.data || []).map(r => r.square_location_id);
    }

    const results = [];

    // Process locations sequentially to avoid overwhelming the system
    for (const location_id of locations) {
      try {
        // Determine start
        let startTs;
        if (body.since === 'last') {
          const status = await db.from('square_location_sync_status')
            .select('last_payment_created_at_seen, last_order_updated_at_seen')
            .eq('location_id', location_id)
            .maybeSingle();
          
          const defaultStart = new Date(endTs.getTime() - lookback * 24 * 60 * 60 * 1000);
          const lastPayment = status.data?.last_payment_created_at_seen ? 
            new Date(status.data.last_payment_created_at_seen) : defaultStart;
          const lastOrder = status.data?.last_order_updated_at_seen ? 
            new Date(status.data.last_order_updated_at_seen) : defaultStart;
          const base = new Date(Math.max(lastPayment.getTime(), lastOrder.getTime()));
          startTs = new Date(base.getTime() - overlap * 60 * 1000);
        } else if (body.start_ts) {
          startTs = new Date(new Date(body.start_ts).getTime() - overlap * 60 * 1000);
        } else {
          startTs = new Date(endTs.getTime() - lookback * 24 * 60 * 60 * 1000);
          startTs = new Date(startTs.getTime() - overlap * 60 * 1000);
        }

        const window = {
          start: startTs.toISOString(),
          end: endTs.toISOString()
        };

        console.log(`Processing location ${location_id} from ${window.start} to ${window.end}`);

        // 1) Payments - with timeout
        const pCall = await callFnWithTimeout(
          `${SUPABASE_URL}/functions/v1/square-sync-payments`, 
          SERVICE_KEY, 
          {
            start_time: window.start,
            end_time: window.end,
            overlap_minutes: 0,
            dry_run: !!body.dry_run,
            locations: [location_id]
          },
          60000 // 60 second timeout
        );

        // 2) Orders - with timeout
        const oCall = await callFnWithTimeout(
          `${SUPABASE_URL}/functions/v1/square-sync-orders`, 
          SERVICE_KEY, 
          {
            start_ts: window.start,
            end_ts: window.end,
            overlap_minutes: 0,
            dry_run: !!body.dry_run,
            locations: [location_id]
          },
          60000 // 60 second timeout
        );

        // 3) Transforms (only when not dry run)
        let tPayments = null, tOrders = null;
        if (!body.dry_run && pCall.ok && oCall.ok) {
          try {
            // Transform payments based on the sync window
            const t1 = await db.rpc('transform_payments_window', {
              start_ts: window.start,
              end_ts: window.end
            });
            if (t1.error) throw new Error(`payments transform: ${t1.error.message}`);
            tPayments = t1.data;

            // For orders, we need to transform based on the actual order creation dates
            // not the sync window, since orders might have been created earlier but synced recently
            // We'll use a broader window to catch any orders that might have been synced
            const transformStart = new Date(Math.min(
              new Date(window.start).getTime(),
              new Date(window.start).getTime() - 7 * 24 * 60 * 60 * 1000 // Go back 7 days
            ));
            
            const t2 = await db.rpc('transform_orders_window', {
              p_start_ts: transformStart.toISOString(),
              p_end_ts: window.end
            });
            if (t2.error) throw new Error(`orders transform: ${t2.error.message}`);
            tOrders = t2.data;
          } catch (transformError) {
            console.error(`Transform error for location ${location_id}:`, transformError);
            // Continue processing even if transforms fail
          }
        }

        // Update watermarks
        if (!body.dry_run && pCall.ok && oCall.ok) {
          await db.from('square_location_sync_status').upsert({
            location_id,
            last_payment_created_at_seen: window.end,
            last_order_updated_at_seen: window.end,
            last_successful_sync_at: new Date().toISOString(),
            last_heartbeat: new Date().toISOString(),
            in_progress: false
          }, {
            onConflict: 'location_id'
          });
        }

        results.push({
          location_id,
          window,
          payments: {
            fetched: pCall.body?.totals?.fetched,
            upserted: pCall.body?.totals?.upserted,
            error: pCall.ok ? undefined : pCall.body?.error || 'unknown'
          },
          orders: {
            fetched: oCall.body?.summaries?.[0]?.fetched,
            upserted: oCall.body?.summaries?.[0]?.upserted,
            error: oCall.ok ? undefined : oCall.body?.error || 'unknown'
          },
          transforms: {
            payments: tPayments,
            orders: tOrders
          }
        });

      } catch (locErr) {
        console.error(`Error processing location ${location_id}:`, locErr);
        results.push({
          location_id,
          window: {
            start: body.start_ts || 'computed',
            end: endTs.toISOString()
          },
          payments: {
            error: locErr.message
          },
          orders: {
            error: locErr.message
          },
          transforms: {
            error: locErr.message
          }
        });
      }

      // Add delay between locations to prevent overwhelming the system
      await delay(1000);
    }

    return new Response(JSON.stringify({
      success: true,
      results
    }), {
      headers: {
        ...cors,
        'Content-Type': 'application/json'
      },
      status: 200
    });

  } catch (outer) {
    console.error('Outer error:', outer);
    return new Response(JSON.stringify({
      success: false,
      error: outer instanceof Error ? outer.message : String(outer)
    }), {
      headers: {
        ...cors,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  }
});

async function callFnWithTimeout(url: string, serviceKey: string, body: any, timeoutMs: number) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const text = await resp.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {}

    return {
      ok: resp.ok,
      body: json
    };
  } catch (e) {
    if (e.name === 'AbortError') {
      return {
        ok: false,
        body: {
          error: `Request timed out after ${timeoutMs}ms`
        }
      };
    }
    return {
      ok: false,
      body: {
        error: e instanceof Error ? e.message : String(e)
      }
    };
  }
}

function delay(ms: number) {
  return new Promise(res => setTimeout(res, ms));
}
