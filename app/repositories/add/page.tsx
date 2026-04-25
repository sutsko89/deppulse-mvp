'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AddRepositoryPage() {
  const router = useRouter()
  const [repoName, setRepoName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/repositories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: repoName.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Ошибка при добавлении')
        return
      }

      router.push('/dashboard')
    } catch {
      setError('Сетевая ошибка')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] px-4">
      <div className="w-full max-w-md">
        <h1 className="text-xl font-semibold text-[var(--color-text)] mb-6">Добавить репозиторий</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-[var(--color-text-muted)] mb-1.5" htmlFor="repo">
              Репозиторий (owner/repo)
            </label>
            <input
              id="repo"
              type="text"
              value={repoName}
              onChange={e => setRepoName(e.target.value)}
              placeholder="facebook/react"
              required
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
            />
          </div>

          {error && (
            <p className="text-sm text-[var(--color-error)]">{error}</p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 rounded-lg border border-[var(--color-border)] px-4 py-2.5 text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading || !repoName.trim()}
              className="flex-1 rounded-lg bg-[var(--color-primary)] text-white px-4 py-2.5 text-sm font-medium hover:bg-[var(--color-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Добавление...' : 'Добавить'}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
