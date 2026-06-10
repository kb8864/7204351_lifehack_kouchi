import type { Metadata, Viewport } from 'next'
import { Noto_Sans_JP, Shippori_Mincho_B1 } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'
import BottomNav from '@/components/BottomNav'
import UidSync from '@/components/UidSync'
import ScrollReset from '@/components/ScrollReset'

// 本文フォント（self-host / render-blocking 解消）
const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
  variable: '--font-noto-sans-jp',
})

// 和風見出しフォント
const shippori = Shippori_Mincho_B1({
  subsets: ['latin'],
  weight: ['600', '800'],
  display: 'swap',
  variable: '--font-shippori',
})

export const metadata: Metadata = {
  title: '七福よさこい連祝禧',
  description: '七福よさこい連祝禧の夏のライフハックをまとめて検索できるアプリです',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#C73E3A',
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" className={`h-full ${notoSansJP.variable} ${shippori.variable}`}>
      <body className="h-dvh overflow-hidden flex flex-col">
        <UidSync />
        <Header />
        <main id="main-scroll" className="flex-1 overflow-y-auto pb-4">
          <ScrollReset />
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  )
}
