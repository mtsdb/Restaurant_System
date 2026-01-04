import React, { useEffect, useState } from 'react'
import * as settingsApi from '../api/settings'

const Settings: React.FC = () => {
  const [form, setForm] = useState<{ tax_rate?: number; service_charge_rate?: number; discount_rate?: number }>({})
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await settingsApi.getSettings()
      setForm({
        tax_rate: data.tax_rate,
        service_charge_rate: data.service_charge_rate,
        discount_rate: data.discount_rate,
      })
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const patch = async () => {
    setError(null)
    setMessage(null)
    setSaving(true)
    try {
      await settingsApi.patchSettings(form)
      setMessage('Settings saved')
      await load()
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to update settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Settings</h2>
        <button className="btn btn-secondary" onClick={load} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh'}</button>
      </div>

      {message && <div className="rounded-md border p-3 text-sm border-green-300 bg-green-50 text-green-800">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="card max-w-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Tax rate (%)</label>
            <input
              type="number"
              className="input mt-1 w-full"
              value={form.tax_rate ?? ''}
              onChange={(e) => setForm({ ...form, tax_rate: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Service charge rate (%)</label>
            <input
              type="number"
              className="input mt-1 w-full"
              value={form.service_charge_rate ?? ''}
              onChange={(e) => setForm({ ...form, service_charge_rate: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Discount rate (%)</label>
            <input
              type="number"
              className="input mt-1 w-full"
              value={form.discount_rate ?? ''}
              onChange={(e) => setForm({ ...form, discount_rate: Number(e.target.value) })}
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button className="btn btn-primary" onClick={patch} disabled={saving}>{saving ? 'Saving…' : 'Save Settings'}</button>
        </div>
      </div>
    </div>
  )
}

export default Settings
