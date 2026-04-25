import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'DepPulse — мониторинг уязвимостей',
  description: 'Автоматический мониторинг уязвимостей в зависимостях GitHub репозиториев',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  )
}
