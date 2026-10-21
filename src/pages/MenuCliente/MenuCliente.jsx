import { useEffect, useMemo, useState } from 'react'
import { FiMinus, FiPlus, FiShoppingBag } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import ThemeToggle from '../../components/layout/ThemeToggle.jsx'
import { money } from '../../data/customerMenu.js'
import useCustomerCatalog from '../../hooks/useCustomerCatalog.js'
import useTableContext from '../../hooks/useTableContext.js'
import { loadCart, saveCart } from '../../utils/customerSession.js'
import { CUSTOMER_CHANGED_EVENT, readCustomerSession } from '../../services/customerSession.js'
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
  useEffect(() => {
    const refresh = () => setCustomerSession(readCustomerSession())
    window.addEventListener(CUSTOMER_CHANGED_EVENT, refresh)
    return () => window.removeEventListener(CUSTOMER_CHANGED_EVENT, refresh)
  }, [])
  const menuReturn = `/menu?mesa=${encodeURIComponent(table || '')}`
  const enterClient = () => navigate('/login-cliente', { state: { from: menuReturn } })
  const signUpClient = () => navigate('/cadastro-cliente', { state: { from: menuReturn } })
  const [filter, setFilter] = useState('Todos')
  const [cart, setCart] = useState(() => loadCart())
  const { products, loading, error: catalogError } = useCustomerCatalog()
  const categories = useMemo(() => ['Todos', ...new Set(products.map((product) => product.category))], [products])

  const visible = useMemo(
    () => products.filter((product) => filter === 'Todos' || product.category === filter),
    [products, filter],
  )

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
    if (!ready || !product?.available || loading || catalogError) return

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
          <div className="customer-menu-table">{table ? `MESA ${table}` : 'CARDÁPIO'}</div>
          <ThemeToggle compact />
          {customerSession ? <span className="customer-menu-account">Olá, {customerSession.customer.nomeUsuario}</span>
            : <button className="customer-menu-auth-button" type="button" onClick={enterClient}>Entrar</button>}
        </div>
      </header>

      <section className="customer-menu-hero">
        <div>
          <span>CARDÁPIO DIGITAL</span>
          <h1>Escolha seus itens.</h1>
          <p>{ready
            ? customerSession
              ? `Sua mesa ${table} está pronta para receber pedidos.`
              : 'Veja os pratos e preços. Para adicionar produtos ao carrinho, entre ou crie uma conta com PIN.'
            : 'Consulte a vitrine. Para pedir, leia o QR Code da mesa e acesse uma conta de cliente.'}</p>
        </div>
      </section>

      <section className="customer-menu-content">
        {tableLoading && <p role="status">Validando a mesa...</p>}
        {tableError && <div className="customer-flow-error" role="alert">{tableError}</div>}
        {!tableLoading && !ready && !tableError && <p role="status">Escaneie o QR Code atualizado da mesa para pedir ou chamar a equipe.</p>}
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
        {ready && <button className="th-btn th-btn--glass" type="button" onClick={() => navigate(`/chamar-garcom?mesa=${table}`)}>Chamar garçom</button>}
        {catalogError && (
          <div className="customer-flow-error" role="alert">
            {catalogError}
          </div>
        )}

        {loading && <p role="status">Atualizando cardápio...</p>}
        <div className="customer-menu-tabs">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={filter === category ? 'is-active' : ''}
              onClick={() => setFilter(category)}
            >
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
                  <img
                    src={product.image}
                    alt={product.name}
                    loading="lazy"
                    style={{
                      objectFit: product.imageFit || 'cover',
                      objectPosition: 'center',
                    }}
                  />
                </div>

                <small>{product.category.toUpperCase()}</small>
                <h2>{product.name}</h2>
                <strong>{money(product.price)}</strong>

                <div className="customer-product-card__action">
                  {!product.available ? (
                    <span className="customer-product-unavailable">Esgotado</span>
                  ) : !customerSession ? (
                    <button type="button" onClick={enterClient} disabled={!ready || loading || !!catalogError}>
                      Entrar para pedir
                    </button>
                  ) : qty === 0 ? (
                    <button type="button" onClick={() => add(product.id)} disabled={!ready || loading || !!catalogError}>
                      Adicionar
                    </button>
                  ) : (
                    <div className="customer-quantity">
                      <button type="button" onClick={() => remove(product.id)} aria-label={`Remover uma unidade de ${product.name}`}>
                        <FiMinus />
                      </button>
                      <span>{qty}</span>
                      <button type="button" onClick={() => add(product.id)} disabled={!ready} aria-label={`Adicionar uma unidade de ${product.name}`}>
                        <FiPlus />
                      </button>
                    </div>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      </section>

      {customerSession && itemCount > 0 && (
        <button
          className="customer-cart-bar"
          type="button"
          disabled={!ready}
          onClick={() => navigate(`/carrinho?mesa=${table}`)}
        >
          <FiShoppingBag />
          <span>{itemCount} {itemCount === 1 ? 'item' : 'itens'}</span>
          <strong>{money(total)}</strong>
        </button>
      )}
    </main>
  )
}
