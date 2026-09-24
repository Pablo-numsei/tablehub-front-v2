import { NavLink } from 'react-router-dom'
import { FiBarChart2 } from 'react-icons/fi'
import ManagementSidebar from '../../components/layout/ManagementSidebar.jsx'
import './Dashboard.css'

const metrics = [
  { label: 'Pedidos hoje', value: '128', delta: '+12%' },
  { label: 'Faturamento', value: 'R$ 8.420', delta: '+8,4%' },
  { label: 'Ticket médio', value: 'R$ 65,78', delta: '+2,1%' },
  { label: 'Mesas ocupadas', value: '8 / 12', delta: '67%' },
]

const recentOrders = [
  { id: '#1028', table: 'Mesa 04', status: 'Preparando', total: 'R$ 78,90' },
  { id: '#1027', table: 'Mesa 09', status: 'Pronto', total: 'R$ 54,00' },
  { id: '#1026', table: 'Mesa 02', status: 'Aguardando', total: 'R$ 112,50' },
  { id: '#1025', table: 'Mesa 11', status: 'Entregue', total: 'R$ 86,40' },
]

const tables = [
  ['01', 'Livre'],
  ['02', 'Ocupada'],
  ['03', 'Ocupada'],
  ['04', 'Ocupada'],
  ['05', 'Livre'],
  ['06', 'Reservada'],
  ['07', 'Livre'],
  ['08', 'Ocupada'],
]

const bars = [32, 46, 40, 58, 72, 64, 83, 76, 92, 70, 86, 95]

export default function Dashboard() {
  return (
    <main className="dashboard-page">
      <ManagementSidebar />

      <section className="dashboard-content">
        <header className="dashboard-header">
          <div>
            <span className="dashboard-header__eyebrow">VISÃO GERAL</span>
            <h1>Dashboard</h1>
            <p>Visão geral da operação do restaurante.</p>
          </div>

          <button type="button" className="dashboard-period">Hoje</button>
        </header>

        <section className="dashboard-metrics">
          {metrics.map((metric) => (
            <article className="metric-card" key={metric.label}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
              <small>{metric.delta}</small>
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

            <div className="orders-table">
              {recentOrders.map((order) => (
                <div className="orders-row" key={order.id}>
                  <strong>{order.id}</strong>
                  <span>{order.table}</span>
                  <span className={`status-badge status-badge--${order.status.toLowerCase()}`}>
                    {order.status}
                  </span>
                  <span>{order.total}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="dashboard-panel dashboard-panel--tables">
            <div className="dashboard-panel__head">
              <div>
                <span>SALÃO</span>
                <h2>Status das mesas</h2>
              </div>
              <NavLink to="/mesas">Abrir mesas</NavLink>
            </div>

            <div className="tables-grid">
              {tables.map(([number, status]) => (
                <div
                  className={`table-card table-card--${status.toLowerCase()}`}
                  key={number}
                >
                  <strong>{number}</strong>
                  <span>{status}</span>
                </div>
              ))}
            </div>
          </article>
        </section>

        <article className="dashboard-panel dashboard-panel--performance">
          <div className="dashboard-panel__head">
            <div>
              <span>DESEMPENHO</span>
              <h2>Movimento do dia</h2>
            </div>
            <FiBarChart2 />
          </div>

          <div className="performance-chart" aria-label="Gráfico de movimento do dia">
            {bars.map((height, index) => (
              <div className="performance-column" key={index}>
                <div className="performance-column__track">
                  <div
                    className="performance-column__bar"
                    style={{ height: `${height}%` }}
                  />
                </div>
                <small>{String(index + 10).padStart(2, '0')}h</small>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  )
}
