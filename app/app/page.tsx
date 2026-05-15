import Link from 'next/link'
import { createServerClient } from '@/lib/supabase'
import { CATEGORIES } from '@/lib/constants'
import type { Category, Lifehack } from '@/types'

async function getCategoryCounts(): Promise<Record<Category, number>> {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('lifehacks')
    .select('category')
    .eq('is_approved', true)

  const counts: Record<Category, number> = { food: 0, health: 0, costume_make: 0, other: 0 }
  data?.forEach((row) => {
    if (row.category in counts) counts[row.category as Category]++
  })
  return counts
}

async function getWeeklyRanking(): Promise<Lifehack[]> {
  const supabase = createServerClient()
  const { data: ranking } = await supabase
    .from('weekly_ranking')
    .select('lifehack_id, view_count')
    .limit(3)

  if (!ranking || ranking.length === 0) return []

  const ids = ranking.map((r: { lifehack_id: number }) => r.lifehack_id)
  const { data: lifehacks } = await supabase
    .from('lifehacks')
    .select('*')
    .in('id', ids)
    .eq('is_approved', true)

  return (lifehacks as Lifehack[]) ?? []
}

export default async function HomePage() {
  const [counts, rankingLifehacks] = await Promise.all([
    getCategoryCounts(),
    getWeeklyRanking(),
  ])

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-8">
      {/* ヒーロー */}
      <div className="text-center py-4">
        <p className="text-[#8E8E93] text-sm mb-1">七福よさこい連祝禧</p>
        <h2 className="text-2xl font-bold text-[#1C1C1E] mb-2">
          夏のライフハック集
        </h2>
        <p className="text-[#8E8E93] text-sm">
          高知よさこいを乗り切る、メンバーの知恵をまとめました
        </p>
      </div>

      {/* 全体検索 */}
      <Link
        href="/search"
        className="flex items-center gap-2 bg-white border border-[#E5E5EA] rounded-xl px-4 py-3 text-[#8E8E93] hover:border-[#E85A2C] transition-colors shadow-sm"
      >
        <span>🔍</span>
        <span className="text-sm">ライフハックを検索...</span>
      </Link>

      {/* カテゴリカード */}
      <section>
        <h3 className="font-bold text-[#1C1C1E] mb-3">カテゴリから探す</h3>
        <div className="grid grid-cols-2 gap-3">
          {(Object.entries(CATEGORIES) as [Category, (typeof CATEGORIES)[Category]][]).map(
            ([slug, info]) => (
              <Link
                key={slug}
                href={`/${slug}`}
                className={`${info.bgColor} ${info.borderColor} border-2 rounded-2xl p-4 hover:shadow-md transition-all`}
              >
                <div className="text-3xl mb-2">{info.icon}</div>
                <div className={`font-bold text-base ${info.color}`}>{info.label}</div>
                <div className="text-xs text-[#8E8E93] mt-0.5">
                  {counts[slug]}件のハック
                </div>
              </Link>
            )
          )}
        </div>
      </section>

      {/* 週間ランキング */}
      {rankingLifehacks.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-[#1C1C1E]">🏆 今週のランキング</h3>
            <Link href="/ranking" className="text-sm text-[#E85A2C] font-medium">
              もっと見る →
            </Link>
          </div>
          <div className="space-y-2">
            {rankingLifehacks.map((lh, i) => (
              <Link
                key={lh.id}
                href={`/lifehack/${lh.id}`}
                className="flex items-center gap-3 bg-white rounded-xl p-3 border border-[#E5E5EA] hover:shadow-sm transition-shadow"
              >
                <span
                  className={`text-lg font-bold w-7 text-center ${
                    i === 0 ? 'text-yellow-500' : i === 1 ? 'text-gray-400' : 'text-amber-600'
                  }`}
                >
                  {i + 1}
                </span>
                <span className="text-sm font-medium text-[#1C1C1E] flex-1 line-clamp-1">
                  {lh.title || lh.description.slice(0, 30) + '…'}
                </span>
                <span className="text-xs">{CATEGORIES[lh.category]?.icon}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
