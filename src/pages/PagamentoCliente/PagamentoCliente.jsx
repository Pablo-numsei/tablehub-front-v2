import { useState } from 'react'
import {
  FiArrowLeft,
  FiCreditCard,
  FiDollarSign,
  FiSmartphone,
} from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import ThemeToggle from '../../components/layout/ThemeToggle.jsx'
import { money } from '../../data/customerMenu.js'
import {
  getActiveCustomerOrder,
  getCustomerOrder,
  updateCustomerOrderPayment,
} from '../../utils/customerSession.js'
import '../../styles/customer-flow.css'

const methods = [
  { id: 'Dinheiro', label: 'Dinheiro', icon: FiDollarSign },
  { id: 'Crédito', label: 'Cartão de crédito', icon: FiCreditCard },
  { id: 'Débito', label: 'Cartão de débito', icon: FiCreditCard },
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

  const confirmPayment = () => {
    if (!method || processing) return

    setProcessing(true)
    updateCustomerOrderPayment(order.id, method)

    window.setTimeout(() => {
      navigate(`/comprovante?${orderQuery}`, { replace: true })
    }, 450)
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
            Esta etapa é apenas uma simulação de interface. Nenhuma cobrança real será realizada.
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
