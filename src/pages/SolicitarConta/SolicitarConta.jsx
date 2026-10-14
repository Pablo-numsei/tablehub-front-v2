import { useState } from 'react'
import { FiCheckCircle, FiFileText } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import ThemeToggle from '../../components/layout/ThemeToggle.jsx'
import api from '../../services/api.js'
import useTableContext from '../../hooks/useTableContext.js'
import { validOrderId, orderAccessError } from '../../services/orderAccess.js'
import { money } from '../../data/customerMenu.js'
import {
  getActiveCustomerOrder,
  getCustomerOrder,
} from '../../utils/customerSession.js'
import '../../styles/customer-flow.css'

export default function SolicitarConta() {
  const navigate = useNavigate()
  const params = new URLSearchParams(window.location.search)
  const requestedId = params.get('id')
  const candidate = requestedId ? getCustomerOrder(requestedId) : getActiveCustomerOrder()
  const requestedTable = params.get('mesa')
  const order = candidate && (!requestedTable || Number(candidate.table) === Number(requestedTable)) ? candidate : null
  const table = order?.table || requestedTable || ''
  const { ready: tableReady, loading: tableLoading, error: tableError } = useTableContext(String(table))
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const requestBill = async () => {
    if (sending || (!order && !tableReady)) return
    setSending(true)
    setError('')

    try {
      const { data: mesas } = await api.get('/api/mesas')
      const mesa = (Array.isArray(mesas) ? mesas : []).find(
        (item) => Number(item.number) === Number(table),
      )

      if (!mesa) throw new Error('Mesa não encontrada no backend.')

      const pedidoId =
        validOrderId(order?.backendId ?? order?.id ?? requestedId)

      await api.post('/api/atendimentos', {
        mesaId: mesa.id,
        pedidoId,
        tipo: 'CONTA',
        detalhe: 'Solicitação de fechamento da mesa',
      })

      setSent(true)
    } catch (requestError) {
      setError(
        orderAccessError(requestError),
      )
    } finally {
      setSending(false)
    }
  }

  return (
    <main className="customer-flow-page">
      <div className="customer-flow-shell">
        <header className="customer-flow-topbar">
          <div className="customer-flow-brand">TableHub</div>
          <div className="customer-flow-topbar__actions">
            <div className="customer-flow-table">MESA {table}</div>
            <ThemeToggle compact />
          </div>
        </header>

        <section className="customer-flow-head customer-status-card">
          <span>CONTA</span>
          <h1>Solicitar fechamento</h1>
          <p>Envie uma solicitação para a equipe responsável pela mesa.</p>
        </section>

        <section className="customer-flow-card customer-status-card">
          {error && <div className="customer-flow-error" role="alert">{error}</div>}
          {!order && tableError && <div className="customer-flow-error" role="alert">{tableError}</div>}
          {!order && !tableLoading && !tableReady && !tableError && <p role="alert">Escaneie o QR Code atualizado da sua mesa para solicitar a conta.</p>}

          {sent ? (
            <div className="customer-request-success">
              <FiCheckCircle />
              <h2>Conta solicitada.</h2>
              <p>A solicitação da mesa {table} foi registrada no sistema.</p>
            </div>
          ) : (
            <>
              <div className="customer-result-icon customer-result-icon--small">
                <FiFileText />
              </div>

              {order && (
                <>
                  <div className="customer-summary-row">
                    <span>Pedido</span>
                    <strong>{order.id}</strong>
                  </div>
                  <div className="customer-summary-row">
                    <span>Pagamento</span>
                    <strong>{order.paymentMethod || 'Pendente'}</strong>
                  </div>
                  <div className="customer-summary-total">
                    <span>Total atual</span>
                    <strong>{money(order.total)}</strong>
                  </div>
                </>
              )}

              <button
                className="th-btn th-btn--primary th-btn--block"
                type="button"
                onClick={requestBill}
                disabled={sending || (!order && !tableReady)}
              >
                {sending ? 'Enviando...' : 'Solicitar conta'}
              </button>
            </>
          )}

          <div className="customer-flow-actions" style={{ marginTop: 12 }}>
            <button
              className="th-btn th-btn--glass th-btn--block"
              type="button"
              onClick={() =>
                navigate(
                  order
                    ? `/acompanhar-pedido?id=${encodeURIComponent(order.id)}&mesa=${table}`
                    : `/menu?mesa=${table}`,
                )
              }
            >
              Voltar
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}
