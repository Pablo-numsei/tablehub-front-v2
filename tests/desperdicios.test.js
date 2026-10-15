import test from 'node:test'
import assert from 'node:assert/strict'
import { validateWasteCost, validateWasteInput, WASTE_REASONS } from '../src/utils/desperdicios.js'

test('exige produto valido', () => {
  assert.equal(validateWasteInput(null, 1), 'Selecione um produto.')
})

test('impede quantidades vazias, fracionadas e negativas', () => {
  const product = { stock: 10 }
  for (const qty of ['', 0, -2, '1.5', 'x']) {
    assert.notEqual(validateWasteInput(product, qty), '')
  }
})

test('impede perdas maiores que o estoque', () => {
  assert.notEqual(validateWasteInput({ stock: 2 }, 3), '')
})

test('aceita quantidade inteira que cabe no estoque', () => {
  assert.equal(validateWasteInput({ stock: 3 }, '2'), '')
})

test('mantem motivos conhecidos pela API', () => {
  assert.deepEqual(WASTE_REASONS.map((reason) => reason.value), [
    'VENCIMENTO', 'PREPARO', 'DANO', 'OUTROS',
  ])
})

test('exige custo unitario informado e valida casas decimais', () => {
  for (const cost of ['', -1, '4.567', 'texto', '12345678901']) {
    assert.notEqual(validateWasteCost(cost), '')
  }
  for (const cost of ['0', '0.00', '2.50', '3,50']) {
    assert.equal(validateWasteCost(cost), '')
  }
})
