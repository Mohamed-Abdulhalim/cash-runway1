create table if not exists public.users (
  id text primary key,
  email text,
  name text,
  updated_at timestamptz default now()
);

create table if not exists public.user_tokens (
  user_id text primary key,
  access_token text,
  refresh_token text,
  tenant_id text,
  expires_at bigint,
  updated_at timestamptz default now()
);

create table if not exists public.user_snapshots (
  user_id text primary key,
  starting_cash numeric,
  inflows jsonb default '[]'::jsonb,
  outflows jsonb default '[]'::jsonb,
  data jsonb,
  last_synced_at timestamptz
);

create table if not exists public.user_settings (
  user_id text primary key,
  commitments jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.users enable row level security;
alter table public.user_tokens enable row level security;
alter table public.user_snapshots enable row level security;
alter table public.user_settings enable row level security;
revoke all on public.users, public.user_tokens, public.user_snapshots, public.user_settings from anon, authenticated;
