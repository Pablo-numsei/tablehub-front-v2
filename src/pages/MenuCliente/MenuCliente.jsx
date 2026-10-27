import { useEffect, useMemo, useState } from 'react'
import { FiArrowRight, FiCamera, FiMinus, FiPlus, FiShoppingBag } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import ThemeToggle from '../../components/layout/ThemeToggle.jsx'
import TableQrScanner from '../../components/customer/TableQrScanner.jsx'
import { money } from '../../data/customerMenu.js'
import useCustomerCatalog from '../../hooks/useCustomerCatalog.js'
import useTableContext from '../../hooks/useTableContext.js'
import { loadCart, saveCart } from '../../utils/customerSession.js'
import { CUSTOMER_CHANGED_EVENT, clearCustomerAuthSession, clearCustomerPinVerification, clearCustomerSession, hasCustomerPinVerification, readCustomerSession } from '../../services/customerSession.js'
import api from '../../services/api.js'
import { saveTableContext } from '../../services/tableAccess.js'
import './MenuCliente.css'

export default function MenuCliente() {
  const navigate = useNavigate()
  const params = new URLSearchParams(window.location.search)
  const requestedTable = params.get('mesa') || ''
  const qr = params.get('qr')
  const { context, ready, loading: tableLoading, error: tableError } = useTableContext(requestedTable, qr)
  const table = context?.mesa.number || requestedTable

  useEffect(() => {
    if (qr && ready) navigate(`/menu?mesa=${context.mesa.number}`, { replace: true })
  }, [qr, ready, context, navigate])

  const [customerSession, setCustomerSession] = useState(readCustomerSession)
  const [pinVerifiedForTable, setPinVerifiedForTable] = useState(hasCustomerPinVerification)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [tablePickerOpen, setTablePickerOpen] = useState(false)
  const [tables, setTables] = useState([])
  const [tablePickerLoading, setTablePickerLoading] = useState(false)
  const [tableSubmitting, setTableSubmitting] = useState(false)
  const [selectedTableNumber, setSelectedTableNumber] = useState('')
  const [tablePickerError, setTablePickerError] = useState('')
  const needsTableSelection = Boolean(customerSession && pinVerifiedForTable && !ready && (!qr || tableError))

  useEffect(() => {
    const refresh = () => {
      setCustomerSession(readCustomerSession())
      setPinVerifiedForTable(hasCustomerPinVerification())
    }
    window.addEventListener(CUSTOMER_CHANGED_EVENT, refresh)
    return () => window.removeEventListener(CUSTOMER_CHANGED_EVENT, refresh)
  }, [])

  const menuReturn = table ? `/menu?mesa=${encodeURIComponent(table)}` : '/menu'
  const enterClient = () => navigate('/login-cliente', { state: { from: menuReturn } })
  const signUpClient = () => navigate('/cadastro-cliente', { state: { from: menuReturn } })

  const logoutClient = () => {
    const nomeUsuario = customerSession?.customer?.nomeUsuario || ''
    clearCustomerSession()
    setCart({})
    // A new login starts a new table-selection flow instead of reusing the previous table.
    navigate('/login-cliente', {
      replace: true,
      state: { from: '/menu', nomeUsuario },
    })
  }

  useEffect(() => {
    // A customer session without a successful PIN verification must never unlock
    // manual table selection, even when the URL contains a table number or QR.
    // Visitors without a session can still browse the public menu.
    if (!customerSession?.token || tableLoading || pinVerifiedForTable) return

    const nomeUsuario = customerSession.customer?.nomeUsuario || ''
    clearCustomerAuthSession()
    setCustomerSession(null)
    navigate('/login-cliente', {
      replace: true,
      state: { from: '/menu', nomeUsuario },
    })
  }, [
    customerSession?.token,
    customerSession?.customer?.nomeUsuario,
    tableLoading,
    ready,
    pinVerifiedForTable,
    menuReturn,
    navigate,
  ])

  useEffect(() => {
    if (!customerSession?.token || !ready || !pinVerifiedForTable) return
    clearCustomerPinVerification()
    setPinVerifiedForTable(false)
  }, [customerSession?.token, ready, pinVerifiedForTable])

  const [filter, setFilter] = useState('Todos')
  const [cart, setCart] = useState(() => loadCart())
  const { products, loading, error: catalogError } = useCustomerCatalog()
  const categories = useMemo(
    () => ['Todos', ...new Set(products.map((product) => product.category))],
    [products],
  )
  const visible = useMemo(
    () => products.filter((product) => filter === 'Todos' || product.category === filter),
    [products, filter],
  )

  const openTablePicker = async () => {
    if (!customerSession?.token || !pinVerifiedForTable) {
      enterClient()
      return
    }
    setTablePickerOpen(true)
    setTablePickerError('')
    if (tables.length > 0) return

    setTablePickerLoading(true)
    try {
      const { data } = await api.get('/api/mesas')
      const activeTables = (Array.isArray(data) ? data : [])
        .filter((item) => item && item.active !== false &&
          Number.isSafeInteger(Number(item.number)) && Number(item.number) > 0)
        .sort((a, b) => Number(a.number) - Number(b.number))

      setTables(activeTables)
      setSelectedTableNumber((current) => current || String(activeTables[0]?.number || ''))
      if (activeTables.length === 0) {
        setTablePickerError('Não há mesas ativas disponíveis no momento.')
      }
    } catch (failure) {
      setTablePickerError(
        failure?.response?.data?.message || 'Não foi possível carregar as mesas. Tente novamente.',
      )
    } finally {
      setTablePickerLoading(false)
    }
  }

  const chooseTable = async (event) => {
    event.preventDefault()
    if (!customerSession?.token || !pinVerifiedForTable || !selectedTableNumber || tableSubmitting) return

    setTableSubmitting(true)
    setTablePickerError('')
    try {
      const { data } = await api.post('/api/mesas/contexto-manual', {
        numeroMesa: Number(selectedTableNumber),
      }, {
        headers: { 'X-Customer-Token': customerSession.token },
      })
      const validatedContext = saveTableContext(data)
      setTablePickerOpen(false)
      navigate(`/menu?mesa=${validatedContext.mesa.number}`, { replace: true })
    } catch (failure) {
      setTablePickerError(
        failure?.response?.data?.message || 'Não foi possível selecionar essa mesa. Tente novamente.',
      )
    } finally {
      setTableSubmitting(false)
    }
  }

  const updateCart = (updater) => {
    setCart((current) => {
      const next = updater(current)
      saveCart(next)
      return next
    })
  }

  const add = (id) => {
    const product = products.find((item) => item.id === id)
    if (!customerSession) { enterClient(); return }
    if (!ready) {
      if (!pinVerifiedForTable) { enterClient(); return }
      openTablePicker()
      return
    }
    if (!product?.available || loading || catalogError) return

    updateCart((current) => ({
      ...current,
      [id]: Math.min((current[id] || 0) + 1, Math.min(product.stock, 100)),
    }))
  }

  const remove = (id) => {
    updateCart((current) => {
      const next = { ...current }
      const value = (next[id] || 0) - 1
      if (value <= 0) delete next[id]
      else next[id] = value
      return next
    })
  }

  const itemCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0)
  const total = products.reduce(
    (sum, product) => sum + product.price * (cart[product.id] || 0),
    0,
  )

  return (
    <main className="customer-menu-page">
      <header className="customer-menu-header">
        <div className="customer-menu-brand">
          <span className="customer-menu-brand__mark">T</span>
          <span>TableHub</span>
        </div>
        <div className="customer-menu-header__actions">
          <div className="customer-menu-table">
            {table ? `MESA ${table}` : customerSession ? 'SELECIONE A MESA' : 'CARDÁPIO'}
          </div>
          <ThemeToggle compact />
          {customerSession ? (
            <>
              <span className="customer-menu-account">Olá, {customerSession.customer.nomeUsuario}</span>
              <button className="customer-menu-auth-button" type="button" onClick={logoutClient}>Sair</button>
            </>
          ) : (
            <button className="customer-menu-auth-button" type="button" onClick={enterClient}>Entrar</button>
          )}
        </div>
      </header>

      <section className="customer-menu-hero">
        <div>
          <span>{needsTableSelection ? 'ACESSO DO CLIENTE' : 'CARDÁPIO DIGITAL'}</span>
          <h1>{needsTableSelection ? 'Escolha sua mesa.' : 'Escolha seus itens.'}</h1>
          <p>
            {needsTableSelection
              ? 'Sua conta está conectada. Selecione o número da mesa para abrir o cardápio e fazer seu pedido.'
              : ready
                ? customerSession
                  ? `Sua mesa ${table} está pronta para receber pedidos.`
                  : 'Veja os pratos e preços. Para adicionar produtos ao carrinho, entre ou crie uma conta com PIN.'
                : 'Consulte a vitrine. Para pedir, leia o QR Code da mesa e acesse uma conta de cliente.'}
          </p>
        </div>
      </section>

      <section className="customer-menu-content">
        {needsTableSelection ? (
          <section className="customer-table-gate" aria-labelledby="customer-table-gate-title">
            <div className="customer-table-gate__icon" aria-hidden="true">T</div>
            <span className="customer-table-gate__eyebrow">PRÓXIMA ETAPA</span>
            <h2 id="customer-table-gate-title">Acesse o cardápio da sua mesa</h2>
            <p>Não precisa escanear o QR Code agora. Toque em “Ver mesas”, escolha o número informado pela equipe e o cardápio será aberto para você.</p>
            {tableError && <div className="customer-flow-error" role="alert">{tableError}</div>}
            {!tablePickerOpen ? (
              <button className="th-btn th-btn--primary customer-table-gate__button" type="button" onClick={openTablePicker}>
                Ver mesas <FiArrowRight aria-hidden="true" />
              </button>
            ) : (
              <form className="customer-table-picker" onSubmit={chooseTable}>
                <label htmlFor="customer-table-number">Número da mesa</label>
                <select
                  id="customer-table-number"
                  required
                  value={selectedTableNumber}
                  onChange={(event) => setSelectedTableNumber(event.target.value)}
                  disabled={tablePickerLoading || tableSubmitting || tables.length === 0}
                >
                  <option value="" disabled>
                    {tablePickerLoading ? 'Carregando mesas...' : 'Selecione uma mesa'}
                  </option>
                  {tables.map((item) => (
                    <option key={item.id} value={item.number}>
                      Mesa {String(item.number).padStart(2, '0')}
                    </option>
                  ))}
                </select>
                {tablePickerLoading && <p role="status">Buscando mesas ativas...</p>}
                {tablePickerError && <div className="customer-flow-error" role="alert">{tablePickerError}</div>}
                <div className="customer-table-picker__actions">
                  <button className="th-btn th-btn--glass" type="button"
                    onClick={() => { setTablePickerOpen(false); setTablePickerError('') }}
                    disabled={tableSubmitting}>Voltar</button>
                  <button className="th-btn th-btn--primary" type="submit"
                    disabled={tablePickerLoading || tableSubmitting || !selectedTableNumber || tables.length === 0}>
                    {tableSubmitting ? 'Abrindo cardápio...' : 'Ir para o cardápio'}
                  </button>
                </div>
              </form>
            )}
          </section>
        ) : (
          <>
            {tableLoading && <p role="status">Validando a mesa...</p>}
            {tableError && <div className="customer-flow-error" role="alert">{tableError}</div>}
            {!ready && !tableLoading && (
              <div className="customer-menu-qr-notice" role="status">
                <div>
                  <strong>Falta validar o QR Code da mesa</strong>
                  <p>O cardápio está em modo vitrine. Entre com usuário e PIN e leia o QR Code da mesa para pedir.</p>
                  <small>No computador, você também pode abrir nesta aba o link do QR gerado em Gestão → Mesas → Gerenciar mesa.</small>
                </div>
                <button className="th-btn th-btn--primary" type="button" onClick={() => setScannerOpen(true)}>
                  <FiCamera aria-hidden="true" /> Ler QR da mesa
                </button>
              </div>
            )}
            {ready && !customerSession && (
              <div className="customer-menu-vitrine" role="note">
                <strong>Vitrine do cardápio</strong>
                <span>Para adicionar itens ao carrinho, identifique-se com usuário e PIN.</span>
                <div>
                  <button className="th-btn th-btn--primary" type="button" onClick={signUpClient}>Criar conta</button>
                  <button className="th-btn th-btn--glass" type="button" onClick={enterClient}>Já tenho conta</button>
                </div>
              </div>
            )}
            {ready && (
              <button className="th-btn th-btn--glass" type="button" onClick={() => navigate(`/chamar-garcom?mesa=${table}`)}>
                Chamar garçom
              </button>
            )}
            {catalogError && <div className="customer-flow-error" role="alert">{catalogError}</div>}
            {loading && <p role="status">Atualizando cardápio...</p>}
            <div className="customer-menu-tabs">
              {categories.map((category) => (
                <button key={category} type="button"
                  className={filter === category ? 'is-active' : ''}
                  onClick={() => setFilter(category)}>
                  {category}
                </button>
              ))}
            </div>
            <div className="customer-menu-grid">
              {visible.map((product) => {
                const qty = cart[product.id] || 0
                return (
                  <article className="customer-product-card" key={product.id}>
                    <div className="customer-product-card__image">
                      <img src={product.image} alt={product.name} loading="lazy"
                        style={{ objectFit: product.imageFit || 'cover', objectPosition: 'center' }} />
                    </div>
                    <small>{product.category.toUpperCase()}</small>
                    <h2>{product.name}</h2>
                    <strong>{money(product.price)}</strong>
                    <div className="customer-product-card__action">
                      {!product.available ? (
                        <span className="customer-product-unavailable">Esgotado</span>
                      ) : !customerSession ? (
                        <button type="button" onClick={enterClient} disabled={loading || !!catalogError}>Entrar para pedir</button>
                      ) : qty === 0 ? (
                        <button type="button" onClick={() => add(product.id)} disabled={loading || !!catalogError}>Adicionar</button>
                      ) : (
                        <div className="customer-quantity">
                          <button type="button" onClick={() => remove(product.id)} aria-label={`Remover uma unidade de ${product.name}`}><FiMinus /></button>
                          <span>{qty}</span>
                          <button type="button" onClick={() => add(product.id)} disabled={loading || !!catalogError} aria-label={`Adicionar uma unidade de ${product.name}`}><FiPlus /></button>
                        </div>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          </>
        )}
      </section>

      {customerSession && ready && itemCount > 0 && (
        <button className="customer-cart-bar" type="button" disabled={!ready}
          onClick={() => navigate(`/carrinho?mesa=${table}`)}>
          <FiShoppingBag />
          <span>{itemCount} {itemCount === 1 ? 'item' : 'itens'}</span>
          <strong>{money(total)}</strong>
        </button>
      )}

      {scannerOpen && (
        <TableQrScanner onClose={() => setScannerOpen(false)} onDetected={route => {
          setScannerOpen(false)
          navigate(route)
        }} />
      )}
    </main>
  )
}
