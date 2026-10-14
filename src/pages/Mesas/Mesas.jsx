import { useEffect, useMemo, useState } from 'react'
import { FiCopy, FiLink, FiPlus, FiRefreshCw, FiX } from 'react-icons/fi'
import { QRCodeSVG } from 'qrcode.react'
import ManagementSidebar from '../../components/layout/ManagementSidebar.jsx'
import api from '../../services/api.js'
import { useAuth } from '../../components/auth/AuthProvider.jsx'
import { isLocalQrUrl, tableQrUrl } from '../../services/tableQr.js'
import '../../styles/management.css'
import './Mesas.css'

const filters = ['Todas', 'Livre', 'Ocupada']

function TableQr({ number, url, size = 280 }) {
  return (
    <div className="table-qr" aria-label={`QR Code da mesa ${Number(number)}`}>
      <QRCodeSVG
        value={url}
        size={size}
        level="M"
        bgColor="#ffffff"
        fgColor="#101826"
        marginSize={4}
      />
    </div>
  )
}

export default function Mesas() {
  const { user } = useAuth()
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('Todas')
  const [selectedNumber, setSelectedNumber] = useState(null)
  const [copied, setCopied] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [qrUrl, setQrUrl] = useState('')
  const [qrLoading, setQrLoading] = useState(false)
  const [qrError, setQrError] = useState('')
  const [creating, setCreating] = useState(false)
  const [number, setNumber] = useState('')
  const [saving, setSaving] = useState(false)
  const [createError, setCreateError] = useState('')

  useEffect(() => {
    let active = true
    let version = 0
    let timer
    let controller
    const load = async () => {
      if (document.hidden) return
      const requestVersion = ++version
      controller = new AbortController()
      try {
        const { data } = await api.get('/api/mesas/painel', { signal: controller.signal })
        if (!active || requestVersion !== version) return
        setTables((Array.isArray(data) ? data : []).map((table) => ({
          ...table, number: String(table.number).padStart(2, '0'),
          status: ['Livre', 'Ocupada'].includes(table.status) ? table.status : 'Não atualizado',
          orders: Array.isArray(table.orders) ? table.orders : [],
        })))
        setError('')
      } catch (requestError) {
        if (active && requestVersion === version && !controller.signal.aborted) setError(requestError?.response?.data?.message || 'Não foi possível atualizar as mesas. As informações anteriores podem estar desatualizadas.')
      } finally {
        if (active && requestVersion === version) { setLoading(false); if (!document.hidden) timer = window.setTimeout(load, 5000) }
      }
    }
    setLoading(true)
    const visible = () => {
      window.clearTimeout(timer)
      version++
      if (document.hidden) controller?.abort()
      else { controller?.abort(); timer = window.setTimeout(load, 0) }
    }
    load()
    document.addEventListener('visibilitychange', visible)
    return () => { active = false; version++; controller?.abort(); window.clearTimeout(timer); document.removeEventListener('visibilitychange', visible) }
  }, [reloadKey])

  const selectedTable = tables.find((table) => table.number === selectedNumber)
  useEffect(() => {
    if (!selectedTable) { setQrUrl(''); return undefined }
    const controller = new AbortController()
    let active = true
    setQrUrl('')
    setCopied(false)
    setQrError('')
    setQrLoading(true)
    api.get(`/api/mesas/${selectedTable.id}/qr`, { signal: controller.signal })
      .then(({ data }) => {
        if (active) setQrUrl(tableQrUrl(data.mesa.number, data.qrToken, import.meta.env.VITE_PUBLIC_URL || window.location.origin))
      })
      .catch((requestError) => {
        if (active && !controller.signal.aborted) setQrError(requestError?.response?.data?.message || requestError?.message || 'Não foi possível gerar o QR Code.')
      })
      .finally(() => { if (active) setQrLoading(false) })
    return () => { active = false; controller.abort() }
  }, [selectedTable?.id, selectedTable?.number])

  useEffect(() => {
    if (!selectedTable && !creating) return undefined
    const previous = document.activeElement
    const dialog = document.querySelector('.table-modal')
    dialog?.querySelector('input,button')?.focus()
    const keydown = (event) => {
      if (event.key === 'Escape' && !saving) { setSelectedNumber(null); setCreating(false) }
      if (event.key !== 'Tab') return
      const controls = [...(dialog?.querySelectorAll('button:not(:disabled),input:not(:disabled),a[href]') || [])]
      if (!controls.length) return
      const first = controls[0]
      const last = controls.at(-1)
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', keydown)
    return () => { document.removeEventListener('keydown', keydown); previous?.focus() }
  }, [!!selectedTable, creating, saving])

  const visibleTables = useMemo(
    () => tables.filter((table) => filter === 'Todas' || table.status === filter),
    [tables, filter],
  )

  const counts = {
    total: tables.length,
    free: tables.filter((table) => table.status === 'Livre').length,
    occupied: tables.filter((table) => table.status === 'Ocupada').length,
    orders: tables.reduce((sum, table) => sum + table.orders.length, 0),
  }

  const copyQrLink = async () => {
    if (!selectedTable || !qrUrl) return

    try {
      await navigator.clipboard.writeText(qrUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
      setQrError('Não foi possível copiar automaticamente. Selecione e copie o link abaixo.')
    }
  }

  const createTable = async (event) => {
    event.preventDefault()
    if (saving) return
    const parsed = Number(number)
    if (!/^\d{1,4}$/.test(number.trim()) || parsed < 1 || parsed > 9999) { setCreateError('Informe um número inteiro de 1 a 9999.'); return }
    setSaving(true)
    setCreateError('')
    try {
      await api.post('/api/mesas', { number: parsed })
      setCreating(false)
      setNumber('')
      setReloadKey((current) => current + 1)
    } catch (requestError) {
      setCreateError(requestError?.response?.data?.message || 'Não foi possível cadastrar esta mesa. Confira se o número já existe.')
    } finally { setSaving(false) }
  }

  return (
    <main className="management-page tables-page">
      <ManagementSidebar />

      <section className="management-content">
        <header className="management-header">
          <div>
            <span className="management-eyebrow">SALÃO</span>
            <h1>Mesas & QR Code</h1>
            <p>Visualize ocupação, pedidos ativos e acesso ao cardápio por QR.</p>
          </div>

          <div className="tables-header-actions">
            <button className="th-btn th-btn--glass" type="button" onClick={() => setReloadKey((current) => current + 1)} disabled={loading}><FiRefreshCw /> Atualizar</button>
            {user?.role === 'ADMINISTRADOR' && <button className="th-btn th-btn--primary" type="button" onClick={() => { setCreating(true); setCreateError('') }}><FiPlus /> Nova mesa</button>}
          </div>
        </header>

        {error && <div className="orders-alert" role="alert">{error}</div>}
        <p className="tables-policy">Ocupada enquanto há pedido não entregue ou pagamento simulado pendente. Esta situação operacional não representa presença física ou reserva.</p>

        <section className="table-summary-grid">
          <article><span>Total</span><strong>{counts.total}</strong></article>
          <article><span>Livres</span><strong>{counts.free}</strong></article>
          <article><span>Ocupadas</span><strong>{counts.occupied}</strong></article>
          <article><span>Pedidos em aberto</span><strong>{counts.orders}</strong></article>
        </section>

        <div className="table-filter">
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

        <section className="table-management-grid">
          {loading && <div className="management-empty">Carregando mesas...</div>}
          {!loading && visibleTables.map((table) => (
            <article className={`table-management-card table-management-card--${table.status.toLowerCase()}`} key={table.number}>
              <div className="table-management-card__top">
                <div>
                  <small>MESA</small>
                  <strong>{table.number}</strong>
                </div>
                <FiLink aria-label="Abrir QR Code em Gerenciar mesa" />
              </div>

              <span className={`table-state table-state--${table.status.toLowerCase()}`}>
                {table.status}
              </span>

              <p>{table.orders.length ? table.orders.map((order) => `#${order.id} · ${order.status}`).join(' | ') : 'Nenhum pedido em aberto'}</p>

              <button type="button" onClick={() => setSelectedNumber(table.number)}>
                Gerenciar mesa
              </button>
            </article>
          ))}
          {!loading && visibleTables.length === 0 && <div className="management-empty">Nenhuma mesa encontrada neste filtro.</div>}
        </section>
      </section>

      {selectedTable && (
        <div className="table-modal-backdrop" onClick={() => setSelectedNumber(null)}>
          <section className="table-modal" role="dialog" aria-modal="true" aria-labelledby="table-qr-title" onClick={(event) => event.stopPropagation()}>
            <button className="table-modal__close" type="button" aria-label="Fechar mesa" onClick={() => setSelectedNumber(null)}>
              <FiX />
            </button>

            <span className="management-eyebrow">MESA {selectedTable.number}</span>
            <h2 id="table-qr-title">Gerenciar mesa</h2>
            <p className="table-modal__sub">
              QR assinado para abrir o cardápio e autorizar pedidos desta mesa. Substitua os QR Codes antigos.
            </p>

            {qrLoading && <p role="status">Gerando QR Code...</p>}
            {qrError && <p className="orders-alert" role="alert">{qrError}</p>}
            {qrUrl && <div className="table-modal__qr"><TableQr number={selectedTable.number} url={qrUrl} /></div>}
            {qrUrl && isLocalQrUrl(qrUrl) && <p role="alert">Este endereço é local. Para usar o QR em um telefone, abra o painel pelo endereço acessível ao telefone ou configure VITE_PUBLIC_URL antes do build.</p>}
            {qrUrl && <label className="table-qr-link">Link do QR<input value={qrUrl} readOnly aria-label="Link do QR Code" onFocus={(event) => event.target.select()} /></label>}

            <button className="th-btn th-btn--glass th-btn--block" type="button" onClick={copyQrLink} disabled={!qrUrl}>
              {copied ? 'Link copiado' : <><FiCopy /> Copiar link do QR</>}
            </button>

            <div className="table-modal__status">
              <span>Status atual</span>
              <div>
                <button type="button" className="is-active">
                  {selectedTable.status}
                </button>
              </div>
            </div>

            <div className="table-modal__order">
              <FiLink />
              <div>
                <small>Pedido associado</small>
                <strong>{selectedTable.orders.length ? selectedTable.orders.map((order) => `#${order.id} · ${order.status}${order.paid ? ' · simulação paga' : ' · pagamento pendente'}`).join(' | ') : 'Nenhum pedido em aberto'}</strong>
              </div>
            </div>
          </section>
        </div>
      )}
      {creating && (
        <div className="table-modal-backdrop" onClick={() => { if (!saving) setCreating(false) }}>
          <section className="table-modal" role="dialog" aria-modal="true" aria-labelledby="table-create-title" onClick={(event) => event.stopPropagation()}>
            <button className="table-modal__close" type="button" aria-label="Fechar cadastro" disabled={saving} onClick={() => setCreating(false)}><FiX /></button>
            <h2 id="table-create-title">Nova mesa</h2>
            <p>O QR Code é gerado pelo sistema após o cadastro.</p>
            <form className="table-create-form" onSubmit={createTable}>
              <label>Número da mesa<input type="number" min="1" max="9999" step="1" required value={number} disabled={saving} onChange={(event) => setNumber(event.target.value)} /></label>
              {createError && <p className="orders-alert" role="alert">{createError}</p>}
              <button className="th-btn th-btn--primary" type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Cadastrar mesa'}</button>
            </form>
          </section>
        </div>
      )}
    </main>
  )
}
