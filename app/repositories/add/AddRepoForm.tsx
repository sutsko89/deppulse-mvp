'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AddRepoForm() {
  const router = useRouter()
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const isValidFormat = /^[\w.-]+\/[\w.-]+$/.test(value.trim())

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValidFormat) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/repositories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: value.trim() }),
      })

      const json = await res.json()

      if (!res.ok) {
        setError(json.error || 'Ошибка при добавлении')
        return
      }

      setSuccess(true)
      setTimeout(() => {
        router.push(`/repositories/${json.repository.id}`)
      }, 800)
    } catch {
      setError('Нет связи с сервером')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" className="text-green-600">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        </div>
        <p className="font-semibold text-gray-900">Репозиторий добавлен!</p>
        <p className="text-sm text-gray-500 mt-1">Переходим...і</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="repo" className="block text-sm font-medium text-gray-700 mb-1.5">
          Название репозитория
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" className="text-gray-400">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22"/>
            </svg>
          </div>
          <input
            id="repo"
            type="text"
            value={value}
            onChange={e => { setValue(e.target.value); setError(null) }}
            placeholder="owner/repository"
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              placeholder:text-gray-400 font-mono"
            disabled={loading}
            autoFocus
            spellCheck={false}
          />
        </div>
        <p className="mt-1.5 text-xs text-gray-400">
          Например: <span className="font-mono">facebook/react</span> или <span className="font-mono">vercel/next.js</span>
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
          </svg>
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-1">
        <a
          href="/dashboard"
          className="flex-1 text-center px-4 py-2.5 text-sm font-medium text-gray-700
            bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Отмена
        </a>
        <button
          type="submit"
          disabled={loading || !isValidFormat}
          className="flex-1 px-4 py-2.5 text-sm font-medium text-white
            bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed
            flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 11-6.219-8.56"/>
              </svg>
              Добавляем...
            </>
          ) : 'Добавить репозиторий'}
        </button>
      </div>
    </form>
  )
}
