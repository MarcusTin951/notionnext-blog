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
    // 捕获可能从其他地方传过来的错误提示
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('error') === 'device_conflict') {
      setErrorMsg('⛔ 该账号正由另一台设备使用中，请等待其退出后再试。')
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) window.location.href = '/'
    })
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    // 🌟 1. 先去验证账号密码是否正确
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
        // 🌟 2. 检查 Supabase 数据库中该账号当前是否已被其他设备锁定
        const { data: sessionData } = await supabase
          .from('user_device_sessions')
          .select('active_token')
          .eq('user_id', userId)
          .maybeSingle()

        // 解析本地浏览器当前可能存在的设备锁 Token
        const localCookies = document.cookie.split('; ').reduce((acc, item) => {
          const [k, v] = item.split('=')
          if (k) acc[k.trim()] = v
          return acc
        }, {})
        const myLocalDeviceToken = localCookies['sb-device-token']

        // 🌟 3. 如果数据库有锁，且锁定的并不是我当前的浏览器设备 -> 强行拦截并退出登录态
        if (sessionData && sessionData.active_token && sessionData.active_token !== myLocalDeviceToken) {
          await supabase.auth.signOut()
          setErrorMsg('⛔ 该账号正由另一台设备使用中，请等待其退出后再试。')
          setLoading(false)
          return
        }

        // 🌟 4. 如果没人占坑（或是这台设备重复登录），则顺利续坑/占坑
        const newDeviceToken = myLocalDeviceToken || 'dev_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now()

        // 写入锁表，对外锁死该设备
        const { error: upsertError } = await supabase
          .from('user_device_sessions')
          .upsert({ 
            user_id: userId, 
            active_token: newDeviceToken,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' })

        if (upsertError) throw upsertError

        // 🌟 5. 统一写入 Cookie 凭证，放行进入首页
        document.cookie = `sb-access-token=${accessToken}; path=/; max-age=604800; SameSite=Lax; Secure`
        document.cookie = `sb-device-token=${newDeviceToken}; path=/; max-age=604800; SameSite=Lax; Secure`

        window.location.href = '/'
      } catch (err) {
        console.error('设备状态锁验证失败:', err)
        setErrorMsg('系统开小差了，请重试')
        setLoading(false)
      }
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h2 style={styles.title}>Atin Story</h2>
          <p style={styles.subtitle}>请输入邮箱和密码证以继续访问</p>
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
