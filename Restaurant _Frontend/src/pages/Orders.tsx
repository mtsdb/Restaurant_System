import React, { useState } from 'react'
import * as ordersApi from '../api/orders'
import * as menuApi from '../api/menu'
import * as tablesApi from '../api/tables'

const Orders: React.FC = () => {
  const [sessionId, setSessionId] = useState('')
  const [orderId, setOrderId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [note, setNote] = useState('')
  const [order, setOrder] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [items, setItems] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all')
  const [search, setSearch] = useState('')
  const [tables, setTables] = useState<any[]>([])
  const [selectedTableId, setSelectedTableId] = useState<number | ''>('')

  React.useEffect(() => {
    const load = async () => {
      try {
        const [{ data: cats }, { data: items }, { data: tbls }] = await Promise.all([
          menuApi.listCategories(),
          menuApi.listItems(),
          tablesApi.listTables(),
        ])
        setCategories(cats)
        setItems(items)
        setTables(tbls)
      } catch (e) {
        // ignore initial load errors; page actions will surface
      }
    }
    load()
  }, [])

  const createOrder = async () => {
    setError(null)
    setMessage(null)
    setLoading(true)
    try {
      const { data } = await ordersApi.createOrderForSession(Number(sessionId))
      setOrder(data)
      setOrderId(String(data.id))
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to create order')
    } finally {
      setLoading(false)
    }
  }

  const fetchOrder = async () => {
    setError(null)
    setMessage(null)
    setLoading(true)
    try {
      const { data } = await ordersApi.getOrder(Number(orderId))
      setOrder(data)
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to fetch order')
    } finally {
      setLoading(false)
    }
  }

  const openSessionForTable = async () => {
    if (!selectedTableId) return
    setError(null)
    setLoading(true)
    try {
      const { data } = await tablesApi.openSession(Number(selectedTableId))
      // open session returns session with id
      setSessionId(String(data.id))
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to open session for table')
    } finally {
      setLoading(false)
    }
  }

  const addItem = async (id: number) => {
    setError(null)
    setMessage(null)
    setLoading(true)
    try {
      await ordersApi.addItemToOrder(Number(orderId), { item_id: id, quantity, note_to_chef: note })
      await fetchOrder()
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to add item')
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
      setMessage('Bill requested. Cashier will see this in Billing.')
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to request bill')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Orders</h2>
        {loading && <span className="text-sm text-gray-500">Working…</span>}
      </div>

      {message && <div className="rounded-md border p-3 text-sm border-green-300 bg-green-50 text-green-800">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-1">
          <h3 className="font-medium mb-3">Table & Session</h3>
          <div className="space-y-3">
            <div>
              <label className="label">Table</label>
              <select
                className="input"
                value={selectedTableId}
                onChange={(e) => setSelectedTableId(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">Select a table</option>
                {tables.map((t) => (
                  <option key={t.id} value={t.id}>
                    Table {t.number} — {t.status}
                  </option>
                ))}
              </select>
              {selectedTableId && (
                <div className="mt-2 text-xs text-gray-600">
                  {(() => {
                    const t = tables.find((x) => x.id === selectedTableId)
                    if (!t) return null
                    if (t.status === 'available') {
                      return 'This table is available. Open a new session to start ordering.'
                    }
                    return 'This table is occupied. Enter the active session ID for this table.'
                  })()}
                </div>
              )}
            </div>
            <div>
              <label className="label">Session ID</label>
              <div className="flex gap-2">
                <input
                  className="input flex-1"
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value)}
                  placeholder={selectedTableId ? 'Enter active session id if occupied' : 'Select a table first'}
                />
                <button
                  className="btn btn-secondary"
                  onClick={openSessionForTable}
                  disabled={!selectedTableId || (!!selectedTableId && tables.find((t) => t.id === selectedTableId)?.status !== 'available')}
                  title="Open session for available table"
                >
                  Open
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-primary flex-1" onClick={createOrder} disabled={!sessionId}>Create Order</button>
              <button className="btn btn-secondary flex-1" onClick={fetchOrder} disabled={!orderId}>Reload Order</button>
            </div>
            <div>
              <label className="label">Payment</label>
              <button className="btn btn-primary w-full" onClick={requestBill} disabled={!sessionId} title="Ask cashier to prepare bill">
                Request Bill
              </button>
              <div className="text-xs text-gray-500 mt-1">Request the bill before closing the table.</div>
            </div>
            <div>
              <label className="label">Current Order ID</label>
              <input className="input" value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="after creating, it appears here" />
            </div>
            <div>
              <label className="label">Quantity</label>
              <input className="input" type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} min={1} />
            </div>
            <div>
              <label className="label">Note to chef</label>
              <input className="input" placeholder="no onions, extra spicy…" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="card lg:col-span-2">
          <h3 className="font-medium mb-3">Menu</h3>
          <div className="flex gap-3 mb-4">
            <select className="input max-w-xs" value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value === 'all' ? 'all' : Number(e.target.value))}>
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <input className="input" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items
              .filter((i) => (selectedCategory === 'all' ? true : i.category?.id === selectedCategory))
              .filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
              .map((i) => (
                <div key={i.id} className="border rounded-lg p-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{i.name}</div>
                    <div className="text-sm text-gray-500">${i.price}</div>
                  </div>
                  <div className="text-xs text-gray-500">{i.category?.name}</div>
                  <button
                    className="btn btn-primary mt-1"
                    onClick={() => addItem(i.id)}
                    disabled={!orderId}
                  >
                    Add to order
                  </button>
                </div>
              ))}
          </div>
        </div>
      </div>

      {order && (
        <div className="card">
          <h3 className="font-medium mb-2">Order #{order.id}</h3>
          {order.items?.length ? (
            <ul className="divide-y">
              {order.items?.map((it: any) => (
                <li key={it.id} className="py-2 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{it.item?.name} x {it.quantity}</div>
                    <div className="text-xs text-gray-500">status: {it.status}</div>
                  </div>
                  <div className="text-sm">${it.price_snapshot}</div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-gray-500">No items yet.</div>
          )}
        </div>
      )}
    </div>
  )
}

export default Orders
