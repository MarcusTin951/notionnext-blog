// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // 1. 绝对放行的白名单
  const isAuthPage = 
    pathname.startsWith('/sign-in') || 
    pathname.startsWith('/sign-up') || 
    pathname.startsWith('/auth')

  const isPublicAsset = 
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api') ||
    pathname.includes('.')

  if (isAuthPage || isPublicAsset) {
    return NextResponse.next()
  }

  // 2. 核心大招：直接去检查浏览器的 Cookies 列表中有没有包含 supabase 登录凭证的字段
  // 标准的 Supabase SSR 登录成功后，会在 Cookie 中写入一个名包含 "sb-" 或 "supabase-auth" 的字段
  const allCookies = req.cookies.getAll()
  const hasSupabaseCookie = allCookies.some(cookie => 
    cookie.name.includes('sb-') || 
    cookie.name.includes('supabase') || 
    cookie.name.includes('access-token')
  )

  // 3. 如果没有任何 Supabase 相关的 Cookie 标记，说明绝对没登录，无条件强行弹走
  if (!hasSupabaseCookie) {
    const url = req.nextUrl.clone()
    url.pathname = '/sign-in'
    
    const redirectRes = NextResponse.redirect(url)
    // 强行给重定向增加禁止缓存的 Header，斩断静态首页的本地缓存
    redirectRes.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    redirectRes.headers.set('Pragma', 'no-cache')
    redirectRes.headers.set('Expires', '0')
    return redirectRes
  }

  // 4. 有 Cookie 凭证，说明已经登录，顺畅放行进入网站
  const response = NextResponse.next()
  // 即使放行，也告诉浏览器不要缓存当前页面，防止后续登出时卡死
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  return response
}

export const config = {
  matcher: [
    // 强行拦截所有路径
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
