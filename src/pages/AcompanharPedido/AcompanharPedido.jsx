import { useMemo } from 'react'
import { FiBell, FiCheck, FiCreditCard, FiFileText, FiRefreshCw } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import ThemeToggle from '../../components/layout/ThemeToggle.jsx'
import { money } from '../../data/customerMenu.js'
import { paymentMethodLabel, paymentStatusLabel } from '../../services/orderPayments.js'
import useCustomerOrder from '../../hooks/useCustomerOrder.js'
import '../../styles/customer-flow.css'

const statuses = ['Aguardando', 'Preparando', 'Pronto', 'Entregue']

export default function AcompanharPedido() {
  const navigate = useNavigate()
  const requestedId = new URLSearchParams(window.location.search).get('id')
  const { order, payment, loading, refreshing, error, refresh } = useCustomerOrder(requestedId, { pollMs: 5000 })

  const currentIndex = useMemo(
    () => statuses.indexOf(order?.status),
    [order?.status],
  )

  if (loading && !order) {
    return (
      <main className="customer-flow-page">
        <div className="customer-flow-shell">
          <header className="customer-flow-topbar">
            <div className="customer-flow-brand">TableHub</div>
            <ThemeToggle compact />
          </header>

          <section className="customer-flow-head">
            <span>PEDIDO</span>
            <h1>Carregando pedido...</h1>
            <p>Consultando o status atual no servidor.</p>
          </section>
        </div>
      </main>
    )
  }

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
            {error && <p>{error}</p>}
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
          <p>O status é atualizado diretamente pelo sistema da cozinha.</p>
        </section>

        <section className="customer-flow-card customer-status-card">
          <span className="customer-flow-card__eyebrow">STATUS ATUAL</span>
          <div
            className={`customer-status-current customer-status-current--${order.status.toLowerCase()}`}
          >
            {order.status}
          </div>

          {error && (
            <div className="customer-flow-error" role="alert">
              {error}
            </div>
          )}

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
            <strong>{paymentMethodLabel(payment?.method)} · {paymentStatusLabel(payment?.status)}</strong>
          </div>

          <div className="customer-flow-actions" style={{ marginTop: 24 }}>
            <button
              className="th-btn th-btn--glass th-btn--block"
              type="button"
              onClick={() => refresh()}
              disabled={refreshing}
            >
              <FiRefreshCw />
              {refreshing ? 'Atualizando...' : 'Atualizar agora'}
            </button>

            <button
              className="th-btn th-btn--primary th-btn--block"
              type="button"
              onClick={() =>
                navigate(
                  payment?.status === 'PAGO'
                    ? `/comprovante?${orderQuery}`
                    : `/pagamento?${orderQuery}`,
                )
              }
            >
              <FiCreditCard />
              {payment?.status === 'PAGO' ? 'Ver registro do recebimento' : 'Pagamento'}
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
