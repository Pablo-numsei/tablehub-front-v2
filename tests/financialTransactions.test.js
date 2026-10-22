import test from 'node:test'
import assert from 'node:assert/strict'
import {
  mapPaymentHistory, filterPaymentHistory, summarizePaymentHistory,
} from '../src/utils/financialTransactions.js'

const fixture = [
  { id: 8, orderId: 12, amount: 29.90, method: 'PIX', status: 'PAGO',
    createdAt: '2026-10-21T19:06:00', processedAt: '2026-10-21T19:07:00' },
  { id: 9, orderId: 13, amount: 37.20, method: 'CREDITO', status: 'PENDENTE',
    createdAt: '2026-10-21T19:10:00' },
  { id: 10, orderId: 14, amount: 15, method: 'DEBITO', status: 'CANCELADO',
    createdAt: '2026-10-21T19:12:00' },
]

test('financial history retains server payment IDs, method and status', () => {
  const rows = mapPaymentHistory(fixture)
  assert.deepEqual(rows.map((row) => row.id), ['#10', '#9', '#8'])
  assert.deepEqual(rows.map((row) => row.methodLabel), ['Débito', 'Crédito', 'PIX'])
  assert.equal(rows[2].status, 'Confirmado')
  assert.equal(rows[2].time, '19:07 (servidor)')
})

test('PIX, credit, debit filters operate on actual method codes', () => {
  const rows = mapPaymentHistory(fixture)
  assert.deepEqual(filterPaymentHistory(rows, 'PIX', '').map((row) => row.order), ['#12'])
  assert.deepEqual(filterPaymentHistory(rows, 'CREDITO', '').map((row) => row.order), ['#13'])
  assert.deepEqual(filterPaymentHistory(rows, 'DEBITO', '').map((row) => row.order), ['#14'])
  assert.deepEqual(filterPaymentHistory(rows, 'Todos', '#13').map((row) => row.id), ['#9'])
  assert.deepEqual(filterPaymentHistory(rows, 'Todos', 'crédito').map((row) => row.id), ['#9'])
})

test('pending totals are based on registered payments, not made-up values', () => {
  assert.deepEqual(summarizePaymentHistory(mapPaymentHistory(fixture)), {
    total: 3, pending: 37.2, confirmed: 1,
  })
  assert.deepEqual(summarizePaymentHistory([]), { total: 0, pending: 0, confirmed: 0 })
  assert.throws(() => mapPaymentHistory({}), /formato inválido/)
})
