'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/', icon: '🏠', label: 'ホーム' },
  { href: '/search', icon: '🔍', label: '検索' },
  { href: '/favorites', icon: '❤️', label: 'お気に入り' },
]

const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSeTKTYVSlMzWkB-OCenbM2ehUEOHBc5Zvirw_mUq6czxI8AMA/viewform?usp=dialog'

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="glass-card border-t border-[var(--border)] z-50 md:hidden shadow-[0_-4px_16px_rgba(42,35,32,0.05)] pb-[env(safe-area-inset-bottom)]">
      {/* のれん風の朱色帯 */}
      <div className="noren-bar h-0.5 w-full" />
      <ul className="flex">
        {NAV_ITEMS.map(({ href, icon, label }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={`flex flex-col items-center justify-center py-2 gap-0.5 transition-[color,transform] duration-150 active:scale-90 ${
                  isActive ? 'text-[var(--primary)]' : 'text-[var(--muted)] hover:text-[var(--primary)]'
                }`}
              >
                <span className="text-xl leading-none">{icon}</span>
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            </li>
          )
        })}
        <li className="flex-1">
          <a
            href={FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center py-2 gap-0.5 text-[var(--primary)] transition-transform duration-150 active:scale-90"
          >
            <span className="text-xl leading-none">✏️</span>
            <span className="text-[10px] font-medium">ライフハック追加</span>
          </a>
        </li>
      </ul>
    </nav>
  )
}
