import test from 'node:test'
import assert from 'node:assert/strict'
import api from '../src/services/api.js'
import { saveCustomerSession } from '../src/services/customerSession.js'
import { saveOrderAccess } from '../src/services/orderAccess.js'
import { saveTableContext } from '../src/services/tableAccess.js'

const values = new Map()
const storage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) }
globalThis.window = { sessionStorage: storage, localStorage: storage, dispatchEvent() {} }
saveOrderAccess(42, 'synthetic-capability-42')

test('Axios guest requests send the capability for their own order', async () => {
  const requests = []
  api.defaults.adapter = async (config) => {
    requests.push(config)
    return { data: {}, status: 200, statusText: 'OK', headers: {}, config }
  }
  await api.get('/api/pedidos/42')
  await api.post('/api/payments/42/process', { method: 'PIX' })
  await api.post('/api/atendimentos', { pedidoId: 42, mesaId: 2, tipo: 'CONTA' })
  assert.equal(requests.length, 3)
  assert.ok(requests.every((request) => request.headers.get('X-Order-Token') === 'synthetic-capability-42'))
  assert.ok(requests.every((request) => !request.headers.get('Authorization')))
})

test('unrelated API requests do not receive another order capability', async () => {
  const requests = []
  api.defaults.adapter = async (config) => {
    requests.push(config)
    return { data: {}, status: 200, statusText: 'OK', headers: {}, config }
  }
  await api.get('/api/pedidos/43')
  await api.get('/api/v1/produtos')
  assert.ok(requests.every((request) => !request.headers.get('X-Order-Token')))
})

test('Axios attaches table context only to new actions for the authorized table', async () => {
  saveTableContext({ mesa: { id: 81, number: 4 }, tableToken: 'synthetic-table-context-81', expiresAt: new Date(Date.now() + 3600000).toISOString() })
  const requests = []
  api.defaults.adapter = async (config) => {
    requests.push(config)
    return { data: {}, status: 200, statusText: 'OK', headers: {}, config }
  }
  await api.post('/api/pedidos', { mesaId: 81, itens: [] })
  await api.post('/api/atendimentos', { mesaId: 81, pedidoId: null, tipo: 'GARCOM' })
  await api.post('/api/pedidos', { mesaId: 82, itens: [] })
  await api.post('/api/atendimentos', { mesaId: 81, pedidoId: 42, tipo: 'CONTA' })
  await api.get('/api/mesas/81/qr')
  assert.equal(requests[0].headers.get('X-Table-Token'), 'synthetic-table-context-81')
  assert.equal(requests[1].headers.get('X-Table-Token'), 'synthetic-table-context-81')
  assert.ok(requests.slice(2).every((request) => !request.headers.get('X-Table-Token')))
  assert.equal(requests[3].headers.get('X-Order-Token'), 'synthetic-capability-42')
})

test('a PIN-authenticated client token only accompanies new order POSTs', async () => {
  const payload = {
    purpose: 'customer', clienteId: 27, sub: 'pablo123',
    exp: Math.floor(Date.now() / 1000) + 3600,
  }
  const token = `head.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.signature`
  saveCustomerSession({ id: 27, nomeUsuario: 'pablo123', token })
  const requests = []
  api.defaults.adapter = async config => {
    requests.push(config)
    return { data: {}, status: 200, statusText: 'OK', headers: {}, config }
  }
  await api.get('/api/v1/produtos')
  await api.post('/api/pedidos', { mesaId: 81, itens: [] })
  await api.post('/api/atendimentos', { mesaId: 81, tipo: 'GARCOM' })
  assert.equal(requests[0].headers.get('X-Customer-Token'), undefined)
  assert.equal(requests[1].headers.get('X-Customer-Token'), token)
  assert.equal(requests[2].headers.get('X-Customer-Token'), undefined)
  assert.equal(requests[1].headers.get('X-Table-Token'), 'synthetic-table-context-81')
})
