import { unstable_cache } from 'next/cache'
import { createServerClient } from '@/lib/supabase'

export const FAV_COUNTS_TAG = 'fav-counts'

// ids ごとのお気に入り数マップを返す(60秒キャッシュ + タグ無効化対応)
export const getFavoriteCounts = unstable_cache(
  async (ids: number[]): Promise<Record<number, number>> => {
    try {
      const supabase = createServerClient()
      const { data, error } = await supabase
        .from('anonymous_favorites')
        .select('lifehack_id')
        .in('lifehack_id', ids)
      if (error || !data) return {}
      const countMap: Record<number, number> = {}
      data.forEach((row) => {
        countMap[row.lifehack_id] = (countMap[row.lifehack_id] ?? 0) + 1
      })
      return countMap
    } catch {
      return {}
    }
  },
  ['fav-counts'],
  { revalidate: 60, tags: [FAV_COUNTS_TAG] }
)

// uid の anonymous_favorites の lifehack_id セット（キャッシュなし、直接クエリ）
export async function getUserFavoriteSet(uid: string): Promise<Set<number>> {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('anonymous_favorites')
      .select('lifehack_id')
      .eq('uid', uid)
    if (error || !data) return new Set()
    return new Set(data.map((row) => row.lifehack_id as number))
  } catch {
    return new Set()
  }
}
