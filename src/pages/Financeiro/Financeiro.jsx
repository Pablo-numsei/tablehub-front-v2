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
import {
  PAYMENT_METHOD_FILTERS, mapPaymentHistory, filterPaymentHistory, summarizePaymentHistory,
} from '../../utils/financialTransactions.js'
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
  const [transactions, setTransactions] = useState([])
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
      const [summaryResult, paymentsResult] = await Promise.allSettled([
        api.get('/api/dashboard/resumo'),
        api.get('/api/payments'),
      ])

      const failures = []
      if (summaryResult.status === 'fulfilled') {
        const data = summaryResult.value.data
        setSummary({
          revenue: Number(data?.faturamentoHoje ?? 0),
          ticket: Number(data?.ticketMedio ?? 0),
        })
      } else {
        failures.push('Não foi possível carregar os indicadores financeiros.')
      }

      if (paymentsResult.status === 'fulfilled') {
        try {
          setTransactions(mapPaymentHistory(paymentsResult.value.data))
        } catch (failure) {
          setTransactions([])
          failures.push(failure.message)
        }
      } else {
        setTransactions([])
        failures.push(paymentsResult.reason?.response?.data?.message ||
          'Não foi possível carregar o histórico de pagamentos.')
      }

      if (failures.length) setError(failures.join(' '))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadSummary()
  }, [])

  const visible = useMemo(() =>
    filterPaymentHistory(transactions, method, query), [transactions, method, query])
  const paymentStats = useMemo(() =>
    summarizePaymentHistory(transactions), [transactions])

  return (
    <main className="management-page finance-page">
      <ManagementSidebar />

      <section className="management-content">
        <header className="management-header">
          <div>
            <span className="management-eyebrow">FINANCEIRO</span>
            <h1>Movimentação</h1>
            <p>Registros persistidos no TableHub. O fluxo desta entrega demonstra pagamentos simulados, sem cobrança bancária.</p>
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
            <span>Registros pagos hoje</span>
            <strong>{loading ? '—' : money(summary.revenue)}</strong>
          </article>

          <article>
            <FiDollarSign />
            <span>Solicitações pendentes no histórico</span>
            <strong>{loading ? '—' : money(paymentStats.pending)}</strong>
          </article>

          <article>
            <FiCreditCard />
            <span>Ticket médio</span>
            <strong>{loading ? '—' : money(summary.ticket)}</strong>
          </article>

          <article>
            <FiCheckCircle />
            <span>Registros no histórico</span>
            <strong>{loading ? '—' : paymentStats.total}</strong>
          </article>
        </section>

        <div className="finance-api-notice">
          Valores confirmados são simulações registradas no TableHub, sem conciliação bancária.
          A lista exibe até 200 pagamentos recentes. Horários antigos aparecem como
          horário do servidor, pois ainda não possuem fuso armazenado.
        </div>

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
            {PAYMENT_METHOD_FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={method === item.id ? 'is-active' : ''}
                aria-pressed={method === item.id}
                onClick={() => setMethod(item.id)}
              >
                {item.label}
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
              <span>{transaction.methodLabel}</span>
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
              {loading ? 'Carregando histórico de pagamentos...' :
                transactions.length === 0
                  ? 'Nenhuma solicitação de pagamento foi encontrada no histórico carregado.'
                  : 'Nenhum pagamento corresponde ao método ou à busca informada.'}
            </div>
          )}
        </section>
      </section>
    </main>
  )
}
