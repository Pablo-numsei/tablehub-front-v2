import { useMemo, useState } from 'react'
import {
  FiCheckCircle,
  FiCreditCard,
  FiDollarSign,
  FiSearch,
  FiTrendingUp,
} from 'react-icons/fi'
import ManagementSidebar from '../../components/layout/ManagementSidebar.jsx'
import { loadCustomerOrders } from '../../utils/customerSession.js'
import '../../styles/management.css'
import './Financeiro.css'

const demoTransactions = [
  { id: 'PG-1042', order: '#1028', method: 'PIX', value: 78.9, time: '12:36', status: 'Confirmado' },
  { id: 'PG-1041', order: '#1027', method: 'Crédito', value: 54, time: '12:30', status: 'Confirmado' },
  { id: 'PG-1040', order: '#1025', method: 'Débito', value: 86.4, time: '12:11', status: 'Confirmado' },
  { id: 'PG-1039', order: '#1024', method: 'Dinheiro', value: 32, time: '12:03', status: 'Pendente' },
  { id: 'PG-1038', order: '#1022', method: 'PIX', value: 129.8, time: '11:44', status: 'Confirmado' },
]

const money = (value) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function Financeiro() {
  const sessionTransactions = loadCustomerOrders()
    .filter((order) => order.paymentMethod)
    .map((order, index) => ({
      id: `SESS-${String(index + 1).padStart(2, '0')}`,
      order: order.id,
      method: order.paymentMethod,
      value: order.total,
      time: order.time,
      status: 'Simulado',
    }))

  const transactions = [...sessionTransactions, ...demoTransactions]
  const [method, setMethod] = useState('Todos')
  const [query, setQuery] = useState('')

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase()

    return transactions.filter((transaction) => {
      const matchesMethod = method === 'Todos' || transaction.method === method
      const matchesSearch =
        !normalized ||
        transaction.id.toLowerCase().includes(normalized) ||
        transaction.order.toLowerCase().includes(normalized) ||
        transaction.method.toLowerCase().includes(normalized)

      return matchesMethod && matchesSearch
    })
  }, [transactions, method, query])

  const confirmed = transactions.filter((item) => item.status !== 'Pendente')
  const revenue = confirmed.reduce((sum, item) => sum + item.value, 0)
  const pending = transactions
    .filter((item) => item.status === 'Pendente')
    .reduce((sum, item) => sum + item.value, 0)
  const ticket = confirmed.length ? revenue / confirmed.length : 0

  return (
    <main className="management-page finance-page">
      <ManagementSidebar />

      <section className="management-content">
        <header className="management-header">
          <div>
            <span className="management-eyebrow">FINANCEIRO</span>
            <h1>Movimentação</h1>
            <p>Acompanhe pagamentos e indicadores financeiros do período.</p>
          </div>
        </header>

        <section className="finance-summary">
          <article>
            <FiTrendingUp />
            <span>Recebido</span>
            <strong>{money(revenue)}</strong>
          </article>
          <article>
            <FiDollarSign />
            <span>Pendente</span>
            <strong>{money(pending)}</strong>
          </article>
          <article>
            <FiCreditCard />
            <span>Ticket médio</span>
            <strong>{money(ticket)}</strong>
          </article>
          <article>
            <FiCheckCircle />
            <span>Pagamentos</span>
            <strong>{confirmed.length}</strong>
          </article>
        </section>

        <section className="finance-toolbar">
          <label className="finance-search">
            <FiSearch />
            <input
              type="search"
              placeholder="Buscar pagamento ou pedido..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>

          <div className="finance-filters">
            {['Todos', 'PIX', 'Crédito', 'Débito', 'Dinheiro'].map((item) => (
              <button
                key={item}
                type="button"
                className={method === item ? 'is-active' : ''}
                onClick={() => setMethod(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        <section className="finance-panel">
          <div className="finance-table finance-table--head">
            <span>TRANSAÇÃO</span>
            <span>PEDIDO</span>
            <span>FORMA</span>
            <span>HORÁRIO</span>
            <span>STATUS</span>
            <span>VALOR</span>
          </div>

          {visible.map((transaction) => (
            <div className="finance-table" key={transaction.id}>
              <strong>{transaction.id}</strong>
              <span>{transaction.order}</span>
              <span>{transaction.method}</span>
              <span>{transaction.time}</span>
              <span className={`finance-status finance-status--${transaction.status.toLowerCase()}`}>
                {transaction.status}
              </span>
              <strong>{money(transaction.value)}</strong>
            </div>
          ))}

          {visible.length === 0 && (
            <div className="management-empty">Nenhuma movimentação encontrada.</div>
          )}
        </section>
      </section>
    </main>
  )
}
