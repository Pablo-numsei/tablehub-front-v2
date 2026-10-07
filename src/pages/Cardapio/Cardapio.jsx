import { useEffect, useMemo, useState } from 'react'
import { FiEdit3, FiPlus, FiSearch, FiToggleLeft, FiToggleRight } from 'react-icons/fi'
import ManagementSidebar from '../../components/layout/ManagementSidebar.jsx'
import { customerCategories, customerProducts } from '../../data/customerMenu.js'
import api from '../../services/api.js'
import '../../styles/management.css'
import './Cardapio.css'

const money = (value) =>
  Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const normalize = (value = '') =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase()

const imageForProduct = (name) =>
  customerProducts.find((item) => normalize(item.name) === normalize(name))

export default function Cardapio() {
  const [products, setProducts] = useState([])
  const [filter, setFilter] = useState('Todos')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/api/v1/produtos')
      .then(({ data }) => {
        setProducts(
          (Array.isArray(data) ? data : []).map((product) => {
            const visual = imageForProduct(product.name)
            return {
              id: product.id,
              name: product.name,
              category: product.category?.name || 'Sem categoria',
              price: Number(product.price),
              stock: Number(product.stockQuantity ?? 0),
              available:
                product.active !== false &&
                product.available !== false &&
                Number(product.stockQuantity ?? 0) > 0,
              image: visual?.image || '',
              imageFit: visual?.imageFit,
            }
          }),
        )
        setError('')
      })
      .catch(() => setError('Não foi possível carregar o cardápio do backend.'))
      .finally(() => setLoading(false))
  }, [])

  const categories = useMemo(
    () => [
      'Todos',
      ...Array.from(new Set(products.map((product) => product.category))),
    ],
    [products],
  )

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

  return (
    <main className="management-page menu-admin-page">
      <ManagementSidebar />

      <section className="management-content">
        <header className="management-header">
          <div>
            <span className="management-eyebrow">CARDÁPIO</span>
            <h1>Produtos & categorias</h1>
            <p>Produtos reais cadastrados no banco de dados.</p>
          </div>

          <div className="menu-admin-actions">
            <button className="th-btn th-btn--glass" type="button" disabled title="Ainda não existe endpoint de categorias no backend">
              <FiPlus /> Categoria
            </button>
            <button className="th-btn th-btn--primary" type="button" disabled title="Formulário de cadastro será conectado em uma próxima etapa">
              <FiPlus /> Novo produto
            </button>
          </div>
        </header>

        {error && <div className="orders-alert" role="alert">{error}</div>}

        <section className="menu-toolbar">
          <label className="menu-search">
            <FiSearch />
            <input type="search" placeholder="Buscar produto..." value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>

          <div className="menu-tabs">
            {categories.map((category) => (
              <button key={category} type="button" className={filter === category ? 'is-active' : ''} onClick={() => setFilter(category)}>
                {category}
              </button>
            ))}
          </div>
        </section>

        <section className="menu-product-grid">
          {loading && <div className="management-empty">Carregando produtos...</div>}

          {!loading && visibleProducts.map((product) => (
            <article className="menu-product-card" key={product.id}>
              <div className="menu-product-card__image">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    loading="lazy"
                    style={{
                      objectFit: product.imageFit || 'cover',
                      objectPosition: 'center',
                    }}
                  />
                ) : null}
              </div>

              <div className="menu-product-card__content">
                <small>{product.category.toUpperCase()}</small>
                <h2>{product.name}</h2>
                <strong>{money(product.price)}</strong>

                <div className="menu-product-card__bottom">
                  <span className={product.available ? 'availability is-on' : 'availability'}>
                    {product.available ? <FiToggleRight /> : <FiToggleLeft />}
                    {product.available ? `Disponível · ${product.stock} un.` : 'Indisponível'}
                  </span>

                  <button className="menu-edit-button" type="button" disabled title="Use Estoque para alterar a quantidade">
                    <FiEdit3 /> Editar
                  </button>
                </div>
              </div>
            </article>
          ))}

          {!loading && visibleProducts.length === 0 && (
            <div className="management-empty">Nenhum produto encontrado.</div>
          )}
        </section>
      </section>
    </main>
  )
}
