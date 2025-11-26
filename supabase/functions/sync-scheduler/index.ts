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
    const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';
    
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

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // Get current time in AWST (GMT+8)
    const now = new Date();
    const awstTime = new Date(now.getTime() + (8 * 60 * 60 * 1000)); // Add 8 hours for AWST
    const dayOfWeek = awstTime.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const hour = awstTime.getHours();
    const minute = awstTime.getMinutes();

    console.log(`Scheduler triggered at AWST: ${awstTime.toISOString()}, Day: ${dayOfWeek}, Hour: ${hour}, Minute: ${minute}`);

    // TEMPORARY: For testing, run a sync on **every** cron invocation (*/15 * * * *).
    // This bypasses the 6am-only weekday gate so we can verify end-to-end syncing.
    // When testing is complete, restore the original day-of-week/hour logic.
    let shouldSync = true;
    let syncReason = 'Test mode: sync on every 15-minute cron tick';

    if (!shouldSync) {
      console.log('No sync scheduled for this time');
      return new Response(JSON.stringify({
        success: true,
        message: 'No sync scheduled for this time',
        schedule: {
          dayOfWeek,
          hour,
          minute,
          awstTime: awstTime.toISOString()
        }
      }), {
        headers: {
          ...cors,
          'Content-Type': 'application/json'
        },
        status: 200
      });
    }

    console.log(`Starting scheduled sync: ${syncReason}`);

    // Skip if a sync appears in progress (heartbeat within last 10 minutes)
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: busyRows } = await supabase
      .from('square_location_sync_status')
      .select('location_id,in_progress,last_heartbeat')
      .eq('in_progress', true)
      .gt('last_heartbeat', tenMinAgo);
    if (Array.isArray(busyRows) && busyRows.length > 0) {
      console.log('Skipping scheduled run because a sync is in progress', busyRows.map(r => r.location_id));
      return new Response(JSON.stringify({
        success: true,
        message: 'Skipped - sync in progress',
        busyLocations: busyRows.map(r => r.location_id),
      }), {
        headers: { ...cors, 'Content-Type': 'application/json' },
        status: 200
      });
    }
    
    // Call the Supabase sync orchestrator (`sync-and-transform`) directly with timeout
    // We stay under the 60 second Edge Function limit to avoid timeouts.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 55000); // 55 second timeout
    
    let syncResponse: Response;
    let syncResult: any;
    
    try {
      syncResponse = await fetch(`${SUPABASE_URL}/functions/v1/sync-and-transform`, {
        method: 'POST',
        headers: {
          // NOTE: use the anon key for edge-function JWT verification,
          // while the function itself uses SERVICE_ROLE for DB access.
          'Authorization': `Bearer ${ANON_KEY || SERVICE_KEY}`,
          'apikey': ANON_KEY || SERVICE_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          // Incremental sync: resume from last successful watermarks with a small overlap
          since: 'last',
          overlap_minutes: 5,
          max_lookback_days: 2,
          dry_run: false,
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      syncResult = await syncResponse.json();

      if (!syncResponse.ok) {
        throw new Error(`sync-and-transform failed: ${syncResult.error || 'Unknown error'}`);
      }

      console.log('Scheduled sync completed successfully:', syncResult);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        throw new Error('sync-and-transform request timed out after 55 seconds');
      }
      throw fetchError;
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Scheduled sync completed: ${syncReason}`,
      syncResult,
      schedule: {
        dayOfWeek,
        hour,
        minute,
        awstTime: awstTime.toISOString()
      }
    }), {
      headers: {
        ...cors,
        'Content-Type': 'application/json'
      },
      status: 200
    });

  } catch (error) {
    console.error('Scheduler error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }), {
      headers: {
        ...cors,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  }
});
