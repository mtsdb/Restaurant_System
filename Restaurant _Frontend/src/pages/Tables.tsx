import React, { useEffect, useState } from 'react'
import * as tablesApi from '../api/tables'
import { useAuth } from '../context/AuthContext'
import { hasRole, isAdmin } from '../utils/roles'

const Tables: React.FC = () => {
  const { user } = useAuth()
  const admin = isAdmin(user)
  const waiter = hasRole(user, 'waiter')
  const cashier = hasRole(user, 'cashier')
  const [tables, setTables] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [newTable, setNewTable] = useState<string>('')
  const [createLoading, setCreateLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await tablesApi.listTables()
      setTables(data)
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to load tables')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const open = async (id: number) => {
    setError(null)
    setActionLoading(id)
    try {
      await tablesApi.openSession(id)
      await load()
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to open session')
    } finally {
      setActionLoading(null)
    }
  }

  const close = async (id: number) => {
    setError(null)
    setActionLoading(id)
    try {
      await tablesApi.closeSession(id)
      await load()
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to close session')
    } finally {
      setActionLoading(null)
    }
  }

  const addTable = async () => {
    if (!newTable) return
    setError(null)
    setCreateLoading(true)
    try {
      await tablesApi.createTable(Number(newTable))
      setNewTable('')
      await load()
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to add table')
    } finally {
      setCreateLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Tables</h2>
        <div className="flex items-center gap-2">
          {admin && (
            <>
              <input
                type="number"
                min={1}
                className="input w-36"
                placeholder="New table #"
                value={newTable}
                onChange={(e) => setNewTable(e.target.value)}
              />
              <button className="btn btn-primary" onClick={addTable} disabled={!newTable || createLoading}>
                {createLoading ? 'Adding…' : 'Add Table'}
              </button>
            </>
          )}
          <button className="btn btn-secondary" onClick={load} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh'}</button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">Table</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tables.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{t.number}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${t.status === 'occupied' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                    {t.status}
                  </span>
                </td>
                <td className="px-4 py-3 space-x-2">
                  {(admin || waiter) && (
                    <button
                      className="btn btn-primary"
                      onClick={() => open(t.id)}
                      disabled={t.status === 'occupied' || actionLoading === t.id}
                    >
                      {actionLoading === t.id ? 'Working…' : 'Open Session'}
                    </button>
                  )}
                  {(admin || cashier) && (
                    <button
                      className="btn btn-secondary"
                      onClick={() => close(t.id)}
                      disabled={t.status !== 'occupied' || actionLoading === t.id}
                    >
                      {actionLoading === t.id ? 'Working…' : 'Close Session'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Tables
