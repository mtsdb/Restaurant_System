import api from './client'

export const listPendingBills = () => api.get('/billing/pending/')
export const createInvoice = (session_id: number) => api.post('/billing/invoices/', { session_id })
export const markInvoicePaid = (invoiceId: number) => api.patch(`/billing/invoices/${invoiceId}/pay/`)
export const getInvoice = (invoiceId: number) => api.get(`/billing/invoices/${invoiceId}/`)
