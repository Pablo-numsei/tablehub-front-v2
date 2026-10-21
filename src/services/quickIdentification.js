import { getTableContextByNumber } from './tableAccess.js'

const SESSION_KEY = 'tablehub_identificacao_rapida_v1'

const keyForTable = table => {
  const normalized = Number(table)
  return Number.isSafeInteger(normalized) && normalized > 0 ? String(normalized) : null
}

export const normalizeBrazilianPhone = phone => {
  const raw = String(phone || '')
  if (!/^[+()0-9\s-]*$/.test(raw)) return null
  let digits = raw.replace(/\D/g, '')
  if (digits.length === 10 || digits.length === 11) digits = '55' + digits
  return /^55[1-9][0-9][2-9][0-9]{7,8}$/.test(digits) ? digits : null
}

export const validateQuickIdentity = ({ name, phone, whatsapp }, available) => {
  const rawName = String(name || '')
  if (/[\x00-\x1f\x7f]/.test(rawName)) {
    return { error: 'Informe seu nome sem caracteres de controle.', value: null }
  }
  const cleanName = rawName.trim().replace(/\s+/g, ' ')
  if (cleanName.length < 2 || cleanName.length > 80) {
    return { error: 'Informe seu nome (2 a 80 caracteres).', value: null }
  }
  if (whatsapp && !available) return { error: 'As atualizações pelo WhatsApp estão indisponíveis.', value: null }
  const normalizedPhone = whatsapp ? normalizeBrazilianPhone(phone) : null
  if (whatsapp && !normalizedPhone) {
    return { error: 'Para receber WhatsApp, informe um telefone brasileiro válido com DDD.', value: null }
  }
  return { error: '', value: { name: cleanName, phone: normalizedPhone, whatsapp: Boolean(whatsapp) } }
}

export const loadQuickIdentity = table => {
  const key = keyForTable(table)
  if (!key || typeof window === 'undefined') return null
  try {
    const stored = JSON.parse(window.sessionStorage.getItem(SESSION_KEY) || '{}')
    // A fresh table QR is still required to order, irrespective of stored identification.
    if (stored.table !== key || !getTableContextByNumber(key)) return null
    if (typeof stored.identity?.name !== 'string') return null
    return stored.identity
  } catch { return null }
}

export const saveQuickIdentity = (table, identity) => {
  const key = keyForTable(table)
  if (!key || !getTableContextByNumber(key)) throw new Error('Escaneie novamente o QR Code da mesa.')
  if (!identity || typeof identity.name !== 'string') throw new Error('Informe seu nome.')
  window.sessionStorage.setItem(SESSION_KEY, JSON.stringify({ table: key, identity }))
}

export const clearQuickIdentity = () => {
  try { window.sessionStorage.removeItem(SESSION_KEY) } catch { /* no storage */ }
}
