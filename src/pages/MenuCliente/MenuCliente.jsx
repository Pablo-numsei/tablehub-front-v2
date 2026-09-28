import { useMemo, useState } from 'react'
import { FiMinus, FiPlus, FiShoppingBag } from 'react-icons/fi'
import './MenuCliente.css'

const products = [
  { id: 1, name: 'Smash Table', category: 'Hambúrgueres', price: 24, available: true },
  { id: 2, name: 'Burger Especial', category: 'Hambúrgueres', price: 31.9, available: true },
  { id: 3, name: 'Batata Crocante', category: 'Acompanhamentos', price: 18, available: true },
  { id: 4, name: 'Onion Rings', category: 'Acompanhamentos', price: 20, available: false },
  { id: 5, name: 'Refrigerante', category: 'Bebidas', price: 12.9, available: true },
  { id: 6, name: 'Brownie', category: 'Sobremesas', price: 16, available: true },
]

const categories = ['Todos', 'Hambúrgueres', 'Acompanhamentos', 'Bebidas', 'Sobremesas']

const money = (value) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function MenuCliente() {
  const params = new URLSearchParams(window.location.search)
  const table = params.get('mesa') || '04'
  const [filter, setFilter] = useState('Todos')
  const [cart, setCart] = useState({})

  const visible = useMemo(
    () => products.filter((product) => filter === 'Todos' || product.category === filter),
    [filter],
  )

  const add = (id) => {
    setCart((current) => ({ ...current, [id]: (current[id] || 0) + 1 }))
  }

  const remove = (id) => {
    setCart((current) => {
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

        <div className="customer-menu-table">MESA {table}</div>
      </header>

      <section className="customer-menu-hero">
        <div>
          <span>CARDÁPIO DIGITAL</span>
          <h1>Escolha seus itens.</h1>
          <p>Seu pedido será associado automaticamente à mesa {table}.</p>
        </div>
      </section>

      <section className="customer-menu-content">
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
                  <span>{product.name.charAt(0)}</span>
                </div>

                <small>{product.category.toUpperCase()}</small>
                <h2>{product.name}</h2>
                <strong>{money(product.price)}</strong>

                <div className="customer-product-card__action">
                  {!product.available ? (
                    <span className="customer-product-unavailable">Esgotado</span>
                  ) : qty === 0 ? (
                    <button type="button" onClick={() => add(product.id)}>
                      Adicionar
                    </button>
                  ) : (
                    <div className="customer-quantity">
                      <button type="button" onClick={() => remove(product.id)}>
                        <FiMinus />
                      </button>
                      <span>{qty}</span>
                      <button type="button" onClick={() => add(product.id)}>
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
        <button className="customer-cart-bar" type="button">
          <FiShoppingBag />
          <span>{itemCount} {itemCount === 1 ? 'item' : 'itens'}</span>
          <strong>{money(total)}</strong>
        </button>
      )}
    </main>
  )
}
