import { useMemo, useState } from 'react'
import { FiArrowLeft, FiArrowRight, FiMinus, FiPlus } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import ThemeToggle from '../../components/layout/ThemeToggle.jsx'
import { customerProducts, money } from '../../data/customerMenu.js'
import { loadCart, saveCart } from '../../utils/customerSession.js'
import '../../styles/customer-flow.css'

export default function CarrinhoCliente() {
  const navigate = useNavigate()
  const params = new URLSearchParams(window.location.search)
  const table = params.get('mesa') || '04'
  const [cart, setCart] = useState(() => loadCart())

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

  const changeQuantity = (id, delta) => {
    setCart((current) => {
      const next = { ...current }
      const quantity = (next[id] || 0) + delta

      if (quantity <= 0) delete next[id]
      else next[id] = quantity

      saveCart(next)
      return next
    })
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
          <span>SEU PEDIDO</span>
          <h1>Carrinho</h1>
          <p>Revise os itens antes de confirmar o pedido.</p>
        </section>

        {items.length === 0 ? (
          <div className="customer-flow-empty">
            <p>Seu carrinho está vazio.</p>
            <button
              className="th-btn th-btn--primary"
              type="button"
              onClick={() => navigate(`/menu?mesa=${table}`)}
            >
              Voltar ao cardápio
            </button>
          </div>
        ) : (
          <section className="customer-flow-grid">
            <div className="customer-flow-card customer-cart-items">
              {items.map((item) => (
                <article className="customer-cart-item" key={item.id}>
                  <div>
                    <h2>{item.name}</h2>
                    <small>{item.category}</small>

                    <div className="customer-cart-quantity">
                      <button
                        type="button"
                        onClick={() => changeQuantity(item.id, -1)}
                        aria-label={`Remover uma unidade de ${item.name}`}
                      >
                        <FiMinus />
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => changeQuantity(item.id, 1)}
                        aria-label={`Adicionar uma unidade de ${item.name}`}
                      >
                        <FiPlus />
                      </button>
                    </div>
                  </div>

                  <strong>{money(item.price * item.quantity)}</strong>
                </article>
              ))}
            </div>

            <aside className="customer-flow-card">
              <span className="customer-flow-card__eyebrow">RESUMO</span>

              <div className="customer-summary-row">
                <span>Itens</span>
                <strong>{items.reduce((sum, item) => sum + item.quantity, 0)}</strong>
              </div>

              <div className="customer-summary-row">
                <span>Taxa</span>
                <strong>{money(0)}</strong>
              </div>

              <div className="customer-summary-total">
                <span>Total</span>
                <strong>{money(total)}</strong>
              </div>

              <div className="customer-flow-actions">
                <button
                  className="th-btn th-btn--primary th-btn--block"
                  type="button"
                  onClick={() => navigate(`/confirmar-pedido?mesa=${table}`)}
                >
                  Continuar pedido <FiArrowRight />
                </button>

                <button
                  className="th-btn th-btn--glass th-btn--block"
                  type="button"
                  onClick={() => navigate(`/menu?mesa=${table}`)}
                >
                  <FiArrowLeft /> Voltar ao cardápio
                </button>
              </div>
            </aside>
          </section>
        )}
      </div>
    </main>
  )
}
