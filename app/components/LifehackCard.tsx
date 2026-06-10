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
  food:         'from-orange-200 via-amber-100 to-red-100',
  costume_make: 'from-pink-200 via-rose-100 to-fuchsia-100',
  other:        'from-purple-200 via-violet-100 to-indigo-100',
}

const CATEGORY_ACCENT: Record<string, string> = {
  food:         'from-orange-400 to-red-400',
  costume_make: 'from-pink-400 to-fuchsia-400',
  other:        'from-violet-400 to-indigo-400',
}

export default function LifehackCard({ lifehack, ogpImageUrl }: LifehackCardProps) {
  const thumbnail = lifehack.photo || ogpImageUrl || null
  const displayTitle = lifehack.title || truncate(lifehack.description, 30)
  const thumbGrad = CATEGORY_THUMB[lifehack.category] ?? 'from-gray-100 to-gray-50'
  const accentGrad = CATEGORY_ACCENT[lifehack.category] ?? 'from-gray-400 to-gray-300'

  return (
    <Link
      href={`/lifehack/${lifehack.id}`}
      className="block glass-card rounded-2xl hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] transition-all duration-200 overflow-hidden"
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
        <h3 className="font-semibold text-[#1C1C1E] text-sm leading-snug mb-1 line-clamp-2">
          {displayTitle}
        </h3>
        {lifehack.author && (
          <p className="text-xs text-[#8E8E93] mb-2">by {lifehack.author}</p>
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
          <span className={(lifehack.favorite_count ?? 0) > 0 ? 'text-red-400' : 'text-[#C7C7CC]'}>
            ♥
          </span>
          <span className={(lifehack.favorite_count ?? 0) > 0 ? 'font-semibold text-red-400' : 'text-[#C7C7CC]'}>
            {lifehack.favorite_count ?? 0}
          </span>
        </div>
      </div>
    </Link>
  )
}
