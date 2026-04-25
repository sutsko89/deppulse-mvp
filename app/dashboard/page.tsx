import { getAuthUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'

export default async function DashboardPage() {
  const user = await getAuthUser()
  const supabase = await createClient()

  // Fetch user's repositories with latest scan info
  const { data: repos } = await supabase
    .from('repositories')
    .select(`
      id,
      full_name,
      last_scan_at,
      vulnerability_scans (
        id,
        status,
        vulnerabilities_count,
        critical_count,
        high_count,
        scanned_at
      )
    `)
    .eq('user_id', user.id)
    .order('last_scan_at', { ascending: false })

  // Aggregate stats
  const totalRepos = repos?.length ?? 0
  const totalVulns = repos?.reduce((acc, r) => {
    const latestScan = r.vulnerability_scans?.[0]
    return acc + (latestScan?.vulnerabilities_count ?? 0)
  }, 0) ?? 0
  const criticalRepos = repos?.filter(r => (r.vulnerability_scans?.[0]?.critical_count ?? 0) > 0).length ?? 0

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
              <button type="submit" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">
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
            <p className="mt-1 text-3xl font-semibold tabular-nums text-[var(--color-text)]">{totalVulns}</p>
          </div>
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
            <p className="text-sm text-[var(--color-text-muted)]">Критических репо</p>
            <p className={`mt-1 text-3xl font-semibold tabular-nums ${
              criticalRepos > 0 ? 'text-[var(--color-error)]' : 'text-[var(--color-text)]'
            }`}>{criticalRepos}</p>
          </div>
        </div>

        {/* Repos list */}
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
              const latestScan = repo.vulnerability_scans?.[0]
              const critical = latestScan?.critical_count ?? 0
              const high = latestScan?.vulnerabilities_count
                ? (latestScan.vulnerabilities_count - critical)
                : 0

              return (
                <Link
                  key={repo.id}
                  href={`/repositories/${repo.id}`}
                  className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 hover:bg-[var(--color-surface-2)] transition-colors"
                >
                  <div>
                    <p className="font-medium text-[var(--color-text)]">{repo.full_name}</p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                      {repo.last_scan_at
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
                    {latestScan?.vulnerabilities_count ? (
                      <span className="rounded-full bg-[var(--color-surface-offset)] text-[var(--color-text-muted)] px-2.5 py-0.5 text-xs">
                        {latestScan.vulnerabilities_count} уязв.
                      </span>
                    ) : (
                      <span className="rounded-full bg-[var(--color-success-highlight)] text-[var(--color-success)] px-2.5 py-0.5 text-xs">
                        Чисто
                      </span>
                    )}
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
