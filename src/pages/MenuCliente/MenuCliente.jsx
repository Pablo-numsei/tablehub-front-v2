import { useMemo, useState } from 'react'
import { FiMinus, FiPlus, FiShoppingBag } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import ThemeToggle from '../../components/layout/ThemeToggle.jsx'
import { money } from '../../data/customerMenu.js'
import useCustomerCatalog from '../../hooks/useCustomerCatalog.js'
import { loadCart, saveCart } from '../../utils/customerSession.js'
import './MenuCliente.css'

export default function MenuCliente() {
  const navigate = useNavigate()
  const params = new URLSearchParams(window.location.search)
  const table = params.get('mesa') || '04'
  const [filter, setFilter] = useState('Todos')
  const [cart, setCart] = useState(() => loadCart())
  const { products, loading, error: catalogError } = useCustomerCatalog()
  const categories = useMemo(() => ['Todos', ...new Set(products.map((product) => product.category))], [products])

  const visible = useMemo(
    () => products.filter((product) => filter === 'Todos' || product.category === filter),
    [products, filter],
  )

  const updateCart = (updater) => {
    setCart((current) => {
      const next = updater(current)
      saveCart(next)
      return next
    })
  }

  const add = (id) => {
    const product = products.find((item) => item.id === id)
    if (!product?.available || loading || catalogError) return

    updateCart((current) => ({
      ...current,
      [id]: Math.min((current[id] || 0) + 1, Math.min(product.stock, 100)),
    }))
  }

  const remove = (id) => {
    updateCart((current) => {
      const next = { ...current }
      const value = (next[id] || 0) - 1

      if (value <= 0) delete next[id]
      else next[id] = value

      return next
    })
  }

  const itemCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0)
  const total = products.reduce(
    (sum, product) => sum + product.price * (cart[product.id] || 0),
    0,
  )

  return (
    <main className="customer-menu-page">
      <header className="customer-menu-header">
        <div className="customer-menu-brand">
          <span className="customer-menu-brand__mark">T</span>
          <span>TableHub</span>
        </div>

        <div className="customer-menu-header__actions">
          <div className="customer-menu-table">MESA {table}</div>
          <ThemeToggle compact />
        </div>
      </header>

      <section className="customer-menu-hero">
        <div>
          <span>CARDÁPIO DIGITAL</span>
          <h1>Escolha seus itens.</h1>
          <p>Seu pedido será associado automaticamente à mesa {table}.</p>
        </div>
      </section>

      <section className="customer-menu-content">
        {catalogError && (
          <div className="customer-flow-error" role="alert">
            {catalogError}
          </div>
        )}

        {loading && <p role="status">Atualizando cardápio...</p>}
        <div className="customer-menu-tabs">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={filter === category ? 'is-active' : ''}
              onClick={() => setFilter(category)}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="customer-menu-grid">
          {visible.map((product) => {
            const qty = cart[product.id] || 0

            return (
              <article className="customer-product-card" key={product.id}>
                <div className="customer-product-card__image">
                  <img
                    src={product.image}
                    alt={product.name}
                    loading="lazy"
                    style={{
                      objectFit: product.imageFit || 'cover',
                      objectPosition: 'center',
                    }}
                  />
                </div>

                <small>{product.category.toUpperCase()}</small>
                <h2>{product.name}</h2>
                <strong>{money(product.price)}</strong>

                <div className="customer-product-card__action">
                  {!product.available ? (
                    <span className="customer-product-unavailable">Esgotado</span>
                  ) : qty === 0 ? (
                    <button type="button" onClick={() => add(product.id)} disabled={loading || !!catalogError}>
                      Adicionar
                    </button>
                  ) : (
                    <div className="customer-quantity">
                      <button type="button" onClick={() => remove(product.id)} aria-label={`Remover uma unidade de ${product.name}`}>
                        <FiMinus />
                      </button>
                      <span>{qty}</span>
                      <button type="button" onClick={() => add(product.id)} aria-label={`Adicionar uma unidade de ${product.name}`}>
                        <FiPlus />
                      </button>
                    </div>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      </section>

      {itemCount > 0 && (
        <button
          className="customer-cart-bar"
          type="button"
          onClick={() => navigate(`/carrinho?mesa=${table}`)}
        >
          <FiShoppingBag />
          <span>{itemCount} {itemCount === 1 ? 'item' : 'itens'}</span>
          <strong>{money(total)}</strong>
        </button>
      )}
    </main>
  )
}
