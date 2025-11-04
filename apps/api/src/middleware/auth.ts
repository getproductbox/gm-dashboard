import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Context, Next } from 'hono';
import { env } from '../env';

export type Clients = {
  supabaseUser: SupabaseClient | null;
  supabaseService: SupabaseClient;
};

export async function withSupabase(c: Context, next: Next) {
  const authHeader = c.req.header('authorization');
  const userClient = authHeader
    ? createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: authHeader } },
      })
    : null;

  // Always provide a service client for backend-only operations (never expose to user)
  // Fallback to anon in development if service role is not configured
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY;
  const serviceClient = createClient(env.SUPABASE_URL, serviceKey);

  // Stash in the request context locals
  // @ts-ignore - Hono types allow arbitrary locals
  c.set('clients', { supabaseUser: userClient, supabaseService: serviceClient } as Clients);

  await next();
}

export function requireAuth(c: Context) {
  const authHeader = c.req.header('authorization');
  if (!authHeader) {
    return c.json({ error: 'Missing authorization header' }, 401);
  }
  return null;
}


