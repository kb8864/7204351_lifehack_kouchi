import { NextResponse } from 'next/server'
import { getAdminSessionFromRequest } from '@/lib/admin-auth'
import { createServerClient } from '@/lib/supabase'

interface Params {
  params: Promise<{ id: string }>
}

// 管理者: ライフハック更新 (PUT)
export async function PUT(req: Request, { params }: Params) {
  const isAdmin = await getAdminSessionFromRequest(req)
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
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
    .eq('id', parseInt(id, 10))

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// 管理者: 承認/ソフトデリート (PATCH)
export async function PATCH(req: Request, { params }: Params) {
  const isAdmin = await getAdminSessionFromRequest(req)
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  const supabase = createServerClient()

  // is_approved: null → ソフトデリート
  if (body.is_approved === null) {
    const { error } = await supabase
      .from('lifehacks')
      .update({ is_deleted: true })
      .eq('id', parseInt(id, 10))
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ deleted: true })
  }

  // restore: true → 削除復活
  if (body.restore === true) {
    const { error } = await supabase
      .from('lifehacks')
      .update({ is_deleted: false })
      .eq('id', parseInt(id, 10))
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ restored: true })
  }

  const { error } = await supabase
    .from('lifehacks')
    .update({ is_approved: body.is_approved })
    .eq('id', parseInt(id, 10))

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// 管理者: ソフトデリート (DELETE)
export async function DELETE(req: Request, { params }: Params) {
  const isAdmin = await getAdminSessionFromRequest(req)
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const supabase = createServerClient()
  const { error } = await supabase
    .from('lifehacks')
    .update({ is_deleted: true })
    .eq('id', parseInt(id, 10))

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
