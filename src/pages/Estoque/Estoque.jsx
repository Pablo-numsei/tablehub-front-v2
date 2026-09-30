import { useMemo, useState } from 'react'
import {
  FiAlertTriangle,
  FiMinus,
  FiPackage,
  FiPlus,
  FiSearch,
  FiTrendingDown,
} from 'react-icons/fi'
import ManagementSidebar from '../../components/layout/ManagementSidebar.jsx'
import '../../styles/management.css'
import './Estoque.css'

const initialInventory = [
  { id: 1, name: 'Pão brioche', category: 'Padaria', stock: 42, minimum: 20, unit: 'un.' },
  { id: 2, name: 'Carne 160g', category: 'Carnes', stock: 28, minimum: 18, unit: 'un.' },
  { id: 3, name: 'Queijo cheddar', category: 'Frios', stock: 14, minimum: 16, unit: 'fatias' },
  { id: 4, name: 'Batata congelada', category: 'Congelados', stock: 9, minimum: 8, unit: 'kg' },
  { id: 5, name: 'Cebola', category: 'Hortifruti', stock: 4, minimum: 6, unit: 'kg' },
  { id: 6, name: 'Refrigerante lata', category: 'Bebidas', stock: 66, minimum: 24, unit: 'un.' },
  { id: 7, name: 'Chocolate', category: 'Sobremesas', stock: 7, minimum: 5, unit: 'kg' },
  { id: 8, name: 'Guardanapos', category: 'Descartáveis', stock: 180, minimum: 80, unit: 'un.' },
]

const inventoryStatus = (item) => {
  if (item.stock <= item.minimum * 0.5) return 'Crítico'
  if (item.stock <= item.minimum) return 'Baixo'
  return 'Normal'
}

export default function Estoque() {
  const [inventory, setInventory] = useState(initialInventory)
  const [filter, setFilter] = useState('Todos')
  const [query, setQuery] = useState('')

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase()

    return inventory.filter((item) => {
      const status = inventoryStatus(item)
      const matchesFilter = filter === 'Todos' || status === filter
      const matchesSearch =
        !normalized ||
        item.name.toLowerCase().includes(normalized) ||
        item.category.toLowerCase().includes(normalized)

      return matchesFilter && matchesSearch
    })
  }, [inventory, filter, query])

  const adjustStock = (id, delta) => {
    setInventory((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, stock: Math.max(0, Number((item.stock + delta).toFixed(2))) }
          : item,
      ),
    )
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
            <h1>Produtos & insumos</h1>
            <p>Controle quantidades mínimas e identifique reposições necessárias.</p>
          </div>
        </header>

        <section className="inventory-summary">
          <article>
            <FiPackage />
            <span>Itens cadastrados</span>
            <strong>{inventory.length}</strong>
          </article>
          <article>
            <FiTrendingDown />
            <span>Abaixo do mínimo</span>
            <strong>{lowCount}</strong>
          </article>
          <article>
            <FiAlertTriangle />
            <span>Estoque crítico</span>
            <strong>{criticalCount}</strong>
          </article>
        </section>

        <section className="inventory-toolbar">
          <label className="inventory-search">
            <FiSearch />
            <input
              type="search"
              placeholder="Buscar item ou categoria..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>

          <div className="inventory-filters">
            {['Todos', 'Normal', 'Baixo', 'Crítico'].map((status) => (
              <button
                key={status}
                type="button"
                className={filter === status ? 'is-active' : ''}
                onClick={() => setFilter(status)}
              >
                {status}
              </button>
            ))}
          </div>
        </section>

        <section className="inventory-grid">
          {visible.map((item) => {
            const status = inventoryStatus(item)
            const percent = Math.min(100, Math.round((item.stock / Math.max(item.minimum * 2, 1)) * 100))

            return (
              <article className="inventory-card" key={item.id}>
                <div className="inventory-card__head">
                  <div>
                    <small>{item.category.toUpperCase()}</small>
                    <h2>{item.name}</h2>
                  </div>
                  <span className={`inventory-status inventory-status--${status.toLowerCase().replace('í', 'i')}`}>
                    {status}
                  </span>
                </div>

                <div className="inventory-stock">
                  <strong>{item.stock}</strong>
                  <span>{item.unit}</span>
                </div>

                <div className="inventory-progress" aria-label={`Nível de estoque de ${item.name}`}>
                  <span style={{ width: `${percent}%` }} />
                </div>

                <div className="inventory-minimum">
                  Mínimo recomendado: <strong>{item.minimum} {item.unit}</strong>
                </div>

                <div className="inventory-actions">
                  <button
                    type="button"
                    onClick={() => adjustStock(item.id, -1)}
                    aria-label={`Diminuir estoque de ${item.name}`}
                  >
                    <FiMinus />
                  </button>
                  <span>Ajuste rápido</span>
                  <button
                    type="button"
                    onClick={() => adjustStock(item.id, 1)}
                    aria-label={`Aumentar estoque de ${item.name}`}
                  >
                    <FiPlus />
                  </button>
                </div>
              </article>
            )
          })}

          {visible.length === 0 && (
            <div className="management-empty">Nenhum item encontrado.</div>
          )}
        </section>
      </section>
    </main>
  )
}
