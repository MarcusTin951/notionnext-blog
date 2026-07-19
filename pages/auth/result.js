import { useRouter } from 'next/router'
import dynamic from 'next/dynamic'

// 💡 核心大招：利用 dynamic import 并关闭服务端渲染 (ssr: false)
// 强行把原本可能报错的 Slug 组件降维成纯前端加载，彻底跳过静态打包期间的扫描
const DynamicSlug = dynamic(() => import('../[prefix]'), {
  ssr: false,
  loading: () => (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#ffffff' }}>
      <div style={{ color: '#71717a', fontSize: '14px' }}>正在加载授权结果...</div>
    </div>
  )
})

/**
 * 授权结果根页面
 */
const UI = props => {
  const router = useRouter()
  return <DynamicSlug {...props} msg={router?.query?.msg} title={'授权结果'} />
}

// 💡 终极防御：提供一个最纯净、绝不依赖任何 Notion 数据源的空静态占位
// 这样在 next export 阶段，打包引擎看到的是个空壳，0.001秒直接通过，绝对不报错！
export const getStaticProps = async () => {
  return {
    props: {},
  }
}

export default UI
