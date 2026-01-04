import React, { createContext, useContext, useMemo, useState, useEffect } from 'react'
import { clearAuth, getAccessToken, getUser, saveTokensAndUser } from '../utils/authStorage'
import * as authApi from '../api/auth'
import type { AppUser } from '../utils/roles'

interface AuthContextShape {
  user: AppUser | null
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextShape | undefined>(undefined)

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(getUser())
  const isAuthenticated = !!getAccessToken()

  const login = async (username: string, password: string) => {
    const data = await authApi.login(username, password)
    setUser(data.user as AppUser)
  }

  const logout = () => {
    clearAuth()
    setUser(null)
  }

  // keep state in sync across tabs
  useEffect(() => {
    const handler = () => setUser(getUser())
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  const value = useMemo(() => ({ user, isAuthenticated, login, logout }), [user, isAuthenticated])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
