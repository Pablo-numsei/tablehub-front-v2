import test, { beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import {
  canAccessRoute, canAdvanceOrder, clearAuthSession, decodeStaffToken,
  landingPage, normalizeRole, readAuthSession, saveAuthSession,
} from '../src/services/authSession.js'

const storage = () => {
  const values = new Map()
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) }
}
const token = (overrides = {}) => `header.${Buffer.from(JSON.stringify({
  usuarioId: 5, sub: 'staff@example.com', perfil: 'Garçom', exp: Math.floor(Date.now() / 1000) + 300,
  ...overrides,
})).toString('base64url')}.signature`
const response = (overrides = {}) => ({ id: 5, nome: 'Equipe', email: 'staff@example.com', perfil: 'Garçom', token: token(), ...overrides })

beforeEach(() => {
  globalThis.window = { sessionStorage: storage(), localStorage: storage(), dispatchEvent: () => {} }
})

test('role policy denies unlisted roles and routes, including public registration', () => {
  assert.equal(normalizeRole(' Garçom '), 'GARCOM')
  assert.equal(canAccessRoute('Cozinha', '/pedidos'), true)
  for (const path of ['/cadastro', '/financeiro', '/estoque', '/dashboard']) assert.equal(canAccessRoute('Cozinha', path), false)
  assert.equal(canAccessRoute('Garçom', '/cadastro'), false)
  assert.equal(canAccessRoute('Administrador', '/cadastro'), true)
  assert.equal(canAccessRoute('Cliente', '/pedidos'), false)
  assert.equal(canAccessRoute('Administrador', '//evil.example'), false)
  assert.equal(landingPage('Cozinha'), '/pedidos')
})

test('status actions match kitchen, waiter and administrator responsibilities', () => {
  assert.equal(canAdvanceOrder('Cozinha', 'Recebido'), true)
  assert.equal(canAdvanceOrder('Cozinha', 'Em preparo'), true)
  assert.equal(canAdvanceOrder('Cozinha', 'Pronto'), false)
  assert.equal(canAdvanceOrder('Garçom', 'Pronto'), true)
  assert.equal(canAdvanceOrder('Garçom', 'Recebido'), false)
  assert.equal(canAdvanceOrder('Administrador', 'Pronto'), true)
  assert.equal(canAdvanceOrder('Administrador', 'Entregue'), false)
})

test('expired, malformed, missing expiry and guest tokens do not create staff sessions', () => {
  for (const value of ['', 'invalid', token({ exp: 0 }), token({ exp: undefined }), token({ perfil: 'Cliente' }), token({ usuarioId: undefined, pedidoId: 7 })]) {
    assert.equal(decodeStaffToken(value), null)
  }
  assert.equal(decodeStaffToken(token()).role, 'GARCOM')
})

test('login without a valid matching token is rejected', () => {
  assert.throws(() => saveAuthSession(response({ token: undefined })))
  assert.throws(() => saveAuthSession(response({ id: 9 })))
  assert.throws(() => saveAuthSession(response({ perfil: 'Administrador' })))
  assert.throws(() => saveAuthSession(response({ email: 'other@example.com' })))
  assert.equal(readAuthSession(), null)
})

test('session storage is default and remember option persists explicitly', () => {
  saveAuthSession(response())
  assert.ok(window.sessionStorage.getItem('tablehub_token'))
  assert.equal(window.localStorage.getItem('tablehub_token'), null)
  saveAuthSession(response(), true)
  assert.equal(window.sessionStorage.getItem('tablehub_token'), null)
  assert.ok(window.localStorage.getItem('tablehub_token'))
})

test('stored profile cannot override token role and logout clears both storages', () => {
  saveAuthSession(response())
  window.sessionStorage.setItem('tablehub_user', JSON.stringify({ nome: 'Equipe', role: 'ADMINISTRADOR', perfil: 'Administrador' }))
  assert.equal(readAuthSession().user.role, 'GARCOM')
  window.localStorage.setItem('tablehub_token', token())
  window.localStorage.setItem('tablehub_push_staff_enabled', '1')
  clearAuthSession()
  assert.equal(readAuthSession(), null)
  assert.equal(window.localStorage.getItem('tablehub_push_staff_enabled'), null)
})

test('unavailable storage fails safely without retaining a partial session', () => {
  window.sessionStorage.setItem = () => { throw new Error('blocked') }
  assert.throws(() => saveAuthSession(response()), /armazenamento/)
  assert.equal(readAuthSession(), null)
})
