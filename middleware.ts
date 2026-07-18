// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // 1. 绝对白名单：登录页、注册页、静态资源、API、第三方认证回调
  const isAuthPage = 
    pathname.startsWith('/sign-in') || 
    pathname.startsWith('/sign-up') || 
    pathname.startsWith('/auth')

  const isPublicAsset = 
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api') ||
    pathname.includes('.') // 排除 favicon.ico, sitemap.xml 等带后缀的文件

  // 如果访问的是白名单，或者是静态资源，直接放行，绝不阻拦
  if (isAuthPage || isPublicAsset) {
    return NextResponse.next()
  }

  // 2. 初始化 Supabase 客户端并获取当前会话
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet: any) {
          try {
            cookiesToSet.forEach(({ name, value }: any) => req.cookies.set(name, value))
            res = NextResponse.next({
              request: {
                headers: req.headers,
              },
            })
            cookiesToSet.forEach(({ name, value, options }: any) => res.cookies.set(name, value, options))
          } catch (e) {
            // 防止部分 Next.js 版本在 Edge 环境下因为 setCookie 报错导致中间件崩溃放行或死循环
          }
        },
      },
    }
  )

  // 3. 安全获取 Session
  // 用 getUser() 替代 getSession()，因为 getUser() 会向服务器严格验证 Cookie 的真实性
  const { data: { user } } = await supabase.auth.getUser()

  // 4. 拦截逻辑：如果没有获取到合法的用户，且当前不在登录页，强行跳转
  if (!user) {
    const url = req.nextUrl.clone()
    url.pathname = '/sign-in'
    
    const redirectRes = NextResponse.redirect(url)
    // 强制清除缓存，防止浏览器记住了错误的重定向
    redirectRes.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate')
    return redirectRes
  }

  // 已登录，正常放行访问首页或文章页
  return res
}

export const config = {
  matcher: [
    // 拦截根路径以及所有深层子路径，但排除静态资源
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
