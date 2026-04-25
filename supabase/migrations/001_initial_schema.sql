-- DepPulse initial schema
-- Run via Supabase Dashboard → SQL Editor or supabase db push

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles (synced from Supabase Auth)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  github_id bigint,
  email text,
  name text,
  avatar_url text,
  plan text not null default 'free' check (plan in ('free', 'pro', 'team')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Repositories monitored by users
create table if not exists public.repositories (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  full_name text not null,  -- "owner/repo"
  last_scan_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, full_name)
);

create index if not exists idx_repositories_user_id on public.repositories(user_id);
create index if not exists idx_repositories_full_name on public.repositories(full_name);

-- Vulnerability scans
create table if not exists public.vulnerability_scans (
  id uuid primary key default uuid_generate_v4(),
  repository_id uuid not null references public.repositories(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'running', 'completed', 'failed')),
  dependencies_count integer not null default 0,
  vulnerabilities_count integer not null default 0,
  critical_count integer not null default 0,
  high_count integer not null default 0,
  medium_count integer not null default 0,
  low_count integer not null default 0,
  scanned_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_scans_repository_id on public.vulnerability_scans(repository_id);
create index if not exists idx_scans_status on public.vulnerability_scans(status);

-- Individual vulnerabilities per scan
create table if not exists public.vulnerabilities (
  id uuid primary key default uuid_generate_v4(),
  scan_id uuid not null references public.vulnerability_scans(id) on delete cascade,
  repo_id uuid not null references public.repositories(id) on delete cascade,
  osv_id text not null,
  package_name text not null,
  version text,
  ecosystem text,
  severity text not null default 'info' check (severity in ('critical', 'high', 'medium', 'low', 'info')),
  summary text,
  details text,
  aliases text[],
  cvss_score numeric(4,1),
  fix_available boolean not null default false,
  safe_version text,
  published timestamptz,
  is_resolved boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_vulns_scan_id on public.vulnerabilities(scan_id);
create index if not exists idx_vulns_severity on public.vulnerabilities(severity);
create index if not exists idx_vulns_osv_id on public.vulnerabilities(osv_id);

-- GitHub Issue notifications (idempotent)
create table if not exists public.github_issue_notifications (
  id uuid primary key default uuid_generate_v4(),
  scan_id uuid not null references public.vulnerability_scans(id) on delete cascade,
  repo_id uuid not null references public.repositories(id) on delete cascade,
  severity_filter text not null default 'high',
  status text not null default 'pending' check (status in ('pending', 'created', 'skipped', 'failed')),
  github_issue_number integer,
  github_issue_url text,
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_scan_id on public.github_issue_notifications(scan_id);

-- Error logs
create table if not exists public.error_logs (
  id uuid primary key default uuid_generate_v4(),
  level text not null default 'error' check (level in ('error', 'warn', 'info')),
  message text not null,
  scan_id uuid references public.vulnerability_scans(id) on delete set null,
  context jsonb,
  created_at timestamptz not null default now()
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.repositories enable row level security;
alter table public.vulnerability_scans enable row level security;
alter table public.vulnerabilities enable row level security;
alter table public.github_issue_notifications enable row level security;
alter table public.error_logs enable row level security;

-- RLS Policies
create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Service role can upsert profiles"
  on public.profiles for all using (true) with check (true);

create policy "Users can CRUD own repositories"
  on public.repositories for all using (auth.uid() = user_id);

create policy "Users can view own scans"
  on public.vulnerability_scans for select
  using (exists (
    select 1 from public.repositories r
    where r.id = repository_id and r.user_id = auth.uid()
  ));

create policy "Service role can manage scans"
  on public.vulnerability_scans for all using (true);

create policy "Users can view own vulnerabilities"
  on public.vulnerabilities for select
  using (exists (
    select 1 from public.repositories r
    where r.id = repo_id and r.user_id = auth.uid()
  ));

create policy "Service role can manage vulnerabilities"
  on public.vulnerabilities for all using (true);

create policy "Service role can manage notifications"
  on public.github_issue_notifications for all using (true);

create policy "Service role can manage error logs"
  on public.error_logs for all using (true);
