import { useEffect, useMemo, useState } from 'react'
import { FiEdit3, FiPlus, FiSearch, FiToggleLeft, FiToggleRight } from 'react-icons/fi'
import ManagementSidebar from '../../components/layout/ManagementSidebar.jsx'
import CatalogDialogs from './CatalogDialogs.jsx'
import { customerProducts } from '../../data/customerMenu.js'
import api from '../../services/api.js'
import { normalizeCatalogText as normalize } from '../../utils/catalogForm.js'
import '../../styles/management.css'
import './Cardapio.css'

const money = (value) =>
  Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const imageForProduct = (name) =>
  customerProducts.find((item) => normalize(item.name) === normalize(name))

const toProduct = (product) => {
  const visual = imageForProduct(product.name)
  return {
    id: product.id,
    name: product.name,
    description: product.description || '',
    category: product.category?.name || 'Sem categoria',
    categoryId: product.category?.id,
    price: Number(product.price),
    stock: Number(product.stockQuantity ?? 0),
    available:
      product.active !== false &&
      product.available !== false &&
      Number(product.stockQuantity ?? 0) > 0,
    image: visual?.image || '',
    imageFit: visual?.imageFit,
  }
}

export default function Cardapio() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [filter, setFilter] = useState('Todos')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dialog, setDialog] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    Promise.all([
      api.get('/api/v1/produtos'),
      api.get('/api/v1/categorias'),
    ])
      .then(([productsResponse, categoriesResponse]) => {
        if (!active) return
        setProducts(
          (Array.isArray(productsResponse.data) ? productsResponse.data : [])
            .map(toProduct),
        )
        setCategories(
          (Array.isArray(categoriesResponse.data) ? categoriesResponse.data : [])
            .filter((category) => category.active !== false),
        )
        setError('')
      })
      .catch((requestError) => {
        if (active) {
          setError(
            requestError?.response?.data?.message ||
            'Não foi possível carregar o cardápio e as categorias do backend.',
          )
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [reloadKey])

  const filters = useMemo(
    () => ['Todos', ...new Set(products.map((product) => product.category))],
    [products],
  )

  const visibleProducts = useMemo(() => {
    const normalized = normalize(query)
    return products.filter((product) => {
      const matchesCategory = filter === 'Todos' || product.category === filter
      const matchesSearch =
        !normalized ||
        normalize(product.name).includes(normalized) ||
        normalize(product.category).includes(normalized)
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
            <button
              className="th-btn th-btn--glass"
              type="button"
              onClick={() => setDialog({ kind: 'category' })}
              disabled={loading}
            >
              <FiPlus /> Categoria
            </button>
            <button
              className="th-btn th-btn--primary"
              type="button"
              onClick={() => setDialog({ kind: 'product', product: null })}
              disabled={loading || categories.length === 0}
            >
              <FiPlus /> Novo produto
            </button>
          </div>
        </header>

        {error && <div className="orders-alert" role="alert">{error}</div>}

        <section className="menu-toolbar">
          <label className="menu-search">
            <FiSearch />
            <input type="search" placeholder="Buscar produto..." value={query}
              onChange={(event) => setQuery(event.target.value)} />
          </label>

          <div className="menu-tabs">
            {filters.map((status) => (
              <button key={status} type="button"
                className={filter === status ? 'is-active' : ''}
                onClick={() => setFilter(status)}>
                {status}
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
                  <img src={product.image} alt={product.name} loading="lazy"
                    style={{ objectFit: product.imageFit || 'cover', objectPosition: 'center' }} />
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
                  <button className="menu-edit-button" type="button"
                    onClick={() => setDialog({ kind: 'product', product })}
                    disabled={loading}>
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

      {dialog && (
        <CatalogDialogs
          dialog={dialog}
          categories={categories}
          onClose={() => setDialog(null)}
          onSaved={() => {
            setDialog(null)
            setFilter('Todos')
            setReloadKey((key) => key + 1)
          }}
        />
      )}
    </main>
  )
}
