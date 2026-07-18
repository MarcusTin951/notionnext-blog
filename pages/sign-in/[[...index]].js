import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function BeautifulSignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState('') // 改为直接接收标准的 Email
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)

  // 1. 进来时先检查，如果其实已经登录了，直接回首页
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push('/')
    })
  }, [router])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    // 2. 直接使用用户输入的完整 Gmail 邮箱和密码进行登录
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
          <h2 style={styles.title}>ATin Story Login</h2>
          <p style={styles.subtitle}>请输入邮箱和密码以继续</p>
        </div>

        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>邮箱地址</label>
            <input 
              type="email" // 更改为 email 类型，自带格式校验
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
              <span style={styles.errorIcon}>⚠️</span>
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
            {loading ? '正在验证密钥...' : '验证并进入'}
          </button>
        </form>
            
      </div>
    </div>
  )
}

// 💅 样式定义保持高级感不改变
const styles = {
  container: {
    position: 'relative',
    width: '100vw',
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#09090b',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    overflow: 'hidden',
  },
  glow1: {
    position: 'absolute',
    width: '400px',
    height: '400px',
    top: '-100px',
    left: '-100px',
    background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(0,0,0,0) 70%)',
    zIndex: 1,
  },
  glow2: {
    position: 'absolute',
    width: '500px',
    height: '500px',
    bottom: '-150px',
    right: '-150px',
    background: 'radial-gradient(circle, rgba(168,85,247,0.15) 0%, rgba(0,0,0,0) 70%)',
    zIndex: 1,
  },
  card: {
    position: 'relative',
    zIndex: 10,
    width: '100%',
    maxWidth: '400px',
    padding: '40px',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '20px',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
    backdropFilter: 'blur(16px)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  logo: {
    fontSize: '32px',
    marginBottom: '16px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#f4f4f5',
    margin: '0 0 8px 0',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontSize: '14px',
    color: '#a1a1aa',
    margin: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#e4e4e7',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    boxSizing: 'border-box',
    background: '#18181b',
    border: '1px solid #27272a',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    outline: 'none',
  },
  errorContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    padding: '10px 14px',
    borderRadius: '8px',
  },
  errorIcon: {
    fontSize: '14px',
  },
  errorText: {
    fontSize: '13px',
    color: '#f87171',
  },
  button: {
    width: '100%',
    padding: '14px',
    background: '#fff',
    color: '#000',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'transform 0.1s ease, background 0.2s',
    marginTop: '10px',
  },
  footer: {
    textAlign: 'center',
    fontSize: '11px',
    color: '#52525b',
    marginTop: '32px',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
  }
}
