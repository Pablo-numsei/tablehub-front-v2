import test, { beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { readCustomerSession, saveCustomerSession, clearCustomerSession, decodeCustomerToken } from '../src/services/customerSession.js'
import { decodeStaffToken } from '../src/services/authSession.js'

const storage = () => {
  const data = new Map()
  return {
    getItem: key => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: key => data.delete(key),
  }
}
const token = (overrides = {}) => `head.${Buffer.from(JSON.stringify({
  purpose: 'customer',
  clienteId: 27,
  sub: 'cliente@example.test',
  exp: Math.floor(Date.now() / 1000) + 300,
  ...overrides,
})).toString('base64url')}.signature`
const response = (overrides = {}) => ({
  id: 27, email: 'cliente@example.test',
  nomeUsuario: 'cliente.tcc', token: token(), ...overrides,
})

beforeEach(() => {
  globalThis.window = { sessionStorage: storage(), localStorage: storage(), dispatchEvent: () => {} }
})

test('customer account uses its own session, not management storage', () => {
  saveCustomerSession(response())
  assert.equal(readCustomerSession().customer.nomeUsuario, 'cliente.tcc')
  assert.equal(window.sessionStorage.getItem('tablehub_token'), null)
  assert.equal(window.localStorage.getItem('tablehub_customer_auth'), null)
  clearCustomerSession()
  assert.equal(readCustomerSession(), null)
})

test('customer token never grants staff permissions', () => {
  assert.equal(decodeStaffToken(token()), null)
  assert.equal(decodeCustomerToken(token()).email, 'cliente@example.test')
  assert.equal(decodeCustomerToken(token({ purpose: 'staff' })), null)
  assert.equal(decodeCustomerToken(token({ exp: 1 })), null)
})

test('mismatched customer identity cannot start a session', () => {
  assert.throws(() => saveCustomerSession(response({ id: 90 })))
  assert.throws(() => saveCustomerSession(response({ email: 'outro@example.test' })))
  assert.throws(() => saveCustomerSession(response({ nomeUsuario: '' })))
  assert.equal(readCustomerSession(), null)
})

test('stored sessions with expired or wrong-purpose tokens are ignored', () => {
  window.sessionStorage.setItem('tablehub_customer_auth',
    JSON.stringify(response({ token: token({ exp: 1 }) })))
  assert.equal(readCustomerSession(), null)
  window.sessionStorage.setItem('tablehub_customer_auth',
    JSON.stringify(response({ token: token({ purpose: 'order-access' }) })))
  assert.equal(readCustomerSession(), null)
})
