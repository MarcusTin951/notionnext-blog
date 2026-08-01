// middleware.js
import { NextResponse } from 'next/server'

export function middleware(req) {
  const { pathname } = req.nextUrl

  // 白名单页面直接放行
  if (
    pathname.startsWith('/sign-in') ||
    pathname.startsWith('/sign-up') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  const deviceToken = req.cookies.get('sb-device-token')?.value
  const accessToken = req.cookies.get('sb-access-token')?.value

  // 如果没有凭证，踢回登录页
  if (!deviceToken || !accessToken) {
    const url = req.nextUrl.clone()
    url.pathname = '/sign-in'
    return NextResponse.redirect(url)
  }

  // 🌟【关键提升】：如果有凭证，顺手延长 Cookie 寿命为 10 年，实现无限续期
  const res = NextResponse.next()
  const TEN_YEARS = 315360000

  res.cookies.set('sb-access-token', accessToken, { path: '/', maxAge: TEN_YEARS, sameSite: 'lax' })
  res.cookies.set('sb-device-token', deviceToken, { path: '/', maxAge: TEN_YEARS, sameSite: 'lax' })

  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
