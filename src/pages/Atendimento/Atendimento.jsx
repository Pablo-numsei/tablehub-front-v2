import { useEffect, useMemo, useState } from 'react'
import {
  FiBell,
  FiCheck,
  FiClock,
  FiFileText,
  FiRefreshCw,
} from 'react-icons/fi'
import ManagementSidebar from '../../components/layout/ManagementSidebar.jsx'
import api from '../../services/api.js'
import {
  enableStaffPush,
  isStaffPushEnabled,
} from '../../services/pushNotifications.js'
import '../../styles/management.css'
import './Atendimento.css'

const filters = ['Todos', 'Enviado', 'Em atendimento', 'Concluído']

const nextStatus = {
  Enviado: 'Em atendimento',
  'Em atendimento': 'Concluído',
  Concluído: 'Concluído',
}

const backendStatus = {
  ENVIADO: 'Enviado',
  EM_ATENDIMENTO: 'Em atendimento',
  CONCLUIDO: 'Concluído',
}

const apiStatus = {
  'Em atendimento': 'EM_ATENDIMENTO',
  Concluído: 'CONCLUIDO',
}

const mapRequest = (request) => ({
  id: request.id,
  label: `REQ-${String(request.id).padStart(4, '0')}`,
  type: request.tipo === 'CONTA' ? 'Conta' : 'Garçom',
  table: String(request.mesa).padStart(2, '0'),
  orderId: request.pedidoId ? `#${request.pedidoId}` : null,
  detail: request.detalhe,
  status: backendStatus[request.status] || request.status,
  createdAt: request.criadoEm,
})

const formatTime = (value) =>
  new Date(value).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })

export default function Atendimento() {
  const [requests, setRequests] = useState([])
  const [filter, setFilter] = useState('Todos')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [updatingId, setUpdatingId] = useState(null)
  const [error, setError] = useState('')
  const [pushEnabled, setPushEnabled] = useState(() => isStaffPushEnabled())
  const [pushLoading, setPushLoading] = useState(false)
  const [pushError, setPushError] = useState('')

  const refreshRequests = async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true)
    else setLoading(true)

    try {
      const { data } = await api.get('/api/atendimentos')
      setRequests((Array.isArray(data) ? data : []).map(mapRequest))
      setError('')
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          'Não foi possível carregar as solicitações do backend.',
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    refreshRequests()
    const timer = window.setInterval(
      () => refreshRequests({ silent: true }),
      3000,
    )
    return () => window.clearInterval(timer)
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

  const activateStaffNotifications = async () => {
    if (pushEnabled || pushLoading) return

    setPushLoading(true)
    setPushError('')

    try {
      await enableStaffPush()
      setPushEnabled(true)
    } catch (requestError) {
      setPushError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Não foi possível ativar as notificações da equipe.',
      )
    } finally {
      setPushLoading(false)
    }
  }

  const advanceRequest = async (request) => {
    const target = nextStatus[request.status]
    if (!target || target === request.status) return

    setUpdatingId(request.id)
    setError('')

    try {
      await api.patch(`/api/atendimentos/${request.id}/status`, {
        status: apiStatus[target],
      })
      await refreshRequests({ silent: true })
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          'Não foi possível atualizar a solicitação.',
      )
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <main className="management-page service-page">
      <ManagementSidebar />

      <section className="management-content">
        <header className="management-header">
          <div>
            <span className="management-eyebrow">ATENDIMENTO</span>
            <h1>Solicitações das mesas</h1>
            <p>Chamados reais de garçom e pedidos de fechamento da conta.</p>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              className="th-btn th-btn--primary"
              type="button"
              onClick={activateStaffNotifications}
              disabled={pushEnabled || pushLoading}
            >
              <FiBell />
              {pushEnabled
                ? 'Notificações ativadas'
                : pushLoading
                  ? 'Ativando...'
                  : 'Ativar notificações'}
            </button>

            <button
              className="th-btn th-btn--glass"
              type="button"
              onClick={() => refreshRequests({ silent: true })}
              disabled={refreshing}
            >
              <FiRefreshCw className={refreshing ? 'orders-spin' : ''} />
              {refreshing ? 'Atualizando' : 'Atualizar'}
            </button>
          </div>
        </header>

        {error && <div className="orders-alert" role="alert">{error}</div>}
        {pushError && <div className="orders-alert" role="alert">{pushError}</div>}

        <section className="service-summary">
          <article><FiBell /><span>Aguardando</span><strong>{counts.open}</strong></article>
          <article><FiClock /><span>Em atendimento</span><strong>{counts.attending}</strong></article>
          <article><FiCheck /><span>Concluídas</span><strong>{counts.done}</strong></article>
        </section>

        <section className="service-toolbar">
          <div className="service-filters">
            {filters.map((status) => (
              <button key={status} type="button" className={filter === status ? 'is-active' : ''} onClick={() => setFilter(status)}>
                {status}
              </button>
            ))}
          </div>
        </section>

        <section className="service-grid">
          {loading && <div className="management-empty">Carregando solicitações...</div>}

          {!loading && visible.map((request) => {
            const Icon = request.type === 'Conta' ? FiFileText : FiBell
            return (
              <article className="service-card" key={request.id}>
                <div className="service-card__top">
                  <div className="service-card__icon"><Icon /></div>
                  <div><small>{request.label}</small><h2>{request.type === 'Conta' ? 'Solicitação de conta' : 'Chamar garçom'}</h2></div>
                  <span className={`service-status service-status--${request.status.toLowerCase().replace(' ', '-').replace('í', 'i')}`}>{request.status}</span>
                </div>

                <div className="service-card__meta">
                  <div><span>Mesa</span><strong>{request.table}</strong></div>
                  <div><span>Pedido</span><strong>{request.orderId || '—'}</strong></div>
                  <div><span>Horário</span><strong>{formatTime(request.createdAt)}</strong></div>
                </div>

                <div className="service-card__detail">
                  <span>DETALHE</span>
                  <p>{request.detail || 'Sem observações.'}</p>
                </div>

                {request.status !== 'Concluído' && (
                  <button className="th-btn th-btn--primary th-btn--block" type="button" disabled={updatingId === request.id} onClick={() => advanceRequest(request)}>
                    {updatingId === request.id ? 'Atualizando...' : `Avançar para ${nextStatus[request.status]}`}
                  </button>
                )}
              </article>
            )
          })}

          {!loading && visible.length === 0 && (
            <div className="management-empty">Nenhuma solicitação neste filtro.</div>
          )}
        </section>
      </section>
    </main>
  )
}
