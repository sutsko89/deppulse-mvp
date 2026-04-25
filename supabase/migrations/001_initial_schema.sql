-- DepPulse: Initial Schema Migration v1.1
-- Run via Supabase Dashboard → SQL Editor
-- Idempotent: safe to run multiple times

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================
DO $$ BEGIN
  CREATE TYPE subscription_tier AS ENUM ('free', 'pro', 'team');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE severity AS ENUM ('critical', 'high', 'medium', 'low', 'info');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE scan_status AS ENUM ('pending', 'running', 'completed', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- TABLE: profiles
-- Linked to auth.users, synced on OAuth login
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id                    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  github_id             BIGINT NOT NULL UNIQUE,
  email                 TEXT,
  name                  TEXT,
  avatar_url            TEXT,
  github_username       TEXT,
  subscription_tier     subscription_tier NOT NULL DEFAULT 'free',
  -- Billing
  yukassa_customer_id   TEXT,
  subscription_ends_at  TIMESTAMPTZ,
  -- AI usage tracking
  ai_requests_used      INTEGER NOT NULL DEFAULT 0,
  ai_requests_reset_at  TIMESTAMPTZ DEFAULT NOW(),
  -- Timestamps
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: repositories
-- ============================================================
CREATE TABLE IF NOT EXISTS public.repositories (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  github_repo_id   BIGINT NOT NULL,
  name             TEXT NOT NULL,
  full_name        TEXT NOT NULL,
  html_url         TEXT,
  is_private       BOOLEAN NOT NULL DEFAULT FALSE,
  default_branch   TEXT NOT NULL DEFAULT 'main',
  -- Scan settings
  scan_enabled     BOOLEAN NOT NULL DEFAULT TRUE,
  scan_frequency   TEXT NOT NULL DEFAULT 'weekly', -- 'push' | 'daily' | 'weekly'
  -- Notification thresholds
  notify_critical  BOOLEAN NOT NULL DEFAULT TRUE,
  notify_high      BOOLEAN NOT NULL DEFAULT TRUE,
  notify_medium    BOOLEAN NOT NULL DEFAULT FALSE,
  notify_low       BOOLEAN NOT NULL DEFAULT FALSE,
  -- GitHub App installation
  installation_id  BIGINT,
  -- Last scan state
  last_scan_at     TIMESTAMPTZ,
  last_scan_status scan_status,
  -- Timestamps
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Constraints
  CONSTRAINT uq_user_repo UNIQUE(user_id, github_repo_id)
);

-- ============================================================
-- TABLE: vulnerability_scans
-- ============================================================
CREATE TABLE IF NOT EXISTS public.vulnerability_scans (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  repo_id          UUID NOT NULL REFERENCES public.repositories(id) ON DELETE CASCADE,
  status           scan_status NOT NULL DEFAULT 'pending',
  triggered_by     TEXT NOT NULL DEFAULT 'schedule', -- 'push' | 'schedule' | 'manual'
  commit_sha       TEXT,
  -- Counts
  total_deps       INTEGER,
  vulnerable_deps  INTEGER,
  critical_count   INTEGER NOT NULL DEFAULT 0,
  high_count       INTEGER NOT NULL DEFAULT 0,
  medium_count     INTEGER NOT NULL DEFAULT 0,
  low_count        INTEGER NOT NULL DEFAULT 0,
  -- Error info
  error_message    TEXT,
  -- Timestamps
  started_at       TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: vulnerabilities
-- Individual CVE findings per scan (from OSV.dev)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.vulnerabilities (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scan_id             UUID NOT NULL REFERENCES public.vulnerability_scans(id) ON DELETE CASCADE,
  repo_id             UUID NOT NULL REFERENCES public.repositories(id) ON DELETE CASCADE,
  -- OSV data
  osv_id              TEXT NOT NULL,
  severity            severity NOT NULL DEFAULT 'medium',
  package_name        TEXT NOT NULL,
  package_version     TEXT,
  ecosystem           TEXT,  -- 'npm' | 'PyPI' | 'crates.io' | 'Go'
  summary             TEXT,
  details             TEXT,
  -- Versions
  affected_versions   TEXT[],
  fixed_version       TEXT,
  -- References
  cvss_score          NUMERIC(4,1),
  cve_ids             TEXT[],
  osv_url             TEXT,
  published           TIMESTAMPTZ,
  -- AI analysis fields
  ai_risk_explanation TEXT,
  ai_safe_update_path TEXT,
  ai_breaking_changes TEXT,
  ai_confidence       NUMERIC(3,2),  -- 0.00 – 1.00
  -- State
  is_resolved         BOOLEAN NOT NULL DEFAULT FALSE,
  is_ignored          BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_at         TIMESTAMPTZ,
  -- Timestamps
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Prevent duplicate CVE per scan
  CONSTRAINT uq_scan_package_osv UNIQUE(scan_id, package_name, osv_id)
);

-- ============================================================
-- TABLE: github_issue_notifications
-- GitHub Issues created for scan results
-- ============================================================
CREATE TABLE IF NOT EXISTS public.github_issue_notifications (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  repo_id              UUID NOT NULL REFERENCES public.repositories(id) ON DELETE CASCADE,
  scan_id              UUID REFERENCES public.vulnerability_scans(id) ON DELETE SET NULL,
  -- GitHub Issue
  github_issue_number  INTEGER NOT NULL,
  github_issue_url     TEXT NOT NULL,
  github_issue_title   TEXT,
  -- Content
  vulnerability_ids    UUID[] NOT NULL DEFAULT '{}',
  severity_summary     JSONB,  -- {"critical": 2, "high": 1}
  -- State
  is_open              BOOLEAN NOT NULL DEFAULT TRUE,
  closed_at            TIMESTAMPTZ,
  -- Timestamps
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: error_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS public.error_logs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  repo_id       UUID REFERENCES public.repositories(id) ON DELETE SET NULL,
  scan_id       UUID REFERENCES public.vulnerability_scans(id) ON DELETE SET NULL,
  error_type    TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_stack   TEXT,
  context       JSONB,
  endpoint      TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_profiles_github_id     ON public.profiles(github_id);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription  ON public.profiles(subscription_tier);

CREATE INDEX IF NOT EXISTS idx_repos_user_id          ON public.repositories(user_id);
CREATE INDEX IF NOT EXISTS idx_repos_github_id        ON public.repositories(github_repo_id);
CREATE INDEX IF NOT EXISTS idx_repos_full_name        ON public.repositories(full_name);
CREATE INDEX IF NOT EXISTS idx_repos_last_scan        ON public.repositories(last_scan_at);

CREATE INDEX IF NOT EXISTS idx_scans_repo_id          ON public.vulnerability_scans(repo_id);
CREATE INDEX IF NOT EXISTS idx_scans_status           ON public.vulnerability_scans(status);
CREATE INDEX IF NOT EXISTS idx_scans_created          ON public.vulnerability_scans(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_vulns_repo_id          ON public.vulnerabilities(repo_id);
CREATE INDEX IF NOT EXISTS idx_vulns_scan_id          ON public.vulnerabilities(scan_id);
CREATE INDEX IF NOT EXISTS idx_vulns_severity         ON public.vulnerabilities(severity);
CREATE INDEX IF NOT EXISTS idx_vulns_osv_id           ON public.vulnerabilities(osv_id);
CREATE INDEX IF NOT EXISTS idx_vulns_resolved         ON public.vulnerabilities(is_resolved);
CREATE INDEX IF NOT EXISTS idx_vulns_package          ON public.vulnerabilities(package_name);

CREATE INDEX IF NOT EXISTS idx_notifications_repo_id  ON public.github_issue_notifications(repo_id);
CREATE INDEX IF NOT EXISTS idx_notifications_scan_id  ON public.github_issue_notifications(scan_id);

CREATE INDEX IF NOT EXISTS idx_errors_created         ON public.error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_errors_type            ON public.error_logs(error_type);

-- ============================================================
-- TRIGGERS: auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS repositories_updated_at ON public.repositories;
CREATE TRIGGER repositories_updated_at
  BEFORE UPDATE ON public.repositories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS vulnerabilities_updated_at ON public.vulnerabilities;
CREATE TRIGGER vulnerabilities_updated_at
  BEFORE UPDATE ON public.vulnerabilities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS notifications_updated_at ON public.github_issue_notifications;
CREATE TRIGGER notifications_updated_at
  BEFORE UPDATE ON public.github_issue_notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.profiles                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repositories              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vulnerability_scans       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vulnerabilities           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.github_issue_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_logs               ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY IF NOT EXISTS "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY IF NOT EXISTS "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY IF NOT EXISTS "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY IF NOT EXISTS "service_role_all_profiles" ON public.profiles
  FOR ALL USING (auth.role() = 'service_role');

-- repositories
CREATE POLICY IF NOT EXISTS "repositories_all_own" ON public.repositories
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "service_role_all_repositories" ON public.repositories
  FOR ALL USING (auth.role() = 'service_role');

-- vulnerability_scans
CREATE POLICY IF NOT EXISTS "scans_select_own" ON public.vulnerability_scans
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.repositories r
      WHERE r.id = repo_id AND r.user_id = auth.uid()
    )
  );
CREATE POLICY IF NOT EXISTS "service_role_all_scans" ON public.vulnerability_scans
  FOR ALL USING (auth.role() = 'service_role');

-- vulnerabilities
CREATE POLICY IF NOT EXISTS "vulnerabilities_select_own" ON public.vulnerabilities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.repositories r
      WHERE r.id = repo_id AND r.user_id = auth.uid()
    )
  );
CREATE POLICY IF NOT EXISTS "service_role_all_vulnerabilities" ON public.vulnerabilities
  FOR ALL USING (auth.role() = 'service_role');

-- github_issue_notifications
CREATE POLICY IF NOT EXISTS "notifications_select_own" ON public.github_issue_notifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.repositories r
      WHERE r.id = repo_id AND r.user_id = auth.uid()
    )
  );
CREATE POLICY IF NOT EXISTS "service_role_all_notifications" ON public.github_issue_notifications
  FOR ALL USING (auth.role() = 'service_role');

-- error_logs
CREATE POLICY IF NOT EXISTS "errors_select_own" ON public.error_logs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "service_role_all_errors" ON public.error_logs
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Returns limits JSON for a given tier
CREATE OR REPLACE FUNCTION get_subscription_limits(tier subscription_tier)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN CASE tier
    WHEN 'free' THEN
      '{"max_repos": 1, "max_private_repos": 0, "scan_frequency": "weekly",
        "ai_requests_per_month": 0, "history_days": 7}'::JSONB
    WHEN 'pro' THEN
      '{"max_repos": 5, "max_private_repos": 5, "scan_frequency": "daily",
        "ai_requests_per_month": 50, "history_days": 30}'::JSONB
    WHEN 'team' THEN
      '{"max_repos": -1, "max_private_repos": -1, "scan_frequency": "push",
        "ai_requests_per_month": 200, "history_days": 90}'::JSONB
    ELSE
      '{"max_repos": 1, "max_private_repos": 0, "scan_frequency": "weekly",
        "ai_requests_per_month": 0, "history_days": 7}'::JSONB
  END;
END;
$$;

-- Check if user can connect another repository
CREATE OR REPLACE FUNCTION can_add_repository(user_uuid UUID, is_private_repo BOOLEAN)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_tier    subscription_tier;
  limits       JSONB;
  current_cnt  INTEGER;
  max_allowed  INTEGER;
BEGIN
  SELECT subscription_tier INTO user_tier
  FROM public.profiles WHERE id = user_uuid;

  limits := get_subscription_limits(user_tier);

  SELECT COUNT(*) INTO current_cnt
  FROM public.repositories
  WHERE user_id = user_uuid AND scan_enabled = TRUE;

  IF is_private_repo THEN
    max_allowed := (limits->>'max_private_repos')::INTEGER;
  ELSE
    max_allowed := (limits->>'max_repos')::INTEGER;
  END IF;

  IF max_allowed = -1 THEN RETURN TRUE; END IF;
  RETURN current_cnt < max_allowed;
END;
$$;

-- ============================================================
-- GRANTS
-- ============================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated, service_role;
