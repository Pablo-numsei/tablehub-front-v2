import axios from 'axios'
import { clearAuthSession, getStaffToken } from './authSession.js'
import { getOrderAccess, orderIdForRequest } from './orderAccess.js'
import { getTableContext, tableIdForRequest } from './tableAccess.js'

const api = axios.create({
  baseURL: import.meta.env?.VITE_API_URL || 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
})

api.interceptors.request.use((config) => {
  const token = getStaffToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  const orderToken = getOrderAccess(orderIdForRequest(config))
  if (orderToken) config.headers['X-Order-Token'] = orderToken
  const tableContext = getTableContext(tableIdForRequest(config))
  if (tableContext) config.headers['X-Table-Token'] = tableContext.tableToken

  return config
})

api.interceptors.response.use((response) => response, (error) => {
  if (error.response?.status === 401 && error.config?.headers?.Authorization) clearAuthSession()
  return Promise.reject(error)
})

export default api
