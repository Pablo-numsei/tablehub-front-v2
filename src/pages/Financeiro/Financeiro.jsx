import { useEffect, useMemo, useState } from 'react'
import {
  FiCheckCircle,
  FiCreditCard,
  FiDollarSign,
  FiRefreshCw,
  FiSearch,
  FiTrendingUp,
} from 'react-icons/fi'
import ManagementSidebar from '../../components/layout/ManagementSidebar.jsx'
import api from '../../services/api.js'
import '../../styles/management.css'
import './Financeiro.css'

const money = (value = 0) =>
  Number(value).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })

export default function Financeiro() {
  const [summary, setSummary] = useState({
    revenue: 0,
    ticket: 0,
  })
  const [transactions] = useState([])
  const [method, setMethod] = useState('Todos')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const loadSummary = async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true)
    else setLoading(true)

    setError('')

    try {
      const { data } = await api.get('/api/dashboard/resumo')

      setSummary({
        revenue: Number(data?.faturamentoHoje ?? 0),
        ticket: Number(data?.ticketMedio ?? 0),
      })
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          'Não foi possível carregar os indicadores financeiros.',
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadSummary()
  }, [])

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase()

    return transactions.filter((transaction) => {
      const matchesMethod =
        method === 'Todos' || transaction.method === method
      const matchesSearch =
        !normalized ||
        transaction.id.toLowerCase().includes(normalized) ||
        transaction.order.toLowerCase().includes(normalized) ||
        transaction.method.toLowerCase().includes(normalized)

      return matchesMethod && matchesSearch
    })
  }, [transactions, method, query])

  return (
    <main className="management-page finance-page">
      <ManagementSidebar />

      <section className="management-content">
        <header className="management-header">
          <div>
            <span className="management-eyebrow">FINANCEIRO</span>
            <h1>Movimentação</h1>
            <p>Indicadores financeiros reais registrados no TableHub.</p>
          </div>

          <button
            className="th-btn th-btn--primary"
            type="button"
            onClick={() => loadSummary({ silent: true })}
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

        <section className="finance-summary">
          <article>
            <FiTrendingUp />
            <span>Faturamento hoje</span>
            <strong>{loading ? '—' : money(summary.revenue)}</strong>
          </article>

          <article>
            <FiDollarSign />
            <span>Pendente</span>
            <strong>—</strong>
          </article>

          <article>
            <FiCreditCard />
            <span>Ticket médio</span>
            <strong>{loading ? '—' : money(summary.ticket)}</strong>
          </article>

          <article>
            <FiCheckCircle />
            <span>Pagamentos</span>
            <strong>—</strong>
          </article>
        </section>

        <div className="finance-api-notice">
          A API atual já fornece faturamento e ticket médio. A listagem de
          pagamentos, o total pendente e a quantidade de pagamentos aguardam
          um endpoint de consulta no backend.
        </div>

        <section className="finance-toolbar">
          <label className="finance-search">
            <FiSearch />
            <input
              type="search"
              placeholder="Buscar pagamento ou pedido..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              disabled
            />
          </label>

          <div className="finance-filters">
            {['Todos', 'PIX', 'Crédito', 'Débito'].map((item) => (
              <button
                key={item}
                type="button"
                className={method === item ? 'is-active' : ''}
                onClick={() => setMethod(item)}
                disabled
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
              <span
                className={`finance-status finance-status--${transaction.status.toLowerCase()}`}
              >
                {transaction.status}
              </span>
              <strong>{money(transaction.value)}</strong>
            </div>
          ))}

          {visible.length === 0 && (
            <div className="management-empty">
              Nenhuma transação fictícia é exibida. As movimentações aparecerão
              aqui quando o endpoint de listagem de pagamentos estiver disponível.
            </div>
          )}
        </section>
      </section>
    </main>
  )
}
