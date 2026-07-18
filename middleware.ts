// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
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
          cookiesToSet.forEach(({ name, value }: any) => req.cookies.set(name, value))
          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }: any) => res.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // 定义不需要登录的白名单路径
  const isAuthPage = 
    req.nextUrl.pathname.startsWith('/sign-in') || 
    req.nextUrl.pathname.startsWith('/sign-up') || 
    req.nextUrl.pathname.startsWith('/auth')

  const isPublicAsset = 
    req.nextUrl.pathname.startsWith('/_next') || 
    req.nextUrl.pathname.startsWith('/api') ||
    req.nextUrl.pathname.includes('.') // 排除静态文件

  // 核心拦截逻辑
  if (!session && !isAuthPage && !isPublicAsset) {
    const url = req.nextUrl.clone()
    url.pathname = '/sign-in'
    return NextResponse.redirect(url)
  }

  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

export default authMiddleware
