import { NextResponse } from 'next/server'
import { createAdminToken, ADMIN_COOKIE, ADMIN_SESSION_DURATION } from '@/lib/admin-auth'

export async function POST(req: Request) {
  const { username, password } = await req.json()

  const validUsername = process.env.ADMIN_USERNAME
  const validPassword = process.env.ADMIN_PASSWORD

  if (!validUsername || !validPassword) {
    return NextResponse.json({ error: 'Admin credentials not configured' }, { status: 500 })
  }

  if (username !== validUsername || password !== validPassword) {
    return NextResponse.json({ error: 'ユーザー名またはパスワードが違います' }, { status: 401 })
  }

  const token = await createAdminToken()

  const res = NextResponse.json({ success: true })
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: ADMIN_SESSION_DURATION,
    path: '/',
  })
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ success: true })
  res.cookies.delete(ADMIN_COOKIE)
  return res
}
