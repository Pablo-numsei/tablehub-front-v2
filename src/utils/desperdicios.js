export const WASTE_REASONS = [
  { value: 'VENCIMENTO', label: 'Vencimento' },
  { value: 'PREPARO', label: 'Perda no preparo' },
  { value: 'DANO', label: 'Dano / avaria' },
  { value: 'OUTROS', label: 'Outros' },
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
