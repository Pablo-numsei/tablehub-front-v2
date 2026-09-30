import { customerProducts } from '../data/customerMenu.js'

const CART_KEY = 'tablehub_customer_cart'
const ORDERS_KEY = 'tablehub_customer_orders'
const ACTIVE_ORDER_KEY = 'tablehub_active_order'
const REQUESTS_KEY = 'tablehub_customer_requests'

const readJson = (key, fallback) => {
  try {
    const raw = sessionStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export const loadCart = () => readJson(CART_KEY, {})

export const saveCart = (cart) => {
  sessionStorage.setItem(CART_KEY, JSON.stringify(cart))
}

export const clearCart = () => {
  sessionStorage.removeItem(CART_KEY)
}

export const loadCustomerOrders = () => readJson(ORDERS_KEY, [])

export const getCustomerOrder = (id) =>
  loadCustomerOrders().find((order) => order.id === id) || null

export const getActiveCustomerOrder = () => {
  const activeId = sessionStorage.getItem(ACTIVE_ORDER_KEY)
  return activeId ? getCustomerOrder(activeId) : null
}

export const createCustomerOrder = ({ table, cart, note = '' }) => {
  const items = customerProducts
    .filter((product) => (cart[product.id] || 0) > 0)
    .map((product) => ({
      productId: product.id,
      name: product.name,
      quantity: cart[product.id],
      price: product.price,
    }))

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  )

  const order = {
    id: `#${String(Date.now()).slice(-6)}`,
    table: String(table).padStart(2, '0'),
    customer: 'Cliente da mesa',
    time: new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    status: 'Aguardando',
    total,
    note: note.trim(),
    items,
    paymentMethod: null,
    paymentStatus: 'Pendente',
    paidAt: null,
    createdAt: new Date().toISOString(),
  }

  const orders = loadCustomerOrders()
  sessionStorage.setItem(ORDERS_KEY, JSON.stringify([order, ...orders]))
  sessionStorage.setItem(ACTIVE_ORDER_KEY, order.id)

  return order
}

export const updateCustomerOrderStatus = (id, status) => {
  const orders = loadCustomerOrders()
  const exists = orders.some((order) => order.id === id)

  if (!exists) return null

  const updated = orders.map((order) =>
    order.id === id ? { ...order, status } : order,
  )

  sessionStorage.setItem(ORDERS_KEY, JSON.stringify(updated))
  return updated.find((order) => order.id === id) || null
}

export const updateCustomerOrderPayment = (id, method) => {
  const orders = loadCustomerOrders()
  const exists = orders.some((order) => order.id === id)

  if (!exists) return null

  const paidAt = new Date().toISOString()
  const updated = orders.map((order) =>
    order.id === id
      ? {
          ...order,
          paymentMethod: method,
          paymentStatus: 'Simulado',
          paidAt,
        }
      : order,
  )

  sessionStorage.setItem(ORDERS_KEY, JSON.stringify(updated))
  return updated.find((order) => order.id === id) || null
}

export const loadServiceRequests = () => readJson(REQUESTS_KEY, [])

export const createServiceRequest = ({
  type,
  table,
  orderId = null,
  detail = '',
}) => {
  const request = {
    id: `REQ-${String(Date.now()).slice(-6)}`,
    type,
    table: String(table).padStart(2, '0'),
    orderId,
    detail,
    status: 'Enviado',
    createdAt: new Date().toISOString(),
  }

  const requests = loadServiceRequests()
  sessionStorage.setItem(REQUESTS_KEY, JSON.stringify([request, ...requests]))

  return request
}

export const updateServiceRequestStatus = (id, status) => {
  const requests = loadServiceRequests()
  const exists = requests.some((request) => request.id === id)

  if (!exists) return null

  const updated = requests.map((request) =>
    request.id === id
      ? {
          ...request,
          status,
          updatedAt: new Date().toISOString(),
        }
      : request,
  )

  sessionStorage.setItem(REQUESTS_KEY, JSON.stringify(updated))
  return updated.find((request) => request.id === id) || null
}
