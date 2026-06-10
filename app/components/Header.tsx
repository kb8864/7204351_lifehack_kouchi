import Link from 'next/link'

export default function Header() {
  return (
    <header className="glass-card border-b border-white/60 sticky top-0 z-50 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🎆</span>
          <span className="font-bold text-[#E85A2C] text-lg leading-tight">
            七福ライフハック
          </span>
        </Link>
      </div>
    </header>
  )
}
