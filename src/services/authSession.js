const TOKEN_KEY = 'tablehub_token'
const USER_KEY = 'tablehub_user'
export const AUTH_CHANGED_EVENT = 'tablehub-auth-change'

export const normalizeRole = (role = '') => String(role)
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase().replace(/\s+/g, '_')

const roles = new Set(['ADMINISTRADOR', 'GARCOM', 'COZINHA'])

export const MANAGEMENT_ROUTES = [
  { label: 'Dashboard', path: '/dashboard', roles: ['ADMINISTRADOR', 'GARCOM', 'COZINHA'] },
  { label: 'Cardápio', path: '/cardapio', roles: ['ADMINISTRADOR'] },
  { label: 'Pedidos', path: '/pedidos', roles: ['ADMINISTRADOR', 'GARCOM', 'COZINHA'] },
  { label: 'Atendimento', path: '/atendimento', roles: ['ADMINISTRADOR', 'GARCOM'] },
  { label: 'Clientes', path: '/clientes', roles: ['ADMINISTRADOR'] },
  { label: 'Financeiro', path: '/financeiro', roles: ['ADMINISTRADOR'] },
  { label: 'Mesas', path: '/mesas', roles: ['ADMINISTRADOR', 'GARCOM'] },
  { label: 'Produtos / Estoque', path: '/estoque', roles: ['ADMINISTRADOR'] },
  { label: 'Usuários', path: '/cadastro', roles: ['ADMINISTRADOR'] },
]

export const landingPage = (role) => '/dashboard'
export const canAccessRoute = (role, path) =>
  MANAGEMENT_ROUTES.find((route) => route.path === path)?.roles.includes(normalizeRole(role)) === true

export const canAdvanceOrder = (role, currentStatus) => {
  const next = { Recebido: 'Em preparo', 'Em preparo': 'Pronto', Pronto: 'Entregue' }[currentStatus]
  if (!next) return false
  const normalized = normalizeRole(role)
  return normalized === 'ADMINISTRADOR' ||
    (normalized === 'COZINHA' && ['Em preparo', 'Pronto'].includes(next)) ||
    (normalized === 'GARCOM' && next === 'Entregue')
}

export const decodeStaffToken = (token, now = Date.now()) => {
  try {
    if (typeof token !== 'string' || token.split('.').length !== 3) return null
    const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const bytes = Uint8Array.from(atob(part), (value) => value.charCodeAt(0))
    const claims = JSON.parse(new TextDecoder().decode(bytes))
    const role = normalizeRole(claims.perfil)
    if (!Number.isFinite(claims.exp) || claims.exp * 1000 <= now ||
      !Number.isInteger(claims.usuarioId) || claims.usuarioId <= 0 ||
      typeof claims.sub !== 'string' || !claims.sub.trim() || !roles.has(role)) return null
    return { id: claims.usuarioId, email: claims.sub, perfil: claims.perfil, role, expiresAt: claims.exp * 1000 }
  } catch {
    return null
  }
}

const storagePairs = () => {
  if (typeof window === 'undefined') return []
  const available = []
  for (const name of ['sessionStorage', 'localStorage']) {
    try { available.push(window[name]) } catch { /* Storage can be disabled by the browser. */ }
  }
  return available
}

export const readAuthSession = () => {
  for (const storage of storagePairs()) {
    try {
      const token = storage.getItem(TOKEN_KEY)
      const claims = decodeStaffToken(token)
      if (!claims) continue
      let profile = {}
      try { profile = JSON.parse(storage.getItem(USER_KEY) || '{}') || {} } catch { /* Use signed claims. */ }
      return { token, user: { ...claims, nome: typeof profile.nome === 'string' ? profile.nome : claims.email } }
    } catch { /* Try the other storage. */ }
  }
  return null
}

const notifyAuthChange = () => {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(AUTH_CHANGED_EVENT))
}

export const clearAuthSession = () => {
  for (const storage of storagePairs()) {
    try {
      storage.removeItem(TOKEN_KEY)
      storage.removeItem(USER_KEY)
      storage.removeItem('tablehub_push_staff_enabled')
    } catch { /* Still clear the other storage. */ }
  }
  notifyAuthChange()
}

export const saveAuthSession = (data, remember = false) => {
  const claims = decodeStaffToken(data?.token)
  if (!claims || data.id !== claims.id || normalizeRole(data.perfil) !== claims.role ||
    String(data.email || '').toLowerCase() !== claims.email.toLowerCase()) {
    throw new Error('A resposta de acesso é inválida. Tente entrar novamente.')
  }
  clearAuthSession()
  try {
    const storage = remember ? window.localStorage : window.sessionStorage
    storage.setItem(TOKEN_KEY, data.token)
    storage.setItem(USER_KEY, JSON.stringify({ nome: data.nome || claims.email }))
  } catch {
    clearAuthSession()
    throw new Error('O navegador bloqueou o armazenamento da sessão. Permita o armazenamento para entrar.')
  }
  notifyAuthChange()
  return { token: data.token, user: { ...claims, nome: data.nome || claims.email } }
}

export const getStaffToken = () => readAuthSession()?.token || null
