import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeCatalogText, parseCatalogPrice } from '../src/utils/catalogForm.js'
import { filterAnonymousOrders, mapAnonymousOrders, summarizeAnonymousOrders } from '../src/utils/anonymousOrders.js'

test('catalog accepts valid cents with comma or dot, including previous float regressions', () => {
  for (const [input, expected] of [
    ['19,99', 19.99], ['19.99', 19.99], ['1,10', 1.10], ['2,30', 2.30],
    ['29,90', 29.90], ['0,01', .01], [' 00019,99 ', 19.99], ['99', 99],
    ['99999999,99', 99999999.99],
  ]) assert.equal(parseCatalogPrice(input), expected, input)
})

test('catalog rejects ambiguous formats, fractions of a cent and values outside database precision', () => {
  for (const input of ['', ' ', null, '0', '-1', 'NaN', 'Infinity', '1e2', '1,234', '1.234,56', '1..00', '100000000,00']) {
    assert.throws(() => parseCatalogPrice(input), undefined, String(input))
  }
})

test('catalog search uses the same accent and case normalization on both sides', () => {
  const name = normalizeCatalogText('Hambúrguer Artesanal')
  for (const query of ['hambúrguer', 'HAMBURGUER', '  HAMBÚRGUER  ', 'hamburgu\u0301er']) {
    assert.ok(name.includes(normalizeCatalogText(query)), query)
  }
})

const rows = [
  { id: 11, mesa: { id: 1, number: 4 }, status: { name: 'Recebido' }, totalValue: '19.99', createdAt: '2026-10-14T10:00:00', customer: { name: 'Do not use', email: 'example@example.invalid' } },
  { id: 12, mesa: { id: 1, number: 4 }, status: { name: 'Entregue' }, totalValue: '1.10', createdAt: '2026-10-14T11:00:00' },
  { id: 13, mesa: { id: 2, number: 9 }, status: { name: 'Em preparo' }, totalValue: '2.30', createdAt: '2026-10-14T12:00:00' },
]

test('anonymous view keeps separate orders at the same table without inventing customer identities', () => {
  const orders = mapAnonymousOrders(rows)
  assert.equal(orders.length, 3)
  assert.deepEqual(orders.map((order) => order.id), [13, 12, 11])
  assert.equal(orders.filter((order) => order.table === 4).length, 2)
  for (const order of orders) {
    assert.deepEqual(Object.keys(order).sort(), ['amount', 'code', 'createdAt', 'id', 'status', 'table'])
  }
  assert.equal(orders.find((order) => order.id === 11).amount, 19.99)
})

test('anonymous filters search order IDs, padded table numbers and status without case sensitivity', () => {
  const orders = mapAnonymousOrders(rows)
  assert.deepEqual(filterAnonymousOrders(orders, '#11', 'Todos').map((order) => order.id), [11])
  assert.deepEqual(filterAnonymousOrders(orders, 'mesa 04', 'Todos').map((order) => order.id), [12, 11])
  assert.deepEqual(filterAnonymousOrders(orders, 'MESA 4', 'Recebido').map((order) => order.id), [11])
  assert.deepEqual(filterAnonymousOrders(orders, 'EM PREPARO', 'Todos').map((order) => order.id), [13])
  assert.deepEqual(filterAnonymousOrders(orders, '#404', 'Todos'), [])
})

test('anonymous summaries describe only the visible order subset and sum cents exactly', () => {
  const orders = mapAnonymousOrders(rows)
  assert.deepEqual(summarizeAnonymousOrders(orders), { count: 3, active: 2, total: 23.39, missingAmounts: 0 })
  assert.deepEqual(summarizeAnonymousOrders(filterAnonymousOrders(orders, 'mesa 04', 'Todos')), { count: 2, active: 1, total: 21.09, missingAmounts: 0 })
  assert.deepEqual(summarizeAnonymousOrders(filterAnonymousOrders(orders, '', 'Entregue')), { count: 1, active: 0, total: 1.1, missingAmounts: 0 })
  assert.deepEqual(summarizeAnonymousOrders([]), { count: 0, active: 0, total: 0, missingAmounts: 0 })
})

test('missing order data stays unknown instead of becoming table 04 or fabricated revenue', () => {
  const orders = mapAnonymousOrders([
    { id: 21, createdAt: 'bad date', totalValue: null },
    { id: 22, mesa: { number: -1 }, totalValue: ' ' },
    { id: 23, totalValue: false },
    { id: 24, totalValue: -5 },
    { id: 25, totalValue: [] },
    { id: 'invalid', totalValue: 100000 },
  ])
  assert.equal(orders.length, 5)
  assert.ok(orders.every((order) => order.table === null && order.amount === null && order.createdAt === null))
  assert.deepEqual(summarizeAnonymousOrders(orders), { count: 5, active: 0, total: 0, missingAmounts: 5 })
  assert.throws(() => mapAnonymousOrders({ error: 'invalid response' }), /interpretar/)
})
