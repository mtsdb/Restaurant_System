import api from './client'

export const getSettings = () => api.get('/settings/')
export const patchSettings = (payload: Partial<{ tax_rate: number; service_charge_rate: number; discount_rate: number }>) =>
  api.patch('/settings/', payload)
