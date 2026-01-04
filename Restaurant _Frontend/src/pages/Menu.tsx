import React, { useEffect, useState } from 'react'
import * as menuApi from '../api/menu'
import { useAuth } from '../context/AuthContext'
import { isAdmin } from '../utils/roles'

const Menu: React.FC = () => {
  const { user } = useAuth()
  const admin = isAdmin(user)
  const [items, setItems] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [filterCat, setFilterCat] = useState<number | 'all'>('all')
  const [creatingCat, setCreatingCat] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [creatingItem, setCreatingItem] = useState(false)
  const [newItem, setNewItem] = useState<{ name: string; price: string; type: 'food' | 'drink'; category_id: string; available: boolean; description?: string }>({ name: '', price: '', type: 'food', category_id: '', available: true })
  const [editingItemId, setEditingItemId] = useState<number | null>(null)
  const [editItem, setEditItem] = useState<{ name?: string; price?: string; type?: 'food' | 'drink'; category_id?: string; available?: boolean; description?: string }>({})

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const [{ data: itemsData }, { data: catData }] = await Promise.all([
        menuApi.listItems(admin ? { all: 1 } : undefined),
        menuApi.listCategories(),
      ])
      setItems(itemsData)
      setCategories(catData)
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to load menu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [admin])

  const filteredItems = items.filter((i) => filterCat === 'all' ? true : i.category?.id === filterCat)

  const createCategory = async () => {
    if (!newCatName.trim()) return
    setError(null)
    setMessage(null)
    setCreatingCat(true)
    try {
      await menuApi.createCategory(newCatName.trim())
      setNewCatName('')
      await load()
      setMessage('Category created')
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to create category')
    } finally {
      setCreatingCat(false)
    }
  }

  const startEditItem = (it: any) => {
    setEditingItemId(it.id)
    setEditItem({
      name: it.name,
      price: String(it.price),
      type: it.type,
      category_id: String(it.category?.id || ''),
      available: Boolean(it.available),
      description: it.description || '',
    })
  }

  const cancelEditItem = () => {
    setEditingItemId(null)
    setEditItem({})
  }

  const saveEditItem = async () => {
    if (!editingItemId) return
    setError(null)
    setMessage(null)
    try {
      const payload: any = {}
      if (editItem.name !== undefined) payload.name = editItem.name
      if (editItem.price !== undefined) payload.price = Number(editItem.price)
      if (editItem.type !== undefined) payload.type = editItem.type
      if (editItem.category_id !== undefined && editItem.category_id) payload.category_id = Number(editItem.category_id)
      if (editItem.available !== undefined) payload.available = editItem.available
      if (editItem.description !== undefined) payload.description = editItem.description
      await menuApi.updateItem(editingItemId, payload)
      setMessage('Item updated')
      setEditingItemId(null)
      setEditItem({})
      await load()
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to update item')
    }
  }

  const removeItem = async (id: number) => {
    setError(null)
    setMessage(null)
    try {
      await menuApi.deleteItem(id)
      setMessage('Item deleted')
      await load()
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to delete item')
    }
  }

  const createItem = async () => {
    if (!newItem.name || !newItem.price || !newItem.category_id) return
    setError(null)
    setMessage(null)
    setCreatingItem(true)
    try {
      await menuApi.createItem({
        name: newItem.name,
        price: Number(newItem.price),
        type: newItem.type,
        category_id: Number(newItem.category_id),
        available: newItem.available,
        description: newItem.description,
      })
      setNewItem({ name: '', price: '', type: 'food', category_id: '', available: true })
      setMessage('Item created')
      await load()
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to create item')
    } finally {
      setCreatingItem(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Menu</h2>
        <div className="flex items-center gap-2">
          <select className="input" value={filterCat} onChange={(e) => setFilterCat(e.target.value === 'all' ? 'all' : Number(e.target.value))}>
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button className="btn btn-secondary" onClick={load} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh'}</button>
        </div>
      </div>

      {message && <div className="rounded-md border p-3 text-sm border-green-300 bg-green-50 text-green-800">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {admin && (
        <div className="card">
          <h3 className="font-medium mb-2">Manage categories</h3>
          <div className="flex items-center gap-2">
            <input className="input" placeholder="New category name" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} />
            <button className="btn btn-primary" onClick={createCategory} disabled={!newCatName || creatingCat}>{creatingCat ? 'Creating…' : 'Add Category'}</button>
          </div>
        </div>
      )}

      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium">Items</h3>
          {admin && (
            <details>
              <summary className="btn btn-primary cursor-pointer select-none">New Item</summary>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                <input className="input" placeholder="Name" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} />
                <input className="input" placeholder="Price" type="number" value={newItem.price} onChange={(e) => setNewItem({ ...newItem, price: e.target.value })} />
                <select className="input" value={newItem.type} onChange={(e) => setNewItem({ ...newItem, type: e.target.value as any })}>
                  <option value="food">Food</option>
                  <option value="drink">Drink</option>
                </select>
                <select className="input" value={newItem.category_id} onChange={(e) => setNewItem({ ...newItem, category_id: e.target.value })}>
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <textarea className="input md:col-span-2" placeholder="Description (optional)" value={newItem.description || ''} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} />
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={newItem.available} onChange={(e) => setNewItem({ ...newItem, available: e.target.checked })} /> Available</label>
                <div className="md:col-span-2 flex justify-end">
                  <button className="btn btn-primary" onClick={createItem} disabled={creatingItem}>{creatingItem ? 'Creating…' : 'Create Item'}</button>
                </div>
              </div>
            </details>
          )}
        </div>
        {loading ? (
          <div className="text-sm text-gray-500">Loading…</div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Name</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Category</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Type</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-600">Price</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Availability</th>
                  {admin && <th className="px-3 py-2 text-right text-xs font-medium text-gray-600">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredItems.map((it) => (
                  <tr key={it.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-sm">
                      {editingItemId === it.id ? (
                        <input className="input w-full" value={editItem.name ?? ''} onChange={(e) => setEditItem({ ...editItem, name: e.target.value })} />
                      ) : (
                        <span className="font-medium">{it.name}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-sm">
                      {editingItemId === it.id ? (
                        <select className="input" value={editItem.category_id ?? ''} onChange={(e) => setEditItem({ ...editItem, category_id: e.target.value })}>
                          <option value="">Select category</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      ) : (
                        it.category?.name
                      )}
                    </td>
                    <td className="px-3 py-2 text-sm">
                      {editingItemId === it.id ? (
                        <select className="input" value={editItem.type ?? 'food'} onChange={(e) => setEditItem({ ...editItem, type: e.target.value as any })}>
                          <option value="food">Food</option>
                          <option value="drink">Drink</option>
                        </select>
                      ) : (
                        it.type
                      )}
                    </td>
                    <td className="px-3 py-2 text-sm text-right">
                      {editingItemId === it.id ? (
                        <input className="input w-24 text-right" type="number" value={editItem.price ?? ''} onChange={(e) => setEditItem({ ...editItem, price: e.target.value })} />
                      ) : (
                        `$${Number(it.price).toFixed(2)}`
                      )}
                    </td>
                    <td className="px-3 py-2 text-sm">
                      {editingItemId === it.id ? (
                        <label className="flex items-center gap-2"><input type="checkbox" checked={!!editItem.available} onChange={(e) => setEditItem({ ...editItem, available: e.target.checked })} /> Available</label>
                      ) : (
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${it.available ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}>{it.available ? 'Available' : 'Hidden'}</span>
                      )}
                    </td>
                    {admin && (
                      <td className="px-3 py-2 text-sm text-right">
                        {editingItemId === it.id ? (
                          <div className="space-x-2">
                            <button className="btn btn-secondary" onClick={cancelEditItem}>Cancel</button>
                            <button className="btn btn-primary" onClick={saveEditItem}>Save</button>
                          </div>
                        ) : (
                          <div className="space-x-2">
                            <button className="btn btn-secondary" onClick={() => startEditItem(it)}>Edit</button>
                            <button className="btn btn-danger" onClick={() => removeItem(it.id)}>Delete</button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={admin ? 6 : 5} className="px-3 py-4 text-center text-sm text-gray-500">No items</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Menu
