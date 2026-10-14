import api from './api.js'

export const paymentMethodLabel = (method) => ({ CREDITO: 'Crédito', DEBITO: 'Débito', PIX: 'PIX' }[method] || method || 'Não informada')
export const paymentStatusLabel = (status) => ({
  PENDENTE: 'Aguardando confirmação da equipe', PAGO: 'Confirmado pela equipe',
  CANCELADO: 'Cancelado', FALHOU: 'Falhou',
}[status] || 'Não solicitado')

export const loadOrderPayment = async (orderId, config = {}) => {
  try {
    const { data } = await api.get(`/api/payments/${orderId}`, config)
    return data && typeof data === 'object' && data.id ? data : null
  } catch (error) {
    if (error.response?.status === 404) return null
    throw error
  }
}
