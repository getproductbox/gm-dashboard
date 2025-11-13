create table if not exists public.xero_pnl_snapshots (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  start_date date not null,
  end_date date not null,
  result_json jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, start_date, end_date)
);

alter table public.xero_pnl_snapshots enable row level security;



