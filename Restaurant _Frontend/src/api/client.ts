import axios from 'axios'
import { getAccessToken, getRefreshToken, saveAccessToken, clearAuth } from '../utils/authStorage'

const baseURL = import.meta.env.VITE_API_BASE || '/api'

const api = axios.create({
  baseURL,
})

// Attach access token
api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Try refresh on 401 once
let isRefreshing = false
let pendingRequests: Array<(token: string | null) => void> = []

function subscribeTokenRefresh(cb: (token: string | null) => void) {
  pendingRequests.push(cb)
}
function onRefreshed(token: string | null) {
  pendingRequests.forEach((cb) => cb(token))
  pendingRequests = []
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((token) => {
            if (token) {
              original.headers = original.headers || {}
              original.headers.Authorization = `Bearer ${token}`
              resolve(api(original))
            } else {
              reject(error)
            }
          })
        })
      }

      original._retry = true
      isRefreshing = true
      try {
        const refresh = getRefreshToken()
        if (!refresh) throw new Error('No refresh token')
        const { data } = await axios.post(`${baseURL}/auth/token/refresh/`, { refresh })
        saveAccessToken(data.access)
        onRefreshed(data.access)
        original.headers = original.headers || {}
        original.headers.Authorization = `Bearer ${data.access}`
        return api(original)
      } catch (e) {
        onRefreshed(null)
        clearAuth()
        return Promise.reject(e)
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(error)
  }
)

export default api
