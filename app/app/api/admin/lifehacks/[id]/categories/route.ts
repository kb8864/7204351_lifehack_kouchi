import { NextResponse } from 'next/server'
import { getAdminSessionFromRequest } from '@/lib/admin-auth'
import { createServerClient } from '@/lib/supabase'
import { revalidateOverrides } from '@/lib/overrides'
import { getAllBaseLifehacks } from '@/lib/data'
import { CATEGORY_SLUGS } from '@/lib/constants'

interface Params {
  params: Promise<{ id: string }>
}

/**
 * PUT /api/admin/lifehacks/[id]/categories
 * body: { categories: string[] }
 *
 * 指定ライフハックの所属カテゴリ集合を `categories` に一致させる。
 *  - 追加(desiredにありexistingに無い): 末尾positionでinsert
 *  - 削除(existingにありdesiredに無い): delete
 *  - 未管理(既存placement0件)→管理化: desired全件insert（クライアントは現所属を含む完全集合を送る前提）
 */
export async function PUT(req: Request, { params }: Params) {
  const isAdmin = await getAdminSessionFromRequest(req)
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const displayId = parseInt(id, 10)
  if (isNaN(displayId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  let body: { categories?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const raw = Array.isArray(body.categories) ? body.categories : null
  if (!raw) {
    return NextResponse.json({ error: 'categories must be an array' }, { status: 400 })
  }

  // 重複除去 + CATEGORY_SLUGS の部分集合かつ1件以上を検証
  const desiredList = [...new Set(raw.filter((c): c is string => typeof c === 'string'))]
  if (desiredList.length === 0) {
    return NextResponse.json({ error: 'At least one category is required' }, { status: 400 })
  }
  if (!desiredList.every((c) => (CATEGORY_SLUGS as string[]).includes(c))) {
    return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
  }
  const desired = new Set(desiredList)

  const supabase = createServerClient()

  // 既存placementを取得
  const { data: existingRows, error: selErr } = await supabase
    .from('lifehack_placements')
    .select('category')
    .eq('display_id', displayId)
  if (selErr) {
    return NextResponse.json({ error: selErr.message }, { status: 500 })
  }
  const existing = new Set((existingRows ?? []).map((r: { category: string }) => r.category))

  // このアイテムが初回materialize(既存placement0件)の場合、ホームカテゴリでの
  // ネイティブ自然indexを引いておく。これにより複数カテゴリ化してもホーム一覧での
  // 位置が保たれる（末尾へ飛ばない）。
  let homeCategory: string | null = null
  let homeNativeIndex: number | null = null
  if (existing.size === 0) {
    try {
      const base = await getAllBaseLifehacks()
      const lh = base.find((b) => b.id === displayId)
      if (lh) {
        homeCategory = lh.category
        // base配列内でホームカテゴリに属する順の位置
        let idx = -1
        let counter = 0
        for (const b of base) {
          if (b.category !== homeCategory) continue
          if (b.id === displayId) {
            idx = counter
            break
          }
          counter++
        }
        homeNativeIndex = idx >= 0 ? idx : null
      }
    } catch {
      // 失敗時はホームindexが引けないので従来の末尾値にフォールバック
      homeCategory = null
      homeNativeIndex = null
    }
  }

  // 追加対象（desiredにありexistingに無い）。
  //  - 初回materializeでホームカテゴリの場合 → ネイティブ自然indexをpositionに。
  //  - それ以外 → 従来通り末尾の大きな値。
  const toAdd = desiredList.filter((c) => !existing.has(c))
  if (toAdd.length > 0) {
    const basePos = 1_000_000 + (Date.now() % 1_000_000)
    const rows = toAdd.map((category, i) => ({
      display_id: displayId,
      category,
      position:
        category === homeCategory && homeNativeIndex != null
          ? homeNativeIndex
          : basePos + i,
    }))
    const { error: insErr } = await supabase.from('lifehack_placements').insert(rows)
    if (insErr) {
      return NextResponse.json({ error: insErr.message }, { status: 500 })
    }
  }

  // 削除対象（existingにありdesiredに無い）
  const toRemove = [...existing].filter((c) => !desired.has(c))
  if (toRemove.length > 0) {
    const { error: delErr } = await supabase
      .from('lifehack_placements')
      .delete()
      .eq('display_id', displayId)
      .in('category', toRemove)
    if (delErr) {
      return NextResponse.json({ error: delErr.message }, { status: 500 })
    }
  }

  revalidateOverrides(displayId)
  return NextResponse.json({ success: true })
}
