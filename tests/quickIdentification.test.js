import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeBrazilianPhone, validateQuickIdentity } from '../src/services/quickIdentification.js'

test('identification needs only the customer name for anonymous orders', () => {
  const result = validateQuickIdentity({ name: 'Lucas', phone: '', whatsapp: false }, false)
  assert.equal(result.error, '')
  assert.deepEqual(result.value, { name: 'Lucas', phone: null, whatsapp: false })
})

test('identification trims name and never sends an unsolicited telephone', () => {
  const result = validateQuickIdentity({
    name: '  Maria  Souza  ', phone: '(11) 99999-9999', whatsapp: false,
  }, true)
  assert.equal(result.value.name, 'Maria Souza')
  assert.equal(result.value.phone, null)
})

test('rejects blank, single-letter, or control characters in the name', () => {
  for (const name of ['', ' ', 'A', 'Lucas\nSilva']) {
    assert.ok(validateQuickIdentity({ name, phone: '', whatsapp: false }, false).error)
  }
})

test('WhatsApp consent requires integration availability and a valid Brazilian number', () => {
  assert.ok(validateQuickIdentity({ name: 'Lucas', phone: '(11) 98765-4321', whatsapp: true }, false).error)
  assert.ok(validateQuickIdentity({ name: 'Lucas', phone: '999', whatsapp: true }, true).error)
  assert.equal(validateQuickIdentity({ name: 'Lucas', phone: '(11) 98765-4321', whatsapp: true }, true).value.phone, '5511987654321')
})

test('Brazilian phone normalization accepts 55 prefix but rejects foreign numbers', () => {
  assert.equal(normalizeBrazilianPhone('+55 (11) 98765-4321'), '5511987654321')
  assert.equal(normalizeBrazilianPhone('(11) 98765-4321'), '5511987654321')
  assert.equal(normalizeBrazilianPhone('+1 202 555 0120'), null)
})
