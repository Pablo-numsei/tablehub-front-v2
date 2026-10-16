import test from 'node:test'
import assert from 'node:assert/strict'
import { readResetTokenFromHash, validateNewPassword } from '../src/services/passwordRecovery.js'

test('reads bearer token only from a URL fragment', () => {
  assert.equal(readResetTokenFromHash('#token=one.two.three'), 'one.two.three')
  assert.equal(readResetTokenFromHash('?token=one.two.three'), '')
  assert.equal(readResetTokenFromHash('#token=%0Aevil'), '')
  assert.equal(readResetTokenFromHash('#token='), '')
})

test('checks characters and UTF-8 length before sending passwords', () => {
  assert.match(validateNewPassword('short', 'short'), /12/)
  assert.match(validateNewPassword('á'.repeat(40), 'á'.repeat(40)), /UTF-8/)
  assert.match(validateNewPassword('strong-secret-pass', 'mismatch'), /coincidem/)
  assert.equal(validateNewPassword('strong-secret-pass', 'strong-secret-pass'), '')
})
