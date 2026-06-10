import Link from 'next/link'
import Image from 'next/image'
import type { Lifehack } from '@/types'
import { TAG_COLORS, DEFAULT_TAG_COLOR } from '@/lib/constants'

interface LifehackCardProps {
  lifehack: Lifehack
  ogpImageUrl?: string | null
}

function truncate(text: string, len = 30) {
  return text.length > len ? text.slice(0, len) + '…' : text
}

const CATEGORY_THUMB: Record<string, string> = {
  food:         'from-red-100 via-amber-50 to-orange-100',
  costume_make: 'from-indigo-100 via-blue-50 to-slate-100',
  other:        'from-amber-100 via-yellow-50 to-stone-100',
}

const CATEGORY_ACCENT: Record<string, string> = {
  food:         'from-red-600 to-red-800',
  costume_make: 'from-indigo-700 to-blue-900',
  other:        'from-amber-500 to-amber-700',
}

export default function LifehackCard({ lifehack, ogpImageUrl }: LifehackCardProps) {
  const thumbnail = lifehack.photo || ogpImageUrl || null
  const displayTitle = lifehack.title || truncate(lifehack.description, 30)
  const thumbGrad = CATEGORY_THUMB[lifehack.category] ?? 'from-gray-100 to-gray-50'
  const accentGrad = CATEGORY_ACCENT[lifehack.category] ?? 'from-gray-400 to-gray-300'

  return (
    <Link
      href={`/lifehack/${lifehack.id}`}
      className="block glass-card rounded-2xl hover:-translate-y-1 active:scale-[0.98] transition-transform duration-200 overflow-hidden"
    >
      {/* カテゴリアクセントバー */}
      <div className={`h-1 w-full bg-gradient-to-r ${accentGrad}`} />

      {/* サムネイル */}
      <div className="relative w-full h-36 overflow-hidden">
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={displayTitle}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${thumbGrad} flex items-center justify-center`}>
            <span className="text-5xl opacity-50">
              {lifehack.category === 'food' ? '🥢' :
               lifehack.category === 'costume_make' ? '👘' : '📦'}
            </span>
          </div>
        )}
      </div>

      {/* コンテンツ */}
      <div className="p-3">
        <h3 className="font-wa font-semibold text-[var(--foreground)] text-sm leading-snug mb-1 line-clamp-2">
          {displayTitle}
        </h3>
        {lifehack.author && (
          <p className="text-xs text-[var(--muted)] mb-2">by {lifehack.author}</p>
        )}

        {/* タグ */}
        <div className="flex flex-wrap gap-1 mb-2">
          {lifehack.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className={`text-[10px] text-white px-1.5 py-0.5 rounded-full font-medium ${TAG_COLORS[tag] || DEFAULT_TAG_COLOR}`}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* お気に入り数 */}
        <div className="flex items-center gap-1 text-xs mt-1">
          <span className={(lifehack.favorite_count ?? 0) > 0 ? 'text-[var(--primary)]' : 'text-[#C9BFB0]'}>
            ♥
          </span>
          <span className={(lifehack.favorite_count ?? 0) > 0 ? 'font-semibold text-[var(--primary)]' : 'text-[#C9BFB0]'}>
            {lifehack.favorite_count ?? 0}
          </span>
        </div>
      </div>
    </Link>
  )
}
