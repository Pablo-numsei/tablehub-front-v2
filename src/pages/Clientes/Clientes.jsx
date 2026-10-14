import { useEffect, useMemo, useState } from 'react'
import { FiArrowRight, FiClock, FiGrid, FiRefreshCw, FiSearch, FiShoppingBag, FiX } from 'react-icons/fi'
import ManagementSidebar from '../../components/layout/ManagementSidebar.jsx'
import api from '../../services/api.js'
import { normalizeCatalogText } from '../../utils/catalogForm.js'
import { ORDER_FILTERS, filterAnonymousOrders, mapAnonymousOrders, summarizeAnonymousOrders } from '../../utils/anonymousOrders.js'
import '../../styles/management.css'
import './Clientes.css'

const money = (value) => value == null ? 'Não informado' : value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const formatDate = (value) => value ? new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : 'Não informada'
const tableLabel = (order) => order.table == null ? 'Mesa não informada' : 'Mesa ' + String(order.table).padStart(2, '0')
const statusClass = (status) => 'client-status client-status--' + normalizeCatalogText(status).replace(/\s+/g, '-')

export default function Clientes() {
  const [orders, setOrders] = useState([])
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('Todos')
  const [selectedId, setSelectedId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')
    api.get('/api/pedidos', { signal: controller.signal }).then(({ data }) => {
      if (!controller.signal.aborted) setOrders(mapAnonymousOrders(data))
    }).catch((failure) => {
      if (controller.signal.aborted) return
      setOrders([])
      setError(failure.response?.data?.message || failure.message || 'Não foi possível carregar os pedidos. Tente novamente.')
    }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [reloadKey])

  const visibleOrders = useMemo(() => filterAnonymousOrders(orders, query, filter), [orders, query, filter])
  const summary = useMemo(() => summarizeAnonymousOrders(visibleOrders), [visibleOrders])
  const selected = orders.find((order) => order.id === selectedId)
  const hasData = !loading && !error
  const reload = () => setReloadKey((current) => current + 1)

  return (
    <main className="management-page clients-page">
      <ManagementSidebar />
      <section className="management-content">
        <header className="management-header">
          <div>
            <span className="management-eyebrow">CONSULTA DE PEDIDOS</span>
            <h1>Pedidos anônimos</h1>
            <p>Cada registro representa um pedido real, sem cadastro ou identificação de pessoas.</p>
          </div>
          <button className="th-btn th-btn--primary" type="button" onClick={reload} disabled={loading}>
            <FiRefreshCw /> {loading ? 'Atualizando...' : 'Atualizar'}
          </button>
        </header>

        {error && <div className="orders-alert" role="alert"><span>{error}</span><button className="th-btn th-btn--glass" type="button" onClick={reload} disabled={loading}>Tentar novamente</button></div>}

        <section className="clients-summary" aria-label="Resumo do filtro atual">
          <article><span>Pedidos no filtro</span><strong>{hasData ? summary.count : '—'}</strong></article>
          <article><span>Em andamento no filtro</span><strong>{hasData ? summary.active : '—'}</strong></article>
          <article><span>Valor dos pedidos no filtro</span><strong>{hasData ? money(summary.total) : '—'}</strong></article>
        </section>
        <p className="clients-scope">
          {hasData ? 'Resumo de ' + summary.count + ' pedidos exibidos, de ' + orders.length + ' carregados. ' : ''}
          Os valores são de pedidos e não representam faturamento ou pagamento confirmado.
          {hasData && summary.missingAmounts > 0 && ' ' + summary.missingAmounts + ' pedidos estão sem valor informado e não entram na soma.'}
        </p>

        <section className="clients-toolbar">
          <label className="clients-search">
            <FiSearch />
            <input type="search" aria-label="Buscar pedido, mesa ou status" placeholder="Buscar pedido, mesa ou status..." value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>
          <div className="clients-filters" aria-label="Filtrar pedidos por status">
            {ORDER_FILTERS.map((status) => <button key={status} type="button" className={filter === status ? 'is-active' : ''} aria-pressed={filter === status} onClick={() => setFilter(status)}>{status}</button>)}
          </div>
        </section>

        <section className="clients-list" aria-busy={loading}>
          {loading && <div className="management-empty" role="status">Carregando pedidos...</div>}
          {hasData && visibleOrders.map((order) => (
            <article className="client-card" key={order.id}>
              <div className="client-card__avatar" aria-hidden="true"><FiShoppingBag /></div>
              <div className="client-card__identity"><small>PEDIDO ANÔNIMO</small><strong>{order.code}</strong><span title={tableLabel(order) + ' · ' + formatDate(order.createdAt)}>{tableLabel(order)} · {formatDate(order.createdAt)}</span></div>
              <div className="client-card__metric"><small>MESA</small><strong>{order.table == null ? '—' : String(order.table).padStart(2, '0')}</strong></div>
              <div className="client-card__metric client-card__metric--date"><small>REGISTRADO</small><span>{formatDate(order.createdAt)}</span></div>
              <div className="client-card__metric"><small>VALOR DO PEDIDO</small><strong>{money(order.amount)}</strong></div>
              <span className={statusClass(order.status)}>{order.status}</span>
              <button className="client-card__open" type="button" onClick={() => setSelectedId(order.id)} aria-label={'Abrir detalhes do pedido ' + order.code}><FiArrowRight /></button>
            </article>
          ))}
          {hasData && visibleOrders.length === 0 && <div className="management-empty">{orders.length ? 'Nenhum pedido encontrado neste filtro.' : 'Nenhum pedido registrado ainda.'}</div>}
        </section>
      </section>

      {selected && (
        <div className="client-drawer-backdrop" onClick={() => setSelectedId(null)}>
          <aside className="client-drawer" role="dialog" aria-modal="true" aria-labelledby="anonymous-order-title" onClick={(event) => event.stopPropagation()} onKeyDown={(event) => { if (event.key === 'Escape') setSelectedId(null) }}>
            <button className="client-drawer__close" type="button" autoFocus onClick={() => setSelectedId(null)} aria-label="Fechar detalhes"><FiX /></button>
            <div className="client-drawer__avatar" aria-hidden="true"><FiShoppingBag /></div>
            <span className="management-eyebrow">PEDIDO ANÔNIMO</span>
            <h2 id="anonymous-order-title">{selected.code}</h2>
            <span className={statusClass(selected.status)}>{selected.status}</span>
            <p className="clients-scope">Este registro representa um pedido, sem nome, e-mail, telefone ou histórico pessoal.</p>
            <div className="client-drawer__stats">
              <div><FiGrid /><span>Mesa</span><strong>{selected.table == null ? 'Não informada' : String(selected.table).padStart(2, '0')}</strong></div>
              <div><FiClock /><span>Registro</span><strong>{formatDate(selected.createdAt)}</strong></div>
              <div><FiShoppingBag /><span>Valor do pedido</span><strong>{money(selected.amount)}</strong></div>
            </div>
            <p className="clients-scope">O valor do pedido não comprova recebimento de pagamento.</p>
          </aside>
        </div>
      )}
    </main>
  )
}
