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

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // Get current time in AWST (GMT+8)
    const now = new Date();
    const awstTime = new Date(now.getTime() + (8 * 60 * 60 * 1000)); // Add 8 hours for AWST
    const dayOfWeek = awstTime.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const hour = awstTime.getHours();
    const minute = awstTime.getMinutes();

    console.log(`Scheduler triggered at AWST: ${awstTime.toISOString()}, Day: ${dayOfWeek}, Hour: ${hour}, Minute: ${minute}`);

    // Determine if we should sync based on schedule
    let shouldSync = false;
    let syncReason = '';

    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      // Monday to Friday - daily sync at 6 AM AWST
      if (hour === 6 && minute === 0) {
        shouldSync = true;
        syncReason = 'Daily sync (Monday-Friday 6 AM AWST)';
      }
    } else if (dayOfWeek === 0 || dayOfWeek === 6) {
      // Saturday (6) and Sunday (0) - every 15 minutes
      if (minute % 15 === 0) {
        shouldSync = true;
        syncReason = 'Weekend frequent sync (every 15 minutes)';
      }
    }

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

    // Call the sync-and-transform function
    const syncResponse = await fetch(`${SUPABASE_URL}/functions/v1/sync-and-transform`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'apikey': SERVICE_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        since: 'last',
        overlap_minutes: 5,
        dry_run: false
      })
    });

    const syncResult = await syncResponse.json();

    if (!syncResponse.ok) {
      throw new Error(`Sync failed: ${syncResult.error || 'Unknown error'}`);
    }

    console.log('Scheduled sync completed successfully:', syncResult);

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
