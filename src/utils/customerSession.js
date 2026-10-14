import { customerProducts } from '../data/customerMenu.js'
import { readCatalog, cartItems } from '../services/customerCatalog.js'
import { saveOrderAccess } from '../services/orderAccess.js'

const CART_KEY = 'tablehub_customer_cart_v2'
const ORDERS_KEY = 'tablehub_customer_orders'
const ACTIVE_ORDER_KEY = 'tablehub_active_order'
const REQUESTS_KEY = 'tablehub_customer_requests'
const memory = new Map()

const write = (key, value) => {
  memory.set(key, value)
  try { sessionStorage.setItem(key, value) } catch { /* Preserve a successful order in this open tab. */ }
}

const readJson = (key, fallback) => {
  try {
    const raw = memory.get(key) ?? sessionStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export const loadCart = () => {
  const value = readJson(CART_KEY, {})
  if (!value || Array.isArray(value) || typeof value !== 'object') return {}
  return Object.fromEntries(Object.entries(value).filter(([id, quantity]) => /^\d+$/.test(id) && Number.isInteger(quantity) && quantity > 0 && quantity <= 100))
}

export const saveCart = (cart) => {
  write(CART_KEY, JSON.stringify(cart))
}

export const clearCart = () => {
  memory.delete(CART_KEY)
  try { sessionStorage.removeItem(CART_KEY) } catch { /* Storage can be unavailable. */ }
}

export const loadCustomerOrders = () => {
  const value = readJson(ORDERS_KEY, [])
  return Array.isArray(value) ? value.filter((order) => order && typeof order.id === 'string' && Array.isArray(order.items)) : []
}

export const getCustomerOrder = (id) =>
  loadCustomerOrders().find((order) => order.id === id) || null

export const getActiveCustomerOrder = () => {
  let activeId = memory.get(ACTIVE_ORDER_KEY)
  if (!activeId) { try { activeId = sessionStorage.getItem(ACTIVE_ORDER_KEY) } catch { /* Keep no active order. */ } }
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
  write(ORDERS_KEY, JSON.stringify([order, ...orders]))
  write(ACTIVE_ORDER_KEY, order.id)

  return order
}

const mapBackendStatusToCustomer = (status) => {
  const statusMap = {
    Recebido: 'Aguardando',
    'Em preparo': 'Preparando',
    Pronto: 'Pronto',
    Entregue: 'Entregue',
  }

  return statusMap[status] || 'Aguardando'
}

export const saveCustomerOrderFromApi = ({
  apiOrder,
  table,
  cart,
  note = '',
  catalog = readCatalog(),
}) => {
  const items = cartItems(catalog, cart).map((product) => ({
    productId: product.id, name: product.name, quantity: product.quantity, price: product.price,
  }))

  const localTotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  )

  const backendStatus = apiOrder?.status?.name || 'Recebido'
  const createdAt = apiOrder?.createdAt || new Date().toISOString()
  const backendId = apiOrder?.id ?? null
  saveOrderAccess(backendId, apiOrder?.accessToken)

  const order = {
    id: backendId != null
      ? `#${backendId}`
      : `#${String(Date.now()).slice(-6)}`,
    backendId,
    table: String(table).padStart(2, '0'),
    customer: 'Cliente da mesa',
    time: new Date(createdAt).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    status: mapBackendStatusToCustomer(backendStatus),
    backendStatus,
    total: Number(apiOrder?.totalValue ?? localTotal),
    note: note.trim(),
    items,
    paymentMethod: null,
    paymentStatus: 'Pendente',
    paidAt: null,
    createdAt,
  }

  const orders = loadCustomerOrders()
  write(ORDERS_KEY, JSON.stringify([order, ...orders]))
  write(ACTIVE_ORDER_KEY, order.id)

  return order
}

export const updateCustomerOrderStatus = (id, status) => {
  const orders = loadCustomerOrders()
  const exists = orders.some((order) => order.id === id)

  if (!exists) return null

  const updated = orders.map((order) =>
    order.id === id ? { ...order, status } : order,
  )

  write(ORDERS_KEY, JSON.stringify(updated))
  return updated.find((order) => order.id === id) || null
}

export const updateCustomerOrderPayment = (id, payment) => {
  const orders = loadCustomerOrders()
  const exists = orders.some((order) => order.id === id)

  if (!exists) return null

  const updated = orders.map((order) =>
    order.id === id
      ? {
          ...order,
          paymentMethod: payment?.method || null,
          paymentStatus: payment?.status || 'Pendente',
          paidAt: payment?.status === 'PAGO' ? payment.processedAt : null,
        }
      : order,
  )

  write(ORDERS_KEY, JSON.stringify(updated))
  return updated.find((order) => order.id === id) || null
}

export const loadServiceRequests = () => readJson(REQUESTS_KEY, [])

export const saveCustomerOrderSnapshot = (apiOrder, apiItems, payment) => {
  if (!Number.isSafeInteger(apiOrder?.id) || apiOrder.id <= 0) throw new Error('Pedido inválido retornado pelo servidor.')
  const id = `#${apiOrder.id}`
  const old = getCustomerOrder(id)
  const backendStatus = apiOrder.status?.name || 'Recebido'
  const order = {
    id, backendId: apiOrder.id,
    table: String(apiOrder.mesa?.number ?? old?.table ?? '').padStart(2, '0'),
    customer: 'Cliente da mesa',
    note: old?.note || '',
    time: new Date(apiOrder.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    createdAt: apiOrder.createdAt,
    status: mapBackendStatusToCustomer(backendStatus), backendStatus,
    total: Number(apiOrder.totalValue),
    items: Array.isArray(apiItems) ? apiItems.map((item) => ({
      productId: item.produto?.id, name: item.produto?.name || 'Produto',
      quantity: Number(item.quantidade), price: Number(item.precoUnitario), subtotal: Number(item.subtotal),
    })) : old?.items || [],
    paymentMethod: payment?.method || null,
    paymentStatus: payment?.status || 'Pendente',
    paidAt: payment?.status === 'PAGO' ? payment.processedAt : null,
  }
  const orders = loadCustomerOrders().filter((current) => current.id !== id)
  write(ORDERS_KEY, JSON.stringify([order, ...orders]))
  write(ACTIVE_ORDER_KEY, id)
  return order
}

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
  write(REQUESTS_KEY, JSON.stringify([request, ...requests]))

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

  write(REQUESTS_KEY, JSON.stringify(updated))
  return updated.find((request) => request.id === id) || null
}
