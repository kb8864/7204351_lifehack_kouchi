/**
 * JSONファイルから直接ライフハックデータを読み込むライブラリ
 *
 * Supabaseへのseedが完了するまでの間、またはSupabaseが未設定の場合に
 * ../public/*.json から直接データを取得する。
 *
 * グローバルIDの割り当て（Supabase SERIAL IDと一致）:
 *   food         : 1  〜 25
 *   health       : 26 〜 34
 *   costume_make : 35 〜 48
 *   other        : 49 〜 76
 */

import * as fs from 'fs'
import * as path from 'path'
import type { Category, Lifehack } from '@/types'
import { buildSearchKey, matchesQuery } from './search-text'

// SupabaseのIDとJSONのID（1-76）が衝突しないようオフセットを加算
export const SUPABASE_ID_OFFSET = 10000

const CATEGORY_ORDER: Category[] = ['food', 'costume_make', 'other']

type RawLifehack = {
  id: number
  title?: string
  description: string
  author?: string
  link?: string
  photo?: string
  tags: string | string[] | (string | string[])[]
}

function normalizeTags(tags: RawLifehack['tags']): string[] {
  if (!tags) return []
  const flat = Array.isArray(tags)
    ? (tags as (string | string[])[]).flatMap((t) => (Array.isArray(t) ? t : [t]))
    : [tags as string]
  return flat.filter((t): t is string => typeof t === 'string' && t.trim() !== '')
}

function readJson(category: Category): RawLifehack[] {
  try {
    // process.cwd() = /七福ライフハック/app  なので .. で public へ
    const filePath = path.join(process.cwd(), '..', 'public', `${category}.json`)
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as RawLifehack[]
  } catch {
    return []
  }
}

// 全データをキャッシュ（プロセス起動中は同じ結果を返す）
let _cache: Lifehack[] | null = null

export function getAllLifehacks(): Lifehack[] {
  if (_cache) return _cache

  let globalId = 1
  const all: Lifehack[] = []

  for (const category of CATEGORY_ORDER) {
    const raw = readJson(category)
    for (const item of raw) {
      all.push({
        id: globalId++,
        title: item.title || null,
        description: item.description,
        author: item.author || null,
        link: item.link?.trim() || null,
        photo: item.photo?.trim() || null,
        category,
        tags: normalizeTags(item.tags),
        is_approved: true,
        created_at: '',
        favorite_count: 0,
        is_favorited: false,
      })
    }
  }

  _cache = all
  return all
}

export function getLifehacksByCategory(category: Category): Lifehack[] {
  return getAllLifehacks().filter((lh) => lh.category === category)
}

export function getLifehackById(id: number): Lifehack | null {
  return getAllLifehacks().find((lh) => lh.id === id) ?? null
}

export function searchLifehacks(query: string, category?: Category): Lifehack[] {
  const source = category ? getLifehacksByCategory(category) : getAllLifehacks()
  if (!query) return source
  return source.filter((lh) => matchesQuery(buildSearchKey(lh), query))
}

/**
 * Supabaseからカテゴリ別の承認済みライフハックを取得する。
 * IDにSUPABASE_ID_OFFSETを加算してJSONデータとの衝突を回避する。
 * Supabase未設定や失敗時は空配列を返す。
 */
export async function getSupabaseLifehacks(category: Category): Promise<Lifehack[]> {
  try {
    const { createServerClient } = await import('@/lib/supabase')
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('lifehacks')
      .select('*')
      .eq('category', category)
      .eq('is_approved', true)
      .eq('is_deleted', false)
      .order('id', { ascending: true })

    if (error || !data) return []

    return data.map((row: {
      id: number
      title: string | null
      description: string
      author: string | null
      link: string | null
      photo: string | null
      category: Category
      tags: string[]
      is_approved: boolean
      created_at: string
    }) => ({
      id: row.id + SUPABASE_ID_OFFSET,
      title: row.title,
      description: row.description,
      author: row.author,
      link: row.link,
      photo: row.photo,
      category: row.category,
      tags: row.tags ?? [],
      is_approved: true,
      created_at: row.created_at,
      favorite_count: 0,
      is_favorited: false,
    }))
  } catch {
    return []
  }
}

/**
 * JSON ID(1-76) と Supabase表示ID(10001+) を両方検索する。
 * ランキング・お気に入りなど複数ページで共通利用する。
 */
export async function getLifehackByDisplayId(id: number): Promise<Lifehack | null> {
  const json = getLifehackById(id)
  if (json) return json
  if (id <= SUPABASE_ID_OFFSET) return null

  try {
    const { createServerClient } = await import('@/lib/supabase')
    const supabase = createServerClient()
    const { data } = await supabase
      .from('lifehacks')
      .select('*')
      .eq('id', id - SUPABASE_ID_OFFSET)
      .eq('is_approved', true)
      .maybeSingle()
    if (!data) return null
    return {
      id,
      title: data.title,
      description: data.description,
      author: data.author,
      link: data.link,
      photo: data.photo,
      category: data.category,
      tags: data.tags ?? [],
      is_approved: true,
      created_at: data.created_at,
      favorite_count: 0,
      is_favorited: false,
    }
  } catch {
    return null
  }
}

/** 全カテゴリのSupabaseライフハックを並列取得 */
export async function getAllSupabaseLifehacks(): Promise<Lifehack[]> {
  const results = await Promise.all(CATEGORY_ORDER.map(getSupabaseLifehacks))
  return results.flat()
}

/** hidden_json_ids テーブルから非表示JSONのIDセットを取得（60秒キャッシュ） */
import { unstable_cache } from 'next/cache'

const getCachedHiddenIds = unstable_cache(
  async (): Promise<number[]> => {
    try {
      const { createServerClient } = await import('@/lib/supabase')
      const supabase = createServerClient()
      const { data } = await supabase.from('hidden_json_ids').select('id')
      return (data ?? []).map((row: { id: number }) => row.id)
    } catch {
      return []
    }
  },
  ['hidden-json-ids'],
  { revalidate: 30 }
)

export async function getHiddenJsonIds(): Promise<Set<number>> {
  return new Set(await getCachedHiddenIds())
}

export function getCategoryCounts(): Record<Category, number> {
  const all = getAllLifehacks()
  const counts: Record<Category, number> = { food: 0, costume_make: 0, other: 0 }
  all.forEach((lh) => counts[lh.category]++)
  return counts
}
