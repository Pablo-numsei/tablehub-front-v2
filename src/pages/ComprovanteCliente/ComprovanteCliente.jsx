import { FiCheckCircle, FiEye } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import ThemeToggle from '../../components/layout/ThemeToggle.jsx'
import { money } from '../../data/customerMenu.js'
import useCustomerOrder from '../../hooks/useCustomerOrder.js'
import { paymentMethodLabel, paymentStatusLabel } from '../../services/orderPayments.js'
import '../../styles/customer-flow.css'

export default function ComprovanteCliente() {
  const navigate = useNavigate()
  const params = new URLSearchParams(window.location.search)
  const requestedId = params.get('id')
  const { order, payment, loading, error } = useCustomerOrder(requestedId, { includeItems: true })

  if (loading) return <main className="customer-flow-page"><div className="customer-flow-shell"><p role="status">Consultando o registro do recebimento...</p></div></main>

  if (!order || error) {
    return (
      <main className="customer-flow-page">
        <div className="customer-flow-shell">
          <section className="customer-flow-head">
            <span>COMPROVANTE</span>
            <h1>Pedido não encontrado.</h1>
            <p role="alert">{error || 'Pedido indisponível nesta sessão.'}</p>
          </section>
        </div>
      </main>
    )
  }

  const orderQuery = `id=${encodeURIComponent(order.id)}&mesa=${order.table}`
  if (payment?.status !== 'PAGO') return <main className="customer-flow-page"><div className="customer-flow-shell"><section className="customer-flow-card customer-status-card"><h1>Recebimento ainda não confirmado.</h1><p>{paymentStatusLabel(payment?.status)}</p><button className="th-btn th-btn--primary" type="button" onClick={() => navigate(`/pagamento?${orderQuery}`)}>Voltar ao pagamento</button></section></div></main>
  const paidAt = order.paidAt
    ? new Date(order.paidAt).toLocaleString('pt-BR')
    : 'Não registrado'

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

        <section className="customer-flow-card customer-receipt-card">
          <div className="customer-result-icon">
            <FiCheckCircle />
          </div>

          <span className="customer-flow-card__eyebrow">REGISTRO DE RECEBIMENTO</span>
          <h1>Confirmado pela equipe.</h1>
          <p>Registro interno do restaurante. Não substitui comprovante bancário ou documento fiscal.</p>

          <div className="customer-receipt-meta">
            <div>
              <span>Pedido</span>
              <strong>{order.id}</strong>
            </div>
            <div>
              <span>Mesa</span>
              <strong>{order.table}</strong>
            </div>
            <div>
              <span>Forma</span>
              <strong>{paymentMethodLabel(payment.method)}</strong>
            </div>
            <div>
              <span>Registro</span>
              <strong>{paidAt}</strong>
            </div>
          </div>

          <div className="customer-order-list">
            {order.items.map((item) => (
              <div key={item.productId}>
                <span>{item.quantity}x {item.name}</span>
                <strong>{money(item.subtotal ?? item.quantity * item.price)}</strong>
              </div>
            ))}
          </div>

          <div className="customer-summary-total">
            <span>Valor confirmado</span>
            <strong>{money(payment.amount)}</strong>
          </div>


          <div className="customer-flow-actions">
            <button
              className="th-btn th-btn--primary th-btn--block"
              type="button"
              onClick={() => navigate(`/acompanhar-pedido?${orderQuery}`)}
            >
              <FiEye /> Acompanhar pedido
            </button>

            <button
              className="th-btn th-btn--glass th-btn--block"
              type="button"
              onClick={() => navigate(`/menu?mesa=${order.table}`)}
            >
              Voltar ao cardápio
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}
