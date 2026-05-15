import { NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase'

interface Params {
  params: Promise<{ id: string }>
}

// 管理者: ライフハック更新 (PUT)
export async function PUT(req: Request, { params }: Params) {
  const session = await getSessionFromRequest(req)
  if (!session?.isAdmin) {
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

// 管理者: 承認/削除 (PATCH)
export async function PATCH(req: Request, { params }: Params) {
  const session = await getSessionFromRequest(req)
  if (!session?.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const { is_approved } = await req.json()

  const supabase = createServerClient()

  if (is_approved === null) {
    // 削除
    await supabase.from('lifehacks').delete().eq('id', parseInt(id, 10))
    return NextResponse.json({ deleted: true })
  }

  const { error } = await supabase
    .from('lifehacks')
    .update({ is_approved })
    .eq('id', parseInt(id, 10))

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// 管理者: 削除 (DELETE)
export async function DELETE(req: Request, { params }: Params) {
  const session = await getSessionFromRequest(req)
  if (!session?.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const supabase = createServerClient()
  await supabase.from('lifehacks').delete().eq('id', parseInt(id, 10))
  return NextResponse.json({ success: true })
}
