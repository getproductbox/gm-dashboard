import crypto from 'crypto';
import { env } from '../env';
import type { SupabaseClient } from '@supabase/supabase-js';

export type StoredConnection = {
  id: string;
  tenant_id: string;
  access_token: string;
  refresh_token_enc: string;
  expires_at: string; // ISO
  scopes: string[];
  created_at: string;
  updated_at: string;
};

function getKey(): Buffer {
  const k = env.XERO_TOKEN_ENCRYPTION_KEY;
  if (/^[0-9a-fA-F]{64}$/.test(k)) return Buffer.from(k, 'hex');
  return crypto.createHash('sha256').update(k).digest();
}

export function encryptSecret(plain: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]).toString('base64');
}

export function decryptSecret(enc: string): string {
  const key = getKey();
  const buf = Buffer.from(enc, 'base64');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const data = buf.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const plain = Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
  return plain;
}

export async function getStoredConnection(db: SupabaseClient): Promise<StoredConnection | null> {
  const { data, error } = await db
    .from('xero_connections')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data || null;
}

export async function upsertConnection(
  db: SupabaseClient,
  input: { tenantId: string; accessToken: string; refreshToken: string; expiresAt: string; scopes: string[] }
) {
  const encrypted = encryptSecret(input.refreshToken);
  const { error } = await db
    .from('xero_connections')
    .upsert({
      tenant_id: input.tenantId,
      access_token: input.accessToken,
      refresh_token_enc: encrypted,
      expires_at: input.expiresAt,
      scopes: input.scopes,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'tenant_id' });
  if (error) throw new Error(error.message);
}



