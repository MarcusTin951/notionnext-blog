import { createClient } from '@supabase/supabase-js'
import { useState, useEffect } from 'react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function CleanSignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // 1. 捕获被其他设备挤下线的提示
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('error') === 'device_conflict') {
      setErrorMsg('⚠️ 您的账号已在其他设备登录，您已被强制下线。')
    }

    // 2. 静默检测：如果已有 Session 且本地设备锁还在，直接静默跳转首页
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const localCookies = document.cookie.split('; ').reduce((acc, item) => {
          const [k, v] = item.split('=')
          if (k) acc[k.trim()] = v
          return acc
        }, {})
        
        // 只要本地有设备 Token 标记，直接进入系统
        if (localCookies['sb-device-token']) {
          window.location.href = '/'
        }
      }
    })
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    // 🌟 1. 验证账号密码
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
      const userId = data.user.id
      const accessToken = data.session.access_token

      try {
        // 🌟 2. 生成一个唯一的设备标识 Token
        const newDeviceToken = 'dev_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now()

        // 🌟 3. 覆盖数据库中的活跃设备标识（抢占式占坑）
        const { error: upsertError } = await supabase
          .from('user_device_sessions')
          .upsert({ 
            user_id: userId, 
            active_token: newDeviceToken,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' })

        if (upsertError) throw upsertError

        // 🌟 4. 【关键设置】：将 Cookie 过期时间设置为 10 年（永久登录体验）
        // 315,360,000 秒 = 10 年
        const TEN_YEARS = 315360000 
        document.cookie = `sb-access-token=${accessToken}; path=/; max-age=${TEN_YEARS}; SameSite=Lax`
        document.cookie = `sb-device-token=${newDeviceToken}; path=/; max-age=${TEN_YEARS}; SameSite=Lax`

        // 🌟 5. 进入首页
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
          <p style={styles.subtitle}>请输入邮箱和密码以继续访问</p>
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
  header: { textAlign: 'center', marginBottom: '32px' },
  title: { fontSize: '22px', fontWeight: '600', color: '#09090b', margin: '0 0 6px 0', letterSpacing: '-0.5px' },
  subtitle: { fontSize: '14px', color: '#71717a', margin: 0 },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '500', color: '#27272a' },
  input: { width: '100%', padding: '10px 14px', boxSizing: 'border-box', background: '#fff', border: '1px solid #d4d4d8', borderRadius: '6px', color: '#09090b', fontSize: '14px', outline: 'none' },
  errorContainer: { background: '#fef2f2', border: '1px solid #fca5a5', padding: '10px 12px', borderRadius: '6px' },
  errorText: { fontSize: '13px', color: '#dc2626' },
  button: { width: '100%', padding: '12px', background: '#09090b', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '500', marginTop: '6px', cursor: 'pointer' }
}
