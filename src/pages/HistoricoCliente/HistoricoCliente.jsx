import { FiArrowRight, FiClock } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import ThemeToggle from '../../components/layout/ThemeToggle.jsx'
import { money } from '../../data/customerMenu.js'
import { loadCustomerOrders } from '../../utils/customerSession.js'
import '../../styles/customer-flow.css'

export default function HistoricoCliente() {
  const navigate = useNavigate()
  const params = new URLSearchParams(window.location.search)
  const requestedTable = params.get('mesa')
  const orders = loadCustomerOrders().filter(
    (order) => !requestedTable || order.table === String(requestedTable).padStart(2, '0'),
  )
  const table = requestedTable
    ? String(requestedTable).padStart(2, '0')
    : orders[0]?.table

  return (
    <main className="customer-flow-page">
      <div className="customer-flow-shell">
        <header className="customer-flow-topbar">
          <div className="customer-flow-brand">TableHub</div>
          <div className="customer-flow-topbar__actions">
            {table && <div className="customer-flow-table">MESA {table}</div>}
            <ThemeToggle compact />
          </div>
        </header>

        <section className="customer-flow-head">
          <span>HISTÓRICO</span>
          <h1>Seus pedidos</h1>
          <p>Pedidos criados durante esta sessão do navegador.</p>
        </section>

        {orders.length === 0 ? (
          <div className="customer-flow-empty">
            <p>Nenhum pedido encontrado nesta sessão.</p>
            <button
              className="th-btn th-btn--primary"
              type="button"
              onClick={() => navigate(`/menu?mesa=${table || '04'}`)}
            >
              Abrir cardápio
            </button>
          </div>
        ) : (
          <section className="customer-history-list">
            {orders.map((order) => (
              <article className="customer-flow-card customer-history-card" key={order.id}>
                <div>
                  <span className="customer-flow-card__eyebrow">{order.id}</span>
                  <h2>Mesa {order.table}</h2>
                  <p><FiClock /> {order.time} · {order.status}</p>
                </div>

                <div className="customer-history-card__end">
                  <strong>{money(order.total)}</strong>
                  <button
                    className="th-btn th-btn--glass"
                    type="button"
                    onClick={() =>
                      navigate(
                        `/acompanhar-pedido?id=${encodeURIComponent(order.id)}&mesa=${order.table}`,
                      )
                    }
                  >
                    Abrir <FiArrowRight />
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  )
}
