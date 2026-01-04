import React from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { hasRole, isAdmin } from '../utils/roles'

const Layout: React.FC = () => {
  const { logout, user } = useAuth()
  const link = 'block rounded px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700'
  const active = 'bg-blue-100 text-blue-800 font-semibold'
  const admin = isAdmin(user)
  const waiter = hasRole(user, 'waiter')
  const chef = hasRole(user, 'chef')
  const barista = hasRole(user, 'barista')
  const cashier = hasRole(user, 'cashier')
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r border-gray-200 bg-white">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-lg font-semibold">Restaurant System</h1>
        </div>
        <nav className="p-3 space-y-1">
          <NavLink to="/dashboard" className={({ isActive }) => `${link} ${isActive ? active : ''}`}>Dashboard</NavLink>
          {(admin || waiter || cashier) && (
            <NavLink to="/tables" className={({ isActive }) => `${link} ${isActive ? active : ''}`}>Tables</NavLink>
          )}
          {admin && (
            <NavLink to="/menu" className={({ isActive }) => `${link} ${isActive ? active : ''}`}>Menu</NavLink>
          )}
          {(admin || waiter) && (
            <>
              <NavLink to="/waiter" className={({ isActive }) => `${link} ${isActive ? active : ''}`}>Service</NavLink>
              <NavLink to="/orders" className={({ isActive }) => `${link} ${isActive ? active : ''}`}>Orders</NavLink>
            </>
          )}
          {(admin || chef) && (
            <NavLink to="/kitchen" className={({ isActive }) => `${link} ${isActive ? active : ''}`}>Kitchen</NavLink>
          )}
          {(admin || barista) && (
            <NavLink to="/barista" className={({ isActive }) => `${link} ${isActive ? active : ''}`}>Barista</NavLink>
          )}
          {(admin || cashier) && (
            <NavLink to="/billing" className={({ isActive }) => `${link} ${isActive ? active : ''}`}>Billing</NavLink>
          )}
          {admin && (
            <NavLink to="/settings" className={({ isActive }) => `${link} ${isActive ? active : ''}`}>Settings</NavLink>
          )}
        </nav>
        <div className="p-3 border-t border-gray-200">
          <button onClick={logout} className="btn btn-secondary w-full">Logout</button>
        </div>
      </aside>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
