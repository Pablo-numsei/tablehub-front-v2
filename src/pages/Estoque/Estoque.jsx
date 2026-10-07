import { useEffect, useMemo, useState } from 'react'
import {
  FiAlertTriangle,
  FiMinus,
  FiPackage,
  FiPlus,
  FiSearch,
  FiTrendingDown,
} from 'react-icons/fi'
import ManagementSidebar from '../../components/layout/ManagementSidebar.jsx'
import api from '../../services/api.js'
import '../../styles/management.css'
import './Estoque.css'

const inventoryStatus = (item) => {
  if (item.stock <= 0) return 'Crítico'
  if (item.stock <= 10) return 'Baixo'
  return 'Normal'
}

const mapProduct = (product) => ({
  id: product.id,
  name: product.name,
  category: product.category?.name || 'Sem categoria',
  categoryId: product.category?.id,
  description: product.description || '',
  price: Number(product.price),
  stock: Number(product.stockQuantity ?? 0),
  minimum: 10,
  unit: 'un.',
})

export default function Estoque() {
  const [inventory, setInventory] = useState([])
  const [filter, setFilter] = useState('Todos')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState(null)

  const loadInventory = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/api/v1/produtos')
      setInventory((Array.isArray(data) ? data : []).map(mapProduct))
      setError('')
    } catch {
      setError('Não foi possível carregar o estoque do backend.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInventory()
  }, [])

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return inventory.filter((item) => {
      const status = inventoryStatus(item)
      return (
        (filter === 'Todos' || status === filter) &&
        (!normalized ||
          item.name.toLowerCase().includes(normalized) ||
          item.category.toLowerCase().includes(normalized))
      )
    })
  }, [inventory, filter, query])

  const adjustStock = async (item, delta) => {
    if (updatingId === item.id) return
    const nextStock = Math.max(0, item.stock + delta)
    setUpdatingId(item.id)
    setError('')

    try {
      const { data } = await api.put(`/api/v1/produtos/${item.id}`, {
        category: { id: item.categoryId },
        name: item.name,
        description: item.description,
        price: item.price,
        stockQuantity: nextStock,
      })
      setInventory((current) =>
        current.map((currentItem) =>
          currentItem.id === item.id ? mapProduct(data) : currentItem,
        ),
      )
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          'Não foi possível atualizar o estoque.',
      )
    } finally {
      setUpdatingId(null)
    }
  }

  const lowCount = inventory.filter((item) => inventoryStatus(item) !== 'Normal').length
  const criticalCount = inventory.filter((item) => inventoryStatus(item) === 'Crítico').length

  return (
    <main className="management-page inventory-page">
      <ManagementSidebar />
      <section className="management-content">
        <header className="management-header">
          <div>
            <span className="management-eyebrow">ESTOQUE</span>
            <h1>Produtos & estoque</h1>
            <p>Quantidades reais cadastradas no banco de dados.</p>
          </div>
        </header>

        {error && <div className="orders-alert" role="alert">{error}</div>}

        <section className="inventory-summary">
          <article><FiPackage /><span>Itens cadastrados</span><strong>{inventory.length}</strong></article>
          <article><FiTrendingDown /><span>Estoque baixo</span><strong>{lowCount}</strong></article>
          <article><FiAlertTriangle /><span>Sem estoque</span><strong>{criticalCount}</strong></article>
        </section>

        <section className="inventory-toolbar">
          <label className="inventory-search">
            <FiSearch />
            <input type="search" placeholder="Buscar produto ou categoria..." value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>
          <div className="inventory-filters">
            {['Todos', 'Normal', 'Baixo', 'Crítico'].map((status) => (
              <button key={status} type="button" className={filter === status ? 'is-active' : ''} onClick={() => setFilter(status)}>{status}</button>
            ))}
          </div>
        </section>

        <section className="inventory-grid">
          {loading && <div className="management-empty">Carregando estoque...</div>}
          {!loading && visible.map((item) => {
            const status = inventoryStatus(item)
            const percent = Math.min(100, Math.round((item.stock / 50) * 100))
            return (
              <article className="inventory-card" key={item.id}>
                <div className="inventory-card__head">
                  <div><small>{item.category.toUpperCase()}</small><h2>{item.name}</h2></div>
                  <span className={`inventory-status inventory-status--${status.toLowerCase().replace('í', 'i')}`}>{status}</span>
                </div>
                <div className="inventory-stock"><strong>{item.stock}</strong><span>{item.unit}</span></div>
                <div className="inventory-progress" aria-label={`Nível de estoque de ${item.name}`}><span style={{ width: `${percent}%` }} /></div>
                <div className="inventory-minimum">Alerta visual: <strong>10 {item.unit}</strong></div>
                <div className="inventory-actions">
                  <button type="button" disabled={updatingId === item.id} onClick={() => adjustStock(item, -1)}><FiMinus /></button>
                  <span>{updatingId === item.id ? 'Salvando...' : 'Ajuste rápido'}</span>
                  <button type="button" disabled={updatingId === item.id} onClick={() => adjustStock(item, 1)}><FiPlus /></button>
                </div>
              </article>
            )
          })}
          {!loading && visible.length === 0 && <div className="management-empty">Nenhum item encontrado.</div>}
        </section>
      </section>
    </main>
  )
}
