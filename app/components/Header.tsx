import Link from 'next/link'
import Image from 'next/image'
import type { SessionUser } from '@/types'

interface HeaderProps {
  session: SessionUser | null
}

export default function Header({ session }: HeaderProps) {
  return (
    <header className="bg-white border-b border-[#E5E5EA] sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* ロゴ */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🎆</span>
          <span className="font-bold text-[#E85A2C] text-lg leading-tight">
            七福<br className="hidden" />ライフハック
          </span>
        </Link>

        {/* 右側: ユーザー情報 or ログインボタン */}
        <div className="flex items-center gap-3">
          {session ? (
            <div className="flex items-center gap-2">
              {session.pictureUrl && (
                <Image
                  src={session.pictureUrl}
                  alt={session.displayName ?? 'ユーザー'}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              )}
              <span className="text-sm text-[#1C1C1E] hidden sm:block max-w-[120px] truncate">
                {session.displayName}
              </span>
                  {/* <Link
                href="/favorites"
                className="flex items-center gap-1 text-sm text-[#8E8E93] hover:text-red-500 transition-colors px-1"
                title="お気に入り"
              >
                <span className="text-base">❤️</span>
                <span className="text-xs font-medium hidden sm:inline">お気に入り</span>
              </Link> */}
              {session.isAdmin && (
                <Link
                  href="/admin"
                  className="text-xs bg-[#E85A2C] text-white px-2 py-1 rounded-full"
                >
                  管理
                </Link>
              )}
              <form action="/api/auth/logout" method="POST">
                <button
                  type="submit"
                  className="text-sm text-[#8E8E93] hover:text-[#1C1C1E] transition-colors"
                >
                  ログアウト
                </button>
              </form>
            </div>
          ) : (
            <a
              href="/api/auth/line"
              className="flex items-center gap-1.5 bg-[#06C755] text-white text-sm font-semibold px-3 py-1.5 rounded-full hover:bg-[#05b04c] transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.349 0 .631.285.631.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
              </svg>
              LINEでログイン
            </a>
          )}
        </div>
      </div>
    </header>
  )
}
