// middleware.js
import { NextResponse } from 'next/server'

export function middleware(req) {
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

  // 2. 更加宽泛且安全的 Cookie 检查机制
  const allCookies = req.cookies.getAll()
  
  // 检查是否有任意符合 Supabase Token 规范的 Cookie
  const hasSupabaseCookie = allCookies.some(cookie => 
    cookie.name.startsWith('sb-') || 
    cookie.name.includes('supabase') || 
    cookie.name.includes('auth-token') ||
    cookie.name.includes('access-token')
  )

  // 3. 如果没有任何凭证，重定向到登录页
  if (!hasSupabaseCookie) {
    const url = req.nextUrl.clone()
    url.pathname = '/sign-in'
    
    const redirectRes = NextResponse.redirect(url)
    redirectRes.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    return redirectRes
  }

  // 4. 有 Cookie 凭证，顺利放行进入网站
  return NextResponse.next()
}

export const config = {
  matcher: [
    // 拦截除了静态资源和 API 外的所有路由
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
