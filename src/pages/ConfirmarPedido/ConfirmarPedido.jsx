import { useMemo, useState } from 'react'
import { FiArrowLeft, FiCheck } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import ThemeToggle from '../../components/layout/ThemeToggle.jsx'
import { money } from '../../data/customerMenu.js'
import useCustomerCatalog from '../../hooks/useCustomerCatalog.js'
import { mapCustomerCatalog, saveCatalog, cartItems, cartTotal } from '../../services/customerCatalog.js'
import api from '../../services/api.js'
import {
  clearCart,
  loadCart,
  saveCustomerOrderFromApi,
} from '../../utils/customerSession.js'
import '../../styles/customer-flow.css'

export default function ConfirmarPedido() {
  const navigate = useNavigate()
  const params = new URLSearchParams(window.location.search)
  const table = params.get('mesa') || '04'
  const cart = loadCart()
  const { products, loading: catalogLoading, error: catalogError, setProducts } = useCustomerCatalog()
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const items = useMemo(() => cartItems(products, cart), [products, cart])
  const total = cartTotal(items)

  const confirmOrder = async () => {
    if (items.length === 0 || submitting || catalogLoading || catalogError) return

    setSubmitting(true)
    setError('')

    try {
      const tableNumber = Number(table)

      if (!Number.isInteger(tableNumber) || tableNumber <= 0) {
        throw new Error('Número da mesa inválido.')
      }

      const [tablesResponse, productsResponse] = await Promise.all([
        api.get('/api/mesas'),
        api.get('/api/v1/produtos'),
      ])

      const tables = Array.isArray(tablesResponse.data)
        ? tablesResponse.data
        : []
      const backendProducts = Array.isArray(productsResponse.data)
        ? productsResponse.data
        : []

      const mesa = tables.find(
        (current) =>
          Number(current.number) === tableNumber &&
          current.active !== false,
      )

      if (!mesa) {
        throw new Error(
          `A mesa ${String(table).padStart(2, '0')} não está cadastrada ou está inativa no banco.`,
        )
      }

      const resolvedItems = items.map((item) => ({
        item,
        backendProduct: backendProducts.find(
          (product) =>
            product.id === item.id,
        ),
      }))

      const missingProducts = resolvedItems
        .filter(({ backendProduct }) => !backendProduct)
        .map(({ item }) => item.name)

      if (missingProducts.length > 0) {
        throw new Error(
          `Estes produtos ainda não estão cadastrados no banco: ${missingProducts.join(', ')}.`,
        )
      }

      const unavailableProducts = resolvedItems
        .filter(({ item, backendProduct }) => {
          const stock = Number(backendProduct.stockQuantity ?? 0)

          return (
            backendProduct.available === false ||
            stock < item.quantity
          )
        })
        .map(({ item }) => item.name)

      if (unavailableProducts.length > 0) {
        throw new Error(
          `Produto indisponível ou sem estoque suficiente: ${unavailableProducts.join(', ')}.`,
        )
      }

      const freshCatalog = mapCustomerCatalog(backendProducts)
      const repriced = cartItems(freshCatalog, cart)
      saveCatalog(freshCatalog)
      setProducts(freshCatalog)
      if (repriced.length !== items.length || repriced.some((item) => items.find((old) => old.id === item.id)?.price !== item.price)) {
        setError('O cardápio mudou. Confira os itens e o novo total antes de confirmar novamente.')
        return
      }

      const payload = {
        mesaId: mesa.id,
        criadoPor: null,
        itens: resolvedItems.map(({ item, backendProduct }) => ({
          produtoId: backendProduct.id,
          quantidade: item.quantity,
        })),
      }

      const { data: apiOrder } = await api.post('/api/pedidos', payload)

      const order = saveCustomerOrderFromApi({
        apiOrder,
        table: mesa.number,
        cart,
        note,
        catalog: freshCatalog,
      })

      clearCart()

      navigate(
        `/pedido-confirmado?id=${encodeURIComponent(order.id)}&mesa=${mesa.number}`,
        { replace: true },
      )
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Não foi possível enviar o pedido para a cozinha.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (items.length === 0) {
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

          <section className="customer-flow-head">
            <span>CONFIRMAÇÃO</span>
            <h1>Nenhum item para confirmar.</h1>
          </section>

          <div className="customer-flow-empty">
            <button
              className="th-btn th-btn--primary"
              type="button"
              onClick={() => navigate(`/menu?mesa=${table}`)}
            >
              Voltar ao cardápio
            </button>
          </div>
        </div>
      </main>
    )
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

        <section className="customer-flow-head">
          <span>CONFIRMAÇÃO</span>
          <h1>Confirme seu pedido.</h1>
          <p>Depois de confirmado, o pedido será enviado para a cozinha.</p>
        </section>

        <section className="customer-flow-grid">
          <div className="customer-flow-card">
            <span className="customer-flow-card__eyebrow">ITENS</span>

            <div className="customer-order-list">
              {items.map((item) => (
                <div key={item.id}>
                  <span>{item.quantity}x {item.name}</span>
                  <strong>{money(item.quantity * item.price)}</strong>
                </div>
              ))}
            </div>

            <label>
              <span className="customer-flow-card__eyebrow">OBSERVAÇÕES</span>
              <textarea
                className="customer-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Ex.: sem cebola, ponto da carne..."
                maxLength={255}
              />
              <small>Informe restrições de preparo diretamente à equipe; este campo fica salvo no seu dispositivo.</small>
            </label>
          </div>

          <aside className="customer-flow-card">
            <span className="customer-flow-card__eyebrow">MESA</span>
            <h2>{String(table).padStart(2, '0')}</h2>

            <div className="customer-summary-row">
              <span>Itens</span>
              <strong>{items.reduce((sum, item) => sum + item.quantity, 0)}</strong>
            </div>

            <div className="customer-summary-total">
              <span>Total</span>
              <strong>{money(total)}</strong>
            </div>

            {catalogLoading && <p role="status">Conferindo cardápio...</p>}
            {(error || catalogError) && (
              <div className="customer-flow-error" role="alert">
                {error || catalogError}
              </div>
            )}

            <div className="customer-flow-actions">
              <button
                className="th-btn th-btn--primary th-btn--block"
                type="button"
                onClick={confirmOrder}
                disabled={submitting || catalogLoading || !!catalogError}
              >
                <FiCheck />
                {submitting ? 'Enviando...' : 'Confirmar pedido'}
              </button>

              <button
                className="th-btn th-btn--glass th-btn--block"
                type="button"
                onClick={() => navigate(`/carrinho?mesa=${table}`)}
              >
                <FiArrowLeft /> Voltar ao carrinho
              </button>
            </div>
          </aside>
        </section>
      </div>
    </main>
  )
}
