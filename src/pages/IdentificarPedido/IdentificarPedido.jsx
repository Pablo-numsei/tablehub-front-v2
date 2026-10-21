import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiArrowLeft, FiArrowRight, FiMessageCircle } from 'react-icons/fi'
import ThemeToggle from '../../components/layout/ThemeToggle.jsx'
import { money } from '../../data/customerMenu.js'
import useCustomerCatalog from '../../hooks/useCustomerCatalog.js'
import useTableContext from '../../hooks/useTableContext.js'
import { cartItems, cartTotal } from '../../services/customerCatalog.js'
import { readCustomerSession } from '../../services/customerSession.js'
import { loadCart } from '../../utils/customerSession.js'
import { loadQuickIdentity, saveQuickIdentity, validateQuickIdentity } from '../../services/quickIdentification.js'
import api from '../../services/api.js'
import '../../styles/customer-flow.css'
import './IdentificarPedido.css'

export default function IdentificarPedido() {
  const navigate = useNavigate()
  const table = new URLSearchParams(window.location.search).get('mesa') || ''
  const { ready, error: tableError, loading: tableLoading } = useTableContext(table)
  const cart = loadCart()
  const { products, loading, error: catalogError } = useCustomerCatalog()
  const items = useMemo(() => cartItems(products, cart), [products, cart])
  const total = cartTotal(items)
  const [whatsAppAvailable, setWhatsAppAvailable] = useState(false)
  const [availabilityLoading, setAvailabilityLoading] = useState(true)
  const [form, setForm] = useState(() => {
    const previous = loadQuickIdentity(table)
    const account = readCustomerSession()
    return {
      name: previous?.name || account?.customer?.nomeUsuario || '',
      phone: previous?.phone || '',
      whatsapp: previous?.whatsapp || false,
    }
  })
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    api.get('/api/whatsapp/status')
      .then(({ data }) => {
        if (active) setWhatsAppAvailable(data?.available === true)
      })
      .catch(() => { if (active) setWhatsAppAvailable(false) })
      .finally(() => { if (active) setAvailabilityLoading(false) })
    return () => { active = false }
  }, [])

  const update = event => {
    const { name, type, checked, value } = event.target
    setForm(current => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
    setError('')
  }

  const next = event => {
    event.preventDefault()
    const { error: validationError, value } = validateQuickIdentity(form, whatsAppAvailable)
    if (validationError) { setError(validationError); return }
    try {
      saveQuickIdentity(table, value)
      navigate(`/confirmar-pedido?mesa=${encodeURIComponent(table)}`)
    } catch (failure) {
      setError(failure.message || 'Não foi possível continuar. Escaneie o QR Code da mesa.')
    }
  }

  if (!items.length && !loading) {
    return (
      <main className="customer-flow-page">
        <div className="customer-flow-shell customer-identify">
          <h1>Seu carrinho está vazio.</h1>
          <button className="th-btn th-btn--primary" type="button"
            onClick={() => navigate(`/menu?mesa=${encodeURIComponent(table)}`)}>
            Voltar ao cardápio
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="customer-flow-page">
      <div className="customer-flow-shell customer-identify">
        <header className="customer-flow-topbar">
          <div className="customer-flow-brand">TableHub</div>
          <div className="customer-flow-topbar__actions">
            <div className="customer-flow-table">MESA {table}</div>
            <ThemeToggle compact />
          </div>
        </header>
        <section className="customer-flow-head">
          <span>UM ÚLTIMO PASSO</span>
          <h1>Como podemos chamar você?</h1>
          <p>Não precisa criar conta. Assim a cozinha e o garçom saberão a quem entregar o pedido.</p>
        </section>

        <form className="customer-flow-card customer-identify__form" onSubmit={next}>
          <label className="customer-identify__field" htmlFor="customer-quick-name">
            <strong>Seu nome <span aria-hidden="true">*</span></strong>
            <input id="customer-quick-name" name="name" autoComplete="given-name"
              autoFocus maxLength={80} minLength={2} required
              value={form.name} onChange={update} placeholder="Ex.: Lucas" />
          </label>

          <label className="customer-identify__field" htmlFor="customer-quick-phone">
            <strong>WhatsApp / telefone <small>(opcional)</small></strong>
            <input id="customer-quick-phone" name="phone" type="tel" inputMode="tel"
              autoComplete="tel" maxLength={20} value={form.phone} onChange={update}
              placeholder="(11) 99999-9999" />
          </label>

          <div className="customer-identify__whatsapp">
            <FiMessageCircle aria-hidden="true" />
            <div>
              <strong>Deseja receber atualizações do seu pedido?</strong>
              <p>{availabilityLoading
                ? 'Conferindo disponibilidade de mensagens...'
                : whatsAppAvailable
                  ? 'Avisaremos sobre o preparo, quando estiver pronto e a entrega.'
                  : 'WhatsApp não está habilitado neste restaurante. O pedido pode ser acompanhado pelo site.'}</p>
              <label className="customer-identify__consent">
                <input type="checkbox" name="whatsapp" checked={Boolean(form.whatsapp && whatsAppAvailable)}
                  disabled={!whatsAppAvailable || availabilityLoading}
                  onChange={update} />
                <span>Autorizo receber mensagens sobre este pedido pelo WhatsApp. Posso cancelar depois.</span>
              </label>
              <small>Não enviamos propaganda. O número só será enviado ao servidor se você autorizar.</small>
            </div>
          </div>

          <div className="customer-summary-row">
            <span>{items.reduce((sum, item) => sum + item.quantity, 0)} itens</span>
            <strong>{money(total)}</strong>
          </div>

          {tableLoading && <p role="status">Validando a mesa...</p>}
          {loading && <p role="status">Conferindo o cardápio...</p>}
          {(error || tableError || catalogError) && (
            <p className="customer-flow-error" role="alert">{error || tableError || catalogError}</p>
          )}
          <button className="th-btn th-btn--primary th-btn--block" type="submit"
            disabled={!ready || tableLoading || loading || !!catalogError || availabilityLoading}>
            Revisar e enviar pedido <FiArrowRight aria-hidden="true" />
          </button>
          <button className="th-btn th-btn--glass th-btn--block" type="button"
            onClick={() => navigate(`/carrinho?mesa=${encodeURIComponent(table)}`)}>
            <FiArrowLeft aria-hidden="true" /> Voltar ao carrinho
          </button>
        </form>
      </div>
    </main>
  )
}
