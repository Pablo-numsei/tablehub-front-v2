import test from 'node:test'
import assert from 'node:assert/strict'
import { getTableContext, getTableContextByNumber, saveTableContext, tableIdForRequest, tableNumber } from '../src/services/tableAccess.js'
import { isLocalQrUrl, tableQrUrl } from '../src/services/tableQr.js'

const context = (id, number) => ({ mesa: { id, number }, tableToken: `synthetic-table-${id}`, expiresAt: new Date(Date.now() + 3600000).toISOString() })

test('table number never defaults to another table for missing or malformed input', () => {
  for (const value of [null, '', 'mesa1', '-1', '0', '1.5', '1e3', '99999999999']) assert.equal(tableNumber(value), null)
  assert.equal(tableNumber('04'), 4)
})

test('table access stays scoped to the real ID, independent from its display number', () => {
  saveTableContext(context(81, 4))
  saveTableContext(context(82, 9))
  assert.equal(getTableContextByNumber('04').mesa.id, 81)
  assert.equal(getTableContext(81).tableToken, 'synthetic-table-81')
  assert.equal(getTableContext(4), null)
  assert.equal(getTableContext(81, Date.now() + 7200000), null)
})

test('only new order and pre-order attendance requests receive table access', () => {
  assert.equal(tableIdForRequest({ method: 'post', url: '/api/pedidos', data: { mesaId: 81 } }), 81)
  assert.equal(tableIdForRequest({ method: 'post', url: '/api/atendimentos', data: JSON.stringify({ mesaId: 81, pedidoId: null }) }), 81)
  for (const value of [
    { method: 'get', url: '/api/pedidos', data: { mesaId: 81 } },
    { method: 'post', url: '/api/atendimentos', data: { mesaId: 81, pedidoId: 42 } },
    { method: 'post', url: '/api/mesas/contexto', data: { mesaId: 81 } },
    { method: 'post', url: '/api/payments/42/process', data: { mesaId: 81 } },
    { method: 'post', url: 'https://other.test/api/pedidos', data: { mesaId: 81 } },
    { method: 'post', url: '//other.test/api/pedidos', data: { mesaId: 81 } },
  ]) assert.equal(tableIdForRequest(value), null)
})

test('a successful QR exchange survives disabled storage without accepting invalid context', () => {
  global.window = { get sessionStorage() { throw new Error('blocked') } }
  saveTableContext(context(83, 11))
  assert.equal(getTableContext(83).tableToken, 'synthetic-table-83')
  assert.throws(() => saveTableContext({ ...context(84, 12), expiresAt: 'bad' }))
  delete global.window
})

test('QR uses the configured public origin, the table number and its signed token', () => {
  const url = new URL(tableQrUrl(4, 'synthetic.signed.token', 'https://tablehub.test'))
  assert.equal(url.origin, 'https://tablehub.test')
  assert.equal(url.pathname, '/menu')
  assert.equal(url.searchParams.get('mesa'), '4')
  assert.equal(url.searchParams.get('qr'), 'synthetic.signed.token')
  assert.equal(isLocalQrUrl(url.toString()), false)
  assert.equal(isLocalQrUrl(tableQrUrl(4, 'token', 'http://localhost:5173')), true)
  assert.throws(() => tableQrUrl(4, '', 'https://tablehub.test'))
  assert.throws(() => tableQrUrl(4, 'token', 'javascript:alert(1)'))
})
