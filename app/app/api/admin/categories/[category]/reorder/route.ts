import { NextResponse } from 'next/server'
import { getAdminSessionFromRequest } from '@/lib/admin-auth'
import { createServerClient } from '@/lib/supabase'
import { revalidateOverrides } from '@/lib/overrides'
import { CATEGORY_SLUGS } from '@/lib/constants'

interface Params {
  params: Promise<{ category: string }>
}

/**
 * POST /api/admin/categories/[category]/reorder
 * body: { orderedIds: number[] }
 *
 * orderedIds の各 (index, display_id) を lifehack_placements に
 * upsert(display_id, category, position=index)。
 * これによりそのカテゴリの全表示要素が管理化され順序が確定する。
 */
export async function POST(req: Request, { params }: Params) {
  const isAdmin = await getAdminSessionFromRequest(req)
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { category } = await params
  if (!(CATEGORY_SLUGS as string[]).includes(category)) {
    return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
  }

  let body: { orderedIds?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const raw = Array.isArray(body.orderedIds) ? body.orderedIds : null
  if (!raw) {
    return NextResponse.json({ error: 'orderedIds must be an array' }, { status: 400 })
  }
  const orderedIds = raw.filter((n): n is number => typeof n === 'number' && Number.isFinite(n))
  if (orderedIds.length !== raw.length) {
    return NextResponse.json({ error: 'orderedIds must be numbers' }, { status: 400 })
  }

  const supabase = createServerClient()
  const rows = orderedIds.map((display_id, index) => ({
    display_id,
    category,
    position: index,
    updated_at: new Date().toISOString(),
  }))

  if (rows.length > 0) {
    const { error } = await supabase
      .from('lifehack_placements')
      .upsert(rows, { onConflict: 'display_id,category' })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  revalidateOverrides()
  return NextResponse.json({ success: true })
}
