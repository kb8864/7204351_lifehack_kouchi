import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getAdminSessionFromRequest } from '@/lib/admin-auth'
import { createServerClient } from '@/lib/supabase'
import { SUPABASE_ID_OFFSET, getLifehackById } from '@/lib/data'

function revalidateForLifehack(category: string | null, displayId: number) {
  revalidatePath('/')                         // ホーム（件数・ランキング）
  revalidatePath('/ranking')
  if (category) revalidatePath(`/${category}`) // 該当カテゴリ一覧
  revalidatePath(`/lifehack/${displayId}`)     // 詳細ページ
}

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
  revalidateForLifehack(body.category ?? null, numId)
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
      const category = getLifehackById(numId)?.category ?? null
      revalidateForLifehack(category, numId)
    } else {
      // Supabase: is_deleted = false
      const { data, error } = await supabase
        .from('lifehacks')
        .update({ is_deleted: false })
        .eq('id', numId - SUPABASE_ID_OFFSET)
        .select('category')
        .maybeSingle()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      revalidateForLifehack(data?.category ?? null, numId)
    }
    return NextResponse.json({ restored: true })
  }

  // ソフトデリート (is_approved: null)
  if (body.is_approved === null) {
    if (isJsonId) {
      const { error } = await supabase.from('hidden_json_ids').upsert({ id: numId })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      const category = getLifehackById(numId)?.category ?? null
      revalidateForLifehack(category, numId)
    } else {
      const { data, error } = await supabase
        .from('lifehacks')
        .update({ is_deleted: true })
        .eq('id', numId - SUPABASE_ID_OFFSET)
        .select('category')
        .maybeSingle()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      revalidateForLifehack(data?.category ?? null, numId)
    }
    return NextResponse.json({ deleted: true })
  }

  // 承認状態変更 (Supabase のみ)
  if (!isJsonId) {
    const { data, error } = await supabase
      .from('lifehacks')
      .update({ is_approved: body.is_approved })
      .eq('id', numId - SUPABASE_ID_OFFSET)
      .select('category')
      .maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    revalidateForLifehack(data?.category ?? null, numId)
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

  let category: string | null = null
  if (numId < SUPABASE_ID_OFFSET) {
    // JSON ライフハック: hidden_json_ids に追加
    const { error } = await supabase.from('hidden_json_ids').upsert({ id: numId })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    category = getLifehackById(numId)?.category ?? null
  } else {
    // Supabase ライフハック: is_deleted = true
    const { data, error } = await supabase
      .from('lifehacks')
      .update({ is_deleted: true })
      .eq('id', numId - SUPABASE_ID_OFFSET)
      .select('category')
      .maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    category = data?.category ?? null
  }

  revalidateForLifehack(category, numId)
  return NextResponse.json({ success: true })
}
