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

  // 2. 核心大招：直接去检查浏览器的 Cookies 列表中有没有包含 supabase 登录凭证的字段
  // 只要登录成功，Supabase 在浏览器 Cookie 中一定会留下包含 sb- 或 supabase 等字样的凭证
  const allCookies = req.cookies.getAll()
  const hasSupabaseCookie = allCookies.some(cookie => 
    cookie.name.includes('sb-') || 
    cookie.name.includes('supabase') || 
    cookie.name.includes('access-token')
  )

  // 3. 如果没有任何凭证，说明绝对没登录，无条件强行重定向到登录页
  if (!hasSupabaseCookie) {
    const url = req.nextUrl.clone()
    url.pathname = '/sign-in'
    
    const redirectRes = NextResponse.redirect(url)
    // 强行增加禁止缓存的 Header，防止静态首页被浏览器缓存绕过中间件
    redirectRes.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    return redirectRes
  }

  // 4. 有 Cookie 凭证，顺利放行进入网站
  return NextResponse.next()
}

export const config = {
  matcher: [
    // 强行拦截除静态资源外的所有路径
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
