import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function CleanSignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push('/')
    })
  }, [router])

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
      router.push('/')
    }
  }

  return (
    <div style={styles.container}>
      {/* 登录卡片 */}
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

          <button 
            type="submit" 
            disabled={loading}
            style={{
              ...styles.button,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '正在验证...' : '验证并进入'}
          </button>
        </form>
      </div>
    </div>
  )
}

const styles = {
  container: {
    // 👇 关键修改：直接继承网页的主体字体，同时兼容系统的无衬线字体栈
    fontFamily: 'inherit, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  card: {
    width: '100%',
    maxWidth: '380px',
    padding: '40px 32px',
    background: '#ffffff',
    border: '1px solid #e4e4e7', 
    borderRadius: '12px',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.03)', 
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  title: {
    fontSize: '22px',
    fontWeight: '600',
    color: '#09090b', 
    margin: '0 0 6px 0',
    letterSpacing: '-0.5px',
    fontFamily: 'inherit', // 继承主页标题字体
  },
  subtitle: {
    fontSize: '14px',
    color: '#71717a', 
    margin: 0,
    fontFamily: 'inherit',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#27272a',
    fontFamily: 'inherit',
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    boxSizing: 'border-box',
    background: '#fff',
    border: '1px solid #d4d4d8',
    borderRadius: '6px',
    color: '#09090b',
    fontSize: '14px',
    outline: 'none',
    fontFamily: 'inherit', // 确保输入框打字时的字体也一致
  },
  errorContainer: {
    background: '#fef2f2',
    border: '1px solid #fca5a5',
    padding: '10px 12px',
    borderRadius: '6px',
  },
  errorText: {
    fontSize: '13px',
    color: '#dc2626',
    fontFamily: 'inherit',
  },
  button: {
    width: '100%',
    padding: '12px',
    background: '#09090b', 
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    marginTop: '6px',
    fontFamily: 'inherit', // 按钮字体一致
  }
}
