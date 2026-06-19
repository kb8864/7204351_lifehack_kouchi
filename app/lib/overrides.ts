/**
 * 複数カテゴリ所属・並び順・タグ上書きの取得と適用を集約するサーバー専用ユーティリティ。
 *
 * 上書きは全て Supabase の新テーブルに持つ（JSONは読み取り専用のため）:
 *   - lifehack_placements(display_id, category, position): 配置行。
 *       配置行が1つでもある display_id = 「管理済み」。その行集合が所属カテゴリの正。
 *       配置行が無い = 「未管理」。元の単一カテゴリにデフォルト順で表示。
 *   - lifehack_tag_overrides(display_id, tags): 存在すれば元タグを置き換える。
 *
 * Supabase 未設定・テーブル未作成・取得失敗時は空を返し、アプリは従来通り
 * 単一カテゴリ・元タグで表示される（フォールバック）。
 */

import { unstable_cache, revalidateTag, revalidatePath } from 'next/cache'
import type { Category, Lifehack } from '@/types'
import { CATEGORY_SLUGS } from '@/lib/constants'

export const OVERRIDES_TAG = 'lifehack-overrides'

/**
 * 上書き変更後の再検証。配置/タグの上書きキャッシュ・ホーム・全カテゴリ一覧、
 * （指定があれば）詳細ページを無効化する。管理APIから呼ぶ。
 */
export function revalidateOverrides(displayId?: number) {
  revalidateTag(OVERRIDES_TAG, 'max')
  revalidatePath('/')
  for (const c of CATEGORY_SLUGS) revalidatePath(`/${c}`)
  if (displayId != null) revalidatePath(`/lifehack/${displayId}`)
}

export interface PlacementsResult {
  /** カテゴリ -> そのカテゴリの配置行（position昇順、同値はdisplay_id昇順） */
  byCategory: Map<string, { display_id: number; position: number }[]>
  /** 配置行を1つでも持つ display_id（=管理済み） */
  managedIds: Set<number>
  /** display_id -> 所属カテゴリ一覧 */
  byDisplayId: Map<number, string[]>
}

const getCachedPlacements = unstable_cache(
  async (): Promise<{ display_id: number; category: string; position: number }[]> => {
    try {
      const { createServerClient } = await import('@/lib/supabase')
      const supabase = createServerClient()
      const { data, error } = await supabase
        .from('lifehack_placements')
        .select('display_id, category, position')
      if (error || !data) return []
      return data as { display_id: number; category: string; position: number }[]
    } catch {
      return []
    }
  },
  ['lifehack-placements'],
  { tags: [OVERRIDES_TAG], revalidate: 30 }
)

/** 全placementを取得して索引化する。失敗時は全て空。 */
export async function getPlacements(): Promise<PlacementsResult> {
  const rows = await getCachedPlacements()

  const byCategory = new Map<string, { display_id: number; position: number }[]>()
  const managedIds = new Set<number>()
  const byDisplayId = new Map<number, string[]>()

  for (const row of rows) {
    managedIds.add(row.display_id)

    const list = byCategory.get(row.category) ?? []
    list.push({ display_id: row.display_id, position: row.position })
    byCategory.set(row.category, list)

    const cats = byDisplayId.get(row.display_id) ?? []
    cats.push(row.category)
    byDisplayId.set(row.display_id, cats)
  }

  // position昇順、同値はdisplay_id昇順で安定化
  for (const list of byCategory.values()) {
    list.sort((a, b) => a.position - b.position || a.display_id - b.display_id)
  }

  return { byCategory, managedIds, byDisplayId }
}

const getCachedTagOverrides = unstable_cache(
  async (): Promise<{ display_id: number; tags: string[] }[]> => {
    try {
      const { createServerClient } = await import('@/lib/supabase')
      const supabase = createServerClient()
      const { data, error } = await supabase
        .from('lifehack_tag_overrides')
        .select('display_id, tags')
      if (error || !data) return []
      return data as { display_id: number; tags: string[] }[]
    } catch {
      return []
    }
  },
  ['lifehack-tag-overrides'],
  { tags: [OVERRIDES_TAG], revalidate: 30 }
)

/** 全タグ上書きを取得。display_id -> tags の Map。失敗時は空。 */
export async function getTagOverrides(): Promise<Map<number, string[]>> {
  const rows = await getCachedTagOverrides()
  const map = new Map<number, string[]>()
  for (const row of rows) {
    map.set(row.display_id, row.tags ?? [])
  }
  return map
}

/**
 * 単一のライフハックにタグ上書きと所属カテゴリを適用したコピーを返す。
 * `.category`（基調色）は元のまま。`.tags` と `.categories` を埋める。
 * 詳細ページ・検索で使う。
 */
export function applyOverridesToOne(
  lh: Lifehack,
  placements: PlacementsResult,
  tagOv: Map<number, string[]>
): Lifehack {
  const categories = placements.managedIds.has(lh.id)
    ? ((placements.byDisplayId.get(lh.id) ?? [lh.category]) as Category[])
    : ([lh.category] as Category[])
  return {
    ...lh,
    tags: tagOv.get(lh.id) ?? lh.tags,
    categories,
  }
}
