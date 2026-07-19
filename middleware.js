import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

export async function middleware(req) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  
  // 获取当前登录状态
  const { data: { session } } = await supabase.auth.getSession()

  const url = req.nextUrl.clone()
  const isAuthPage = url.pathname.startsWith('/sign-in') || 
                     url.pathname.startsWith('/sign-up') || 
                     url.pathname.startsWith('/auth')

  // 如果没有登录，且访问的不是登录相关的页面，直接服务端重定向（无闪现）
  if (!session && !isAuthPage) {
    url.pathname = '/sign-in'
    return NextResponse.redirect(url)
  }

  return res
}

// 匹配哪些页面需要保护（这里保护除静态资源外的所有页面）
export const config = {
  matcher: [
    /*
     * 匹配所有请求，除了：
     * - _next/static (静态文件)
     * - _next/image (图片优化)
     * - favicon.ico (网站图标)
     * - public 文件夹下的静态文件
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
