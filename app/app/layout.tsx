import type { Metadata, Viewport } from 'next'
import './globals.css'
import Header from '@/components/Header'
import BottomNav from '@/components/BottomNav'
import { getSession } from '@/lib/auth'

export const metadata: Metadata = {
  title: '七福ライフハック | 七福よさこい連祝禧',
  description: '七福よさこい連祝禧の夏のライフハックをまとめて検索できるアプリです',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  return (
    <html lang="ja" className="h-full">
      <body className="min-h-full flex flex-col bg-[#F7F7F5]">
        <Header session={session} />
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
        <BottomNav />
      </body>
    </html>
  )
}
