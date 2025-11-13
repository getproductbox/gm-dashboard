import { env } from "../env";

type TokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number; // seconds
  token_type: string;
  scope?: string;
};

export function buildAuthorizeUrl(state: string) {
  const base = "https://login.xero.com/identity/connect/authorize";
  const params = new URLSearchParams({
    response_type: "code",
    client_id: env.XERO_CLIENT_ID,
    redirect_uri: env.XERO_REDIRECT_URI,
    scope: env.XERO_SCOPES,
    state,
  });
  return `${base}?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string): Promise<TokenResponse> {
  const url = "https://identity.xero.com/connect/token";
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: env.XERO_REDIRECT_URI,
  });
  const basic = Buffer.from(`${env.XERO_CLIENT_ID}:${env.XERO_CLIENT_SECRET}`).toString("base64");
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Xero token exchange failed: ${resp.status} ${text}`);
  }
  return (await resp.json()) as TokenResponse;
}

export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const url = "https://identity.xero.com/connect/token";
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
  const basic = Buffer.from(`${env.XERO_CLIENT_ID}:${env.XERO_CLIENT_SECRET}`).toString("base64");
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Xero token refresh failed: ${resp.status} ${text}`);
  }
  return (await resp.json()) as TokenResponse;
}

export type Connection = {
  id: string;
  tenantId: string;
  tenantType: string;
  createdDateUtc: string;
  updatedDateUtc: string;
};

export async function getConnections(accessToken: string): Promise<Connection[]> {
  const resp = await fetch("https://api.xero.com/connections", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Xero connections failed: ${resp.status} ${text}`);
  }
  return (await resp.json()) as Connection[];
}

export async function getAccounts(accessToken: string, tenantId: string) {
  const resp = await fetch("https://api.xero.com/api.xro/2.0/Accounts", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "xero-tenant-id": tenantId,
      Accept: "application/json",
    },
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Xero accounts failed: ${resp.status} ${text}`);
  }
  return await resp.json();
}

export async function getProfitAndLoss(
  accessToken: string,
  tenantId: string,
  startDate: string,
  endDate: string
) {
  // Use Accounting Reports P&L (Finance API is restricted for partners)
  const base = "https://api.xero.com/api.xro/2.0/Reports/ProfitAndLoss";
  const params = new URLSearchParams({
    fromDate: startDate,
    toDate: endDate,
  });
  const url = `${base}?${params.toString()}`;
  const resp = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "xero-tenant-id": tenantId,
      Accept: "application/json",
    },
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Xero P&L failed: ${resp.status} ${text}`);
  }
  return await resp.json();
}


