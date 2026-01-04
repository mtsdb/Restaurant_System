import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { hasRole, isAdmin } from '../utils/roles'

const ProtectedRoute: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

export default ProtectedRoute

export const RoleGate: React.FC<React.PropsWithChildren & { roles?: string[]; allowAdmin?: boolean; adminOnly?: boolean }> = ({ children, roles, allowAdmin = true, adminOnly = false }) => {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  if (adminOnly) {
    return isAdmin(user) ? <>{children}</> : <Navigate to="/dashboard" replace />
  }
  if (allowAdmin && isAdmin(user)) return <>{children}</>
  if (!roles || roles.length === 0) return <>{children}</>
  const ok = roles.some((r) => hasRole(user, r))
  if (!ok) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}
