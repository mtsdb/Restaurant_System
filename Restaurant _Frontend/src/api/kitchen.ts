import api from './client'

export const listKitchenItems = (params?: { status?: string; table?: number; session?: number }) =>
  api.get('/kitchen/items/', { params })
export const kitchenDashboard = (params?: { status?: string }) => api.get('/kitchen/dashboard/', { params })
