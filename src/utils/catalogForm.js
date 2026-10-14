export const normalizeCatalogText = (value = '') => String(value)
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase()

// Match the decimal(10, 2) column without using binary floating-point validation.
export const parseCatalogPrice = (value) => {
  const text = String(value ?? '').trim()
  if (!/^\d+(?:[,.]\d{1,2})?$/.test(text)) {
    throw new Error('Informe um preço válido com no máximo duas casas decimais, como 19,99.')
  }
  const [whole, fraction = ''] = text.replace(',', '.').split('.')
  const cents = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'))
  if (cents <= 0n || cents > 9999999999n) {
    throw new Error('O preço precisa estar entre R$ 0,01 e R$ 99.999.999,99.')
  }
  return Number(cents) / 100
}
