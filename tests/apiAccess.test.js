import test from 'node:test'
import assert from 'node:assert/strict'
import api from '../src/services/api.js'
import { saveOrderAccess } from '../src/services/orderAccess.js'

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
