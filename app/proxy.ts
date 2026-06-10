import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const getSecret = () => new TextEncoder().encode(process.env.JWT_SECRET!)

const ADMIN_ROUTES = ['/admin']
const ADMIN_PUBLIC_ROUTES = ['/admin/login']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isAdminPublic = ADMIN_PUBLIC_ROUTES.some((r) => pathname.startsWith(r))
  const isAdmin = !isAdminPublic && ADMIN_ROUTES.some((r) => pathname.startsWith(r))

  // 管理者ルート: admin_session Cookie で検証
  if (isAdmin) {
    const adminToken = request.cookies.get('admin_session')?.value
    if (adminToken) {
      try {
        await jwtVerify(adminToken, getSecret())
        return NextResponse.next()
      } catch {
        // 無効トークン → ログインへ
      }
    }
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  // 全ページ共通：匿名UIDクッキーがなければ発行（5年有効）
  const response = NextResponse.next()
  if (!request.cookies.get('shichifuku_uid')?.value) {
    response.cookies.set('shichifuku_uid', crypto.randomUUID(), {
      maxAge: 60 * 60 * 24 * 365 * 5,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: false, // クライアントJSからも読める
      path: '/',
    })
  }
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico).*)'],
}
