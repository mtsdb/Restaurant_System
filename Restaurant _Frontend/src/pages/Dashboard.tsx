import React, { useEffect, useState } from 'react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth()
  const [me, setMe] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      try {
        const { data } = await api.get('/auth/me/')
        setMe(data)
      } catch (e: any) {
        setError(e?.response?.data?.detail || 'Failed to load profile')
      }
    }
    run()
  }, [])

  return (
    <div style={{ padding: 20, fontFamily: 'system-ui' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Dashboard</h2>
        <button onClick={logout}>Logout</button>
      </div>
      <p>Signed in as:</p>
      <pre style={{ background: '#f5f5f5', padding: 12 }}>
        {JSON.stringify(user || me, null, 2)}
      </pre>
      {error && <div style={{ color: 'red' }}>{error}</div>}
    </div>
  )
}

export default Dashboard
