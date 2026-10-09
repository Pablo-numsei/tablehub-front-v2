import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  FiBell,
  FiCheck,
  FiCreditCard,
  FiFileText,
  FiRefreshCw,
} from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import ThemeToggle from '../../components/layout/ThemeToggle.jsx'
import { money } from '../../data/customerMenu.js'
import api from '../../services/api.js'
import { playNotificationSound } from '../../services/notificationSound.js'
import {
  getActiveCustomerOrder,
  getCustomerOrder,
  updateCustomerOrderStatus,
} from '../../utils/customerSession.js'
import '../../styles/customer-flow.css'

const statuses = ['Aguardando', 'Preparando', 'Pronto', 'Entregue']

const backendStatusToCustomer = {
  Recebido: 'Aguardando',
  'Em preparo': 'Preparando',
  Pronto: 'Pronto',
  Entregue: 'Entregue',
}

const getBackendId = (orderId, localOrder) => {
  if (localOrder?.backendId != null) {
    return Number(localOrder.backendId)
  }

  const parsed = Number(String(orderId || '').replace('#', ''))
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

const formatTime = (value) => {
  if (!value) return '—'

  return new Date(value).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function AcompanharPedido() {
  const navigate = useNavigate()
  const params = new URLSearchParams(window.location.search)
  const requestedId = params.get('id')
  const requestedTable = params.get('mesa')

  const initialLocalOrder = requestedId
    ? getCustomerOrder(requestedId)
    : getActiveCustomerOrder()

  const [order, setOrder] = useState(initialLocalOrder)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const previousStatus = useRef(null)

  const refreshOrder = useCallback(async ({ manual = false } = {}) => {
    const localOrder = requestedId
      ? getCustomerOrder(requestedId)
      : getActiveCustomerOrder()

    const backendId = getBackendId(requestedId, localOrder)

    if (!backendId) {
      setOrder(localOrder)
      setLoading(false)
      return
    }

    if (manual) setRefreshing(true)

    try {
      const { data: apiOrder } = await api.get(
        `/api/pedidos/${backendId}`,
      )

      const backendStatus = apiOrder?.status?.name || 'Recebido'
      const customerStatus =
        backendStatusToCustomer[backendStatus] || 'Aguardando'

      if (previousStatus.current && previousStatus.current !== customerStatus) {
        const statusTag = backendStatus
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .replace(/\s+/g, '-')

        playNotificationSound(
          `pedido-${backendId}-${statusTag}`,
        )
      }
      previousStatus.current = customerStatus

      if (localOrder) {
        updateCustomerOrderStatus(localOrder.id, customerStatus)
      }

      setOrder({
        ...(localOrder || {}),
        id: localOrder?.id || `#${apiOrder.id}`,
        backendId: apiOrder.id,
        table: String(
          apiOrder?.mesa?.number ??
            localOrder?.table ??
            requestedTable ??
            '—',
        ).padStart(2, '0'),
        customer: localOrder?.customer || 'Cliente da mesa',
        time: localOrder?.time || formatTime(apiOrder?.createdAt),
        status: customerStatus,
        backendStatus,
        total: Number(
          apiOrder?.totalValue ??
            localOrder?.total ??
            0,
        ),
        paymentMethod: localOrder?.paymentMethod || null,
        paymentStatus: localOrder?.paymentStatus || 'Pendente',
        createdAt:
          apiOrder?.createdAt ||
          localOrder?.createdAt ||
          new Date().toISOString(),
      })

      setError('')
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          'Não foi possível atualizar o status do pedido.',
      )

      setOrder((current) => current || localOrder)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [requestedId, requestedTable])

  useEffect(() => {
    refreshOrder()

    const timer = window.setInterval(
      () => refreshOrder(),
      2000,
    )

    return () => {
      window.clearInterval(timer)
    }
  }, [refreshOrder])

  const currentIndex = useMemo(
    () => statuses.indexOf(order?.status),
    [order?.status],
  )

  if (loading && !order) {
    return (
      <main className="customer-flow-page">
        <div className="customer-flow-shell">
          <header className="customer-flow-topbar">
            <div className="customer-flow-brand">TableHub</div>
            <ThemeToggle compact />
          </header>

          <section className="customer-flow-head">
            <span>PEDIDO</span>
            <h1>Carregando pedido...</h1>
            <p>Consultando o status atual no servidor.</p>
          </section>
        </div>
      </main>
    )
  }

  if (!order) {
    return (
      <main className="customer-flow-page">
        <div className="customer-flow-shell">
          <header className="customer-flow-topbar">
            <div className="customer-flow-brand">TableHub</div>
            <ThemeToggle compact />
          </header>

          <section className="customer-flow-head">
            <span>PEDIDO</span>
            <h1>Pedido não encontrado.</h1>
            {error && <p>{error}</p>}
          </section>

          <div className="customer-flow-empty">
            <button
              className="th-btn th-btn--primary"
              type="button"
              onClick={() => navigate('/')}
            >
              Voltar ao início
            </button>
          </div>
        </div>
      </main>
    )
  }

  const orderQuery = `id=${encodeURIComponent(order.id)}&mesa=${order.table}`

  return (
    <main className="customer-flow-page">
      <div className="customer-flow-shell">
        <header className="customer-flow-topbar">
          <div className="customer-flow-brand">TableHub</div>
          <div className="customer-flow-topbar__actions">
            <div className="customer-flow-table">MESA {order.table}</div>
            <ThemeToggle compact />
          </div>
        </header>

        <section className="customer-flow-head customer-status-card">
          <span>PEDIDO {order.id}</span>
          <h1>Acompanhe seu pedido.</h1>
          <p>O status é atualizado diretamente pelo sistema da cozinha.</p>
        </section>

        <section className="customer-flow-card customer-status-card">
          <span className="customer-flow-card__eyebrow">STATUS ATUAL</span>
          <div
            className={`customer-status-current customer-status-current--${order.status.toLowerCase()}`}
          >
            {order.status}
          </div>

          {error && (
            <div className="customer-flow-error" role="alert">
              {error}
            </div>
          )}

          <div className="customer-status-steps">
            {statuses.map((status, index) => {
              const done = index < currentIndex
              const current = index === currentIndex

              return (
                <div
                  key={status}
                  className={`customer-status-step ${done ? 'is-done' : ''} ${current ? 'is-current' : ''}`}
                >
                  <span className="customer-status-step__dot">
                    {done ? <FiCheck /> : index + 1}
                  </span>
                  <strong>{status}</strong>
                </div>
              )
            })}
          </div>

          <div className="customer-summary-row" style={{ marginTop: 24 }}>
            <span>Total</span>
            <strong>{money(order.total)}</strong>
          </div>

          <div className="customer-summary-row">
            <span>Horário</span>
            <strong>{order.time}</strong>
          </div>

          <div className="customer-summary-row">
            <span>Pagamento</span>
            <strong>{order.paymentMethod || 'Pendente'}</strong>
          </div>

          <div className="customer-flow-actions" style={{ marginTop: 24 }}>
            <button
              className="th-btn th-btn--glass th-btn--block"
              type="button"
              onClick={() => refreshOrder({ manual: true })}
              disabled={refreshing}
            >
              <FiRefreshCw />
              {refreshing ? 'Atualizando...' : 'Atualizar agora'}
            </button>

            <button
              className="th-btn th-btn--primary th-btn--block"
              type="button"
              onClick={() =>
                navigate(
                  order.paymentMethod
                    ? `/comprovante?${orderQuery}`
                    : `/pagamento?${orderQuery}`,
                )
              }
            >
              <FiCreditCard />
              {order.paymentMethod ? 'Ver comprovante' : 'Pagamento'}
            </button>

            <div className="customer-action-grid">
              <button
                className="th-btn th-btn--glass"
                type="button"
                onClick={() => navigate(`/chamar-garcom?${orderQuery}`)}
              >
                <FiBell /> Chamar garçom
              </button>

              <button
                className="th-btn th-btn--glass"
                type="button"
                onClick={() => navigate(`/solicitar-conta?${orderQuery}`)}
              >
                <FiFileText /> Solicitar conta
              </button>
            </div>

            <button
              className="customer-text-link"
              type="button"
              onClick={() => navigate(`/historico?mesa=${order.table}`)}
            >
              Ver histórico de pedidos
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}
