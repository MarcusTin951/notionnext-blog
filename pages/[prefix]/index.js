import BLOG from '@/blog.config'
import { siteConfig } from '@/lib/config'
import { getGlobalData, getPost } from '@/lib/db/getSiteData'
import LayoutBase from '@/themes/BLOG_THEME' // 自动加载当前启用的主题
import { dynamicImport } from '@/themes/theme'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'

// 💡 动态引入自定义 Supabase 组件，关闭 SSR 以避免静态构建报错
const UserProfile = dynamic(() => import('@/components/UserProfile'), { ssr: false })
const UserList = dynamic(() => import('@/components/UserList'), { ssr: false })

/**
 * 对应 [prefix] 路由页面
 */
const Prefix = props => {
  const router = useRouter()

  // 1. 提取纯净路径（移除 query 参数和末尾斜杠）
  const cleanPath = router.asPath ? router.asPath.split('?')[0].replace(/\/$/, '') : ''

  // 🌟 2. 路由拦截：如果是 /profile 路径，渲染个人中心
  if (cleanPath.endsWith('/profile')) {
    return <UserProfile />
  }

  // 🌟 3. 路由拦截：如果是 /users 路径，渲染用户列表
  if (cleanPath.endsWith('/users')) {
    return <UserList />
  }

  // 4. 默认逻辑：正常渲染 NotionNext 原有主题页面
  const { siteInfo, categoryOptions, tagOptions } = props
  const theme = siteConfig('THEME', BLOG.THEME, props.NOTION_CONFIG)
  const Layout = dynamicImport(theme, props.post?.type || 'LayoutSlug')

  const meta = {
    title: `${props.post?.title} | ${siteInfo?.title}`,
    description: props.post?.summary,
    type: 'article',
    slug: props.post?.slug
  }

  return (
    <LayoutBase {...props} meta={meta}>
      <Layout {...props} />
    </LayoutBase>
  )
}

export async function getStaticProps({ params }) {
  const prefix = params.prefix
  const from = 'prefix-index'
  const props = await getGlobalData({ from })

  // 查找对应 prefix/slug 的文章或页面
  props.post = props.allPages?.find(p => p.slug === prefix)

  // 💡 如果是 profile 或 users 这种纯自定义组件路径，无需让 Notion 校验 404
  const isCustomPath = prefix === 'profile' || prefix === 'users'

  return {
    props,
    revalidate: siteConfig('NEXT_REVALIDATE_SECOND', BLOG.NEXT_REVALIDATE_SECOND, props.NOTION_CONFIG),
    notFound: isCustomPath ? false : !props.post
  }
}

export async function getStaticPaths() {
  // 生成预渲染路径，这里默认为空，交由 ISR 增量生成
  return {
    paths: [],
    fallback: 'blocking'
  }
}

export default Prefix
