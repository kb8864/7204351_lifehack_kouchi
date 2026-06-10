export const revalidate = 60

import Link from 'next/link'
import Image from 'next/image'
import { createServerClient } from '@/lib/supabase'
import { getLifehacksByCategory, getHiddenJsonIds, getAllLifehacks, getLifehackByDisplayId } from '@/lib/data'
import { CATEGORIES } from '@/lib/constants'
import type { Category, Lifehack } from '@/types'
import HomeSearch from '@/components/HomeSearch'

async function getWeeklyRanking(): Promise<Lifehack[]> {
  try {
    const supabase = createServerClient()
    const { data: ranking } = await supabase
      .from('weekly_ranking')
      .select('lifehack_id, view_count')
      .limit(3)

    if (!ranking || ranking.length === 0) return []

    const lifehacks = (
      await Promise.all(ranking.map((r: { lifehack_id: number }) => getLifehackByDisplayId(r.lifehack_id)))
    ).filter((lh): lh is Lifehack => lh !== null)

    return lifehacks
  } catch {
    return []
  }
}

async function getLiveCategoryCounts(): Promise<Record<Category, number>> {
  const supabase = createServerClient()
  const [hiddenIds, { data: supabaseCounts }] = await Promise.all([
    getHiddenJsonIds(),
    supabase
      .from('lifehacks')
      .select('category')
      .eq('is_approved', true)
      .eq('is_deleted', false),
  ])

  const counts: Record<Category, number> = { food: 0, costume_make: 0, other: 0 }
  for (const cat of ['food', 'costume_make', 'other'] as Category[]) {
    const jsonCount = getLifehacksByCategory(cat).filter((lh) => !hiddenIds.has(lh.id)).length
    const supabaseCount = (supabaseCounts ?? []).filter((r) => r.category === cat).length
    counts[cat] = jsonCount + supabaseCount
  }
  return counts
}

export default async function HomePage() {
  const [counts, rankingLifehacks] = await Promise.all([
    getLiveCategoryCounts(),
    getWeeklyRanking(),
  ])

  const allLifehacks = getAllLifehacks()
  const searchLifehacks = allLifehacks.map((lh) => ({
    id: lh.id,
    title: lh.title,
    description: lh.description,
    tags: lh.tags,
    category: lh.category,
  }))
  const tagFreq: Record<string, number> = {}
  allLifehacks.forEach((lh) => lh.tags.forEach((t) => { tagFreq[t] = (tagFreq[t] ?? 0) + 1 }))
  const popularTags = Object.entries(tagFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([tag]) => tag)

  const RANK_MEDALS = ['🥇', '🥈', '🥉']

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-8">
      {/* ヒーロー */}
      <div className="text-center py-6">
        <p className="text-[#8E8E93] text-sm tracking-wide mb-2">
          今年最高に楽しい夏を過ごすあなたへ
        </p>
        <h2 className="text-3xl font-black leading-tight mb-1"
          style={{ background: 'linear-gradient(135deg, #E85A2C 0%, #FF8C42 50%, #FFB347 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          夏のライフハック集
        </h2>
        <p className="text-2xl">🍉🌻</p>
      </div>

      {/* インライン検索（画面遷移なし） */}
      <HomeSearch lifehacks={searchLifehacks} popularTags={popularTags} />

      {/* カテゴリカード */}
      <section>
        <h3 className="font-bold text-[#1C1C1E] mb-3 text-base">カテゴリから探す</h3>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {(Object.entries(CATEGORIES) as [Category, (typeof CATEGORIES)[Category]][]).map(
            ([slug, info]) => (
              <Link
                key={slug}
                href={`/${slug}`}
                className="bg-white rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-200 active:scale-[0.98] shrink-0 w-48 shadow-sm"
              >
                <div className="relative">
                  <Image
                    src={info.image}
                    alt={info.label}
                    width={400}
                    height={400}
                    className="w-full h-auto"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                </div>
                <div className="px-3 py-2.5">
                  <div className={`font-bold text-sm ${info.color}`}>{info.icon} {info.label}</div>
                  <div className="text-xs text-[#8E8E93] mt-0.5">{counts[slug]}件のハック</div>
                </div>
              </Link>
            )
          )}
        </div>
      </section>

      {/* 週間ランキング */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-[#1C1C1E] text-base">🏆 アクセス数の多いライフハック</h3>
          <Link href="/ranking" className="text-sm font-medium"
            style={{ color: '#E85A2C' }}>
            もっと見る →
          </Link>
        </div>
        {rankingLifehacks.length === 0 ? (
          <p className="text-sm text-[#8E8E93] text-center py-4">まだデータがありません</p>
        ) : (
          <div className="space-y-2">
            {rankingLifehacks.map((lh, i) => (
              <Link
                key={lh.id}
                href={`/lifehack/${lh.id}`}
                className="flex items-center gap-3 glass-card rounded-2xl p-3.5 hover:shadow-md transition-all duration-200 active:scale-[0.99]"
              >
                <span className="text-2xl w-8 text-center flex-shrink-0">{RANK_MEDALS[i] ?? i + 1}</span>
                <span className="text-sm font-medium text-[#1C1C1E] flex-1 line-clamp-1">
                  {lh.title || lh.description.slice(0, 30) + '…'}
                </span>
                <span className="text-base">{CATEGORIES[lh.category]?.icon}</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
