import { useEffect, useMemo, useState } from 'react'
import {
  FiBell,
  FiCheck,
  FiClock,
  FiFileText,
  FiRefreshCw,
} from 'react-icons/fi'
import ManagementSidebar from '../../components/layout/ManagementSidebar.jsx'
import {
  loadServiceRequests,
  updateServiceRequestStatus,
} from '../../utils/customerSession.js'
import '../../styles/management.css'
import './Atendimento.css'

const demoRequests = [
  {
    id: 'REQ-1041',
    type: 'Garçom',
    table: '03',
    orderId: '#1023',
    detail: 'Preciso de ajuda',
    status: 'Enviado',
    createdAt: '2026-09-30T11:52:00.000Z',
  },
  {
    id: 'REQ-1039',
    type: 'Conta',
    table: '07',
    orderId: '#1024',
    detail: 'Solicitação de fechamento da mesa',
    status: 'Em atendimento',
    createdAt: '2026-09-30T11:46:00.000Z',
  },
  {
    id: 'REQ-1036',
    type: 'Garçom',
    table: '11',
    orderId: '#1025',
    detail: 'Talheres / guardanapos',
    status: 'Concluído',
    createdAt: '2026-09-30T11:38:00.000Z',
  },
]

const filters = ['Todos', 'Enviado', 'Em atendimento', 'Concluído']

const nextStatus = {
  Enviado: 'Em atendimento',
  'Em atendimento': 'Concluído',
  Concluído: 'Concluído',
}

const formatTime = (value) =>
  new Date(value).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })

export default function Atendimento() {
  const [requests, setRequests] = useState(() => [
    ...loadServiceRequests(),
    ...demoRequests,
  ])
  const [filter, setFilter] = useState('Todos')

  const refreshRequests = () => {
    const sessionRequests = loadServiceRequests()

    setRequests((current) => {
      const demos = current.filter((request) =>
        demoRequests.some((demo) => demo.id === request.id),
      )
      return [...sessionRequests, ...demos]
    })
  }

  useEffect(() => {
    const timer = window.setInterval(refreshRequests, 1200)
    window.addEventListener('storage', refreshRequests)

    return () => {
      window.clearInterval(timer)
      window.removeEventListener('storage', refreshRequests)
    }
  }, [])

  const visible = useMemo(
    () =>
      requests.filter(
        (request) => filter === 'Todos' || request.status === filter,
      ),
    [requests, filter],
  )

  const counts = {
    open: requests.filter((request) => request.status === 'Enviado').length,
    attending: requests.filter((request) => request.status === 'Em atendimento').length,
    done: requests.filter((request) => request.status === 'Concluído').length,
  }

  const advanceRequest = (id) => {
    setRequests((current) =>
      current.map((request) => {
        if (request.id !== id) return request

        const status = nextStatus[request.status]
        updateServiceRequestStatus(id, status)

        return { ...request, status }
      }),
    )
  }

  return (
    <main className="management-page service-page">
      <ManagementSidebar />

      <section className="management-content">
        <header className="management-header">
          <div>
            <span className="management-eyebrow">ATENDIMENTO</span>
            <h1>Solicitações das mesas</h1>
            <p>Centralize chamados de garçom e pedidos de fechamento da conta.</p>
          </div>

          <button className="th-btn th-btn--glass" type="button" onClick={refreshRequests}>
            <FiRefreshCw /> Atualizar
          </button>
        </header>

        <section className="service-summary">
          <article>
            <FiBell />
            <span>Aguardando</span>
            <strong>{counts.open}</strong>
          </article>
          <article>
            <FiClock />
            <span>Em atendimento</span>
            <strong>{counts.attending}</strong>
          </article>
          <article>
            <FiCheck />
            <span>Concluídas</span>
            <strong>{counts.done}</strong>
          </article>
        </section>

        <section className="service-toolbar">
          <div className="service-filters">
            {filters.map((status) => (
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

        <section className="service-grid">
          {visible.map((request) => {
            const Icon = request.type === 'Conta' ? FiFileText : FiBell

            return (
              <article className="service-card" key={request.id}>
                <div className="service-card__top">
                  <div className="service-card__icon">
                    <Icon />
                  </div>

                  <div>
                    <small>{request.id}</small>
                    <h2>{request.type === 'Conta' ? 'Solicitação de conta' : 'Chamar garçom'}</h2>
                  </div>

                  <span className={`service-status service-status--${request.status
                    .toLowerCase()
                    .replace(' ', '-')
                    .replace('í', 'i')}`}>
                    {request.status}
                  </span>
                </div>

                <div className="service-card__meta">
                  <div>
                    <span>Mesa</span>
                    <strong>{request.table}</strong>
                  </div>
                  <div>
                    <span>Pedido</span>
                    <strong>{request.orderId || '—'}</strong>
                  </div>
                  <div>
                    <span>Horário</span>
                    <strong>{formatTime(request.createdAt)}</strong>
                  </div>
                </div>

                <div className="service-card__detail">
                  <span>DETALHE</span>
                  <p>{request.detail || 'Sem observações.'}</p>
                </div>

                {request.status !== 'Concluído' && (
                  <button
                    className="th-btn th-btn--primary th-btn--block"
                    type="button"
                    onClick={() => advanceRequest(request.id)}
                  >
                    Avançar para {nextStatus[request.status]}
                  </button>
                )}
              </article>
            )
          })}

          {visible.length === 0 && (
            <div className="management-empty">Nenhuma solicitação neste filtro.</div>
          )}
        </section>
      </section>
    </main>
  )
}
