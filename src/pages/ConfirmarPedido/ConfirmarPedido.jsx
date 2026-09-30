import { useMemo, useState } from 'react'
import { FiArrowLeft, FiCheck } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import ThemeToggle from '../../components/layout/ThemeToggle.jsx'
import { customerProducts, money } from '../../data/customerMenu.js'
import {
  clearCart,
  createCustomerOrder,
  loadCart,
} from '../../utils/customerSession.js'
import '../../styles/customer-flow.css'

export default function ConfirmarPedido() {
  const navigate = useNavigate()
  const params = new URLSearchParams(window.location.search)
  const table = params.get('mesa') || '04'
  const cart = loadCart()
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const items = useMemo(
    () =>
      customerProducts
        .filter((product) => (cart[product.id] || 0) > 0)
        .map((product) => ({ ...product, quantity: cart[product.id] })),
    [cart],
  )

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  )

  const confirmOrder = () => {
    if (items.length === 0 || submitting) return

    setSubmitting(true)
    const order = createCustomerOrder({ table, cart, note })
    clearCart()

    navigate(
      `/pedido-confirmado?id=${encodeURIComponent(order.id)}&mesa=${table}`,
      { replace: true },
    )
  }

  if (items.length === 0) {
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

          <section className="customer-flow-head">
            <span>CONFIRMAÇÃO</span>
            <h1>Nenhum item para confirmar.</h1>
          </section>

          <div className="customer-flow-empty">
            <button
              className="th-btn th-btn--primary"
              type="button"
              onClick={() => navigate(`/menu?mesa=${table}`)}
            >
              Voltar ao cardápio
            </button>
          </div>
        </div>
      </main>
    )
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

        <section className="customer-flow-head">
          <span>CONFIRMAÇÃO</span>
          <h1>Confirme seu pedido.</h1>
          <p>Depois de confirmado, o pedido será enviado para a cozinha.</p>
        </section>

        <section className="customer-flow-grid">
          <div className="customer-flow-card">
            <span className="customer-flow-card__eyebrow">ITENS</span>

            <div className="customer-order-list">
              {items.map((item) => (
                <div key={item.id}>
                  <span>{item.quantity}x {item.name}</span>
                  <strong>{money(item.quantity * item.price)}</strong>
                </div>
              ))}
            </div>

            <label>
              <span className="customer-flow-card__eyebrow">OBSERVAÇÕES</span>
              <textarea
                className="customer-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Ex.: sem cebola, ponto da carne..."
                maxLength={280}
              />
            </label>
          </div>

          <aside className="customer-flow-card">
            <span className="customer-flow-card__eyebrow">MESA</span>
            <h2>{String(table).padStart(2, '0')}</h2>

            <div className="customer-summary-row">
              <span>Itens</span>
              <strong>{items.reduce((sum, item) => sum + item.quantity, 0)}</strong>
            </div>

            <div className="customer-summary-total">
              <span>Total</span>
              <strong>{money(total)}</strong>
            </div>

            <div className="customer-flow-actions">
              <button
                className="th-btn th-btn--primary th-btn--block"
                type="button"
                onClick={confirmOrder}
                disabled={submitting}
              >
                <FiCheck />
                {submitting ? 'Enviando...' : 'Confirmar pedido'}
              </button>

              <button
                className="th-btn th-btn--glass th-btn--block"
                type="button"
                onClick={() => navigate(`/carrinho?mesa=${table}`)}
              >
                <FiArrowLeft /> Voltar ao carrinho
              </button>
            </div>
          </aside>
        </section>
      </div>
    </main>
  )
}
