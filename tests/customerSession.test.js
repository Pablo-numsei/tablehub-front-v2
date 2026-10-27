import test, { beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import {
  readCustomerSession, saveCustomerSession, clearCustomerSession,
  hasCustomerPinVerification, decodeCustomerToken, safeCustomerReturn,
} from '../src/services/customerSession.js'
import { decodeStaffToken } from '../src/services/authSession.js'
import { getTableContext, saveTableContext } from '../src/services/tableAccess.js'

const storage = () => {
  const data = new Map()
  return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value),
    removeItem: key => data.delete(key) }
}
const token = (overrides = {}) => `head.${Buffer.from(JSON.stringify({
  purpose: 'customer', clienteId: 27, sub: 'pablo123',
  exp: Math.floor(Date.now() / 1000) + 300, ...overrides,
})).toString('base64url')}.signature`
const response = (overrides = {}) => ({
  id: 27, nomeUsuario: 'pablo123', token: token(), ...overrides,
})

beforeEach(() => {
  globalThis.window = { sessionStorage: storage(), localStorage: storage(), dispatchEvent: () => {} }
})

test('a customer PIN session does not grant staff privileges', () => {
  saveCustomerSession(response())
  assert.equal(hasCustomerPinVerification(), true)
  saveTableContext({ mesa: { id: 81, number: 4 }, tableToken: 'synthetic-table-81', expiresAt: new Date(Date.now() + 3600000).toISOString() })
  assert.equal(readCustomerSession().customer.nomeUsuario, 'pablo123')
  assert.equal(window.sessionStorage.getItem('tablehub_token'), null)
  assert.equal(window.localStorage.getItem('tablehub_customer_auth'), null)
  assert.equal(decodeStaffToken(token()), null)
  assert.equal(decodeCustomerToken(token()).nomeUsuario, 'pablo123')
  clearCustomerSession()
  assert.equal(readCustomerSession(), null)
  assert.equal(hasCustomerPinVerification(), false)
  assert.equal(getTableContext(81), null)
})

test('forged, expired and wrong-purpose customer sessions are ignored', () => {
  assert.equal(decodeCustomerToken(token({ purpose: 'staff' })), null)
  assert.equal(decodeCustomerToken(token({ exp: 1 })), null)
  assert.throws(() => saveCustomerSession(response({ id: 99 })))
  assert.throws(() => saveCustomerSession(response({ nomeUsuario: 'outro' })))
  assert.equal(readCustomerSession(), null)
})

test('client return route only accepts a local menu reference', () => {
  assert.equal(safeCustomerReturn('/menu?mesa=4'), '/menu?mesa=4')
  assert.equal(safeCustomerReturn('https://evil.example/menu?mesa=4'), '/menu')
  assert.equal(safeCustomerReturn('//evil.example'), '/menu')
  assert.equal(safeCustomerReturn('/dashboard'), '/menu')
})
