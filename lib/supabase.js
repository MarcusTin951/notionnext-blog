// supabase.js
import { createBrowserClient, createServerClient } from '@supabase/ssr'

// 1. 供客户端 (组件/页面) 使用的 Client
export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

// 2. 供 Middleware / Server 端使用的 Client
export const createServerSideClient = (req, res) => {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            // 确保设置长期的 maxAge（如 30 天），防止关闭浏览器后 Cookie 被清空
            req.cookies.set(name, value)
            if (res) {
              res.cookies.set(name, value, {
                ...options,
                maxAge: 30 * 24 * 60 * 60, // 30天持久化
                path: '/'
              })
            }
          })
        },
      },
    }
  )
}
