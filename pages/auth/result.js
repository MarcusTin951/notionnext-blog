import { fetchGlobalAllData } from '@/lib/db/SiteDataApi'
import { useRouter } from 'next/router'
import Slug from '../[prefix]'

/**
 * 获取全局数据用于页面渲染
 */
export const getStaticProps = async () => {
  const from = 'auth'
  const props = await fetchGlobalAllData({ from })

  // 确保哪怕 Notion 里没配置相关数据，props 也不会是 undefined
  if (props && props.allPages) {
    delete props.allPages
  }
  
  return {
    props: props || {},
    // 强制设置重新验证时间，防止导出时因数据源为空被卡死
    revalidate: 1 
  }
}

/**
 * 根据 notion 的 slug 访问页面
 * 解析二级目录 /article/about
 */
const UI = props => {
  const router = useRouter()
  return <Slug {...props} msg={router?.query?.msg} title={'授权结果'} />
}

export default UI
