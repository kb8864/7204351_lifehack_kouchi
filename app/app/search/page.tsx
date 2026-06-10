import { Suspense } from 'react'
import Link from 'next/link'
import { searchLifehacks, getAllSupabaseLifehacks, getHiddenJsonIds } from '@/lib/data'
import { getOgpImageMap } from '@/lib/ogp'
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

  return [...jsonResults, ...supabaseFiltered]
}

export default async function SearchPage({ searchParams }: Props) {
  const { q = '', category = '' } = await searchParams
  const results = await search(q, category)
  const ogpMap = await getOgpImageMap(results)

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
      <h1 className="text-xl font-bold text-[#1C1C1E]">🔍 ライフハックを検索</h1>

      <Suspense>
        <SearchInput defaultValue={q} defaultCategory={category} />
      </Suspense>

      {/* カテゴリ絞り込み */}
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/search${q ? `?q=${q}` : ''}`}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
            !category
              ? 'bg-[#E85A2C] text-white border-[#E85A2C]'
              : 'bg-white border-[#E5E5EA] text-[#8E8E93]'
          }`}
        >
          すべて
        </Link>
        {(Object.entries(CATEGORIES) as [Category, (typeof CATEGORIES)[Category]][]).map(
          ([slug, info]) => (
            <Link
              key={slug}
              href={`/search?${q ? `q=${q}&` : ''}category=${slug}`}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                category === slug
                  ? 'bg-[#E85A2C] text-white border-[#E85A2C]'
                  : 'bg-white border-[#E5E5EA] text-[#8E8E93]'
              }`}
            >
              {info.icon} {info.label}
            </Link>
          )
        )}
      </div>

      {/* 検索結果 */}
      {!q && !category ? (
        <div className="text-center py-16 text-[#8E8E93]">
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
        <div className="text-center py-16 text-[#8E8E93]">
          <div className="text-4xl mb-3">😢</div>
          <p>「{q}」に一致するライフハックが見つかりませんでした</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-[#8E8E93]">{results.length}件見つかりました</p>
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
