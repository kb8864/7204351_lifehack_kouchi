import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@/lib/supabase'

// お気に入り状態確認 (GET)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const uid = searchParams.get('uid')
  const lifehack_id = Number(searchParams.get('lifehack_id'))
  if (!uid || !lifehack_id) return NextResponse.json({ favorited: false })

  const supabase = createServerClient()
  const { data } = await supabase
    .from('anonymous_favorites')
    .select('uid')
    .eq('uid', uid)
    .eq('lifehack_id', lifehack_id)
    .maybeSingle()

  return NextResponse.json({ favorited: !!data })
}

// お気に入りトグル (POST)
export async function POST(req: Request) {
  const cookieStore = await cookies()
  const uid = cookieStore.get('shichifuku_uid')?.value
  if (!uid) return NextResponse.json({ error: 'uid not found' }, { status: 400 })

  const { lifehack_id } = await req.json()
  if (!lifehack_id) return NextResponse.json({ error: 'lifehack_id required' }, { status: 400 })

  const supabase = createServerClient()

  const { data: existing } = await supabase
    .from('anonymous_favorites')
    .select('uid')
    .eq('uid', uid)
    .eq('lifehack_id', lifehack_id)
    .maybeSingle()

  if (existing) {
    await supabase.from('anonymous_favorites').delete().eq('uid', uid).eq('lifehack_id', lifehack_id)
    return NextResponse.json({ favorited: false })
  } else {
    await supabase.from('anonymous_favorites').insert({ uid, lifehack_id })
    return NextResponse.json({ favorited: true })
  }
}
