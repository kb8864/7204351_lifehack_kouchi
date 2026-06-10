export const revalidate = 600

import Link from 'next/link'
import { createServerClient } from '@/lib/supabase'
import { getLifehackByDisplayId } from '@/lib/data'
import { CATEGORIES } from '@/lib/constants'
import type { Lifehack } from '@/types'

interface RankingRow {
  lifehack_id: number
  view_count: number
}

async function getWeeklyRanking(): Promise<{ lifehack: Lifehack; viewCount: number }[]> {
  try {
    const supabase = createServerClient()
    const { data: ranking } = await supabase
      .from('weekly_ranking')
      .select('lifehack_id, view_count')
      .limit(5)

    if (!ranking || ranking.length === 0) return []

    const items = await Promise.all(
      (ranking as RankingRow[]).map(async (r) => {
        const lifehack = await getLifehackByDisplayId(r.lifehack_id)
        return lifehack ? { lifehack, viewCount: r.view_count } : null
      })
    )
    return items.filter((item): item is { lifehack: Lifehack; viewCount: number } => item !== null)
  } catch {
    return []
  }
}

const RANK_STYLES = [
  { medal: '🥇', bg: 'bg-amber-50 border-amber-300', numColor: 'text-amber-600' },
  { medal: '🥈', bg: 'bg-stone-50 border-stone-300', numColor: 'text-stone-500' },
  { medal: '🥉', bg: 'bg-orange-50 border-orange-300', numColor: 'text-orange-700' },
  { medal: '', bg: 'bg-[var(--card)] border-[var(--border)]', numColor: 'text-[var(--muted)]' },
  { medal: '', bg: 'bg-[var(--card)] border-[var(--border)]', numColor: 'text-[var(--muted)]' },
]

export default async function RankingPage() {
  const ranking = await getWeeklyRanking()

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <div className="text-center">
        <div className="text-4xl mb-2">🏆</div>
        <h1 className="font-wa text-xl font-bold text-[var(--foreground)]"> アクセス数の多いライフハック</h1>
        <p className="text-sm text-[var(--muted)] mt-1">過去7日間の閲覧数ランキング</p>
      </div>

      {ranking.length === 0 ? (
        <div className="text-center py-16 text-[var(--muted)]">
          <p>まだランキングデータがありません</p>
          <p className="text-sm mt-2">ライフハックを閲覧するとランキングに反映されます</p>
        </div>
      ) : (
        <div className="space-y-3">
          {ranking.map(({ lifehack: lh, viewCount }, i) => {
            const style = RANK_STYLES[i] ?? RANK_STYLES[4]
            const info = CATEGORIES[lh.category]
            return (
              <Link
                key={lh.id}
                href={`/lifehack/${lh.id}`}
                className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-transform duration-200 active:scale-[0.99] ${style.bg}`}
              >
                {/* 順位 */}
                <div className="flex flex-col items-center w-10 shrink-0">
                  {style.medal ? (
                    <span className="text-2xl">{style.medal}</span>
                  ) : (
                    <span className={`text-xl font-bold ${style.numColor}`}>{i + 1}</span>
                  )}
                </div>

                {/* コンテンツ */}
                <div className="flex-1 min-w-0">
                  <p className="font-wa font-semibold text-[var(--foreground)] text-sm line-clamp-2">
                    {lh.title || lh.description.slice(0, 40) + '…'}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs">{info.icon}</span>
                    <span className="text-xs text-[var(--muted)]">{info.label}</span>
                    {lh.author && (
                      <>
                        <span className="text-xs text-[var(--muted)]">·</span>
                        <span className="text-xs text-[var(--muted)]">{lh.author}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* 閲覧数 */}
                <div className="text-right shrink-0">
                  <div className="text-lg font-bold text-[var(--primary)]">{viewCount}</div>
                  <div className="text-xs text-[var(--muted)]">閲覧</div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
