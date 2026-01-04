import api from './client'

export const listCategories = () => api.get('/menu/categories/')
export const listItems = (params?: { all?: 1 | true }) => api.get('/menu/items/', { params })
export const getItem = (id: number) => api.get(`/menu/items/${id}/`)
export const createCategory = (name: string) => api.post('/menu/categories/', { name })
export const updateCategory = (id: number, data: { name: string }) => api.patch(`/menu/categories/${id}/`, data)
export const deleteCategory = (id: number) => api.delete(`/menu/categories/${id}/`)
export const createItem = (data: { name: string; price: number; type: 'food' | 'drink'; category_id: number; available?: boolean; description?: string }) => api.post('/menu/items/', data)
export const updateItem = (id: number, data: Partial<{ name: string; price: number; type: 'food' | 'drink'; category_id: number; available: boolean; description: string }>) => api.patch(`/menu/items/${id}/`, data)
export const deleteItem = (id: number) => api.delete(`/menu/items/${id}/`)
