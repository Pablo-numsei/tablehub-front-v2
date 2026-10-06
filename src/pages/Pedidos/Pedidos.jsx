import { useEffect, useMemo, useState } from 'react'
import {
  FiArrowRight,
  FiRefreshCw,
  FiSearch,
  FiX,
} from 'react-icons/fi'
import ManagementSidebar from '../../components/layout/ManagementSidebar.jsx'
import { money } from '../../data/customerMenu.js'
import api from '../../services/api.js'
import { updateCustomerOrderStatus } from '../../utils/customerSession.js'
import '../../styles/management.css'
import './Pedidos.css'

const statuses = ['Todos', 'Recebido', 'Em preparo', 'Pronto', 'Entregue']

const nextStatus = {
  Recebido: 'Em preparo',
  'Em preparo': 'Pronto',
  Pronto: 'Entregue',
  Entregue: 'Entregue',
}

const customerStatusByBackend = {
  Recebido: 'Aguardando',
  'Em preparo': 'Preparando',
  Pronto: 'Pronto',
  Entregue: 'Entregue',
}

const statusSlug = (status = '') =>
  status
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '-')

const formatTime = (value) => {
  if (!value) return '—'

  return new Date(value).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

const apiOrderToManagement = (order, items = []) => ({
  backendId: order.id,
  id: `#${order.id}`,
  table: `Mesa ${String(order.mesa?.number ?? '—').padStart(2, '0')}`,
  customer: 'Cliente da mesa',
  time: formatTime(order.createdAt),
  createdAt: order.createdAt,
  status: order.status?.name || 'Recebido',
  total: money(order.totalValue),
  items: items.map(
    (item) =>
      `${item.quantidade}x ${item.produto?.name || 'Produto'}`,
  ),
})

export default function Pedidos() {
  const [orders, setOrders] = useState([])
  const [filter, setFilter] = useState('Todos')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [updatingId, setUpdatingId] = useState(null)
  const [error, setError] = useState('')

  const loadOrders = async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true)
    else setLoading(true)

    setError('')

    try {
      const { data } = await api.get('/api/pedidos')
      const apiOrders = Array.isArray(data) ? data : []

      const mappedOrders = await Promise.all(
        apiOrders.map(async (order) => {
          let items = []

          try {
            const response = await api.get(
              `/api/itens-pedido/pedido/${order.id}`,
            )
            items = Array.isArray(response.data) ? response.data : []
          } catch {
            items = []
          }

          return apiOrderToManagement(order, items)
        }),
      )

      mappedOrders.sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime(),
      )

      setOrders(mappedOrders)
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          'Não foi possível carregar os pedidos do backend.',
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadOrders()

    const timer = window.setInterval(
      () => loadOrders({ silent: true }),
      5000,
    )

    return () => window.clearInterval(timer)
  }, [])

  const selectedOrder = orders.find(
    (order) => order.backendId === selectedId,
  )

  const filteredOrders = useMemo(() => {
    const normalized = query.trim().toLowerCase()

    return orders.filter((order) => {
      const matchesStatus =
        filter === 'Todos' || order.status === filter
      const matchesSearch =
        !normalized ||
        order.id.toLowerCase().includes(normalized) ||
        order.table.toLowerCase().includes(normalized) ||
        order.customer.toLowerCase().includes(normalized)

      return matchesStatus && matchesSearch
    })
  }, [orders, filter, query])

  const advanceStatus = async (order) => {
    const targetStatus = nextStatus[order.status]

    if (
      !targetStatus ||
      targetStatus === order.status ||
      updatingId === order.backendId
    ) {
      return
    }

    setUpdatingId(order.backendId)
    setError('')

    try {
      await api.patch(
        `/api/pedidos/${order.backendId}/status`,
        {
          novoStatus: targetStatus,
          alteradoPor: null,
        },
      )

      updateCustomerOrderStatus(
        order.id,
        customerStatusByBackend[targetStatus],
      )

      await loadOrders({ silent: true })
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          'Não foi possível avançar o status do pedido.',
      )
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <main className="management-page orders-page">
      <ManagementSidebar />

      <section className="management-content">
        <header className="management-header">
          <div>
            <span className="management-eyebrow">OPERAÇÃO</span>
            <h1>Pedidos</h1>
            <p>Pedidos reais registrados no TableHub e no SQL Server.</p>
          </div>

          <button
            className="th-btn th-btn--primary"
            type="button"
            onClick={() => loadOrders({ silent: true })}
            disabled={refreshing}
          >
            <FiRefreshCw className={refreshing ? 'orders-spin' : ''} />
            {refreshing ? 'Atualizando' : 'Atualizar'}
          </button>
        </header>

        {error && (
          <div className="orders-alert" role="alert">
            {error}
          </div>
        )}

        <section className="orders-toolbar">
          <label className="orders-search">
            <FiSearch />
            <input
              type="search"
              placeholder="Buscar pedido, mesa ou cliente..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>

          <div className="orders-tabs">
            {statuses.map((status) => (
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

        <section className="orders-list">
          {loading && (
            <div className="management-empty">
              Carregando pedidos do banco...
            </div>
          )}

          {!loading &&
            filteredOrders.map((order) => (
              <article className="order-card" key={order.backendId}>
                <div className="order-card__main">
                  <div>
                    <small>PEDIDO</small>
                    <strong>{order.id}</strong>
                  </div>
                  <div>
                    <small>MESA</small>
                    <span>{order.table}</span>
                  </div>
                  <div>
                    <small>HORÁRIO</small>
                    <span>{order.time}</span>
                  </div>
                  <div>
                    <small>STATUS</small>
                    <span
                      className={`order-status order-status--${statusSlug(order.status)}`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <div>
                    <small>TOTAL</small>
                    <strong>{order.total}</strong>
                  </div>
                </div>

                <div className="order-card__bottom">
                  <span>
                    {order.items.length > 0
                      ? order.items.join(' · ')
                      : 'Itens registrados no pedido'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedId(order.backendId)}
                  >
                    Ver detalhes <FiArrowRight />
                  </button>
                </div>
              </article>
            ))}

          {!loading && filteredOrders.length === 0 && (
            <div className="management-empty">
              Nenhum pedido encontrado com esses filtros.
            </div>
          )}
        </section>
      </section>

      {selectedOrder && (
        <div
          className="order-drawer-backdrop"
          onClick={() => setSelectedId(null)}
        >
          <aside
            className="order-drawer"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="order-drawer__head">
              <div>
                <span>DETALHES DO PEDIDO</span>
                <h2>{selectedOrder.id}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                aria-label="Fechar"
              >
                <FiX />
              </button>
            </div>

            <div className="order-drawer__meta">
              <div>
                <small>Mesa</small>
                <strong>{selectedOrder.table}</strong>
              </div>
              <div>
                <small>Horário</small>
                <strong>{selectedOrder.time}</strong>
              </div>
              <div>
                <small>Status</small>
                <strong>{selectedOrder.status}</strong>
              </div>
            </div>

            <div className="order-drawer__items">
              <span>ITENS</span>
              {selectedOrder.items.length > 0 ? (
                selectedOrder.items.map((item, index) => (
                  <div key={`${item}-${index}`}>{item}</div>
                ))
              ) : (
                <div>Não foi possível carregar os itens deste pedido.</div>
              )}
            </div>

            <div className="order-drawer__total">
              <span>Total</span>
              <strong>{selectedOrder.total}</strong>
            </div>

            {selectedOrder.status !== 'Entregue' && (
              <button
                className="th-btn th-btn--primary th-btn--block"
                type="button"
                onClick={() => advanceStatus(selectedOrder)}
                disabled={updatingId === selectedOrder.backendId}
              >
                {updatingId === selectedOrder.backendId
                  ? 'Atualizando status...'
                  : `Avançar para ${nextStatus[selectedOrder.status]}`}
                <FiArrowRight />
              </button>
            )}
          </aside>
        </div>
      )}
    </main>
  )
}
