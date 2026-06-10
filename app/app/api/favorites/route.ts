import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { revalidateTag, revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase'
import { FAV_COUNTS_TAG } from '@/lib/favorites'

// お気に入り状態確認 (GET)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const lifehack_id = Number(searchParams.get('lifehack_id'))
  if (!lifehack_id) return NextResponse.json({ favorited: false, count: 0 })

  const cookieStore = await cookies()
  const uid = cookieStore.get('shichifuku_uid')?.value

  const supabase = createServerClient()

  // このユーザーがお気に入り済みか（uid があれば）
  let favorited = false
  if (uid) {
    const { data } = await supabase
      .from('anonymous_favorites')
      .select('uid')
      .eq('uid', uid)
      .eq('lifehack_id', lifehack_id)
      .maybeSingle()
    favorited = !!data
  }

  // この lifehack_id の総 count
  const { count } = await supabase
    .from('anonymous_favorites')
    .select('*', { count: 'exact', head: true })
    .eq('lifehack_id', lifehack_id)

  return NextResponse.json({ favorited, count: count ?? 0 })
}

// お気に入りトグル (POST)
export async function POST(req: Request) {
  const cookieStore = await cookies()
  let uid = cookieStore.get('shichifuku_uid')?.value

  // uid が無ければ新規発行してレスポンスに Set-Cookie する
  const isNewUid = !uid
  if (!uid) {
    uid = crypto.randomUUID()
  }

  const { lifehack_id } = await req.json()
  if (!lifehack_id) return NextResponse.json({ error: 'lifehack_id required' }, { status: 400 })

  const supabase = createServerClient()

  const { data: existing } = await supabase
    .from('anonymous_favorites')
    .select('uid')
    .eq('uid', uid)
    .eq('lifehack_id', lifehack_id)
    .maybeSingle()

  let favorited: boolean

  if (existing) {
    const { error } = await supabase
      .from('anonymous_favorites')
      .delete()
      .eq('uid', uid)
      .eq('lifehack_id', lifehack_id)
    if (error) return NextResponse.json({ error: 'db_error' }, { status: 500 })
    favorited = false
  } else {
    const { error } = await supabase
      .from('anonymous_favorites')
      .insert({ uid, lifehack_id })
    if (error) return NextResponse.json({ error: 'db_error' }, { status: 500 })
    favorited = true
  }

  // 最新の count を取得
  const { count } = await supabase
    .from('anonymous_favorites')
    .select('*', { count: 'exact', head: true })
    .eq('lifehack_id', lifehack_id)

  // キャッシュ無効化
  revalidateTag(FAV_COUNTS_TAG, 'max')
  revalidatePath('/')
  revalidatePath('/food')
  revalidatePath('/costume_make')
  revalidatePath('/other')
  revalidatePath(`/lifehack/${lifehack_id}`)

  const response = NextResponse.json({ favorited, count: count ?? 0 })

  // 新規発行した uid を Cookie にセット
  if (isNewUid) {
    const maxAge = 60 * 60 * 24 * 365 * 5 // 5年
    response.cookies.set('shichifuku_uid', uid, {
      maxAge,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: false,
    })
  }

  return response
}
