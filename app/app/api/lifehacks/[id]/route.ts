import { NextResponse } from 'next/server'
import { getAdminSessionFromRequest } from '@/lib/admin-auth'
import { createServerClient } from '@/lib/supabase'
import { SUPABASE_ID_OFFSET } from '@/lib/data'

interface Params {
  params: Promise<{ id: string }>
}

// 管理者: ライフハック更新 (PUT) — Supabase ライフハックのみ対象
export async function PUT(req: Request, { params }: Params) {
  const isAdmin = await getAdminSessionFromRequest(req)
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const numId = parseInt(id, 10)
  const body = await req.json()

  const supabase = createServerClient()
  const { error } = await supabase
    .from('lifehacks')
    .update({
      title: body.title || null,
      description: body.description,
      author: body.author || null,
      link: body.link || null,
      photo: body.photo || null,
      category: body.category,
      tags: body.tags ?? [],
      is_approved: body.is_approved ?? true,
    })
    .eq('id', numId - SUPABASE_ID_OFFSET)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// 管理者: 承認/ソフトデリート/復活 (PATCH)
export async function PATCH(req: Request, { params }: Params) {
  const isAdmin = await getAdminSessionFromRequest(req)
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const numId = parseInt(id, 10)
  const body = await req.json()
  const supabase = createServerClient()
  const isJsonId = numId < SUPABASE_ID_OFFSET

  // 復活
  if (body.restore === true) {
    if (isJsonId) {
      // JSON: hidden_json_ids から削除
      const { error } = await supabase.from('hidden_json_ids').delete().eq('id', numId)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    } else {
      // Supabase: is_deleted = false
      const { error } = await supabase
        .from('lifehacks')
        .update({ is_deleted: false })
        .eq('id', numId - SUPABASE_ID_OFFSET)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ restored: true })
  }

  // ソフトデリート (is_approved: null)
  if (body.is_approved === null) {
    if (isJsonId) {
      await supabase.from('hidden_json_ids').upsert({ id: numId })
    } else {
      await supabase
        .from('lifehacks')
        .update({ is_deleted: true })
        .eq('id', numId - SUPABASE_ID_OFFSET)
    }
    return NextResponse.json({ deleted: true })
  }

  // 承認状態変更 (Supabase のみ)
  if (!isJsonId) {
    const { error } = await supabase
      .from('lifehacks')
      .update({ is_approved: body.is_approved })
      .eq('id', numId - SUPABASE_ID_OFFSET)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

// 管理者: ソフトデリート (DELETE)
export async function DELETE(req: Request, { params }: Params) {
  const isAdmin = await getAdminSessionFromRequest(req)
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const numId = parseInt(id, 10)
  const supabase = createServerClient()

  if (numId < SUPABASE_ID_OFFSET) {
    // JSON ライフハック: hidden_json_ids に追加
    const { error } = await supabase.from('hidden_json_ids').upsert({ id: numId })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else {
    // Supabase ライフハック: is_deleted = true
    const { error } = await supabase
      .from('lifehacks')
      .update({ is_deleted: true })
      .eq('id', numId - SUPABASE_ID_OFFSET)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
