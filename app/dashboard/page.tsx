import { getAuthUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'

export default async function DashboardPage() {
  const user = await getAuthUser()
  const supabase = await createClient()

  // Fetch repositories with latest scan (limit 1, ordered by completed_at)
  const { data: repos } = await supabase
    .from('repositories')
    .select(`
      id,
      full_name,
      name,
      is_private,
      last_scan_at,
      last_scan_status,
      language
    `)
    .eq('user_id', user.id)
    .order('last_scan_at', { ascending: false, nullsFirst: false })

  // Fetch latest scan per repo in one query
  const repoIds = repos?.map(r => r.id) ?? []
  const { data: latestScans } = repoIds.length > 0
    ? await supabase
        .from('vulnerability_scans')
        .select('id, repo_id, status, total_deps, vulnerable_deps, critical_count, high_count, medium_count, low_count, completed_at')
        .in('repo_id', repoIds)
        .order('completed_at', { ascending: false })
    : { data: [] }

  // Map: repoId -> latestScan
  const scanByRepo = new Map<string, NonNullable<typeof latestScans>[number]>()
  for (const scan of latestScans ?? []) {
    if (scan.repo_id && !scanByRepo.has(scan.repo_id)) {
      scanByRepo.set(scan.repo_id, scan)
    }
  }

  // Aggregate stats
  const totalRepos = repos?.length ?? 0
  const totalVulns = Array.from(scanByRepo.values()).reduce(
    (acc, s) => acc + (s.vulnerable_deps ?? 0), 0
  )
  const criticalRepos = Array.from(scanByRepo.values()).filter(
    s => (s.critical_count ?? 0) > 0
  ).length

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Header */}
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2.5">
            <svg width="28" height="28" viewBox="0 0 48 48" fill="none" className="text-[var(--color-primary)]">
              <rect width="48" height="48" rx="12" fill="currentColor" opacity="0.12" />
              <path d="M10 28 L18 16 L24 24 L30 14 L38 28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <circle cx="24" cy="24" r="3" fill="currentColor" />
            </svg>
            <span className="font-semibold text-[var(--color-text)]">DepPulse</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-[var(--color-text-muted)]">
              {user.user_metadata?.name ?? user.email}
            </span>
            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
              >
                Выйти
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {/* Stats */}
        <div className="mb-8 grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
            <p className="text-sm text-[var(--color-text-muted)]">Репозитории</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums text-[var(--color-text)]">{totalRepos}</p>
          </div>
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
            <p className="text-sm text-[var(--color-text-muted)]">Уязвимостей</p>
            <p className={`mt-1 text-3xl font-semibold tabular-nums ${
              totalVulns > 0 ? 'text-[var(--color-warning)]' : 'text-[var(--color-text)]'
            }`}>{totalVulns}</p>
          </div>
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
            <p className="text-sm text-[var(--color-text-muted)]">Критических репо</p>
            <p className={`mt-1 text-3xl font-semibold tabular-nums ${
              criticalRepos > 0 ? 'text-[var(--color-error)]' : 'text-[var(--color-text)]'
            }`}>{criticalRepos}</p>
          </div>
        </div>

        {/* Repo list */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-[var(--color-text)]">Репозитории</h2>
          <Link
            href="/repositories/add"
            className="rounded-lg bg-[var(--color-primary)] text-white px-4 py-2 text-sm font-medium hover:bg-[var(--color-primary-hover)] transition-colors"
          >
            + Добавить
          </Link>
        </div>

        {totalRepos === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--color-border)] p-12 text-center">
            <p className="text-[var(--color-text-muted)] mb-4">Нет репозиториев</p>
            <Link
              href="/repositories/add"
              className="text-sm text-[var(--color-primary)] hover:underline"
            >
              Добавить первый репозиторий →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {repos?.map(repo => {
              const scan = scanByRepo.get(repo.id)
              const critical = scan?.critical_count ?? 0
              const totalVulnsRepo = scan?.vulnerable_deps ?? 0
              const isRunning = scan?.status === 'pending' || repo.last_scan_status === 'pending'

              return (
                <Link
                  key={repo.id}
                  href={`/repositories/${repo.id}`}
                  className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 hover:bg-[var(--color-surface-2)] transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-[var(--color-text)]">{repo.full_name}</p>
                      {repo.is_private && (
                        <span className="rounded px-1.5 py-0.5 text-[10px] bg-[var(--color-surface-offset)] text-[var(--color-text-muted)]">private</span>
                      )}
                      {repo.language && (
                        <span className="rounded px-1.5 py-0.5 text-[10px] bg-[var(--color-surface-offset)] text-[var(--color-text-muted)]">{repo.language}</span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                      {isRunning
                        ? '⏳ Сканирование...'
                        : repo.last_scan_at
                          ? `Последний скан: ${formatDistanceToNow(new Date(repo.last_scan_at), { addSuffix: true, locale: ru })}`
                          : 'Ещё не сканировался'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {critical > 0 && (
                      <span className="rounded-full bg-[var(--color-error-highlight)] text-[var(--color-error)] px-2.5 py-0.5 text-xs font-medium">
                        {critical} крит.
                      </span>
                    )}
                    {totalVulnsRepo > 0 ? (
                      <span className="rounded-full bg-[var(--color-surface-offset)] text-[var(--color-text-muted)] px-2.5 py-0.5 text-xs">
                        {totalVulnsRepo} уязв.
                      </span>
                    ) : scan ? (
                      <span className="rounded-full bg-[var(--color-success-highlight)] text-[var(--color-success)] px-2.5 py-0.5 text-xs">
                        Чисто ✓
                      </span>
                    ) : null}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--color-text-faint)]">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
