create table if not exists public.xero_connections (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null unique,
  access_token text not null,
  refresh_token_enc text not null,
  expires_at timestamptz not null,
  scopes text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.xero_connections enable row level security;

-- Policies can be added to restrict access; for now rely on service role usage from the API.



