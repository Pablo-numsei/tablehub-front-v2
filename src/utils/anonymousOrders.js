import { normalizeCatalogText } from './catalogForm.js'

export const ORDER_FILTERS = ['Todos', 'Recebido', 'Em preparo', 'Pronto', 'Entregue']
const activeStatuses = new Set(['Recebido', 'Em preparo', 'Pronto'])

// Somente amostras visuais: nunca gravar no backend como se fossem clientes reais.
const demoNames = [
  'Mariana Santos', 'Lucas Oliveira', 'Beatriz Costa', 'Rafael Martins',
  'Camila Ribeiro', 'Gabriel Almeida', 'Fernanda Lima', 'Bruno Alves',
]

const orderAmount = (value) => {
  if (!['string', 'number'].includes(typeof value) || String(value).trim() === '') return null
  const amount = Number(value)
  return Number.isFinite(amount) && amount >= 0 ? amount : null
}

const validInstant = (value) =>
  typeof value === 'string' && /(?:Z|[+-]\d{2}:\d{2})$/i.test(value) && Number.isFinite(Date.parse(value))

const serverTimestamp = (value) =>
  typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T?\s?\d{2}:\d{2}/.test(value)

export const mapAnonymousOrders = (rows) => {
  if (!Array.isArray(rows)) throw new Error('Não foi possível interpretar os pedidos recebidos.')
  return rows.filter((row) => Number.isSafeInteger(row?.id) && row.id > 0).map((row) => {
    const table = Number(row.mesa?.number)
    const realName = typeof row.nomeCliente === 'string' ? row.nomeCliente.trim() : ''
    const displayName = realName || demoNames[row.id % demoNames.length]
    const createdAtUtc = validInstant(row.createdAtUtc) ? row.createdAtUtc : null
    const createdAt = serverTimestamp(row.createdAt) ? row.createdAt : null
    return {
      id: row.id, code: `#${row.id}`,
      table: Number.isSafeInteger(table) && table > 0 ? table : null,
      status: typeof row.status?.name === 'string' && row.status.name.trim() ? row.status.name : 'Não informado',
      createdAt, createdAtUtc, amount: orderAmount(row.totalValue),
      displayName, isDemoName: !realName,
    }
  }).sort((a, b) => b.id - a.id)
}

export const filterAnonymousOrders = (orders, query, status) => {
  const term = normalizeCatalogText(query)
  return orders.filter((order) => (status === 'Todos' || order.status === status) &&
    (!term || normalizeCatalogText(`${order.code} ${order.displayName || ''} mesa ${order.table ?? ''} mesa ${order.table == null ? '' : String(order.table).padStart(2, '0')} ${order.status}`).includes(term)))
}

export const summarizeAnonymousOrders = (orders) => ({
  count: orders.length,
  active: orders.filter((order) => activeStatuses.has(order.status)).length,
  total: orders.reduce((sum, order) => sum + (order.amount == null ? 0 : Math.round(order.amount * 100)), 0) / 100,
  missingAmounts: orders.filter((order) => order.amount == null).length,
})
