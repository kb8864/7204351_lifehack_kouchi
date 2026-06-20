export const revalidate = 60

import Link from 'next/link'
import Image from 'next/image'
import { createServerClient } from '@/lib/supabase'
import { getHiddenJsonIds, getAllLifehacks, getAllSupabaseLifehacks, getLifehackByDisplayId, getEffectiveCategoryCounts } from '@/lib/data'
import { getTagOverrides } from '@/lib/overrides'
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

export default async function HomePage() {
  const [counts, rankingLifehacks, hiddenIds, supabaseLifehacks, tagOv] = await Promise.all([
    getEffectiveCategoryCounts(),
    getWeeklyRanking(),
    getHiddenJsonIds(),
    getAllSupabaseLifehacks(),
    getTagOverrides(),
  ])

  // JSON(非表示除外) + Supabase承認済み投稿をマージ
  const jsonLifehacks = getAllLifehacks().filter((lh) => !hiddenIds.has(lh.id))
  const allLifehacks = [...jsonLifehacks, ...supabaseLifehacks].map((lh) => ({
    ...lh,
    tags: tagOv.get(lh.id) ?? lh.tags,
  }))

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
      {/* ヒーロー（祭り提灯） */}
      <div className="text-center py-6">
        <div className="flex items-center justify-center gap-2 mb-3 text-2xl">
          <span>🏮</span>
          <span className="font-wa text-[var(--secondary)] text-sm font-semibold tracking-[0.3em]">七福よさこい連祝禧</span>
          <span>🏮</span>
        </div>
        <p className="text-[var(--muted)] text-sm tracking-wide mb-2">
          今年最高に楽しい夏を過ごすあなたへ
        </p>
        <h2 className="font-wa text-3xl font-extrabold leading-tight mb-2 text-[var(--primary)]">
          夏のライフハック集
        </h2>
        {/* 朱色の帯（のれん風アンダーライン） */}
        <div className="noren-bar h-1 w-20 mx-auto rounded-full mb-2" />
        <p className="text-2xl">🎐🍧🥁</p>
      </div>

      {/* インライン検索（画面遷移なし） */}
      <HomeSearch lifehacks={searchLifehacks} popularTags={popularTags} />

      {/* カテゴリカード */}
      <section>
        <h3 className="font-wa font-bold text-[var(--foreground)] mb-3 text-base">🎴 カテゴリから探す</h3>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {(Object.entries(CATEGORIES) as [Category, (typeof CATEGORIES)[Category]][]).map(
            ([slug, info]) => (
              <Link
                key={slug}
                href={`/${slug}`}
                className="tap-press glass-card rounded-2xl overflow-hidden hover:-translate-y-1 shrink-0 w-48 shadow-sm"
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
                  <div className={`font-wa font-bold text-sm ${info.color}`}>{info.icon} {info.label}</div>
                  <div className="text-xs text-[var(--muted)] mt-0.5">{counts[slug]}件のハック</div>
                </div>
              </Link>
            )
          )}
        </div>
      </section>

      {/* 週間ランキング */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-wa font-bold text-[var(--foreground)] text-base">🏆 アクセス数の多いライフハック</h3>
          <Link href="/ranking" className="text-sm font-medium text-[var(--primary)]">
            もっと見る →
          </Link>
        </div>
        {rankingLifehacks.length === 0 ? (
          <p className="text-sm text-[var(--muted)] text-center py-4">まだデータがありません</p>
        ) : (
          <div className="space-y-2">
            {rankingLifehacks.map((lh, i) => (
              <Link
                key={lh.id}
                href={`/lifehack/${lh.id}`}
                className="flex items-center gap-3 glass-card rounded-2xl p-3.5 transition-transform duration-200 active:scale-[0.99]"
              >
                <span className="text-2xl w-8 text-center flex-shrink-0">{RANK_MEDALS[i] ?? i + 1}</span>
                <span className="text-sm font-medium text-[var(--foreground)] flex-1 line-clamp-1">
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
