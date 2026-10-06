import { useMemo, useState } from 'react'
import { FiEdit3, FiPlus, FiSearch, FiToggleLeft, FiToggleRight } from 'react-icons/fi'
import ManagementSidebar from '../../components/layout/ManagementSidebar.jsx'
import { customerCategories, customerProducts } from '../../data/customerMenu.js'
import '../../styles/management.css'
import './Cardapio.css'

const categories = customerCategories

const money = (value) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function Cardapio() {
  const [products, setProducts] = useState(() =>
    customerProducts.map((product) => ({ ...product })),
  )
  const [filter, setFilter] = useState('Todos')
  const [query, setQuery] = useState('')

  const visibleProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return products.filter((product) => {
      const matchesCategory = filter === 'Todos' || product.category === filter
      const matchesSearch =
        !normalized ||
        product.name.toLowerCase().includes(normalized) ||
        product.category.toLowerCase().includes(normalized)
      return matchesCategory && matchesSearch
    })
  }, [products, filter, query])

  const toggleAvailability = (id) => {
    setProducts((current) =>
      current.map((product) =>
        product.id === id
          ? { ...product, available: !product.available }
          : product,
      ),
    )
  }

  return (
    <main className="management-page menu-admin-page">
      <ManagementSidebar />

      <section className="management-content">
        <header className="management-header">
          <div>
            <span className="management-eyebrow">CARDÁPIO</span>
            <h1>Produtos & categorias</h1>
            <p>Organize o que aparece para o cliente no cardápio.</p>
          </div>

          <div className="menu-admin-actions">
            <button className="th-btn th-btn--glass" type="button">
              <FiPlus /> Categoria
            </button>
            <button className="th-btn th-btn--primary" type="button">
              <FiPlus /> Novo produto
            </button>
          </div>
        </header>

        <section className="menu-toolbar">
          <label className="menu-search">
            <FiSearch />
            <input
              type="search"
              placeholder="Buscar produto..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>

          <div className="menu-tabs">
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
        </section>

        <section className="menu-product-grid">
          {visibleProducts.map((product) => (
            <article className="menu-product-card" key={product.id}>
              <div className="menu-product-card__image">
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

              <div className="menu-product-card__content">
                <small>{product.category.toUpperCase()}</small>
                <h2>{product.name}</h2>
                <strong>{money(product.price)}</strong>

                <div className="menu-product-card__bottom">
                  <button
                    className={product.available ? 'availability is-on' : 'availability'}
                    type="button"
                    onClick={() => toggleAvailability(product.id)}
                  >
                    {product.available ? <FiToggleRight /> : <FiToggleLeft />}
                    {product.available ? 'Disponível' : 'Indisponível'}
                  </button>

                  <button className="menu-edit-button" type="button">
                    <FiEdit3 /> Editar
                  </button>
                </div>
              </div>
            </article>
          ))}

          {visibleProducts.length === 0 && (
            <div className="management-empty">
              Nenhum produto encontrado.
            </div>
          )}
        </section>
      </section>
    </main>
  )
}
