import { useState } from 'react'
import { FiArrowRight, FiBell, FiCheckCircle, FiClock } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import ThemeToggle from '../../components/layout/ThemeToggle.jsx'
import { money } from '../../data/customerMenu.js'
import {
  enableOrderPush,
  isOrderPushEnabled,
} from '../../services/pushNotifications.js'
import {
  getActiveCustomerOrder,
  getCustomerOrder,
} from '../../utils/customerSession.js'
import '../../styles/customer-flow.css'

export default function PedidoConfirmado() {
  const navigate = useNavigate()
  const params = new URLSearchParams(window.location.search)
  const requestedId = params.get('id')
  const order = requestedId
    ? getCustomerOrder(requestedId)
    : getActiveCustomerOrder()

  const [pushEnabled, setPushEnabled] = useState(() =>
    isOrderPushEnabled(order),
  )
  const [pushLoading, setPushLoading] = useState(false)
  const [pushError, setPushError] = useState('')

  if (!order) {
    return (
      <main className="customer-flow-page">
        <div className="customer-flow-shell">
          <header className="customer-flow-topbar">
            <div className="customer-flow-brand">TableHub</div>
            <ThemeToggle compact />
          </header>

          <section className="customer-flow-head">
            <span>PEDIDO</span>
            <h1>Pedido não encontrado.</h1>
          </section>
        </div>
      </main>
    )
  }

  const orderQuery = `id=${encodeURIComponent(order.id)}&mesa=${order.table}`

  const activateNotifications = async () => {
    if (pushEnabled || pushLoading) return

    setPushLoading(true)
    setPushError('')

    try {
      await enableOrderPush(order)
      setPushEnabled(true)
    } catch (error) {
      setPushError(
        error?.response?.data?.message ||
          error?.message ||
          'Não foi possível ativar as notificações.',
      )
    } finally {
      setPushLoading(false)
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

        <section className="customer-flow-card customer-result-card">
          <div className="customer-result-icon">
            <FiCheckCircle />
          </div>

          <span className="customer-flow-card__eyebrow">PEDIDO CONFIRMADO</span>
          <h1>Enviado para a cozinha.</h1>
          <p>
            Seu pedido {order.id} foi registrado. Você pode acompanhar o preparo
            e registrar uma forma de pagamento nesta demonstração.
          </p>

          <div className="customer-result-summary">
            <div>
              <span>Total</span>
              <strong>{money(order.total)}</strong>
            </div>
            <div>
              <span>Horário</span>
              <strong><FiClock /> {order.time}</strong>
            </div>
          </div>

          {pushError && (
            <div className="customer-flow-error" role="alert">
              {pushError}
            </div>
          )}

          <div className="customer-flow-actions">
            <button
              className="th-btn th-btn--glass th-btn--block"
              type="button"
              onClick={activateNotifications}
              disabled={pushEnabled || pushLoading}
            >
              <FiBell />
              {pushEnabled
                ? 'Notificações ativadas'
                : pushLoading
                  ? 'Ativando notificações...'
                  : 'Receber atualizações do pedido'}
            </button>

            <button
              className="th-btn th-btn--primary th-btn--block"
              type="button"
              onClick={() => navigate(`/pagamento?${orderQuery}`)}
            >
              Ir para pagamento <FiArrowRight />
            </button>

            <button
              className="th-btn th-btn--glass th-btn--block"
              type="button"
              onClick={() => navigate(`/acompanhar-pedido?${orderQuery}`)}
            >
              Acompanhar pedido
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}
