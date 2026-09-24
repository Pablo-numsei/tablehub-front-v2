import { useMemo, useState } from 'react'
import { FiArrowRight, FiPlus, FiSearch, FiX } from 'react-icons/fi'
import ManagementSidebar from '../../components/layout/ManagementSidebar.jsx'
import '../../styles/management.css'
import './Pedidos.css'

const initialOrders = [
  {
    id: '#1028',
    table: 'Mesa 04',
    customer: 'Cliente da mesa',
    time: '12:34',
    status: 'Preparando',
    total: 'R$ 78,90',
    items: ['2x Smash Table', '1x Batata', '1x Bebida'],
  },
  {
    id: '#1027',
    table: 'Mesa 09',
    customer: 'Cliente da mesa',
    time: '12:27',
    status: 'Pronto',
    total: 'R$ 54,00',
    items: ['1x Smash Table', '1x Bebida'],
  },
  {
    id: '#1026',
    table: 'Mesa 02',
    customer: 'Cliente da mesa',
    time: '12:18',
    status: 'Aguardando',
    total: 'R$ 112,50',
    items: ['2x Burger Especial', '2x Batata', '1x Bebida'],
  },
  {
    id: '#1025',
    table: 'Mesa 11',
    customer: 'Cliente da mesa',
    time: '12:06',
    status: 'Entregue',
    total: 'R$ 86,40',
    items: ['2x Smash Table', '1x Sobremesa'],
  },
  {
    id: '#1024',
    table: 'Mesa 07',
    customer: 'Cliente da mesa',
    time: '11:58',
    status: 'Preparando',
    total: 'R$ 32,00',
    items: ['1x Burger Clássico'],
  },
]

const statuses = ['Todos', 'Aguardando', 'Preparando', 'Pronto', 'Entregue']
const nextStatus = {
  Aguardando: 'Preparando',
  Preparando: 'Pronto',
  Pronto: 'Entregue',
  Entregue: 'Entregue',
}

export default function Pedidos() {
  const [orders, setOrders] = useState(initialOrders)
  const [filter, setFilter] = useState('Todos')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState(null)

  const selectedOrder = orders.find((order) => order.id === selectedId)

  const filteredOrders = useMemo(() => {
    const normalized = query.trim().toLowerCase()

    return orders.filter((order) => {
      const matchesStatus = filter === 'Todos' || order.status === filter
      const matchesSearch =
        !normalized ||
        order.id.toLowerCase().includes(normalized) ||
        order.table.toLowerCase().includes(normalized) ||
        order.customer.toLowerCase().includes(normalized)

      return matchesStatus && matchesSearch
    })
  }, [orders, filter, query])

  const advanceStatus = (id) => {
    setOrders((current) =>
      current.map((order) =>
        order.id === id
          ? { ...order, status: nextStatus[order.status] }
          : order,
      ),
    )
  }

  return (
    <main className="management-page orders-page">
      <ManagementSidebar />

      <section className="management-content">
        <header className="management-header">
          <div>
            <span className="management-eyebrow">OPERAÇÃO</span>
            <h1>Pedidos</h1>
            <p>Acompanhe cada pedido da entrada até a entrega.</p>
          </div>

          <button className="th-btn th-btn--primary" type="button">
            <FiPlus /> Novo pedido
          </button>
        </header>

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
          {filteredOrders.map((order) => (
            <article className="order-card" key={order.id}>
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
                  <span className={`order-status order-status--${order.status.toLowerCase()}`}>
                    {order.status}
                  </span>
                </div>
                <div>
                  <small>TOTAL</small>
                  <strong>{order.total}</strong>
                </div>
              </div>

              <div className="order-card__bottom">
                <span>{order.items.join(' · ')}</span>
                <button type="button" onClick={() => setSelectedId(order.id)}>
                  Ver detalhes <FiArrowRight />
                </button>
              </div>
            </article>
          ))}

          {filteredOrders.length === 0 && (
            <div className="management-empty">
              Nenhum pedido encontrado com esses filtros.
            </div>
          )}
        </section>
      </section>

      {selectedOrder && (
        <div className="order-drawer-backdrop" onClick={() => setSelectedId(null)}>
          <aside className="order-drawer" onClick={(event) => event.stopPropagation()}>
            <div className="order-drawer__head">
              <div>
                <span>DETALHES DO PEDIDO</span>
                <h2>{selectedOrder.id}</h2>
              </div>
              <button type="button" onClick={() => setSelectedId(null)} aria-label="Fechar">
                <FiX />
              </button>
            </div>

            <div className="order-drawer__meta">
              <div><small>Mesa</small><strong>{selectedOrder.table}</strong></div>
              <div><small>Horário</small><strong>{selectedOrder.time}</strong></div>
              <div><small>Status</small><strong>{selectedOrder.status}</strong></div>
            </div>

            <div className="order-drawer__items">
              <span>ITENS</span>
              {selectedOrder.items.map((item) => (
                <div key={item}>{item}</div>
              ))}
            </div>

            <div className="order-drawer__total">
              <span>Total</span>
              <strong>{selectedOrder.total}</strong>
            </div>

            {selectedOrder.status !== 'Entregue' && (
              <button
                className="th-btn th-btn--primary th-btn--block"
                type="button"
                onClick={() => advanceStatus(selectedOrder.id)}
              >
                Avançar para {nextStatus[selectedOrder.status]}
                <FiArrowRight />
              </button>
            )}
          </aside>
        </div>
      )}
    </main>
  )
}
