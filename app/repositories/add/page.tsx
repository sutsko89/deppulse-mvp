import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AddRepoForm from './AddRepoForm'

export const metadata = { title: 'Add Repository — DepPulse' }

export default async function AddRepositoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Назад к Dashboard
          </a>
          <h1 className="text-2xl font-bold text-gray-900">Добавить репозиторий</h1>
          <p className="mt-2 text-gray-500">
            Укажите публичный репозиторий для сканирования уязвимостей зависимостей
          </p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <AddRepoForm />
        </div>

        {/* Info block */}
        <div className="mt-6 bg-blue-50 border border-blue-100 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-800 mb-2">Что происходит после добавления?</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• DepPulse скачает файлы зависимостей (если публичный репо)</li>
            <li>• Проверяет каждый пакет по базе OSV.dev</li>
            <li>• Создаёт GitHub Issue если найдены Critical/High уязвимости</li>
          </ul>
        </div>
      </div>
    </main>
  )
}
