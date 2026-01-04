import React from 'react'
import * as kitchenApi from '../api/kitchen'
import * as baristaApi from '../api/barista'
import * as settingsApi from '../api/settings'
import * as tablesApi from '../api/tables'

type OrderItem = {
  id: number
  quantity: number
  price_snapshot: number
  status: string
  created_at?: string
  item?: { name?: string; type?: string }
  order?: { session?: { table?: { number?: number } } }
}

type SessionInfo = {
  id: number
  status: string
  bill_requested: boolean
  bill_requested_at?: string
  table?: { id: number; number: number; status: string }
}

type AppSettings = {
  tax_rate: number
  service_charge_rate: number
  discount_rate: number
}

const Waiter: React.FC = () => {
  const [sessionId, setSessionId] = React.useState('')
  const [items, setItems] = React.useState<OrderItem[]>([])
  const [session, setSession] = React.useState<SessionInfo | null>(null)
  const [settings, setSettings] = React.useState<AppSettings | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [message, setMessage] = React.useState<string | null>(null)
  const [activeSessions, setActiveSessions] = React.useState<Array<{ id: number; table: number; bill_requested: boolean; bill_requested_at?: string }>>([])

  React.useEffect(() => {
    const fetchActive = async () => {
      try {
        const { data } = await tablesApi.listActiveSessions()
        setActiveSessions(data)
      } catch (e) {
        // ignore
      }
    }
    fetchActive()
  }, [])

  const load = async () => {
    if (!sessionId) return
    setLoading(true)
    setError(null)
    setMessage(null)
    try {
      const [foodRes, drinkRes, sessRes, setRes] = await Promise.all([
        kitchenApi.listKitchenItems({ session: Number(sessionId) }),
        baristaApi.listBaristaItems({ session: Number(sessionId) }),
        tablesApi.getSession(Number(sessionId)),
        settingsApi.getSettings(),
      ])
      const merged: OrderItem[] = [...foodRes.data, ...drinkRes.data]
      merged.sort((a, b) => (new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()))
      setItems(merged)
      setSession(sessRes.data)
      setSettings(setRes.data)
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to load session details')
    } finally {
      setLoading(false)
    }
  }

  const requestBill = async () => {
    if (!sessionId) return
    setError(null)
    setMessage(null)
    setLoading(true)
    try {
      await tablesApi.requestBill(Number(sessionId))
      setMessage('Bill requested. Cashier will create the invoice.')
      await load()
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to request bill')
    } finally {
      setLoading(false)
    }
  }

  const totals = React.useMemo(() => {
    const subtotal = items.reduce((sum, it) => sum + Number(it.price_snapshot || 0) * Number(it.quantity || 0), 0)
    const taxRate = Number(settings?.tax_rate || 0) / 100
    const svcRate = Number(settings?.service_charge_rate || 0) / 100
    const discRate = Number(settings?.discount_rate || 0) / 100
    const discount = subtotal * discRate
    const service = subtotal * svcRate
    const taxBase = subtotal - discount + service
    const tax = taxBase * taxRate
    const total = subtotal - discount + service + tax
    return { subtotal, discount, service, tax, total }
  }, [items, settings])

  const statusBadge = (s: string) => {
    const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium '
    if (s === 'waiting') return base + 'bg-yellow-100 text-yellow-800'
    if (s === 'in_progress') return base + 'bg-blue-100 text-blue-800'
    if (s === 'ready') return base + 'bg-green-100 text-green-800'
    if (s === 'served') return base + 'bg-gray-200 text-gray-700'
    return base + 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Service (Waiter)</h2>
        <div className="flex gap-2">
          <select
            className="input"
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
          >
            <option value="">Active sessions…</option>
            {activeSessions.map((s) => (
              <option key={s.id} value={s.id}>
                {`Table ${s.table} • #${s.id}${s.bill_requested ? ' • bill requested' : ''}`}
              </option>
            ))}
          </select>
          <input className="input" placeholder="Session ID" value={sessionId} onChange={(e) => setSessionId(e.target.value)} />
          <button className="btn btn-secondary" onClick={load} disabled={!sessionId || loading}>{loading ? 'Loading…' : 'Refresh'}</button>
        </div>
      </div>

      {message && <div className="rounded-md border p-3 text-sm border-green-300 bg-green-50 text-green-800">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {session && (
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">Table</div>
              <div className="text-lg font-semibold">{session.table?.number}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Session</div>
              <div className="text-lg font-semibold">#{session.id} • {session.status}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Bill</div>
              <div className="text-sm">
                {session.bill_requested ? (
                  <span className="text-green-700">Requested {session.bill_requested_at ? `• ${new Date(session.bill_requested_at).toLocaleString()}` : ''}</span>
                ) : (
                  <div className="space-y-1">
                    <span className="text-gray-500 block">Not requested</span>
                    <button className="btn btn-primary" onClick={requestBill}>Request Bill</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <div className="card">
            <h3 className="font-medium mb-2">Items Progress</h3>
            {items.length === 0 ? (
              <div className="text-sm text-gray-500">No items for this session.</div>
            ) : (
              <ul className="divide-y">
                {items.map((it) => (
                  <li key={it.id} className="py-2 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{it.item?.name} x {it.quantity}</div>
                      <div className="text-xs text-gray-500">Table {it.order?.session?.table?.number}</div>
                    </div>
                    <span className={statusBadge(it.status)}>{it.status.replace('_', ' ')}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div>
          <div className="card">
            <h3 className="font-medium mb-2">Estimated Bill</h3>
            {!settings ? (
              <div className="text-sm text-gray-500">Load a session to see totals.</div>
            ) : (
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>${totals.subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Service ({settings.service_charge_rate}%)</span><span>${totals.service.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Discount ({settings.discount_rate}%)</span><span>-${totals.discount.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Tax ({settings.tax_rate}%)</span><span>${totals.tax.toFixed(2)}</span></div>
                <div className="border-t pt-2 mt-2 flex justify-between font-semibold"><span>Total</span><span>${totals.total.toFixed(2)}</span></div>
                {!session?.bill_requested && (
                  <div className="text-xs text-gray-500">Final invoice is created by the cashier after you request the bill.</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Waiter
