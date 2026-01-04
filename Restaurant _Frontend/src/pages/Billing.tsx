import React, { useEffect, useState } from 'react'
import * as billingApi from '../api/billing'

const Billing: React.FC = () => {
  const [pending, setPending] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [workingSession, setWorkingSession] = useState<number | null>(null)
  const [workingInvoice, setWorkingInvoice] = useState<number | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [invoicePreview, setInvoicePreview] = useState<any | null>(null)
  const [invoiceLoading, setInvoiceLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await billingApi.listPendingBills()
      setPending(data)
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to load pending bills')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const createInv = async (sessionId: number) => {
    setError(null)
    setMessage(null)
    setWorkingSession(sessionId)
    try {
      await billingApi.createInvoice(sessionId)
      setMessage(`Invoice created for session ${sessionId}`)
      await load()
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to create invoice')
    } finally {
      setWorkingSession(null)
    }
  }
  const markPaid = async (invoiceId: number) => {
    setError(null)
    setMessage(null)
    setWorkingInvoice(invoiceId)
    try {
      await billingApi.markInvoicePaid(invoiceId)
      setMessage(`Invoice #${invoiceId} marked as paid`)
      await load()
      setInvoicePreview(null)
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to mark paid')
    } finally {
      setWorkingInvoice(null)
    }
  }

  const openPreview = async (invoiceId: number) => {
    setPreviewError(null)
    setInvoiceLoading(true)
    try {
      const { data } = await billingApi.getInvoice(invoiceId)
      setInvoicePreview(data)
    } catch (e: any) {
      setPreviewError(e?.response?.data?.detail || 'Failed to load invoice')
    } finally {
      setInvoiceLoading(false)
    }
  }
  const closePreview = () => setInvoicePreview(null)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Billing</h2>
        <button className="btn btn-secondary" onClick={load} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh'}</button>
      </div>

      {message && (
        <div className="rounded-md border p-3 text-sm border-green-300 bg-green-50 text-green-800">{message}</div>
      )}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">Table</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">Session</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">Requested At</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">Invoice</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pending.map((p) => (
              <tr key={p.session} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{p.table}</td>
                <td className="px-4 py-3">{p.session}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{new Date(p.bill_requested_at).toLocaleString()}</td>
                <td className="px-4 py-3">{p.has_invoice ? `#${p.invoice_id}` : '-'}</td>
                <td className="px-4 py-3 space-x-2">
                  {!p.has_invoice ? (
                    <button
                      className="btn btn-primary"
                      onClick={() => createInv(p.session)}
                      disabled={workingSession === p.session}
                    >
                      {workingSession === p.session ? 'Creating…' : 'Create Invoice'}
                    </button>
                  ) : (
                    <>
                      <button
                        className="btn btn-secondary"
                        onClick={() => openPreview(p.invoice_id)}
                        disabled={invoiceLoading}
                      >
                        {invoiceLoading ? 'Loading…' : 'Preview'}
                      </button>
                      <button
                        className="btn btn-primary"
                        onClick={() => markPaid(p.invoice_id)}
                        disabled={workingInvoice === p.invoice_id}
                      >
                        {workingInvoice === p.invoice_id ? 'Marking…' : 'Mark Paid'}
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {pending.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">No pending bill requests</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {invoicePreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-2xl rounded-lg shadow-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Invoice #{invoicePreview.id} • Table {invoicePreview.table} • Session {invoicePreview.session}</h3>
              <button className="btn btn-secondary" onClick={closePreview}>Close</button>
            </div>
            {previewError && <div className="alert alert-error mb-2">{previewError}</div>}
            <div className="border rounded-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Item</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-600">Qty</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-600">Unit</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-600">Line</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invoicePreview.items?.map((it: any) => (
                    <tr key={it.id}>
                      <td className="px-3 py-2 text-sm">{it.name}</td>
                      <td className="px-3 py-2 text-sm text-right">{it.quantity}</td>
                      <td className="px-3 py-2 text-sm text-right">${Number(it.unit_price).toFixed(2)}</td>
                      <td className="px-3 py-2 text-sm text-right">${Number(it.line_total).toFixed(2)}</td>
                    </tr>
                  ))}
                  {(!invoicePreview.items || invoicePreview.items.length === 0) && (
                    <tr>
                      <td colSpan={4} className="px-3 py-4 text-center text-sm text-gray-500">No items</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between mt-3">
              <div className="text-sm text-gray-600">Waiter(s): {invoicePreview.waiters?.join(', ') || '-'}</div>
              <div className="text-sm space-y-1">
                <div className="flex justify-between gap-6"><span>Subtotal</span><span>${Number(invoicePreview.subtotal).toFixed(2)}</span></div>
                <div className="flex justify-between gap-6"><span>Discount</span><span>-${Number(invoicePreview.discount).toFixed(2)}</span></div>
                <div className="flex justify-between gap-6"><span>Service</span><span>${Number(invoicePreview.service_charge).toFixed(2)}</span></div>
                <div className="flex justify-between gap-6"><span>Tax</span><span>${Number(invoicePreview.tax).toFixed(2)}</span></div>
                <div className="border-t pt-2 mt-2 flex justify-between gap-6 font-semibold"><span>Total</span><span>${Number(invoicePreview.total).toFixed(2)}</span></div>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button className="btn btn-secondary" onClick={closePreview}>Close</button>
              <button className="btn btn-primary" onClick={() => markPaid(invoicePreview.id)} disabled={workingInvoice === invoicePreview.id}>
                {workingInvoice === invoicePreview.id ? 'Marking…' : 'Mark Paid'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Billing
