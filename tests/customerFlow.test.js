import test from 'node:test'
import assert from 'node:assert/strict'
import { mapCustomerCatalog, saveCatalog, cartItems, cartTotal } from '../src/services/customerCatalog.js'
import { saveOrderAccess, getOrderAccess, forgetOrderAccess, orderIdForRequest } from '../src/services/orderAccess.js'
import { saveCustomerOrderFromApi, getCustomerOrder, saveCustomerOrderSnapshot, loadCart } from '../src/utils/customerSession.js'

const values = new Map()
const storage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) }
globalThis.window = { sessionStorage: storage }
globalThis.sessionStorage = storage

test('catalog uses server IDs and prices even after renaming or adding products', () => {
  const catalog = mapCustomerCatalog([
    { id: 101, name: 'Hambúrguer novo', price: 40.75, stockQuantity: 3, category: { name: 'Pratos' } },
    { id: 202, name: 'Produto adicional', price: 5.10, stockQuantity: 2, category: { name: 'Bebidas' } },
  ])
  assert.deepEqual(catalog.map((item) => item.id), [101, 202])
  assert.equal(cartTotal(cartItems(catalog, { 101: 2, 202: 1 })), 86.60)
})

test('unavailable and malformed products cannot masquerade as available menu items', () => {
  const catalog = mapCustomerCatalog([
    { id: 7, name: 'Sem estoque', price: 9.50, stockQuantity: 0 },
    { id: 8, name: 'Desativado', price: 4, stockQuantity: 5, active: false },
    { id: 9, name: 'Preço inválido', price: 'invalid', stockQuantity: 5 },
  ])
  assert.equal(catalog.length, 1)
  assert.equal(catalog[0].available, false)
})

test('authorisation is attached only to the matching order endpoint', () => {
  saveOrderAccess(42, 'synthetic-order-capability')
  assert.equal(getOrderAccess(42), 'synthetic-order-capability')
  assert.equal(getOrderAccess(43), null)
  assert.equal(orderIdForRequest({ url: '/api/pedidos/42?refresh=1' }), 42)
  assert.equal(orderIdForRequest({ url: '/api/payments/42/process' }), 42)
  assert.equal(orderIdForRequest({ url: '/api/push/subscriptions', method: 'post', data: '{"pedidoId":42}' }), 42)
  assert.equal(orderIdForRequest({ url: 'https://example.invalid/api/pedidos/42' }), null)
  assert.equal(orderIdForRequest({ url: '/api/dashboard/resumo' }), null)
  forgetOrderAccess(42)
  assert.equal(getOrderAccess(42), null)
})

test('successful order retains official prices and access token', () => {
  const catalog = mapCustomerCatalog([{ id: 77, name: 'Produto real', price: 19.90, stockQuantity: 4 }])
  saveCatalog(catalog)
  const order = saveCustomerOrderFromApi({
    apiOrder: { id: 301, accessToken: 'synthetic-capability-301', totalValue: 39.80, status: { name: 'Recebido' }, createdAt: '2026-10-13T12:00:00' },
    table: 2, cart: { 77: 2 }, catalog,
  })
  assert.equal(order.items[0].productId, 77)
  assert.equal(order.items[0].price, 19.90)
  assert.equal(order.total, 39.80)
  assert.equal(getOrderAccess(301), 'synthetic-capability-301')
})

test('browser storage failure does not turn a successful POST into a failed order', () => {
  const blocked = { getItem() { throw new Error('blocked') }, setItem() { throw new Error('blocked') }, removeItem() { throw new Error('blocked') } }
  window.sessionStorage = blocked
  globalThis.sessionStorage = blocked
  try {
    saveCustomerOrderFromApi({ apiOrder: { id: 302, accessToken: 'synthetic-capability-302', totalValue: 10, status: { name: 'Recebido' } }, table: 2, cart: {}, catalog: [] })
    assert.equal(getCustomerOrder('#302').backendId, 302)
    assert.equal(getOrderAccess(302), 'synthetic-capability-302')
  } finally { window.sessionStorage = storage; globalThis.sessionStorage = storage }
})

test('receipt snapshot uses persisted item prices and confirmed payment only', () => {
  const order = saveCustomerOrderSnapshot({ id: 303, totalValue: 22, mesa: { number: 3 }, status: { name: 'Entregue' }, createdAt: '2026-10-13T12:00:00' },
    [{ produto: { id: 7, name: 'Produto' }, quantidade: 2, precoUnitario: 11, subtotal: 22 }],
    { status: 'PAGO', method: 'PIX', processedAt: '2026-10-13T13:00:00' })
  assert.equal(order.items[0].price, 11)
  assert.equal(order.paymentStatus, 'PAGO')
  assert.equal(order.paidAt, '2026-10-13T13:00:00')
})

test('malformed cart storage is safely rejected', () => {
  values.set('tablehub_customer_cart_v2', 'null')
  assert.deepEqual(loadCart(), {})
  values.set('tablehub_customer_cart_v2', JSON.stringify({ 1: -1, 2: '2', 3: 101, 4: 2 }))
  assert.deepEqual(loadCart(), { 4: 2 })
})
