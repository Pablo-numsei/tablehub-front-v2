import { tableNumber } from './tableAccess.js'

// O leitor aceita somente o formato de QR emitido pelo próprio TableHub.
// A autorização real continua sendo feita pelo backend em /api/mesas/contexto.
export const customerMenuRouteFromQr = (rawValue, currentOrigin) => {
  if (typeof rawValue !== 'string' || rawValue.length > 8192 || !rawValue.trim()) return null

  try {
    const url = new URL(rawValue.trim())
    const origin = new URL(currentOrigin)
    if (!['https:', 'http:'].includes(url.protocol) || url.origin !== origin.origin ||
        url.username || url.password || url.pathname !== '/menu' || url.hash ||
        url.searchParams.getAll('mesa').length !== 1 ||
        url.searchParams.getAll('qr').length !== 1) return null

    const number = tableNumber(url.searchParams.get('mesa'))
    const token = url.searchParams.get('qr')
    // O token de mesa tem formato JWT assinado, mas apenas o servidor valida a assinatura.
    if (!number || !token || token.length > 4096 ||
        !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) return null

    return `/menu?mesa=${number}&qr=${encodeURIComponent(token)}`
  } catch {
    return null
  }
}
