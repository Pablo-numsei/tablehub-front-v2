/**
 * Customer JWT stays separate from all staff and order-capability storage.
 * Reading the JWT here only supports UX; the backend always checks the signature.
 */
const KEY = 'tablehub_customer_auth'
export const CUSTOMER_CHANGED_EVENT = 'tablehub-customer-auth-change'

export const decodeCustomerToken = (token, now = Date.now()) => {
  try {
    if (typeof token !== 'string' || token.split('.').length !== 3) return null
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const bytes = Uint8Array.from(atob(payload), letter => letter.charCodeAt(0))
    const claims = JSON.parse(new TextDecoder().decode(bytes))
    if (claims.purpose !== 'customer' ||
        !Number.isInteger(claims.clienteId) || claims.clienteId <= 0 ||
        typeof claims.sub !== 'string' || !claims.sub.trim() ||
        !Number.isFinite(claims.exp) || claims.exp * 1000 <= now) return null
    return { id: claims.clienteId, nomeUsuario: claims.sub, expiresAt: claims.exp * 1000 }
  } catch {
    return null
  }
}

export const clearCustomerSession = () => {
  if (typeof window === 'undefined') return
  try { window.sessionStorage.removeItem(KEY) } catch { /* disabled */ }
  window.dispatchEvent(new Event(CUSTOMER_CHANGED_EVENT))
}

export const readCustomerSession = () => {
  if (typeof window === 'undefined') return null
  try {
    const data = JSON.parse(window.sessionStorage.getItem(KEY) || 'null')
    const claims = decodeCustomerToken(data?.token)
    if (!claims || data.id !== claims.id ||
        data.nomeUsuario?.toLowerCase() !== claims.nomeUsuario.toLowerCase()) return null
    return { token: data.token, customer: { ...claims, nomeUsuario: data.nomeUsuario } }
  } catch {
    return null
  }
}

export const saveCustomerSession = response => {
  const claims = decodeCustomerToken(response?.token)
  if (!claims || claims.id !== response.id ||
      claims.nomeUsuario.toLowerCase() !== String(response.nomeUsuario || '').toLowerCase()) {
    throw new Error('Sessão inválida. Tente entrar novamente.')
  }
  const data = { id: claims.id, nomeUsuario: response.nomeUsuario, token: response.token }
  try { window.sessionStorage.setItem(KEY, JSON.stringify(data)) } catch {
    throw new Error('O navegador não permitiu salvar sua sessão nesta aba.')
  }
  window.dispatchEvent(new Event(CUSTOMER_CHANGED_EVENT))
  return { token: data.token, customer: { ...claims, nomeUsuario: data.nomeUsuario } }
}

/** Prevent redirect outside the client menu; no QR/token is persisted in a URL. */
export const safeCustomerReturn = (from) => {
  if (typeof from !== 'string') return '/menu'
  const match = from.match(/^\/menu\?mesa=(\d{1,6})$/)
  return match ? from : '/menu'
}
