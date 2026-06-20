'use client'

import { useState, useMemo, useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { CATEGORIES, TAG_COLORS, DEFAULT_TAG_COLOR } from '@/lib/constants'
import { buildSearchKey, matchesQuery } from '@/lib/search-text'
import { springBouncy, springPop } from '@/lib/motion'
import RingPulse from '@/components/motion/RingPulse'
import SparkleBurst from '@/components/motion/SparkleBurst'
import LifehackCard from '@/components/LifehackCard'
import type { Category, Lifehack } from '@/types'

interface CategoryBrowserProps {
  category: Category
  lifehacks: Lifehack[]
  ogpMap: Record<number, string | null>
}

export default function CategoryBrowser({
  category,
  lifehacks,
  ogpMap,
}: CategoryBrowserProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const reduce = useReducedMotion()
  const info = CATEGORIES[category]

  const [query, setQuery] = useState(() => searchParams.get('q') ?? '')
  const [activeTag, setActiveTag] = useState(() => searchParams.get('tag') ?? '')

  // 直近にトグルしたチップの識別子＋発火カウンタ（リングパルス/キラ粒子の再発火用）。
  // '' は「すべて」を表す。
  const [burstChip, setBurstChip] = useState<string | null>(null)
  const [burstKey, setBurstKey] = useState(0)

  const fireBurst = (chip: string) => {
    if (reduce) return
    setBurstChip(chip)
    setBurstKey((k) => k + 1)
  }

  // 全件からタグ一覧を生成
  const allTags = useMemo(
    () => [...new Set(lifehacks.flatMap((lh) => lh.tags))],
    [lifehacks]
  )

  // 各ライフハックの検索キーを1回だけ構築
  const searchKeys = useMemo(
    () => lifehacks.map((lh) => buildSearchKey(lh)),
    [lifehacks]
  )

  // フィルタ結果（AND: タグ絞り込み ＋ クエリ検索）
  const filtered = useMemo(() => {
    return lifehacks.filter((lh, i) => {
      if (activeTag && !lh.tags.includes(activeTag)) return false
      if (query && !matchesQuery(searchKeys[i], query)) return false
      return true
    })
  }, [lifehacks, searchKeys, activeTag, query])

  // URL同期: window.history.replaceState でシャロー更新
  // Next.js App Router では pushState/replaceState がサポートされている
  // (公式ドキュメント single-page-applications.md 参照)
  useEffect(() => {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (activeTag) params.set('tag', activeTag)
    const qs = params.toString()
    const url = qs ? `${pathname}?${qs}` : pathname
    window.history.replaceState(null, '', url)
  }, [query, activeTag, pathname])

  return (
    <div className="space-y-4">
      {/* 検索バー */}
      <div className="space-y-3">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] text-sm">🔍</span>
          <input
            type="text"
            value={query}
            placeholder={`${info.label}のライフハックを検索...`}
            className="w-full pl-9 pr-4 py-2.5 border border-[var(--border)] rounded-xl text-sm bg-[var(--card)] focus:outline-none focus:border-[var(--primary)] transition-colors"
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* タグチップ */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <motion.button
              onClick={() => {
                if (activeTag) {
                  setActiveTag('')
                  fireBurst('')
                }
              }}
              whileTap={reduce ? undefined : { scale: 0.9 }}
              animate={reduce ? undefined : { scale: !activeTag ? 1.06 : 1 }}
              transition={springBouncy}
              className={`relative px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                !activeTag
                  ? 'bg-[var(--primary)] text-white shadow-[0_0_10px_rgba(199,62,58,0.45)]'
                  : 'bg-[var(--card)] border border-[var(--border)] text-[var(--muted)] hover:border-[var(--primary)]'
              }`}
            >
              すべて
              {burstChip === '' && (
                <span key={burstKey} className="pointer-events-none absolute inset-0">
                  <RingPulse active color="var(--primary)" />
                  <SparkleBurst active spread={20} colors={['#C73E3A', '#C9A227', '#D9B441']} />
                </span>
              )}
            </motion.button>
            {allTags.map((tag) => {
              const selected = activeTag === tag
              return (
                <motion.button
                  key={tag}
                  onClick={() => {
                    const next = selected ? '' : tag
                    setActiveTag(next)
                    if (next) fireBurst(tag)
                  }}
                  whileTap={reduce ? undefined : { scale: 0.9 }}
                  animate={reduce ? undefined : { scale: selected ? 1.1 : 1 }}
                  transition={springBouncy}
                  className={`relative px-3 py-1.5 rounded-full text-xs font-medium transition-opacity text-white ${
                    selected
                      ? `${TAG_COLORS[tag] || DEFAULT_TAG_COLOR} ring-2 ring-offset-1 ring-current shadow-[0_0_12px_rgba(201,162,39,0.5)]`
                      : `${TAG_COLORS[tag] || DEFAULT_TAG_COLOR} opacity-70 hover:opacity-100`
                  }`}
                >
                  {tag}
                  {burstChip === tag && (
                    <span key={burstKey} className="pointer-events-none absolute inset-0">
                      <RingPulse active color="#C9A227" />
                      <SparkleBurst active spread={22} colors={['#C9A227', '#D9B441', '#FFFFFF']} />
                    </span>
                  )}
                </motion.button>
              )
            })}
          </div>
        )}
      </div>

      {/* ヒット件数（フィルタ中のみ表示） */}
      {(query || activeTag) && (
        <p className="text-sm text-[var(--muted)]">{filtered.length}件ヒット</p>
      )}

      {/* グリッド or 空状態 */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-[var(--muted)]">
          <div className="text-4xl mb-3">🔍</div>
          <p>該当するライフハックが見つかりませんでした</p>
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((lh) => (
              <motion.div
                key={lh.id}
                layout
                exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
                transition={springPop}
              >
                <LifehackCard
                  lifehack={lh}
                  ogpImageUrl={ogpMap[lh.id] ?? null}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  )
}
