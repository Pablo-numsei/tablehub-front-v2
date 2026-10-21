import test from 'node:test'
import assert from 'node:assert/strict'
import { formatOrderTime } from '../src/services/orderTime.js'

test('UTC timestamp is displayed in São Paulo restaurant local time', () => {
  // 23:45 UTC on 21 October is 20:45 in São Paulo, irrespective of host timezone.
  assert.equal(formatOrderTime('2026-10-21T23:45:00Z'), '20:45')
  assert.equal(formatOrderTime('2026-10-22T01:05:00Z'), '22:05')
})

test('legacy SQL GETDATE timestamp is labelled rather than shifted by a guessed offset', () => {
  assert.equal(formatOrderTime(null, '2026-10-21T18:45:00'), '18:45 (servidor)')
  assert.equal(formatOrderTime('2026-10-21T23:45:00', null), '—')
  assert.equal(formatOrderTime(null, null), '—')
})
