import { useState } from 'react'
import { FiCheckCircle, FiFileText } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import ThemeToggle from '../../components/layout/ThemeToggle.jsx'
import { money } from '../../data/customerMenu.js'
import {
  createServiceRequest,
  getActiveCustomerOrder,
  getCustomerOrder,
} from '../../utils/customerSession.js'
import '../../styles/customer-flow.css'

export default function SolicitarConta() {
  const navigate = useNavigate()
  const params = new URLSearchParams(window.location.search)
  const requestedId = params.get('id')
  const order = requestedId
    ? getCustomerOrder(requestedId)
    : getActiveCustomerOrder()
  const table = order?.table || params.get('mesa') || '04'
  const [sent, setSent] = useState(false)

  const requestBill = () => {
    createServiceRequest({
      type: 'Conta',
      table,
      orderId: order?.id || null,
      detail: 'Solicitação de fechamento da mesa',
    })
    setSent(true)
  }

  return (
    <main className="customer-flow-page">
      <div className="customer-flow-shell">
        <header className="customer-flow-topbar">
          <div className="customer-flow-brand">TableHub</div>
          <div className="customer-flow-topbar__actions">
            <div className="customer-flow-table">MESA {table}</div>
            <ThemeToggle compact />
          </div>
        </header>

        <section className="customer-flow-head customer-status-card">
          <span>CONTA</span>
          <h1>Solicitar fechamento</h1>
          <p>Envie uma solicitação para a equipe responsável pela mesa.</p>
        </section>

        <section className="customer-flow-card customer-status-card">
          {sent ? (
            <div className="customer-request-success">
              <FiCheckCircle />
              <h2>Conta solicitada.</h2>
              <p>A solicitação da mesa {table} foi registrada no protótipo.</p>
            </div>
          ) : (
            <>
              <div className="customer-result-icon customer-result-icon--small">
                <FiFileText />
              </div>

              {order && (
                <>
                  <div className="customer-summary-row">
                    <span>Pedido</span>
                    <strong>{order.id}</strong>
                  </div>
                  <div className="customer-summary-row">
                    <span>Pagamento</span>
                    <strong>{order.paymentMethod || 'Pendente'}</strong>
                  </div>
                  <div className="customer-summary-total">
                    <span>Total atual</span>
                    <strong>{money(order.total)}</strong>
                  </div>
                </>
              )}

              <button
                className="th-btn th-btn--primary th-btn--block"
                type="button"
                onClick={requestBill}
              >
                Solicitar conta
              </button>
            </>
          )}

          <div className="customer-flow-actions" style={{ marginTop: 12 }}>
            <button
              className="th-btn th-btn--glass th-btn--block"
              type="button"
              onClick={() =>
                navigate(
                  order
                    ? `/acompanhar-pedido?id=${encodeURIComponent(order.id)}&mesa=${table}`
                    : `/menu?mesa=${table}`,
                )
              }
            >
              Voltar
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}
