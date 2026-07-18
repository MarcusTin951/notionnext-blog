import { createClient } from '@supabase/supabase-js'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function SignInPage() {
  const router = useRouter()

  useEffect(() => {
    // 监听登录，一旦成功，跳回首页
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        router.push('/')
      }
    })
    return () => subscription.unsubscribe()
  }, [router])

  return (
    <div style={{ maxWidth: '420px', margin: '80px auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>管理后台 - 登录</h2>
      <Auth
        supabaseClient={supabase}
        appearance={{ theme: ThemeSupa }}
        view="sign_in" // 强制这个页面只显示登录表单
        providers={['github']} // 如果你在 Supabase 开启了 GitHub 登录可以保留，没开可直接删掉这行
        localization={{
          variables: {
            sign_in: {
              email_label: '邮箱地址',
              password_label: '密码',
              button_label: '登 录',
              loading_button_label: '正在登录...',
              link_text: '没有账号？去注册'
            }
          }
        }}
      />
    </div>
  )
}
