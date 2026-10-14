export const tableQrUrl = (number, qrToken, publicUrl) => {
  if (!Number.isInteger(Number(number)) || Number(number) <= 0 || typeof qrToken !== 'string' || !qrToken) {
    throw new Error('O QR Code desta mesa está indisponível.')
  }
  const base = new URL(publicUrl)
  if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password) {
    throw new Error('Configure um endereço público HTTP ou HTTPS válido para os QR Codes.')
  }
  const url = new URL('/menu', base)
  url.searchParams.set('mesa', String(Number(number)))
  url.searchParams.set('qr', qrToken)
  return url.toString()
}

export const isLocalQrUrl = (url) => {
  try { return ['localhost', '127.0.0.1', '[::1]'].includes(new URL(url).hostname) } catch { return false }
}
