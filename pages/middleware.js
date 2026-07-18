// middleware.js
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(req) {
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  // 1. 创建服务器端的 Supabase 客户端
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => req.cookies.set(name, value))
          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
        },
      },
    }
  )

  // 2. 检查用户的登录状态（获取 session）
  const { data: { session } } = await supabase.auth.getSession()

  // 3. 如果没有登录，且访问的不是登录页面，直接重定向到 /login
  const isLoginPage = req.nextUrl.pathname.startsWith('/login')
  // 如果你有其他公开页面（如 /about），也可以加在下面
  const isPublicAsset = req.nextUrl.pathname.startsWith('/_next') || req.nextUrl.pathname.startsWith('/api')

  if (!session && !isLoginPage && !isPublicAsset) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return res
}

// 配置哪些路由需要走中间件（匹配所有路由，排除静态文件）
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
