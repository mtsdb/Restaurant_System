import api from './client'
import { saveTokensAndUser } from '../utils/authStorage'

export type LoginResponse = {
  access: string
  refresh: string
  user: any
}

export async function login(username: string, password: string) {
  const { data } = await api.post<LoginResponse>('/auth/login/', { username, password })
  saveTokensAndUser(data.access, data.refresh, data.user)
  return data
}
