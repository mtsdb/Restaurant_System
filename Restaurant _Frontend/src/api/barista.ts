import api from './client'

export const listBaristaItems = (params?: { status?: string; table?: number; session?: number }) =>
  api.get('/barista/items/', { params })
export const baristaDashboard = (params?: { status?: string }) => api.get('/barista/dashboard/', { params })
