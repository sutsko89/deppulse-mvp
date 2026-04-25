'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ScanButtonProps {
  repositoryId: string
  repoFullName: string
  isScanning: boolean
}

export default function ScanButton({ repositoryId, repoFullName, isScanning: initialScanning }: ScanButtonProps) {
  const [isScanning, setIsScanning] = useState(initialScanning)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleScan() {
    setIsScanning(true)
    setError(null)
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repositoryId,
          repoFullName,
          createIssue: true,
          minSeverity: 'high',
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error ?? 'Ошибка сканирования')
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setIsScanning(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleScan}
        disabled={isScanning}
        className="rounded-lg bg-[var(--color-primary)] text-white px-4 py-2 text-sm font-medium hover:bg-[var(--color-primary-hover)] disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
      >
        {isScanning ? (
          <>
            <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
            Сканирование...
          </>
        ) : (
          'Запустить скан'
        )}
      </button>
      {error && (
        <p className="text-xs text-[var(--color-error)]">{error}</p>
      )}
    </div>
  )
}
