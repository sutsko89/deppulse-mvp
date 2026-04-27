import { getAuthUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatDistanceToNow, format } from 'date-fns'
import { ru } from 'date-fns/locale'
import ScanButton from './ScanButton'

const SEVERITY_CONFIG = {
  critical: { label: 'Критичный', bg: 'bg-[var(--color-error-highlight)]', text: 'text-[var(--color-error)]' },
  high:     { label: 'Высокий',   bg: 'bg-[var(--color-warning-highlight)]', text: 'text-[var(--color-warning)]' },
  medium:   { label: 'Средний',   bg: 'bg-[var(--color-gold-highlight)]', text: 'text-[var(--color-gold)]' },
  low:      { label: 'Низкий',    bg: 'bg-[var(--color-blue-highlight)]', text: 'text-[var(--color-blue)]' },
  info:     { label: 'Инфо',      bg: 'bg-[var(--color-surface-offset)]', text: 'text-[var(--color-text-muted)]' },
} as const

type Severity = keyof typeof SEVERITY_CONFIG

export default async function RepositoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getAuthUser()
  const supabase = await createClient()

  // Fetch repository — only columns that exist in the schema
  const { data: repo } = await supabase
    .from('repositories')
    .select('id, full_name, name, is_private, html_url, last_scan_at, last_scan_status')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!repo) notFound()

  // Fetch scan history (last 10)
  const { data: scans } = await supabase
    .from('vulnerability_scans')
    .select('id, status, total_deps, vulnerable_deps, critical_count, high_count, medium_count, low_count, completed_at, started_at, triggered_by, error_message')
    .eq('repo_id', id)
    .order('started_at', { ascending: false })
    .limit(10)

  const latestScan = scans?.[0]

  // Fetch vulnerabilities for latest scan
  const { data: vulns } = latestScan
    ? await supabase
        .from('vulnerabilities')
        .select('id, osv_id, package_name, package_version, severity, summary, fixed_version, fix_available, ecosystem, osv_url, cve_ids, is_resolved')
        .eq('scan_id', latestScan.id)
        .order('severity', { ascending: true })
        .limit(100)
    : { data: [] }

  // Fetch latest GitHub Issue notification
  const { data: latestIssue } = latestScan
    ? await supabase
        .from('github_issue_notifications')
        .select('github_issue_url, github_issue_number, github_issue_title, status, is_open')
        .eq('scan_id', latestScan.id)
        .eq('status', 'created')
        .maybeSingle()
    : { data: null }

  const isScanning = repo.last_scan_status === 'pending' || latestScan?.status === 'pending'

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Header */}
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center gap-4">
          <Link
            href="/dashboard"
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            ← Назад
          </Link>
          <div className="flex items-center gap-2.5">
            <svg width="24" height="24" viewBox="0 0 48 48" fill="none" className="text-[var(--color-primary)]">
              <rect width="48" height="48" rx="12" fill="currentColor" opacity="0.12" />
              <path d="M10 28 L18 16 L24 24 L30 14 L38 28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <circle cx="24" cy="24" r="3" fill="currentColor" />
            </svg>
            <span className="font-semibold text-[var(--color-text)]">DepPulse</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {/* Repo header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-semibold text-[var(--color-text)]">{repo.full_name}</h1>
              {repo.is_private && (
                <span className="rounded px-1.5 py-0.5 text-[10px] bg-[var(--color-surface-offset)] text-[var(--color-text-muted)]">private</span>
              )}
            </div>
            <div className="mt-1 flex items-center gap-3">
              {repo.html_url && (
                <a
                  href={repo.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[var(--color-primary)] hover:underline"
                >
                  Открыть на GitHub ↗
                </a>
              )}
              {repo.last_scan_at && (
                <span className="text-xs text-[var(--color-text-muted)]">
                  Последний скан: {formatDistanceToNow(new Date(repo.last_scan_at), { addSuffix: true, locale: ru })}
                </span>
              )}
            </div>
          </div>
          <ScanButton
            repositoryId={repo.id}
            repoFullName={repo.full_name}
            isScanning={isScanning ?? false}
          />
        </div>

        {/* Latest scan summary */}
        {latestScan && (
          <div className="mb-6 grid grid-cols-5 gap-3">
            {(['critical', 'high', 'medium', 'low'] as Severity[]).map(sev => {
              const count = latestScan[`${sev}_count` as keyof typeof latestScan] as number ?? 0
              const cfg = SEVERITY_CONFIG[sev]
              return (
                <div key={sev} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-center">
                  <p className={`text-2xl font-semibold tabular-nums ${count > 0 ? cfg.text : 'text-[var(--color-text-muted)]'}`}>
                    {count}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">{cfg.label}</p>
                </div>
              )
            })}
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-center">
              <p className="text-2xl font-semibold tabular-nums text-[var(--color-text)]">
                {latestScan.total_deps ?? '—'}
              </p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">Зависимостей</p>
            </div>
          </div>
        )}

        {/* GitHub Issue link */}
        {latestIssue?.github_issue_url && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--color-primary)] shrink-0">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--color-text)] truncate">
                {latestIssue.github_issue_title ?? `Issue #${latestIssue.github_issue_number}`}
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">
                GitHub Issue {latestIssue.is_open ? '• открыт' : '• закрыт'}
              </p>
            </div>
            <a
              href={latestIssue.github_issue_url}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-xs text-[var(--color-primary)] hover:underline"
            >
              Открыть ↗
            </a>
          </div>
        )}

        {/* Vulnerabilities table */}
        {(vulns?.length ?? 0) > 0 ? (
          <div className="mb-8">
            <h2 className="mb-3 text-base font-medium text-[var(--color-text)]">Уязвимости</h2>
            <div className="rounded-xl border border-[var(--color-border)] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">Уровень</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">Пакет</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">Версия</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">CVE / OSV</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">Фикс</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {vulns?.map(v => {
                    const sev = (v.severity ?? 'info') as Severity
                    const cfg = SEVERITY_CONFIG[sev] ?? SEVERITY_CONFIG.info
                    const ver = v.package_version ?? '—'
                    const fixVer = v.fixed_version
                    const cveId = v.cve_ids?.[0] ?? v.osv_id
                    return (
                      <tr key={v.id} className={`bg-[var(--color-surface)] ${v.is_resolved ? 'opacity-50' : ''}`}>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.text}`}>
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-[var(--color-text)]">{v.package_name}</p>
                          {v.summary && (
                            <p className="text-xs text-[var(--color-text-muted)] truncate max-w-xs">{v.summary}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[var(--color-text-muted)] font-mono text-xs">{ver}</td>
                        <td className="px-4 py-3">
                          {v.osv_url ? (
                            <a
                              href={v.osv_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-[var(--color-primary)] hover:underline font-mono"
                            >
                              {cveId}
                            </a>
                          ) : (
                            <span className="text-xs text-[var(--color-text-muted)] font-mono">{cveId}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {fixVer ? (
                            <span className="text-[var(--color-success)]">→ {fixVer}</span>
                          ) : v.fix_available ? (
                            <span className="text-[var(--color-text-muted)]">Доступен</span>
                          ) : (
                            <span className="text-[var(--color-text-faint)]">Нет фикса</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : latestScan?.status === 'completed' ? (
          <div className="mb-8 rounded-xl border border-dashed border-[var(--color-success)] bg-[var(--color-success-highlight)] p-10 text-center">
            <p className="text-[var(--color-success)] font-medium">✓ Уязвимостей не найдено</p>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              Проверено {latestScan.total_deps ?? 0} зависимостей
            </p>
          </div>
        ) : null}

        {/* Scan history */}
        {(scans?.length ?? 0) > 0 && (
          <div>
            <h2 className="mb-3 text-base font-medium text-[var(--color-text)]">История сканов</h2>
            <div className="space-y-2">
              {scans?.map((scan, i) => (
                <div
                  key={scan.id}
                  className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                      scan.status === 'completed' ? 'bg-[var(--color-success)]' :
                      scan.status === 'pending'   ? 'bg-[var(--color-gold)] animate-pulse' :
                      scan.status === 'failed'    ? 'bg-[var(--color-error)]' :
                      'bg-[var(--color-text-faint)]'
                    }`} />
                    <div>
                      <p className="text-sm text-[var(--color-text)]">
                        {i === 0 ? 'Последний скан' : `Скан #${scans.length - i}`}
                        {scan.triggered_by && (
                          <span className="ml-2 text-xs text-[var(--color-text-muted)]">({scan.triggered_by})</span>
                        )}
                      </p>
                      {scan.error_message && (
                        <p className="text-xs text-[var(--color-error)] mt-0.5 truncate max-w-sm">{scan.error_message}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
                    <span>{scan.vulnerable_deps ?? 0} уязв. / {scan.total_deps ?? 0} зависим.</span>
                    <span>
                      {scan.completed_at
                        ? format(new Date(scan.completed_at), 'd MMM yyyy, HH:mm', { locale: ru })
                        : scan.started_at
                          ? format(new Date(scan.started_at), 'd MMM yyyy, HH:mm', { locale: ru })
                          : '—'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No scans yet */}
        {!latestScan && (
          <div className="rounded-xl border border-dashed border-[var(--color-border)] p-12 text-center">
            <p className="text-[var(--color-text-muted)] mb-2">Ещё не сканировался</p>
            <p className="text-sm text-[var(--color-text-muted)]">Нажмите «Запустить скан» выше</p>
          </div>
        )}
      </main>
    </div>
  )
}
