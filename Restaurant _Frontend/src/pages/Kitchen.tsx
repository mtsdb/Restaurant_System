import React, { useEffect, useState } from 'react'
import * as kitchenApi from '../api/kitchen'
import * as ordersApi from '../api/orders'

const Kitchen: React.FC = () => {
  const [items, setItems] = useState<any[]>([])
  const [statusFilter, setStatusFilter] = useState('')
  const [dashboard, setDashboard] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [workingId, setWorkingId] = useState<number | null>(null)

  const load = async () => {
    setError(null)
    try {
      const [{ data: list }, { data: dash }] = await Promise.all([
        kitchenApi.listKitchenItems(statusFilter ? { status: statusFilter } : undefined),
        kitchenApi.kitchenDashboard(statusFilter ? { status: statusFilter } : undefined),
      ])
      setItems(list)
      setDashboard(dash)
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to load kitchen data')
    }
  }

  useEffect(() => { load() }, [statusFilter])

  const actionFor = (status: string): { label: string; next: string } | null => {
    if (status === 'waiting') return { label: 'Start', next: 'in_progress' }
    if (status === 'in_progress') return { label: 'Mark Ready', next: 'ready' }
    if (status === 'ready') return { label: 'Mark Served', next: 'served' }
    return null
  }

  const updateStatus = async (id: number, next: string) => {
    setError(null)
    setWorkingId(id)
    try {
      await ordersApi.updateOrderItemStatus(id, next)
      await load()
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to update status')
    } finally {
      setWorkingId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Kitchen</h2>
        <div className="flex gap-2 items-center">
          <select className="input max-w-xs" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All</option>
            <option value="waiting">Waiting</option>
            <option value="in_progress">In Progress</option>
            <option value="ready">Ready</option>
          </select>
          <button className="btn btn-secondary" onClick={load}>Refresh</button>
        </div>
      </div>

      {dashboard && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card"><div className="text-sm text-gray-500">Waiting</div><div className="text-2xl font-semibold">{dashboard.food?.waiting ?? 0}</div></div>
          <div className="card"><div className="text-sm text-gray-500">In Progress</div><div className="text-2xl font-semibold">{dashboard.food?.in_progress ?? 0}</div></div>
          <div className="card"><div className="text-sm text-gray-500">Ready</div><div className="text-2xl font-semibold">{dashboard.food?.ready ?? 0}</div></div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((it) => {
          const act = actionFor(it.status)
          return (
            <div key={it.id} className="card">
              <div className="flex items-center justify-between">
                <div className="font-medium">{it.item?.name}</div>
                <span className="text-xs rounded-full px-2 py-1 bg-gray-100">#{it.id}</span>
              </div>
              <div className="text-sm text-gray-600">Table {it.order?.session?.table?.number} • Qty {it.quantity}</div>
              {it.note_to_chef && <div className="text-xs text-gray-500">Note: {it.note_to_chef}</div>}
              <div className="mt-3 flex gap-2">
                {act ? (
                  <button
                    className="btn btn-primary"
                    onClick={() => updateStatus(it.id, act.next)}
                    disabled={workingId === it.id}
                  >
                    {workingId === it.id ? 'Working…' : act.label}
                  </button>
                ) : (
                  <button className="btn btn-secondary" disabled>Completed</button>
                )}
              </div>
            </div>
          )
        })}
      </div>
      {error && <div className="alert alert-error">{error}</div>}
    </div>
  )
}

export default Kitchen
