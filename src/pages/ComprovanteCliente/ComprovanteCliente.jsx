import { FiCheckCircle, FiDownload, FiEye } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import ThemeToggle from '../../components/layout/ThemeToggle.jsx'
import { money } from '../../data/customerMenu.js'
import {
  getActiveCustomerOrder,
  getCustomerOrder,
} from '../../utils/customerSession.js'
import '../../styles/customer-flow.css'

export default function ComprovanteCliente() {
  const navigate = useNavigate()
  const params = new URLSearchParams(window.location.search)
  const requestedId = params.get('id')
  const order = requestedId
    ? getCustomerOrder(requestedId)
    : getActiveCustomerOrder()

  if (!order) {
    return (
      <main className="customer-flow-page">
        <div className="customer-flow-shell">
          <section className="customer-flow-head">
            <span>COMPROVANTE</span>
            <h1>Pedido não encontrado.</h1>
          </section>
        </div>
      </main>
    )
  }

  const orderQuery = `id=${encodeURIComponent(order.id)}&mesa=${order.table}`
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

          <span className="customer-flow-card__eyebrow">COMPROVANTE DE DEMONSTRAÇÃO</span>
          <h1>Pagamento registrado.</h1>
          <p>Nenhuma cobrança real foi processada neste protótipo.</p>

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
              <strong>{order.paymentMethod || 'Não informada'}</strong>
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
                <strong>{money(item.quantity * item.price)}</strong>
              </div>
            ))}
          </div>

          <div className="customer-summary-total">
            <span>Total</span>
            <strong>{money(order.total)}</strong>
          </div>

          <div className="customer-demo-notice">
            <FiDownload />
            Exportação em PDF ficará para a integração final.
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
