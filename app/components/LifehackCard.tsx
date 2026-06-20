'use client'

import { ViewTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, useReducedMotion } from 'motion/react'
import type { Lifehack } from '@/types'
import { TAG_COLORS, DEFAULT_TAG_COLOR, CATEGORIES } from '@/lib/constants'
import { cardRise, cardRiseReduced, springPop } from '@/lib/motion'
import { useRipple } from '@/components/motion/Ripple'

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
  practice:     'from-teal-100 via-cyan-50 to-emerald-100',
  festival:     'from-rose-100 via-pink-50 to-orange-100',
}

const CATEGORY_ACCENT: Record<string, string> = {
  food:         'from-red-600 to-red-800',
  costume_make: 'from-indigo-700 to-blue-900',
  other:        'from-amber-500 to-amber-700',
  practice:     'from-teal-600 to-teal-800',
  festival:     'from-rose-500 to-rose-700',
}

const MotionLink = motion.create(Link)

export default function LifehackCard({ lifehack, ogpImageUrl }: LifehackCardProps) {
  const reduce = useReducedMotion()
  const { onPointerDown, rippleLayer } = useRipple()
  const thumbnail = lifehack.photo || ogpImageUrl || null
  const displayTitle = lifehack.title || truncate(lifehack.description, 30)
  const thumbGrad = CATEGORY_THUMB[lifehack.category] ?? 'from-gray-100 to-gray-50'
  const accentGrad = CATEGORY_ACCENT[lifehack.category] ?? 'from-gray-400 to-gray-300'

  return (
    <MotionLink
      href={`/lifehack/${lifehack.id}`}
      className="group block glass-card rounded-2xl overflow-hidden"
      variants={reduce ? cardRiseReduced : cardRise}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.15 }}
      whileHover={reduce ? undefined : { y: -6, rotate: -0.6, transition: springPop }}
      whileTap={reduce ? undefined : { scale: 0.97 }}
      onPointerDown={onPointerDown}
      style={{ willChange: 'transform' }}
    >
      {/* タップ位置から広がる朱の波紋（カードは overflow-hidden でクリップ） */}
      {rippleLayer}

      {/* カテゴリアクセントバー（祭りシャインのスイープを重ねる） */}
      <div className={`relative h-1 w-full bg-gradient-to-r ${accentGrad} overflow-hidden`}>
        {!reduce && (
          <span className="festival-shine pointer-events-none absolute inset-0" />
        )}
      </div>

      {/* サムネイル（詳細ヒーローへの共有要素モーフ用に view-transition-name を付与） */}
      <div className="relative w-full h-36 overflow-hidden">
        <ViewTransition name={`lh-thumb-${lifehack.id}`}>
          {thumbnail ? (
            <Image
              src={thumbnail}
              alt={displayTitle}
              fill
              className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
              unoptimized
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${thumbGrad} flex items-center justify-center transition-transform duration-300 ease-out group-hover:scale-105`}>
              <span className="text-5xl opacity-50">{CATEGORIES[lifehack.category]?.icon ?? '📦'}</span>
            </div>
          )}
        </ViewTransition>
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
    </MotionLink>
  )
}
