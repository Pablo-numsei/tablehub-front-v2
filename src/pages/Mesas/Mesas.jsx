import { useEffect, useMemo, useState } from 'react'
import { FiCopy, FiLink, FiPlus, FiX } from 'react-icons/fi'
import { QRCodeSVG } from 'qrcode.react'
import ManagementSidebar from '../../components/layout/ManagementSidebar.jsx'
import api from '../../services/api.js'
import '../../styles/management.css'
import './Mesas.css'

const filters = ['Todas', 'Livre', 'Ocupada']

const menuUrlForTable = (number) =>
  `${window.location.origin}/menu?mesa=${Number(number)}`

function TableQr({ number, size = 150 }) {
  return (
    <div className="table-qr" aria-label={`QR Code da mesa ${Number(number)}`}>
      <QRCodeSVG
        value={menuUrlForTable(number)}
        size={size}
        level="M"
        bgColor="#ffffff"
        fgColor="#101826"
      />
    </div>
  )
}

export default function Mesas() {
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('Todas')
  const [selectedNumber, setSelectedNumber] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    Promise.all([
      api.get('/api/mesas'),
      api.get('/api/dashboard/resumo'),
    ])
      .then(([tablesResponse, dashboardResponse]) => {
        const statusByNumber = new Map(
          (dashboardResponse.data?.mesas || []).map((item) => [
            Number(item.numero),
            item.status,
          ]),
        )

        setTables(
          (Array.isArray(tablesResponse.data) ? tablesResponse.data : [])
            .filter((table) => table.active !== false)
            .map((table) => ({
              id: table.id,
              number: String(table.number).padStart(2, '0'),
              status: statusByNumber.get(Number(table.number)) || 'Livre',
              qrCode: table.qrCode,
              order: null,
            })),
        )
        setError('')
      })
      .catch(() => setError('Não foi possível carregar as mesas do backend.'))
      .finally(() => setLoading(false))
  }, [])

  const selectedTable = tables.find((table) => table.number === selectedNumber)

  const visibleTables = useMemo(
    () => tables.filter((table) => filter === 'Todas' || table.status === filter),
    [tables, filter],
  )

  const counts = {
    total: tables.length,
    free: tables.filter((table) => table.status === 'Livre').length,
    occupied: tables.filter((table) => table.status === 'Ocupada').length,
    reserved: 0,
  }

  const copyQrLink = async () => {
    if (!selectedTable) return
    const url = menuUrlForTable(selectedTable.number)

    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
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

          <button className="th-btn th-btn--primary" type="button" disabled title="Cadastro será habilitado quando o formulário estiver conectado">
            <FiPlus /> Nova mesa
          </button>
        </header>

        {error && <div className="orders-alert" role="alert">{error}</div>}

        <section className="table-summary-grid">
          <article><span>Total</span><strong>{counts.total}</strong></article>
          <article><span>Livres</span><strong>{counts.free}</strong></article>
          <article><span>Ocupadas</span><strong>{counts.occupied}</strong></article>
          <article><span>Reservadas</span><strong>{counts.reserved}</strong></article>
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
                <TableQr number={table.number} size={46} />
              </div>

              <span className={`table-state table-state--${table.status.toLowerCase()}`}>
                {table.status}
              </span>

              <p>{table.order || 'Nenhum pedido ativo'}</p>

              <button type="button" onClick={() => setSelectedNumber(table.number)}>
                Gerenciar mesa
              </button>
            </article>
          ))}
        </section>
      </section>

      {selectedTable && (
        <div className="table-modal-backdrop" onClick={() => setSelectedNumber(null)}>
          <section className="table-modal" onClick={(event) => event.stopPropagation()}>
            <button className="table-modal__close" type="button" onClick={() => setSelectedNumber(null)}>
              <FiX />
            </button>

            <span className="management-eyebrow">MESA {selectedTable.number}</span>
            <h2>Gerenciar mesa</h2>
            <p className="table-modal__sub">
              QR exclusivo para abrir o cardápio vinculado a esta mesa.
            </p>

            <div className="table-modal__qr">
              <TableQr number={selectedTable.number} size={150} />
            </div>

            <button className="th-btn th-btn--glass th-btn--block" type="button" onClick={copyQrLink}>
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
                <strong>{selectedTable.order || 'Nenhum pedido ativo'}</strong>
              </div>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
