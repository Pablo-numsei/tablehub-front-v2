import { useEffect, useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  FiAlertCircle,
  FiBarChart2,
  FiRefreshCw,
} from 'react-icons/fi'
import ManagementSidebar from '../../components/layout/ManagementSidebar.jsx'
import api from '../../services/api.js'
import './Dashboard.css'

const moneyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const formatMoney = (value) => moneyFormatter.format(Number(value || 0))

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

export default function Dashboard() {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadDashboard = async () => {
    setLoading(true)
    setError('')

    try {
      const { data } = await api.get('/api/dashboard/resumo')
      setDashboard(data)
    } catch (requestError) {
      setDashboard(null)
      setError(
        requestError?.response?.data?.message ||
          'Não foi possível carregar os dados reais do Dashboard.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const metrics = useMemo(() => {
    if (!dashboard) return []

    const occupiedPercentage = dashboard.totalMesas
      ? Math.round((dashboard.mesasOcupadas / dashboard.totalMesas) * 100)
      : 0

    return [
      {
        label: 'Pedidos hoje',
        value: String(dashboard.pedidosHoje),
        detail: 'Pedidos registrados no banco',
      },
      {
        label: 'Faturamento',
        value: formatMoney(dashboard.faturamentoHoje),
        detail: 'Pagamentos PAGO processados hoje',
      },
      {
        label: 'Ticket médio',
        value: formatMoney(dashboard.ticketMedio),
        detail: 'Média dos pedidos pagos hoje',
      },
      {
        label: 'Mesas ocupadas',
        value: `${dashboard.mesasOcupadas} / ${dashboard.totalMesas}`,
        detail: `${occupiedPercentage}% das mesas ativas`,
      },
    ]
  }, [dashboard])

  const movement = dashboard?.movimentoPorHora || []
  const maxMovement = Math.max(
    1,
    ...movement.map((item) => Number(item.quantidade || 0)),
  )

  return (
    <main className="dashboard-page">
      <ManagementSidebar />

      <section className="dashboard-content">
        <header className="dashboard-header">
          <div>
            <span className="dashboard-header__eyebrow">VISÃO GERAL</span>
            <h1>Dashboard</h1>
            <p>Dados operacionais carregados diretamente do TableHub.</p>
          </div>

          <button
            type="button"
            className="dashboard-period"
            onClick={loadDashboard}
            disabled={loading}
          >
            <FiRefreshCw className={loading ? 'is-spinning' : ''} />
            {loading ? 'Atualizando' : 'Hoje'}
          </button>
        </header>

        {error && (
          <div className="dashboard-alert" role="alert">
            <FiAlertCircle />
            <div>
              <strong>Dashboard sem conexão com o backend.</strong>
              <span>{error}</span>
            </div>
            <button type="button" onClick={loadDashboard}>
              Tentar novamente
            </button>
          </div>
        )}

        <section className="dashboard-metrics">
          {loading &&
            Array.from({ length: 4 }).map((_, index) => (
              <article className="metric-card metric-card--loading" key={index}>
                <span />
                <strong />
                <small />
              </article>
            ))}

          {!loading &&
            metrics.map((metric) => (
              <article className="metric-card" key={metric.label}>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
                <small>{metric.detail}</small>
              </article>
            ))}
        </section>

        {!loading && dashboard && (
          <>
            <section className="dashboard-status-strip">
              {dashboard.pedidosPorStatus.map((item) => (
                <article
                  className={`dashboard-status dashboard-status--${statusSlug(item.status)}`}
                  key={item.status}
                >
                  <span>{item.status}</span>
                  <strong>{item.quantidade}</strong>
                </article>
              ))}
            </section>

            <section className="dashboard-grid">
              <article className="dashboard-panel dashboard-panel--orders">
                <div className="dashboard-panel__head">
                  <div>
                    <span>OPERAÇÃO</span>
                    <h2>Pedidos recentes</h2>
                  </div>
                  <NavLink to="/pedidos">Ver todos</NavLink>
                </div>

                {dashboard.pedidosRecentes.length > 0 ? (
                  <div className="orders-table">
                    {dashboard.pedidosRecentes.map((order) => (
                      <div className="orders-row" key={order.id}>
                        <strong>#{order.id}</strong>
                        <span>Mesa {String(order.mesa).padStart(2, '0')}</span>
                        <span
                          className={`status-badge status-badge--${statusSlug(order.status)}`}
                        >
                          {order.status}
                        </span>
                        <span>{formatMoney(order.total)}</span>
                        <small>{formatTime(order.criadoEm)}</small>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="dashboard-empty">
                    Nenhum pedido registrado ainda.
                  </div>
                )}
              </article>

              <article className="dashboard-panel dashboard-panel--tables">
                <div className="dashboard-panel__head">
                  <div>
                    <span>SALÃO</span>
                    <h2>Status das mesas</h2>
                  </div>
                  <NavLink to="/mesas">Abrir mesas</NavLink>
                </div>

                {dashboard.mesas.length > 0 ? (
                  <div className="tables-grid">
                    {dashboard.mesas.map((table) => (
                      <div
                        className={`table-card table-card--${statusSlug(table.status)}`}
                        key={table.numero}
                      >
                        <strong>{String(table.numero).padStart(2, '0')}</strong>
                        <span>{table.status}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="dashboard-empty">
                    Nenhuma mesa ativa cadastrada.
                  </div>
                )}
              </article>
            </section>

            <article className="dashboard-panel dashboard-panel--performance">
              <div className="dashboard-panel__head">
                <div>
                  <span>DESEMPENHO</span>
                  <h2>Pedidos por hora</h2>
                </div>
                <FiBarChart2 />
              </div>

              <div className="performance-chart-scroll">
                <div
                  className="performance-chart"
                  aria-label="Gráfico de pedidos por hora do dia"
                >
                  {movement.map((item) => {
                    const quantity = Number(item.quantidade || 0)
                    const height = quantity
                      ? Math.max(8, (quantity / maxMovement) * 100)
                      : 0

                    return (
                      <div className="performance-column" key={item.hora}>
                        <strong>{quantity || ''}</strong>
                        <div className="performance-column__track">
                          <div
                            className="performance-column__bar"
                            style={{ height: `${height}%` }}
                          />
                        </div>
                        <small>
                          {item.hora % 2 === 0
                            ? `${String(item.hora).padStart(2, '0')}h`
                            : ''}
                        </small>
                      </div>
                    )
                  })}
                </div>
              </div>
            </article>
          </>
        )}
      </section>
    </main>
  )
}
