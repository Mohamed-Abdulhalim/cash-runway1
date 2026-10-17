alter table public.user_snapshots add column if not exists data jsonb;

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

delete from public.user_tokens where access_token not like 'enc:v1:%';
delete from public.user_snapshots where data is null;

alter table public.user_tokens alter column tenant_id drop not null;
