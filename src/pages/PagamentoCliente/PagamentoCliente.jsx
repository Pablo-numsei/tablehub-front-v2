import { useEffect, useState } from 'react'
import {
  FiArrowLeft,
  FiCreditCard,
  FiSmartphone,
} from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import ThemeToggle from '../../components/layout/ThemeToggle.jsx'
import api from '../../services/api.js'
import useCustomerOrder from '../../hooks/useCustomerOrder.js'
import { paymentMethodLabel, paymentStatusLabel } from '../../services/orderPayments.js'
import { orderAccessError } from '../../services/orderAccess.js'
import { money } from '../../data/customerMenu.js'
import '../../styles/customer-flow.css'

const methods = [
  { id: 'CREDITO', label: 'Cartão de crédito', icon: FiCreditCard },
  { id: 'DEBITO', label: 'Cartão de débito', icon: FiCreditCard },
  { id: 'PIX', label: 'PIX', icon: FiSmartphone },
]

export default function PagamentoCliente() {
  const navigate = useNavigate()
  const params = new URLSearchParams(window.location.search)
  const requestedId = params.get('id')
  const { order, payment, backendId, loading, error: loadError, refresh } = useCustomerOrder(requestedId, { pollMs: 5000 })
  const [method, setMethod] = useState('')
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => { if (payment?.method) setMethod(payment.method) }, [payment?.method])
  const pending = payment?.status === 'PENDENTE'
  const paid = payment?.status === 'PAGO'

  if (loading && !order) return <main className="customer-flow-page"><div className="customer-flow-shell"><p role="status">Consultando pedido...</p></div></main>

  if (!order) {
    return (
      <main className="customer-flow-page">
        <div className="customer-flow-shell">
          <section className="customer-flow-head">
            <span>PAGAMENTO</span>
            <h1>Pedido não encontrado.</h1>
            <p role="alert">{loadError || 'Volte à aba em que o pedido foi criado ou peça ajuda à equipe.'}</p>
          </section>
        </div>
      </main>
    )
  }

  const orderQuery = `id=${encodeURIComponent(order.id)}&mesa=${order.table}`

  const confirmPayment = async () => {
    if (!method || processing || pending || paid || loadError) return

    if (!backendId) {
      setError('Este pedido não possui um ID válido no backend.')
      return
    }

    setProcessing(true)
    setError('')

    try {
      await api.post(`/api/payments/${backendId}/process`, {
        method,
      })
      await refresh()
    } catch (requestError) {
      setError(
        orderAccessError(requestError),
      )
    } finally {
      setProcessing(false)
    }
  }

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
          <span>PAGAMENTO SIMULADO</span>
          <h1>{paid ? 'Simulação confirmada.' : pending ? 'Solicitação de simulação enviada.' : 'Como deseja simular o pagamento?'}</h1>
          <p>Esta demonstração não realiza cobrança. A equipe confirma apenas o registro simulado no sistema.</p>
        </section>

        <section className="customer-flow-card customer-status-card">
          {(error || loadError) && (
            <div className="customer-flow-error" role="alert">
              {error || loadError}
            </div>
          )}

          <div className="customer-payment-methods">
            {methods.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className={`customer-choice-button ${method === id ? 'is-active' : ''}`}
                onClick={() => setMethod(id)}
                aria-pressed={method === id}
                disabled={pending || paid || processing}
              >
                <Icon />
                <span>{label}</span>
              </button>
            ))}
          </div>

          <div className="customer-summary-total">
            <span>Total do pedido</span>
            <strong>{money(order.total)}</strong>
          </div>

          {payment && <p role="status">Simulado · {paymentMethodLabel(payment.method)} · {paymentStatusLabel(payment.status)}</p>}

          <div className="customer-demo-notice">
            Pagamento simulado: nenhuma cobrança, transferência PIX ou transação de cartão é efetuada. O registro não comprova pagamento real.
          </div>

          <div className="customer-flow-actions">
            <button
              className="th-btn th-btn--primary th-btn--block"
              type="button"
              onClick={paid ? () => navigate(`/comprovante?${orderQuery}`) : confirmPayment}
              disabled={!paid && (!method || processing || pending || !!loadError)}
            >
              {paid ? 'Ver comprovante simulado' : processing ? 'Enviando...' : pending ? 'Simulação aguardando equipe' : 'Solicitar pagamento simulado'}
            </button>

            <button
              className="th-btn th-btn--glass th-btn--block"
              type="button"
              onClick={() => navigate(`/acompanhar-pedido?${orderQuery}`)}
            >
              <FiArrowLeft /> Voltar ao pedido
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}
