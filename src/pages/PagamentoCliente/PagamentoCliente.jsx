import { useState } from 'react'
import {
  FiArrowLeft,
  FiCreditCard,
  FiSmartphone,
} from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import ThemeToggle from '../../components/layout/ThemeToggle.jsx'
import api from '../../services/api.js'
import { money } from '../../data/customerMenu.js'
import {
  getActiveCustomerOrder,
  getCustomerOrder,
  updateCustomerOrderPayment,
} from '../../utils/customerSession.js'
import '../../styles/customer-flow.css'

const methods = [
  { id: 'CREDITO', label: 'Cartão de crédito', icon: FiCreditCard },
  { id: 'DEBITO', label: 'Cartão de débito', icon: FiCreditCard },
  { id: 'PIX', label: 'PIX', icon: FiSmartphone },
]

export default function PagamentoCliente() {
  const navigate = useNavigate()
  const params = new URLSearchParams(window.location.search)
  const requestedId = params.get('id')
  const order = requestedId
    ? getCustomerOrder(requestedId)
    : getActiveCustomerOrder()
  const [method, setMethod] = useState(order?.paymentMethod || '')
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')

  if (!order) {
    return (
      <main className="customer-flow-page">
        <div className="customer-flow-shell">
          <section className="customer-flow-head">
            <span>PAGAMENTO</span>
            <h1>Pedido não encontrado.</h1>
          </section>
        </div>
      </main>
    )
  }

  const orderQuery = `id=${encodeURIComponent(order.id)}&mesa=${order.table}`

  const confirmPayment = async () => {
    if (!method || processing) return

    const backendId =
      order.backendId ?? Number(String(order.id).replace('#', ''))

    if (!backendId) {
      setError('Este pedido não possui um ID válido no backend.')
      return
    }

    setProcessing(true)
    setError('')

    try {
      await api.post(`/api/payments/${backendId}/process`, {
        method,
        gatewayReference: null,
      })

      const labels = {
        CREDITO: 'Crédito',
        DEBITO: 'Débito',
        PIX: 'PIX',
      }

      updateCustomerOrderPayment(order.id, labels[method] || method)
      navigate(`/comprovante?${orderQuery}`, { replace: true })
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          'Não foi possível registrar o pagamento no backend.',
      )
    } finally {
      setProcessing(false)
    }
  }

  return (
    <main className="customer-flow-page">
      <div className="customer-flow-shell">
        <header className="customer-flow-topbar">
          <div className="customer-flow-brand">TableHub</div>
          <div className="customer-flow-topbar__actions">
            <div className="customer-flow-table">MESA {order.table}</div>
            <ThemeToggle compact />
          </div>
        </header>

        <section className="customer-flow-head customer-status-card">
          <span>PAGAMENTO</span>
          <h1>Como deseja pagar?</h1>
          <p>Escolha uma forma de pagamento para concluir a etapa visual do protótipo.</p>
        </section>

        <section className="customer-flow-card customer-status-card">
          {error && (
            <div className="customer-flow-error" role="alert">
              {error}
            </div>
          )}

          <div className="customer-payment-methods">
            {methods.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className={`customer-choice-button ${method === id ? 'is-active' : ''}`}
                onClick={() => setMethod(id)}
              >
                <Icon />
                <span>{label}</span>
              </button>
            ))}
          </div>

          <div className="customer-summary-total">
            <span>Total do pedido</span>
            <strong>{money(order.total)}</strong>
          </div>

          <div className="customer-demo-notice">
            O registro é salvo no TableHub. Não existe integração com banco, maquininha ou gateway de cobrança real.
          </div>

          <div className="customer-flow-actions">
            <button
              className="th-btn th-btn--primary th-btn--block"
              type="button"
              onClick={confirmPayment}
              disabled={!method || processing}
            >
              {processing ? 'Registrando...' : 'Confirmar forma de pagamento'}
            </button>

            <button
              className="th-btn th-btn--glass th-btn--block"
              type="button"
              onClick={() => navigate(`/acompanhar-pedido?${orderQuery}`)}
            >
              <FiArrowLeft /> Voltar ao pedido
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}
