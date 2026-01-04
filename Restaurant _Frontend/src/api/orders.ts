import api from './client'

export const createOrderForSession = (sessionId: number) => api.post(`/sessions/${sessionId}/orders/`)
export const getOrder = (orderId: number) => api.get(`/orders/${orderId}/`)
export const addItemToOrder = (orderId: number, payload: { item_id: number; quantity?: number; note_to_chef?: string }) =>
  api.post(`/orders/${orderId}/add-item/`, payload)
export const updateOrderItemStatus = (orderItemId: number, status: string) =>
  api.patch(`/orders/items/${orderItemId}/status/`, { status })
export const deleteOrderItem = (orderItemId: number) => api.delete(`/orders/items/${orderItemId}/`)
