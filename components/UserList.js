import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function UserList() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('user_public_profiles').select('*').then(({ data, error }) => {
      if (!error && data) {
        setUsers(data)
      }
      setLoading(false)
    })
  }, [])

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>网站成员列表</h1>
      {loading ? (
        <p>加载中...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
          {users.map((u) => (
            <div key={u.id} style={{ padding: '16px', border: '1px solid #e4e4e7', borderRadius: '8px', background: '#fff', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f4f4f5', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#71717a' }}>
                {u.avatar_url ? <img src={u.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (u.full_name?.[0] || 'U')}
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '600', margin: '0 0 4px 0', color: '#09090b' }}>{u.full_name || '未命名用户'}</h3>
                <p style={{ fontSize: '12px', color: '#71717a', margin: 0 }}>加入时间: {new Date(u.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
