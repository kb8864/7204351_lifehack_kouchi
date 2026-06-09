import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import { COOKIE_NAME } from './lib/constants'

const getSecret = () => new TextEncoder().encode(process.env.JWT_SECRET!)

// ログインが必要なルート
const PROTECTED_ROUTES = ['/favorites']
// 管理者のみアクセス可能なルート（/admin/login は除外）
const ADMIN_ROUTES = ['/admin']
const ADMIN_PUBLIC_ROUTES = ['/admin/login']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r))
  const isAdminPublic = ADMIN_PUBLIC_ROUTES.some((r) => pathname.startsWith(r))
  const isAdmin = !isAdminPublic && ADMIN_ROUTES.some((r) => pathname.startsWith(r))

  if (!isProtected && !isAdmin) return NextResponse.next()

  const token = request.cookies.get(COOKIE_NAME)?.value

  if (!token) {
    const loginUrl = new URL('/api/auth/line', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  try {
    const { payload } = await jwtVerify(token, getSecret())

    if (isAdmin && !payload.isAdmin) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    return NextResponse.next()
  } catch {
    const loginUrl = new URL('/api/auth/line', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }
}

export const config = {
  matcher: ['/favorites/:path*', '/admin/:path*'],
}
