import { useEffect, useMemo, useState } from 'react'
import {
  FiBell,
  FiCheck,
  FiCreditCard,
  FiFileText,
  FiRefreshCw,
} from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import ThemeToggle from '../../components/layout/ThemeToggle.jsx'
import { money } from '../../data/customerMenu.js'
import {
  getActiveCustomerOrder,
  getCustomerOrder,
} from '../../utils/customerSession.js'
import '../../styles/customer-flow.css'

const statuses = ['Aguardando', 'Preparando', 'Pronto', 'Entregue']

export default function AcompanharPedido() {
  const navigate = useNavigate()
  const params = new URLSearchParams(window.location.search)
  const requestedId = params.get('id')
  const [order, setOrder] = useState(() =>
    requestedId ? getCustomerOrder(requestedId) : getActiveCustomerOrder(),
  )

  useEffect(() => {
    const refresh = () => {
      const current = requestedId
        ? getCustomerOrder(requestedId)
        : getActiveCustomerOrder()

      setOrder(current)
    }

    const timer = window.setInterval(refresh, 1200)
    window.addEventListener('storage', refresh)

    return () => {
      window.clearInterval(timer)
      window.removeEventListener('storage', refresh)
    }
  }, [requestedId])

  const currentIndex = useMemo(
    () => statuses.indexOf(order?.status),
    [order?.status],
  )

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

          <div className="customer-flow-empty">
            <button
              className="th-btn th-btn--primary"
              type="button"
              onClick={() => navigate('/')}
            >
              Voltar ao início
            </button>
          </div>
        </div>
      </main>
    )
  }

  const orderQuery = `id=${encodeURIComponent(order.id)}&mesa=${order.table}`

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
          <span>PEDIDO {order.id}</span>
          <h1>Acompanhe seu pedido.</h1>
          <p>O status abaixo representa o fluxo atual da cozinha nesta demonstração.</p>
        </section>

        <section className="customer-flow-card customer-status-card">
          <span className="customer-flow-card__eyebrow">STATUS ATUAL</span>
          <div
            className={`customer-status-current customer-status-current--${order.status.toLowerCase()}`}
          >
            {order.status}
          </div>

          <div className="customer-status-steps">
            {statuses.map((status, index) => {
              const done = index < currentIndex
              const current = index === currentIndex

              return (
                <div
                  key={status}
                  className={`customer-status-step ${done ? 'is-done' : ''} ${current ? 'is-current' : ''}`}
                >
                  <span className="customer-status-step__dot">
                    {done ? <FiCheck /> : index + 1}
                  </span>
                  <strong>{status}</strong>
                </div>
              )
            })}
          </div>

          <div className="customer-summary-row" style={{ marginTop: 24 }}>
            <span>Total</span>
            <strong>{money(order.total)}</strong>
          </div>

          <div className="customer-summary-row">
            <span>Horário</span>
            <strong>{order.time}</strong>
          </div>

          <div className="customer-summary-row">
            <span>Pagamento</span>
            <strong>{order.paymentMethod || 'Pendente'}</strong>
          </div>

          <div className="customer-flow-actions" style={{ marginTop: 24 }}>
            <button
              className="th-btn th-btn--glass th-btn--block"
              type="button"
              onClick={() => setOrder(getCustomerOrder(order.id))}
            >
              <FiRefreshCw /> Atualizar agora
            </button>

            <button
              className="th-btn th-btn--primary th-btn--block"
              type="button"
              onClick={() =>
                navigate(
                  order.paymentMethod
                    ? `/comprovante?${orderQuery}`
                    : `/pagamento?${orderQuery}`,
                )
              }
            >
              <FiCreditCard />
              {order.paymentMethod ? 'Ver comprovante' : 'Pagamento'}
            </button>

            <div className="customer-action-grid">
              <button
                className="th-btn th-btn--glass"
                type="button"
                onClick={() => navigate(`/chamar-garcom?${orderQuery}`)}
              >
                <FiBell /> Chamar garçom
              </button>

              <button
                className="th-btn th-btn--glass"
                type="button"
                onClick={() => navigate(`/solicitar-conta?${orderQuery}`)}
              >
                <FiFileText /> Solicitar conta
              </button>
            </div>

            <button
              className="customer-text-link"
              type="button"
              onClick={() => navigate(`/historico?mesa=${order.table}`)}
            >
              Ver histórico de pedidos
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}
