const tokens = new Map()
const tokenKey = (id) => `tablehub_order_access_${id}`

export const validOrderId = (value) => {
  const id = Number(String(value ?? '').replace(/^#/, ''))
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

export const saveOrderAccess = (orderId, accessToken) => {
  const id = validOrderId(orderId)
  if (!id || typeof accessToken !== 'string' || !accessToken.trim()) {
    throw new Error('O pedido não retornou uma autorização válida de acompanhamento.')
  }
  tokens.set(id, accessToken)
  try { window.sessionStorage.setItem(tokenKey(id), accessToken) } catch { /* Keep access in this open tab. */ }
}

export const getOrderAccess = (orderId) => {
  const id = validOrderId(orderId)
  if (!id) return null
  try {
    const value = window.sessionStorage.getItem(tokenKey(id))
    if (value) return value
  } catch { /* Storage may be blocked. */ }
  return tokens.get(id) || null
}

export const forgetOrderAccess = (orderId) => {
  const id = validOrderId(orderId)
  if (!id) return
  tokens.delete(id)
  try { window.sessionStorage.removeItem(tokenKey(id)) } catch { /* Memory is already cleared. */ }
}

export const orderIdForRequest = (config) => {
  const path = String(config.url || '').split('?')[0]
  const match = path.match(/^\/api\/(?:pedidos\/(\d+)$|itens-pedido\/pedido\/(\d+)$|payments\/(\d+)(?:\/process)?$)/)
  if (match) return validOrderId(match[1] || match[2] || match[3])
  const optout = path.match(/^\/api\/pedidos\/(\d+)\/whatsapp\/cancelar$/)
  if (optout && String(config.method).toLowerCase() === 'post') return validOrderId(optout[1])
  if (!['/api/atendimentos', '/api/push/subscriptions'].includes(path) || String(config.method).toLowerCase() !== 'post') return null
  try {
    const payload = typeof config.data === 'string' ? JSON.parse(config.data) : config.data
    return validOrderId(payload?.pedidoId)
  } catch { return null }
}

export const orderAccessError = (error) => [401, 403].includes(error?.response?.status)
  ? 'A autorização deste pedido expirou ou não está nesta aba. Volte à aba em que o pedido foi criado ou peça ajuda à equipe.'
  : error?.response?.data?.message || 'Não foi possível consultar o pedido. Tente novamente.'
