// import '@/styles/animate.css' // @see https://animate.style/
import '@/styles/globals.css'
import '@/styles/utility-patterns.css'

// core styles shared by all of react-notion-x (required)
import '@/styles/notion.css' //  重写部分notion样式
import 'react-notion-x/src/styles.css' // 原版的react-notion-x

import useAdjustStyle from '@/hooks/useAdjustStyle'
import { GlobalContextProvider } from '@/lib/global'
import { getBaseLayoutByTheme } from '@/themes/theme'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useMemo } from 'react'
import { getQueryParam } from '../lib/utils'
import ErrorHandler from '@/lib/utils/errorHandler'

// 各种扩展插件 这个要阻塞引入
import BLOG from '@/blog.config'
import ExternalPlugins from '@/components/ExternalPlugins'
import SEO from '@/components/SEO'
import { zhCN } from '@clerk/localizations'
import dynamic from 'next/dynamic'
// import { ClerkProvider } from '@clerk/nextjs'
const ClerkProvider = dynamic(() =>
  import('@clerk/nextjs').then(m => m.ClerkProvider)
)
const AppErrorBoundary = ErrorHandler.createErrorBoundary(
  <div style={{ padding: '2rem', textAlign: 'center', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
    <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Something went wrong</h1>
    <p style={{ color: '#666', marginBottom: '1.5rem' }}>An unexpected error occurred. Please refresh the page.</p>
    <button onClick={() => window.location.reload()} style={{ padding: '0.5rem 1.5rem', cursor: 'pointer', border: '1px solid #ccc', borderRadius: '4px', background: 'transparent' }}>Refresh</button>
  </div>
)

/**
 * App挂载DOM 入口文件
 * @param {*} param0
 * @returns
 */
const MyApp = ({ Component, pageProps }) => {
  // 一些可能出现 bug 的样式，可以统一放入该钩子进行调整
  useAdjustStyle()

  const route = useRouter()
  const queryTheme = getQueryParam(route.asPath, 'theme')
  const notionTheme = pageProps?.NOTION_CONFIG?.THEME
  const configTheme = BLOG.THEME
  const theme = useMemo(() => {
    return queryTheme || notionTheme || configTheme
  }, [queryTheme, notionTheme, configTheme])

  useEffect(() => {
    const source = queryTheme
      ? 'url:theme'
      : notionTheme
        ? 'notion:config'
        : 'blog/env:config'
    console.log(
      '[ThemeResolver][runtime-final]',
      JSON.stringify(
        {
          note: 'This is the final theme used for rendering.',
          configTheme,
          notionTheme: notionTheme || null,
          queryTheme: queryTheme || null,
          finalTheme: theme,
          source
        },
        null,
        2
      )
    )
  }, [configTheme, notionTheme, queryTheme, theme])

  // 整体布局
  const GLayout = useCallback(
    props => {
      const Layout = getBaseLayoutByTheme(theme)
      return <Layout {...props} />
    },
    [theme]
  )
// pages/_app.js 的核心魔改部分
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function App({ Component, pageProps }) {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    // 1. 定义不需要拦截的白名单页面
    const isAuthPage = 
      router.pathname.startsWith('/sign-in') || 
      router.pathname.startsWith('/sign-up') || 
      router.pathname.startsWith('/auth')

    // 2. 检查 Supabase 登录状态
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session && !isAuthPage) {
        // 没登录，且不是登录页，强制前端闪现到登录
        router.replace('/sign-in')
      } else {
        // 已登录，或者是登录页，放行
        setIsAuthorized(true)
      }
    }

    checkUser()

    // 监听登录状态变化（防止用户登出或令牌失效）
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        router.replace('/sign-in')
      }
    })

    return () => subscription.unsubscribe()
  }, [router.pathname])

  // 3. 关键：如果正在判断中且访问的不是登录页，展示一个纯白遮罩，防止静态内容“闪现”泄密
  const isAuthPage = router.pathname.startsWith('/sign-in')
  if (!isAuthorized && !isAuthPage) {
    return <div style={{ background: '#ffffff', width: '100vw', height: '100vh' }} />
  }

  // 正常渲染你的博客内容
  return <Component {...pageProps} />
