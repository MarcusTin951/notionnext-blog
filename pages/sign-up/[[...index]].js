import { createClient } from '@supabase/supabase-js'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function SignUpPage() {
  const router = useRouter()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        router.push('/')
      }
    })
    return () => subscription.unsubscribe()
  }, [router])

  return (
    <div style={{ maxWidth: '420px', margin: '80px auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>管理后台 - 注册账户</h2>
      <Auth
        supabaseClient={supabase}
        appearance={{ theme: ThemeSupa }}
        view="sign_up" // 强制这个页面只显示注册表单
        providers={[]} // 注册页我们可以关闭第三方，仅允许邮箱注册
        localization={{
          variables: {
            sign_up: {
              email_label: '电子邮箱',
              password_label: '设置密码',
              button_label: '注 册',
              loading_button_label: '正在注册...',
              link_text: '已有账号？直接登录'
            }
          }
        }}
      />
    </div>
  )
}
