import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function UserProfile() {
  const [user, setUser] = useState(null)
  const [fullName, setFullName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user)
        setFullName(user.user_metadata?.full_name || '')
        setAvatarUrl(user.user_metadata?.avatar_url || '')
      }
    })
  }, [])

  const handleUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName, avatar_url: avatarUrl }
    })

    setLoading(false)
    if (error) {
      setMessage('更新失败: ' + error.message)
    } else {
      setMessage('✨ 个人信息更新成功！')
    }
  }

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>个人中心</h1>
      {user ? (
        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', marginBottom: '6px', fontWeight: '500' }}>邮箱账号</label>
            <input type="text" disabled value={user.email} style={{ width: '100%', padding: '10px', background: '#f4f4f5', border: '1px solid #d4d4d8', borderRadius: '6px', color: '#71717a' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '14px', marginBottom: '6px', fontWeight: '500' }}>昵称 / 名字</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="输入你的名字" style={{ width: '100%', padding: '10px', border: '1px solid #d4d4d8', borderRadius: '6px' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '14px', marginBottom: '6px', fontWeight: '500' }}>头像图片链接 (URL)</label>
            <input type="text" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://example.com/avatar.png" style={{ width: '100%', padding: '10px', border: '1px solid #d4d4d8', borderRadius: '6px' }} />
          </div>
          {message && <p style={{ fontSize: '14px', color: message.includes('成功') ? '#16a34a' : '#dc2626' }}>{message}</p>}
          <button type="submit" disabled={loading} style={{ padding: '10px 20px', background: '#09090b', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>
            {loading ? '保存中...' : '保存修改'}
          </button>
        </form>
      ) : (
        <p>正在加载用户信息...</p>
      )}
    </div>
  )
}
