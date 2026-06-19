import { NextResponse } from 'next/server'
import { getAdminSessionFromRequest } from '@/lib/admin-auth'
import { createServerClient } from '@/lib/supabase'
import { revalidateOverrides } from '@/lib/overrides'

interface Params {
  params: Promise<{ id: string }>
}

/**
 * PUT /api/admin/lifehacks/[id]/tags
 * body: { tags: string[] }
 *
 * lifehack_tag_overrides に upsert。存在すれば元タグを置き換える。
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

  let body: { tags?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const raw = Array.isArray(body.tags) ? body.tags : null
  if (!raw) {
    return NextResponse.json({ error: 'tags must be an array' }, { status: 400 })
  }

  // 正規化: trim / 空除去 / 重複除去
  const tags = [
    ...new Set(
      raw
        .filter((t): t is string => typeof t === 'string')
        .map((t) => t.trim())
        .filter((t) => t !== '')
    ),
  ]

  const supabase = createServerClient()
  const { error } = await supabase
    .from('lifehack_tag_overrides')
    .upsert({ display_id: displayId, tags, updated_at: new Date().toISOString() })
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  revalidateOverrides(displayId)
  return NextResponse.json({ success: true })
}
