import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@/lib/supabase'
import { createSessionToken } from '@/lib/auth'
import { COOKIE_NAME, SESSION_DURATION } from '@/lib/constants'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  const cookieStore = await cookies()
  const savedState = cookieStore.get('line_oauth_state')?.value
  const redirectTo = cookieStore.get('line_oauth_redirect')?.value ?? '/'

  // stateを削除
  cookieStore.delete('line_oauth_state')
  cookieStore.delete('line_oauth_redirect')

  // CSRFチェック
  if (!code || !state || state !== savedState) {
    return NextResponse.redirect(`${APP_URL}/?error=auth_failed`)
  }

  // アクセストークンを取得
  const tokenRes = await fetch('https://api.line.me/oauth2/v2.1/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: `${APP_URL}/api/auth/callback/line`,
      client_id: process.env.LINE_CHANNEL_ID!,
      client_secret: process.env.LINE_CHANNEL_SECRET!,
    }),
  })

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${APP_URL}/?error=token_failed`)
  }

  const { access_token } = await tokenRes.json()

  // プロフィールを取得
  const profileRes = await fetch('https://api.line.me/v2/profile', {
    headers: { Authorization: `Bearer ${access_token}` },
  })

  if (!profileRes.ok) {
    return NextResponse.redirect(`${APP_URL}/?error=profile_failed`)
  }

  const profile = await profileRes.json()
  const { userId: lineUserId, displayName, pictureUrl } = profile

  // Supabaseにユーザーをupsert
  const supabase = createServerClient()
  const { data: user, error } = await supabase
    .from('users')
    .upsert(
      {
        line_user_id: lineUserId,
        display_name: displayName,
        picture_url: pictureUrl ?? null,
      },
      { onConflict: 'line_user_id' }
    )
    .select('id, is_admin')
    .single()

  if (error || !user) {
    return NextResponse.redirect(`${APP_URL}/?error=db_failed`)
  }

  // JWTセッションを作成
  const token = await createSessionToken({
    id: user.id,
    lineUserId,
    displayName,
    pictureUrl: pictureUrl ?? null,
    isAdmin: user.is_admin,
  })

  // Cookieにセット
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION,
    path: '/',
  })

  return NextResponse.redirect(`${APP_URL}${redirectTo}`)
}
