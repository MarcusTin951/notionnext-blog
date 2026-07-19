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
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) window.location.href = '/'
    })
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: password,
    })

    setLoading(false)

    if (error) {
      setErrorMsg('邮箱或密码不正确，请重新输入')
    } else if (data.session) {
      // 💡【核心修正】：登录成功时，强行把 access_token 写入 Cookie，有效期 7 天
      // 这样服务端的 middleware 就能 100% 读取到，绝对不会误判
      const token = data.session.access_token
      document.cookie = `sb-access-token=${token}; path=/; max-age=604800; SameSite=Lax; Secure`
      
      window.location.href = '/'
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
  container: { position: 'fixed', top: 0, left: 0, zIndex: 99999, width: '100vw', height: '100vh', background: '#ffffff', display: 'flex', justifyContent: 'center', alignItems: 'center',fontFamily: 'inherit, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', },
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
