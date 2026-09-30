import { useMemo, useState } from 'react'
import {
  FiArrowRight,
  FiMail,
  FiPhone,
  FiSearch,
  FiShoppingBag,
  FiUser,
  FiX,
} from 'react-icons/fi'
import ManagementSidebar from '../../components/layout/ManagementSidebar.jsx'
import { loadCustomerOrders } from '../../utils/customerSession.js'
import '../../styles/management.css'
import './Clientes.css'

const demoCustomers = [
  {
    id: 'CLI-001',
    name: 'Mariana Costa',
    email: 'mariana@email.com',
    phone: '(11) 98821-4450',
    orders: 12,
    total: 842.4,
    lastVisit: 'Hoje, 12:28',
    status: 'Frequente',
  },
  {
    id: 'CLI-002',
    name: 'Lucas Almeida',
    email: 'lucas@email.com',
    phone: '(11) 97642-1138',
    orders: 7,
    total: 463.9,
    lastVisit: 'Ontem, 20:14',
    status: 'Ativo',
  },
  {
    id: 'CLI-003',
    name: 'Beatriz Santos',
    email: 'bia@email.com',
    phone: '(11) 96718-9042',
    orders: 18,
    total: 1286.7,
    lastVisit: '28/09, 19:42',
    status: 'Frequente',
  },
  {
    id: 'CLI-004',
    name: 'Rafael Lima',
    email: 'rafael@email.com',
    phone: '(11) 95541-8820',
    orders: 3,
    total: 194.5,
    lastVisit: '26/09, 13:06',
    status: 'Novo',
  },
  {
    id: 'CLI-005',
    name: 'Ana Martins',
    email: 'ana@email.com',
    phone: '(11) 94772-6614',
    orders: 5,
    total: 356,
    lastVisit: '24/09, 21:11',
    status: 'Ativo',
  },
]

const money = (value) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function Clientes() {
  const sessionOrders = loadCustomerOrders()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('Todos')
  const [selectedId, setSelectedId] = useState(null)

  const sessionCustomer = sessionOrders.length
    ? [{
        id: 'SESSAO',
        name: 'Cliente da sessão atual',
        email: 'Acesso via QR Code',
        phone: 'Mesa ' + sessionOrders[0].table,
        orders: sessionOrders.length,
        total: sessionOrders.reduce((sum, order) => sum + order.total, 0),
        lastVisit: sessionOrders[0].time,
        status: 'Sessão',
      }]
    : []

  const customers = [...sessionCustomer, ...demoCustomers]
  const selected = customers.find((customer) => customer.id === selectedId)

  const visibleCustomers = useMemo(() => {
    const normalized = query.trim().toLowerCase()

    return customers.filter((customer) => {
      const matchesFilter = filter === 'Todos' || customer.status === filter
      const matchesSearch =
        !normalized ||
        customer.name.toLowerCase().includes(normalized) ||
        customer.email.toLowerCase().includes(normalized) ||
        customer.phone.toLowerCase().includes(normalized)

      return matchesFilter && matchesSearch
    })
  }, [customers, filter, query])

  const totalRevenue = customers.reduce((sum, customer) => sum + customer.total, 0)
  const totalOrders = customers.reduce((sum, customer) => sum + customer.orders, 0)

  return (
    <main className="management-page clients-page">
      <ManagementSidebar />

      <section className="management-content">
        <header className="management-header">
          <div>
            <span className="management-eyebrow">RELACIONAMENTO</span>
            <h1>Clientes</h1>
            <p>Consulte histórico, frequência e valor movimentado por cliente.</p>
          </div>
        </header>

        <section className="clients-summary">
          <article>
            <span>Clientes exibidos</span>
            <strong>{customers.length}</strong>
          </article>
          <article>
            <span>Pedidos acumulados</span>
            <strong>{totalOrders}</strong>
          </article>
          <article>
            <span>Valor movimentado</span>
            <strong>{money(totalRevenue)}</strong>
          </article>
        </section>

        <section className="clients-toolbar">
          <label className="clients-search">
            <FiSearch />
            <input
              type="search"
              placeholder="Buscar nome, e-mail ou telefone..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>

          <div className="clients-filters">
            {['Todos', 'Frequente', 'Ativo', 'Novo', 'Sessão'].map((status) => (
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

        <section className="clients-list">
          {visibleCustomers.map((customer) => (
            <article className="client-card" key={customer.id}>
              <div className="client-card__avatar">
                {customer.name.charAt(0)}
              </div>

              <div className="client-card__identity">
                <small>{customer.id}</small>
                <strong>{customer.name}</strong>
                <span>{customer.email}</span>
              </div>

              <div className="client-card__metric">
                <small>PEDIDOS</small>
                <strong>{customer.orders}</strong>
              </div>

              <div className="client-card__metric">
                <small>TOTAL</small>
                <strong>{money(customer.total)}</strong>
              </div>

              <div className="client-card__metric">
                <small>ÚLTIMA VISITA</small>
                <span>{customer.lastVisit}</span>
              </div>

              <span className={`client-status client-status--${customer.status.toLowerCase().replace('ã', 'a')}`}>
                {customer.status}
              </span>

              <button
                className="client-card__open"
                type="button"
                onClick={() => setSelectedId(customer.id)}
                aria-label={`Abrir detalhes de ${customer.name}`}
              >
                <FiArrowRight />
              </button>
            </article>
          ))}

          {visibleCustomers.length === 0 && (
            <div className="management-empty">Nenhum cliente encontrado.</div>
          )}
        </section>
      </section>

      {selected && (
        <div className="client-drawer-backdrop" onClick={() => setSelectedId(null)}>
          <aside className="client-drawer" onClick={(event) => event.stopPropagation()}>
            <button
              className="client-drawer__close"
              type="button"
              onClick={() => setSelectedId(null)}
              aria-label="Fechar"
            >
              <FiX />
            </button>

            <div className="client-drawer__avatar">
              <FiUser />
            </div>

            <span className="management-eyebrow">{selected.id}</span>
            <h2>{selected.name}</h2>
            <span className={`client-status client-status--${selected.status.toLowerCase().replace('ã', 'a')}`}>
              {selected.status}
            </span>

            <div className="client-drawer__contacts">
              <div><FiMail /><span>{selected.email}</span></div>
              <div><FiPhone /><span>{selected.phone}</span></div>
            </div>

            <div className="client-drawer__stats">
              <div><FiShoppingBag /><span>Pedidos</span><strong>{selected.orders}</strong></div>
              <div><span>Movimentado</span><strong>{money(selected.total)}</strong></div>
              <div><span>Última visita</span><strong>{selected.lastVisit}</strong></div>
            </div>
          </aside>
        </div>
      )}
    </main>
  )
}
