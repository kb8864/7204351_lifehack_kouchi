import { NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase'

// お気に入りのトグル (POST)
export async function POST(req: Request) {
  const session = await getSessionFromRequest(req)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { lifehack_id } = await req.json()
  if (!lifehack_id) {
    return NextResponse.json({ error: 'lifehack_id required' }, { status: 400 })
  }

  const supabase = createServerClient()

  // 既にお気に入り済みか確認
  const { data: existing } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', session.id)
    .eq('lifehack_id', lifehack_id)
    .single()

  if (existing) {
    // 削除
    await supabase.from('favorites').delete().eq('id', existing.id)
    return NextResponse.json({ favorited: false })
  } else {
    // 追加
    await supabase.from('favorites').insert({ user_id: session.id, lifehack_id })
    return NextResponse.json({ favorited: true })
  }
}
