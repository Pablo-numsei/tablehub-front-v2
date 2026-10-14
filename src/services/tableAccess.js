const STORAGE_KEY = 'tablehub_table_contexts_v1'
let memory = {}

export const tableNumber = (value) => {
  const text = String(value ?? '').trim()
  if (!/^\d{1,10}$/.test(text)) return null
  const number = Number(text)
  return Number.isSafeInteger(number) && number > 0 && number <= 2147483647 ? number : null
}

const validContext = (value, now = Date.now()) => {
  const id = Number(value?.mesa?.id)
  const number = tableNumber(value?.mesa?.number)
  const expiresAt = Date.parse(value?.expiresAt)
  return Number.isSafeInteger(id) && id > 0 && number &&
    typeof value?.tableToken === 'string' && value.tableToken.length > 0 &&
    Number.isFinite(expiresAt) && expiresAt > now
}

const load = () => {
  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) || '{}')
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) memory = { ...parsed, ...memory }
  } catch { /* Keep a successful exchange available when storage is disabled. */ }
  return memory
}

export const saveTableContext = (context) => {
  if (!validContext(context)) throw new Error('O QR Code retornou um contexto de mesa inválido.')
  const clean = {
    mesa: { id: Number(context.mesa.id), number: tableNumber(context.mesa.number) },
    tableToken: context.tableToken,
    expiresAt: context.expiresAt,
  }
  const current = load()
  memory = Object.fromEntries(Object.entries(current).filter(([, value]) => validContext(value)))
  memory[clean.mesa.id] = clean
  try { window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(memory)) } catch { /* Use memory. */ }
  return clean
}

export const getTableContext = (id, now = Date.now()) => {
  const result = load()[Number(id)]
  return validContext(result, now) && Number(result.mesa.id) === Number(id) ? result : null
}

export const getTableContextByNumber = (number, now = Date.now()) => {
  const expected = tableNumber(number)
  if (!expected) return null
  return Object.values(load()).find((value) => validContext(value, now) && tableNumber(value.mesa.number) === expected) || null
}

export const tableIdForRequest = (config) => {
  if (String(config.method || 'get').toLowerCase() !== 'post') return null
  const raw = String(config.url || '')
  if (/^https?:\/\//i.test(raw) || raw.startsWith('//')) return null
  const route = raw.split('?')[0]
  let data = config.data
  if (typeof data === 'string') {
    try { data = JSON.parse(data) } catch { return null }
  }
  if (route !== '/api/pedidos' && !(route === '/api/atendimentos' && data?.pedidoId == null)) return null
  const id = Number(data?.mesaId)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}
