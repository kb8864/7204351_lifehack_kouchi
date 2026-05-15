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

export default function LifehackCard({ lifehack, ogpImageUrl }: LifehackCardProps) {
  const thumbnail = lifehack.photo || ogpImageUrl || null
  const displayTitle = lifehack.title || truncate(lifehack.description, 30)

  return (
    <Link
      href={`/lifehack/${lifehack.id}`}
      className="block bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-[#E5E5EA]"
    >
      {/* サムネイル */}
      <div className="relative w-full h-36 bg-[#F7F7F5] flex items-center justify-center overflow-hidden">
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={displayTitle}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <span className="text-4xl opacity-30">
            {lifehack.category === 'food' ? '🥢' :
             lifehack.category === 'health' ? '💪' :
             lifehack.category === 'costume_make' ? '👘' : '📦'}
          </span>
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
              className={`text-[10px] text-white px-1.5 py-0.5 rounded-full ${TAG_COLORS[tag] || DEFAULT_TAG_COLOR}`}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* お気に入り数 */}
        {typeof lifehack.favorite_count === 'number' && (
          <div className="flex items-center gap-1 text-xs text-[#8E8E93]">
            <span>❤️</span>
            <span>{lifehack.favorite_count}</span>
          </div>
        )}
      </div>
    </Link>
  )
}
