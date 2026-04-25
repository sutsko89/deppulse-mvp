import { signInWithGitHub } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) redirect('/dashboard')

  const { error } = await searchParams

  async function handleSignIn() {
    'use server'
    await signInWithGitHub('/dashboard')
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
      <div className="w-full max-w-sm px-6">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <svg
            width="48"
            height="48"
            viewBox="0 0 48 48"
            fill="none"
            aria-label="DepPulse"
            className="text-[var(--color-primary)]"
          >
            <rect width="48" height="48" rx="12" fill="currentColor" opacity="0.12" />
            <path
              d="M10 28 L18 16 L24 24 L30 14 L38 28"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <circle cx="24" cy="24" r="3" fill="currentColor" />
          </svg>
          <h1 className="text-2xl font-semibold text-[var(--color-text)] tracking-tight">
            DepPulse
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] text-center">
            Мониторинг уязвимостей зависимостей
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg border border-[var(--color-error)] bg-[var(--color-error-highlight)] px-4 py-3 text-sm text-[var(--color-error)]">
            {error === 'no_code' && 'Авторизация отменена.'}
            {error === 'auth_failed' && 'Ошибка авторизации. Попробуй снова.'}
            {error !== 'no_code' && error !== 'auth_failed' && 'Что-то пошло не так.'}
          </div>
        )}

        {/* Sign in card */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-md)]">
          <p className="mb-5 text-sm text-[var(--color-text-muted)] leading-relaxed">
            Войди через GitHub, чтобы начать сканирование репозиториев на уязвимости.
          </p>
          <form action={handleSignIn}>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2.5 rounded-lg bg-[var(--color-text)] text-[var(--color-text-inverse)] px-4 py-2.5 text-sm font-medium transition-opacity hover:opacity-80 active:opacity-70"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
              Войти через GitHub
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-[var(--color-text-faint)]">
          DepPulse · Защита зависимостей
        </p>
      </div>
    </main>
  )
}
