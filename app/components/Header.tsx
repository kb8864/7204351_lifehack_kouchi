import Link from 'next/link'

export default function Header() {
  return (
    <header className="glass-card border-b border-[var(--border)] sticky top-0 z-50 shadow-sm">
      {/* のれん風の朱色帯 */}
      <div className="noren-bar h-1.5 w-full" />
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center">
        <Link href="/" className="flex items-center gap-2.5">
          {/* 家紋風の丸に提灯 */}
          <span className="kamon w-9 h-9 flex items-center justify-center bg-[var(--primary-light)] text-lg leading-none">
            🏮
          </span>
          <span className="font-wa font-extrabold text-[var(--primary)] text-lg leading-tight tracking-wide">
            七福ライフハック
          </span>
        </Link>
      </div>
    </header>
  )
}
