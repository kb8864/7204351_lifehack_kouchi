import { Suspense } from 'react'
import Link from 'next/link'
import { searchLifehacks, getAllSupabaseLifehacks, getHiddenJsonIds } from '@/lib/data'
import { getOgpImageMap } from '@/lib/ogp'
import { getFavoriteCounts } from '@/lib/favorites'
import { CATEGORIES, TAG_COLORS, DEFAULT_TAG_COLOR } from '@/lib/constants'
import type { Category, Lifehack } from '@/types'
import LifehackCard from '@/components/LifehackCard'
import SearchInput from '@/components/SearchInput'

interface Props {
  searchParams: Promise<{ q?: string; category?: string }>
}

async function search(query: string, category: string): Promise<Lifehack[]> {
  if (!query && !category) return []
  const [hiddenIds, supabaseAll] = await Promise.all([
    getHiddenJsonIds(),
    getAllSupabaseLifehacks(),
  ])
  const jsonResults = searchLifehacks(query, (category as Category) || undefined)
    .filter((lh) => !hiddenIds.has(lh.id))
  const q = query.toLowerCase()
  const cat = category as Category | undefined
  const supabaseFiltered = supabaseAll.filter((lh) => {
    if (cat && lh.category !== cat) return false
    if (!query) return true
    return (
      lh.description.toLowerCase().includes(q) ||
      lh.title?.toLowerCase().includes(q) ||
      lh.tags.some((t) => t.toLowerCase().includes(q))
    )
  })

  const results = [...jsonResults, ...supabaseFiltered]

  // お気に入り数をオーバーレイ（失敗しても表示は継続）
  const countMap = await getFavoriteCounts(results.map((lh) => lh.id))
  return results.map((lh) => ({ ...lh, favorite_count: countMap[lh.id] ?? 0 }))
}

export default async function SearchPage({ searchParams }: Props) {
  const { q = '', category = '' } = await searchParams
  const results = await search(q, category)
  const ogpMap = await getOgpImageMap(results)

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
      <h1 className="font-wa text-xl font-bold text-[var(--foreground)]">🔍 ライフハックを検索</h1>

      <Suspense>
        <SearchInput defaultValue={q} defaultCategory={category} />
      </Suspense>

      {/* カテゴリ絞り込み */}
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/search${q ? `?q=${q}` : ''}`}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            !category
              ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
              : 'bg-[var(--card)] border-[var(--border)] text-[var(--muted)]'
          }`}
        >
          すべて
        </Link>
        {(Object.entries(CATEGORIES) as [Category, (typeof CATEGORIES)[Category]][]).map(
          ([slug, info]) => (
            <Link
              key={slug}
              href={`/search?${q ? `q=${q}&` : ''}category=${slug}`}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                category === slug
                  ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                  : 'bg-[var(--card)] border-[var(--border)] text-[var(--muted)]'
              }`}
            >
              {info.icon} {info.label}
            </Link>
          )
        )}
      </div>

      {/* 検索結果 */}
      {!q && !category ? (
        <div className="text-center py-16 text-[var(--muted)]">
          <div className="text-4xl mb-3">💡</div>
          <p>キーワードを入力してライフハックを探しましょう</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {['熱中症対策', '食事', 'メイク', 'おすすめグッズ'].map((keyword) => (
              <Link
                key={keyword}
                href={`/search?q=${keyword}`}
                className={`text-xs text-white px-2 py-1 rounded-full ${TAG_COLORS[keyword] || DEFAULT_TAG_COLOR}`}
              >
                {keyword}
              </Link>
            ))}
          </div>
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-16 text-[var(--muted)]">
          <div className="text-4xl mb-3">😢</div>
          <p>「{q}」に一致するライフハックが見つかりませんでした</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-[var(--muted)]">{results.length}件見つかりました</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {results.map((lh) => (
              <LifehackCard key={lh.id} lifehack={lh} ogpImageUrl={ogpMap[lh.id] ?? null} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
