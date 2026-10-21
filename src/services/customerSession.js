/**
 * Customer sessions never reuse staff storage keys or staff roles.
 * Decoding claims in the browser is for presentation only; the server verifies signatures.
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
    return { id: claims.clienteId, email: claims.sub, expiresAt: claims.exp * 1000 }
  } catch {
    return null
  }
}

export const clearCustomerSession = () => {
  try { window.sessionStorage.removeItem(KEY) } catch { /* Browser storage disabled. */ }
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(CUSTOMER_CHANGED_EVENT))
}

export const readCustomerSession = () => {
  if (typeof window === 'undefined') return null
  try {
    const data = JSON.parse(window.sessionStorage.getItem(KEY) || 'null')
    const claims = decodeCustomerToken(data?.token)
    if (!claims || data.id !== claims.id ||
      data.email?.toLowerCase() !== claims.email.toLowerCase() ||
      typeof data.nomeUsuario !== 'string' || !data.nomeUsuario.trim()) {
      return null
    }
    return { token: data.token, customer: { ...claims, nomeUsuario: data.nomeUsuario } }
  } catch {
    return null
  }
}

export const saveCustomerSession = (response) => {
  const claims = decodeCustomerToken(response?.token)
  if (!claims || claims.id !== response.id ||
    claims.email.toLowerCase() !== String(response.email || '').toLowerCase() ||
    !String(response.nomeUsuario || '').trim()) {
    throw new Error('Sessão de cliente inválida. Tente entrar novamente.')
  }
  const session = {
    id: claims.id,
    email: claims.email,
    nomeUsuario: response.nomeUsuario,
    token: response.token,
  }
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(session))
  } catch {
    throw new Error('O navegador não permitiu armazenar a sessão nesta aba.')
  }
  window.dispatchEvent(new Event(CUSTOMER_CHANGED_EVENT))
  return { token: session.token, customer: { ...claims, nomeUsuario: session.nomeUsuario } }
}
