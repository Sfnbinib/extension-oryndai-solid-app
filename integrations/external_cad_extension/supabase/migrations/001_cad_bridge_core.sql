create table if not exists public.cad_bridge_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cad_bridge_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null check (status in ('none', 'trial', 'active', 'expired', 'canceled')),
  source text not null default 'manual' check (source in ('manual', 'stripe', 'crypto', 'promo', 'trial')),
  plan_code text not null default 'cad_bridge_free',
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  external_customer_id text,
  external_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cad_bridge_entitlements_user_status_idx
  on public.cad_bridge_entitlements (user_id, status, expires_at);

create table if not exists public.cad_bridge_trials (
  user_id uuid primary key references auth.users(id) on delete cascade,
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  fingerprint_hash text,
  created_at timestamptz not null default now()
);

create table if not exists public.cad_bridge_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  local_session_id text,
  prompt text,
  scenario text,
  source_path text not null default 'text_macro',
  operation_plan jsonb not null default '{}'::jsonb,
  validation jsonb not null default '{}'::jsonb,
  macro_hash text,
  status text not null default 'previewed' check (status in ('previewed', 'approved', 'executed', 'failed', 'exported')),
  target_cad text not null default 'solidworks',
  created_at timestamptz not null default now()
);

create index if not exists cad_bridge_runs_user_created_idx
  on public.cad_bridge_runs (user_id, created_at desc);

create table if not exists public.cad_bridge_model_routes (
  user_id uuid primary key references auth.users(id) on delete cascade,
  provider text not null check (provider in ('anthropic', 'openai', 'ollama', 'local', 'server')),
  model text,
  byo_key_enabled boolean not null default false,
  server_route_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.cad_bridge_profiles enable row level security;
alter table public.cad_bridge_entitlements enable row level security;
alter table public.cad_bridge_trials enable row level security;
alter table public.cad_bridge_runs enable row level security;
alter table public.cad_bridge_model_routes enable row level security;

drop policy if exists "cad bridge profiles own read" on public.cad_bridge_profiles;
create policy "cad bridge profiles own read"
  on public.cad_bridge_profiles for select
  using (auth.uid() = user_id);

drop policy if exists "cad bridge profiles own write" on public.cad_bridge_profiles;
create policy "cad bridge profiles own write"
  on public.cad_bridge_profiles for insert
  with check (auth.uid() = user_id);

drop policy if exists "cad bridge profiles own update" on public.cad_bridge_profiles;
create policy "cad bridge profiles own update"
  on public.cad_bridge_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "cad bridge entitlements own read" on public.cad_bridge_entitlements;
create policy "cad bridge entitlements own read"
  on public.cad_bridge_entitlements for select
  using (auth.uid() = user_id);

drop policy if exists "cad bridge trials own read" on public.cad_bridge_trials;
create policy "cad bridge trials own read"
  on public.cad_bridge_trials for select
  using (auth.uid() = user_id);

drop policy if exists "cad bridge trials own insert" on public.cad_bridge_trials;
create policy "cad bridge trials own insert"
  on public.cad_bridge_trials for insert
  with check (auth.uid() = user_id);

drop policy if exists "cad bridge runs own read" on public.cad_bridge_runs;
create policy "cad bridge runs own read"
  on public.cad_bridge_runs for select
  using (auth.uid() = user_id);

drop policy if exists "cad bridge runs own insert" on public.cad_bridge_runs;
create policy "cad bridge runs own insert"
  on public.cad_bridge_runs for insert
  with check (auth.uid() = user_id);

drop policy if exists "cad bridge runs own update" on public.cad_bridge_runs;
create policy "cad bridge runs own update"
  on public.cad_bridge_runs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "cad bridge model routes own read" on public.cad_bridge_model_routes;
create policy "cad bridge model routes own read"
  on public.cad_bridge_model_routes for select
  using (auth.uid() = user_id);

drop policy if exists "cad bridge model routes own write" on public.cad_bridge_model_routes;
create policy "cad bridge model routes own write"
  on public.cad_bridge_model_routes for insert
  with check (auth.uid() = user_id);

drop policy if exists "cad bridge model routes own update" on public.cad_bridge_model_routes;
create policy "cad bridge model routes own update"
  on public.cad_bridge_model_routes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

