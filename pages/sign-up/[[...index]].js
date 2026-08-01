import { createClient } from '@supabase/supabase-js'
import { useState, useEffect } from 'react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const TEN_YEARS = 315360000 // 10年过期时间（秒）

export default function CleanSignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // 1. 捕获被其他设备挤下线或 OAuth 登录失败的提示
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('error') === 'device_conflict') {
      setErrorMsg('⚠️ 您的账号已在其他设备登录，您已被强制下线。')
    }

    // 2. 核心逻辑：处理常规登录检测 & 捕获 Google OAuth 回调后的 Session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const localCookies = document.cookie.split('; ').reduce((acc, item) => {
          const [k, v] = item.split('=')
          if (k) acc[k.trim()] = v
          return acc
        }, {})

        // 如果已经有设备锁 Cookie，直接跳首页
        if (localCookies['sb-device-token']) {
          window.location.href = '/'
          return
        }

        // 🌟 如果是从 Google 重定向回来的（还没有设备锁 Cookie），自动补全设备锁和 10年 Cookie
        try {
          const userId = session.user.id
          const accessToken = session.access_token
          const newDeviceToken = 'dev_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now()

          // 写入/覆盖 Supabase 中的设备锁表
          await supabase.from('user_device_sessions').upsert({
            user_id: userId,
            active_token: newDeviceToken,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' })

          // 写入 10 年持久化 Cookie
          document.cookie = `sb-access-token=${accessToken}; path=/; max-age=${TEN_YEARS}; SameSite=Lax`
          document.cookie = `sb-device-token=${newDeviceToken}; path=/; max-age=${TEN_YEARS}; SameSite=Lax`

          window.location.href = '/'
        } catch (err) {
          console.error('OAuth 设备锁绑定失败:', err)
        }
      }
    })
  }, [])

  // 🌟 Google OAuth 登录入口
  const handleGoogleLogin = async () => {
    setLoading(true)
    setErrorMsg('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // 登录成功后重定向回当前登录页，由上面的 useEffect 接管设备锁处理
        redirectTo: `${window.location.origin}/sign-in`
      }
    })

    if (error) {
      setErrorMsg('Google 登录失败：' + error.message)
      setLoading(false)
    }
  }

  // 账号密码登录入口
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: password,
    })

    if (error) {
      setErrorMsg('邮箱或密码不正确，请重新输入')
      setLoading(false)
      return
    }

    if (data.session && data.user) {
      try {
        const userId = data.user.id
        const accessToken = data.session.access_token
        const newDeviceToken = 'dev_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now()

        await supabase.from('user_device_sessions').upsert({ 
          user_id: userId, 
          active_token: newDeviceToken,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })

        document.cookie = `sb-access-token=${accessToken}; path=/; max-age=${TEN_YEARS}; SameSite=Lax`
        document.cookie = `sb-device-token=${newDeviceToken}; path=/; max-age=${TEN_YEARS}; SameSite=Lax`

        window.location.href = '/'
      } catch (err) {
        console.error('设备锁更新失败:', err)
        setErrorMsg('登录失败，请稍后重试')
        setLoading(false)
      }
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h2 style={styles.title}>Atin Story</h2>
          <p style={styles.subtitle}>请选择登录方式以继续访问</p>
        </div>

        {/* 🌟 新增：Google 登录按钮 */}
        <button 
          onClick={handleGoogleLogin} 
          disabled={loading} 
          style={styles.googleButton}
        >
          <svg style={{ width: '18px', height: '18px', marginRight: '8px' }} viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          使用 Google 账号登录
        </button>

        <div style={styles.divider}>
          <span style={styles.dividerText}>或使用邮箱密码</span>
        </div>

        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>邮箱地址</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              placeholder="example@atin.qzz.io"
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>密码</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              placeholder="输入密码"
            />
          </div>

          {errorMsg && (
            <div style={styles.errorContainer}>
              <span style={styles.errorText}>{errorMsg}</span>
            </div>
          )}

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? '正在验证...' : '验证并进入'}
          </button>
        </form>
      </div>
    </div>
  )
}

CleanSignInPage.getLayout = function getLayout(page) {
  return page
}

const styles = {
  container: { position: 'fixed', top: 0, left: 0, zIndex: 99999, width: '100vw', height: '100vh', background: '#ffffff', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'inherit, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' },
  card: { width: '100%', maxWidth: '380px', padding: '40px 32px', background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: '12px', boxShadow: '0 4px 24px rgba(0, 0, 0, 0.03)' },
  header: { textAlign: 'center', marginBottom: '24px' },
  title: { fontSize: '22px', fontWeight: '600', color: '#09090b', margin: '0 0 6px 0', letterSpacing: '-0.5px' },
  subtitle: { fontSize: '14px', color: '#71717a', margin: 0 },
  googleButton: { width: '100%', padding: '10px', background: '#ffffff', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background-color 0.2s' },
  divider: { display: 'flex', alignItems: 'center', textAlign: 'center', margin: '20px 0', borderTop: '1px solid #f4f4f5' },
  dividerText: { background: '#fff', padding: '0 10px', fontSize: '12px', color: '#a1a1aa', margin: '-10px auto 0 auto' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '500', color: '#27272a' },
  input: { width: '100%', padding: '10px 14px', boxSizing: 'border-box', background: '#fff', border: '1px solid #d4d4d8', borderRadius: '6px', color: '#09090b', fontSize: '14px', outline: 'none' },
  errorContainer: { background: '#fef2f2', border: '1px solid #fca5a5', padding: '10px 12px', borderRadius: '6px' },
  errorText: { fontSize: '13px', color: '#dc2626' },
  button: { width: '100%', padding: '12px', background: '#09090b', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '500', marginTop: '6px', cursor: 'pointer' }
}
