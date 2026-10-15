export const WASTE_REASONS = [
  { value: 'VENCIMENTO', label: 'Vencimento' },
  { value: 'PREPARO', label: 'Perda no preparo' },
  { value: 'DANIFICADO', label: 'Dano / avaria' },
  { value: 'OUTRO', label: 'Outros' },
]

export const validateWasteInput = (product, quantity) => {
  if (!product) return 'Selecione um produto.'
  const amount = Number(quantity)
  if (!Number.isSafeInteger(amount) || amount <= 0) return 'Informe uma quantidade inteira maior que zero.'
  if (!Number.isSafeInteger(product.stock) || amount > product.stock) {
    return 'A quantidade perdida nao pode ultrapassar o estoque disponivel.'
  }
  return ''
}

export const validateWasteCost = (value) => {
  const normalized = String(value ?? '').trim().replace(',', '.')
  if (!/^\d{1,10}(?:\.\d{1,2})?$/.test(normalized)) {
    return 'Informe o custo unitario em reais, com ate duas casas decimais.'
  }
  return ''
}
