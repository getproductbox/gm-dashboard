import { Hono } from 'hono';
import { buildAuthorizeUrl, exchangeCodeForToken, getConnections, getAccounts, getProfitAndLoss, refreshAccessToken } from './client';
import { env } from '../env';
import { z } from 'zod';
import { type Clients } from '../middleware/auth';
import { decryptSecret, getStoredConnection, upsertConnection } from './tokenStore';
import { mapAccountToCategory } from './mapping';

export const xero = new Hono();

// Start OAuth consent
xero.get('/connect', (c) => {
  const state = Math.random().toString(36).slice(2);
  const url = buildAuthorizeUrl(state);
  // Temporary debug to diagnose invalid scope/redirect issues
  console.log('[Xero] /connect authorize URL:', url);
  console.log('[Xero] scopes:', env.XERO_SCOPES);
  console.log('[Xero] redirect_uri:', env.XERO_REDIRECT_URI);
  return c.redirect(url, 302);
});

// OAuth callback: exchange code, fetch connections, store tokens
xero.get('/callback', async (c) => {
  const code = c.req.query('code');
  if (!code) return c.json({ error: 'Missing code' }, 400);
  const token = await exchangeCodeForToken(code);
  const connections = await getConnections(token.access_token);
  if (!Array.isArray(connections) || connections.length === 0) {
    return c.json({ error: 'No Xero connections found after auth' }, 400);
  }
  const primary = connections[0];
  const tenantId = primary.tenantId;
  const expiresAt = new Date(Date.now() + token.expires_in * 1000).toISOString();

  // @ts-ignore
  const { supabaseService } = c.get('clients') as Clients;
  await upsertConnection(supabaseService, {
    tenantId,
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    expiresAt,
    scopes: (token.scope || env.XERO_SCOPES).split(/[\s,]+/).filter(Boolean),
  });

  return c.html('<html><body><h3>Xero connected successfully.</h3><p>You can close this window.</p></body></html>');
});

// Fetch Accounts (trimmed)
xero.get('/accounts', async (c) => {
  // @ts-ignore
  const { supabaseService } = c.get('clients') as Clients;
  let con = await getStoredConnection(supabaseService);
  if (!con) return c.json({ error: 'Xero not connected' }, 400);
  // Refresh if expiring
  if (new Date(con.expires_at).getTime() < Date.now() + 5 * 60 * 1000) {
    const refreshed = await refreshAccessToken(decryptSecret(con.refresh_token_enc));
    const newExpires = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();
    await upsertConnection(supabaseService, {
      tenantId: con.tenant_id,
      accessToken: refreshed.access_token,
      refreshToken: refreshed.refresh_token,
      expiresAt: newExpires,
      scopes: (refreshed.scope || env.XERO_SCOPES).split(/[\s,]+/).filter(Boolean),
    });
    con = (await getStoredConnection(supabaseService))!;
  }
  let json: any;
  try {
    json = await getAccounts(con.access_token, con.tenant_id);
  } catch (err: any) {
    const msg = String(err?.message || err);
    // If Xero responded unauthorized, force a refresh and retry once
    if (msg.includes('401') || msg.toLowerCase().includes('unauthorized')) {
      const refreshed = await refreshAccessToken(decryptSecret(con.refresh_token_enc));
      const newExpires = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();
      await upsertConnection(supabaseService, {
        tenantId: con.tenant_id,
        accessToken: refreshed.access_token,
        refreshToken: refreshed.refresh_token,
        expiresAt: newExpires,
        scopes: (refreshed.scope || env.XERO_SCOPES).split(/[\s,]+/).filter(Boolean),
      });
      con = (await getStoredConnection(supabaseService))!;
      json = await getAccounts(con.access_token, con.tenant_id);
    } else {
      console.error('[Xero] Accounts failed:', msg);
      return c.json({ error: 'Xero Accounts request failed', detail: msg }, 502);
    }
  }
  const items = (json?.Accounts || []).map((a: any) => ({
    AccountID: a.AccountID,
    Code: a.Code,
    Name: a.Name,
    Type: a.Type,
  }));
  return c.json({ accounts: items });
});

// Fetch Profit & Loss and normalize
xero.post('/pnl', async (c) => {
  const Body = z.object({ startDate: z.string().min(1), endDate: z.string().min(1), refresh: z.boolean().optional() });
  const input = Body.safeParse(await c.req.json().catch(() => ({})));
  if (!input.success) return c.json({ error: input.error.flatten() }, 400);

  // @ts-ignore
  const { supabaseService } = c.get('clients') as Clients;
  let con = await getStoredConnection(supabaseService);
  if (!con) return c.json({ error: 'Xero not connected' }, 400);
  if (new Date(con.expires_at).getTime() < Date.now() + 5 * 60 * 1000) {
    const refreshed = await refreshAccessToken(decryptSecret(con.refresh_token_enc));
    const newExpires = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();
    await upsertConnection(supabaseService, {
      tenantId: con.tenant_id,
      accessToken: refreshed.access_token,
      refreshToken: refreshed.refresh_token,
      expiresAt: newExpires,
      scopes: (refreshed.scope || env.XERO_SCOPES).split(/[\s,]+/).filter(Boolean),
    });
    con = (await getStoredConnection(supabaseService))!;
  }

  // Caching: try snapshot first unless refresh requested
  if (!input.data.refresh) {
    const { data: existing, error: snapErr } = await supabaseService
      .from('xero_pnl_snapshots')
      .select('id,result_json,updated_at')
      .eq('tenant_id', con.tenant_id)
      .eq('start_date', input.data.startDate)
      .eq('end_date', input.data.endDate)
      .maybeSingle();
    if (!snapErr && existing?.result_json) {
      const withMeta = { ...existing.result_json, meta: { cached: true, lastUpdated: existing.updated_at } };
      return c.json(withMeta);
    }
  }

  let data: any;
  try {
    data = await getProfitAndLoss(con.access_token, con.tenant_id, input.data.startDate, input.data.endDate);
  } catch (err: any) {
    const msg = String(err?.message || err);
    // If unauthorized, refresh and retry once
    if (msg.includes('401') || msg.toLowerCase().includes('unauthorized')) {
      const refreshed = await refreshAccessToken(decryptSecret(con.refresh_token_enc));
      const newExpires = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();
      await upsertConnection(supabaseService, {
        tenantId: con.tenant_id,
        accessToken: refreshed.access_token,
        refreshToken: refreshed.refresh_token,
        expiresAt: newExpires,
        scopes: (refreshed.scope || env.XERO_SCOPES).split(/[\s,]+/).filter(Boolean),
      });
      con = (await getStoredConnection(supabaseService))!;
      data = await getProfitAndLoss(con.access_token, con.tenant_id, input.data.startDate, input.data.endDate);
    } else {
      console.error('[Xero] P&L fetch failed:', msg);
      return c.json({ error: 'Xero P&L request failed', detail: msg }, 502);
    }
  }
  // Accounting Reports API structure: data.Reports[0].Rows is a tree.
  const period = { start: input.data.startDate, end: input.data.endDate };
  let incomeTotal = 0;
  let expenseTotal = 0;
  const categories: Record<string, number> = {};
  const uncategorized: any[] = [];

  const rows = (data?.Reports?.[0]?.Rows || []) as any[];

  const parseAmount = (s: any): number => {
    if (s == null) return 0;
    const str = String(s).replace(/[,\s]/g, '');
    if (!str) return 0;
    // Handle (123.45) as negative
    const negative = /^\(.*\)$/.test(str);
    const cleaned = str.replace(/[()]/g, '');
    const n = Number(cleaned);
    return negative ? -Math.abs(n) : n;
  };

  function walk(rows: any[], section: string | null) {
    for (const r of rows || []) {
      if (r.RowType === 'Section') {
        const title = (r.Title || section || '').toString();
        walk(r.Rows || [], title);
        continue;
      }
      if (r.RowType === 'Row' && Array.isArray(r.Cells)) {
        const label = (r.Cells[0]?.Value || '').toString();
        // pick the last numeric-looking cell as amount
        const lastCell = [...r.Cells].reverse().find((c: any) => c && c.Value != null);
        const amount = parseAmount(lastCell?.Value);
        if (!label) continue;

        // Determine category heuristically
        let cat = 'other';
        const labelL = label.toLowerCase();
        const sectionL = (section || '').toLowerCase();
        if (sectionL.includes('cost of sales') || sectionL.includes('cost of goods')) cat = 'cogs';
        if (labelL.includes('wage') || labelL.includes('payroll')) cat = 'wages';
        if (labelL.includes('security')) cat = 'security';

        categories[cat] = (categories[cat] || 0) + Math.abs(amount);
        if (sectionL.includes('revenue') || sectionL.includes('income')) incomeTotal += amount;
        else expenseTotal += Math.abs(amount);

        if (cat === 'other') uncategorized.push({ name: label, section, amount });
        continue;
      }
      if (Array.isArray(r.Rows)) walk(r.Rows, section);
    }
  }

  walk(rows, null);

  const result = {
    period,
    totals: { income: incomeTotal, expenses: expenseTotal, netProfit: incomeTotal - expenseTotal },
    categories,
    uncategorized,
    raw: data,
  };
  // Save snapshot
  await supabaseService
    .from('xero_pnl_snapshots')
    .upsert({
      tenant_id: con.tenant_id,
      start_date: input.data.startDate,
      end_date: input.data.endDate,
      result_json: result,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'tenant_id,start_date,end_date' });
  return c.json({ ...result, meta: { cached: false, lastUpdated: new Date().toISOString() } });
});


