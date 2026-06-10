import type { Metadata, Viewport } from 'next'
import './globals.css'
import Header from '@/components/Header'
import BottomNav from '@/components/BottomNav'

export const metadata: Metadata = {
  title: '七福よさこい連祝禧',
  description: '七福よさこい連祝禧の夏のライフハックをまとめて検索できるアプリです',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" className="h-full">
      <body className="min-h-full flex flex-col">
        {/* グラスモーフィズム用 背景装飾オーブ（固定） */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="bg-orb-orange absolute -top-40 -right-32 w-[480px] h-[480px] rounded-full" />
          <div className="bg-orb-amber absolute bottom-10 -left-24 w-[380px] h-[380px] rounded-full" />
          <div className="bg-orb-rose absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full" />
        </div>
        <Header />
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
        <BottomNav />
      </body>
    </html>
  )
}
