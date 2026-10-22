import { formatOrderTime } from '../services/orderTime.js'

const METHOD_LABELS = { PIX: 'PIX', CREDITO: 'Crédito', DEBITO: 'Débito' }
const STATUS_LABELS = {
  PAGO: 'Confirmado', PENDENTE: 'Pendente',
  CANCELADO: 'Cancelado', FALHOU: 'Falhou',
}
const toSearchable = (value) => String(value || '')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

export const PAYMENT_METHOD_FILTERS = [
  { id: 'Todos', label: 'Todos' },
  { id: 'PIX', label: 'PIX' },
  { id: 'CREDITO', label: 'Crédito' },
  { id: 'DEBITO', label: 'Débito' },
]

export const mapPaymentHistory = (rows) => {
  if (!Array.isArray(rows)) throw new Error('O histórico de pagamentos retornou um formato inválido.')
  return rows
    .filter((row) => Number.isSafeInteger(row?.id) && Number.isSafeInteger(row?.orderId))
    .map((row) => {
      const code = String(row.method || '').toUpperCase()
      const statusCode = String(row.status || '').toUpperCase()
      const amount = Number(row.amount)
      return {
        id: `#${row.id}`, order: `#${row.orderId}`,
        method: code, methodLabel: METHOD_LABELS[code] || (row.method || 'Não informado'),
        statusCode, status: STATUS_LABELS[statusCode] || (row.status || 'Não informado'),
        time: formatOrderTime(null, row.processedAt || row.createdAt),
        value: Number.isFinite(amount) ? amount : 0,
      }
    })
    .sort((a, b) => Number(b.id.slice(1)) - Number(a.id.slice(1)))
}

export const filterPaymentHistory = (transactions, method, query) => {
  const search = toSearchable(query).trim()
  return transactions.filter((transaction) =>
    (method === 'Todos' || transaction.method === method) &&
    (!search || toSearchable(`${transaction.id} ${transaction.order} ${transaction.methodLabel} ${transaction.status}`).includes(search)))
}

export const summarizePaymentHistory = (transactions) => ({
  total: transactions.length,
  pending: transactions.filter((row) => row.statusCode === 'PENDENTE')
    .reduce((sum, row) => sum + Math.round(row.value * 100), 0) / 100,
  confirmed: transactions.filter((row) => row.statusCode === 'PAGO').length,
})
