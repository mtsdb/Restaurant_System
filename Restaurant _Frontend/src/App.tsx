import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ProtectedRoute, { RoleGate } from './components/ProtectedRoute'
import Layout from './components/Layout'
import Tables from './pages/Tables'
import Menu from './pages/Menu'
import Orders from './pages/Orders'
import Kitchen from './pages/Kitchen'
import Barista from './pages/Barista'
import Billing from './pages/Billing'
import Settings from './pages/Settings'
import Waiter from './pages/Waiter'

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tables" element={<RoleGate roles={["waiter", "cashier"]}><Tables /></RoleGate>} />
        <Route path="/menu" element={<RoleGate roles={[]} allowAdmin><Menu /></RoleGate>} />
        <Route path="/waiter" element={<RoleGate roles={["waiter"]}><Waiter /></RoleGate>} />
        <Route path="/orders" element={<RoleGate roles={["waiter"]}><Orders /></RoleGate>} />
        <Route path="/kitchen" element={<RoleGate roles={["chef"]}><Kitchen /></RoleGate>} />
        <Route path="/barista" element={<RoleGate roles={["barista"]}><Barista /></RoleGate>} />
        <Route path="/billing" element={<RoleGate roles={["cashier"]}><Billing /></RoleGate>} />
        <Route path="/settings" element={<RoleGate roles={[]} allowAdmin><Settings /></RoleGate>} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
