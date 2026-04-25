-- DepPulse: Schema Compatibility Patch
-- Adds columns referenced by engine.ts and issues.ts but missing from 001
-- Idempotent: safe to run multiple times

-- ============================================================
-- vulnerability_scans: legacy column aliases used by engine.ts
-- ============================================================

-- engine.ts writes repository_id (legacy) + repo_id (v2)
ALTER TABLE public.vulnerability_scans
  ADD COLUMN IF NOT EXISTS repository_id UUID REFERENCES public.repositories(id) ON DELETE CASCADE;

-- engine.ts writes dependencies_count (legacy) + total_deps (v2)
ALTER TABLE public.vulnerability_scans
  ADD COLUMN IF NOT EXISTS dependencies_count INTEGER;

-- engine.ts writes vulnerabilities_count (legacy) + vulnerable_deps (v2)
ALTER TABLE public.vulnerability_scans
  ADD COLUMN IF NOT EXISTS vulnerabilities_count INTEGER;

-- engine.ts writes scanned_at (legacy) + completed_at (v2)
ALTER TABLE public.vulnerability_scans
  ADD COLUMN IF NOT EXISTS scanned_at TIMESTAMPTZ;

-- ============================================================
-- vulnerabilities: legacy column aliases used by engine.ts
-- ============================================================

-- engine.ts writes version (legacy) + package_version (v2)
ALTER TABLE public.vulnerabilities
  ADD COLUMN IF NOT EXISTS version TEXT;

-- engine.ts writes safe_version (legacy) + fixed_version (v2)
ALTER TABLE public.vulnerabilities
  ADD COLUMN IF NOT EXISTS safe_version TEXT;

-- engine.ts writes fix_available (legacy)
ALTER TABLE public.vulnerabilities
  ADD COLUMN IF NOT EXISTS fix_available BOOLEAN;

-- engine.ts writes aliases (raw OSV array)
ALTER TABLE public.vulnerabilities
  ADD COLUMN IF NOT EXISTS aliases TEXT[];

-- engine.ts writes details
ALTER TABLE public.vulnerabilities
  ADD COLUMN IF NOT EXISTS details TEXT;

-- ============================================================
-- github_issue_notifications: columns used by issues.ts
-- ============================================================

-- issues.ts writes status: 'pending' | 'created' | 'failed' | 'skipped'
ALTER TABLE public.github_issue_notifications
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';

-- issues.ts writes severity_filter
ALTER TABLE public.github_issue_notifications
  ADD COLUMN IF NOT EXISTS severity_filter TEXT NOT NULL DEFAULT 'high';

-- issues.ts writes error_message
ALTER TABLE public.github_issue_notifications
  ADD COLUMN IF NOT EXISTS error_message TEXT;

-- github_issue_number and github_issue_url may be null until issue is created
ALTER TABLE public.github_issue_notifications
  ALTER COLUMN github_issue_number DROP NOT NULL;

ALTER TABLE public.github_issue_notifications
  ALTER COLUMN github_issue_url DROP NOT NULL;

-- ============================================================
-- error_logs: columns used by engine.ts
-- ============================================================

ALTER TABLE public.error_logs
  ADD COLUMN IF NOT EXISTS level TEXT NOT NULL DEFAULT 'error';

ALTER TABLE public.error_logs
  ADD COLUMN IF NOT EXISTS message TEXT;

-- ============================================================
-- INDEXES for new columns
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_notifications_status ON public.github_issue_notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_scan_status ON public.github_issue_notifications(scan_id, status);
CREATE INDEX IF NOT EXISTS idx_scans_repository_id ON public.vulnerability_scans(repository_id);
