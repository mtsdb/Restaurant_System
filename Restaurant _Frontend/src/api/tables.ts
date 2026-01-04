import api from './client'

export const listTables = () => api.get('/tables/')
export const openSession = (tableId: number) => api.post(`/tables/${tableId}/open-session/`)
export const closeSession = (tableId: number) => api.post(`/tables/${tableId}/close-session/`)
export const getSession = (sessionId: number) => api.get(`/sessions/${sessionId}/`)
export const requestBill = (sessionId: number) => api.post(`/sessions/${sessionId}/request-bill/`)
export const listActiveSessions = () => api.get('/sessions/active/')
export const createTable = (number: number) => api.post('/tables/', { number })
