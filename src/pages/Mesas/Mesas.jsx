import { useMemo, useState } from 'react'
import { FiCopy, FiPlus, FiQrCode, FiX } from 'react-icons/fi'
import ManagementSidebar from '../../components/layout/ManagementSidebar.jsx'
import '../../styles/management.css'
import './Mesas.css'

const initialTables = [
  { number: '01', status: 'Livre', order: null },
  { number: '02', status: 'Ocupada', order: '#1026' },
  { number: '03', status: 'Ocupada', order: '#1023' },
  { number: '04', status: 'Ocupada', order: '#1028' },
  { number: '05', status: 'Livre', order: null },
  { number: '06', status: 'Reservada', order: '13:30' },
  { number: '07', status: 'Livre', order: null },
  { number: '08', status: 'Ocupada', order: '#1022' },
  { number: '09', status: 'Ocupada', order: '#1027' },
  { number: '10', status: 'Livre', order: null },
  { number: '11', status: 'Ocupada', order: '#1025' },
  { number: '12', status: 'Livre', order: null },
]

const filters = ['Todas', 'Livre', 'Ocupada', 'Reservada']

function FakeQr() {
  return (
    <div className="table-qr" aria-label="Prévia do QR Code">
      {Array.from({ length: 25 }).map((_, index) => (
        <span key={index} className={[1, 3, 5, 7, 9, 13, 17, 19, 21, 23].includes(index) ? 'is-green' : ''} />
      ))}
    </div>
  )
}

export default function Mesas() {
  const [tables, setTables] = useState(initialTables)
  const [filter, setFilter] = useState('Todas')
  const [selectedNumber, setSelectedNumber] = useState(null)
  const [copied, setCopied] = useState(false)

  const selectedTable = tables.find((table) => table.number === selectedNumber)

  const visibleTables = useMemo(
    () => tables.filter((table) => filter === 'Todas' || table.status === filter),
    [tables, filter],
  )

  const counts = {
    total: tables.length,
    free: tables.filter((table) => table.status === 'Livre').length,
    occupied: tables.filter((table) => table.status === 'Ocupada').length,
    reserved: tables.filter((table) => table.status === 'Reservada').length,
  }

  const setTableStatus = (number, status) => {
    setTables((current) =>
      current.map((table) =>
        table.number === number
          ? { ...table, status, order: status === 'Livre' ? null : table.order }
          : table,
      ),
    )
  }

  const copyQrLink = async () => {
    if (!selectedTable) return
    const url = `${window.location.origin}/cardapio?mesa=${selectedTable.number}`

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

          <button className="th-btn th-btn--primary" type="button">
            <FiPlus /> Nova mesa
          </button>
        </header>

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
          {visibleTables.map((table) => (
            <article className={`table-management-card table-management-card--${table.status.toLowerCase()}`} key={table.number}>
              <div className="table-management-card__top">
                <div>
                  <small>MESA</small>
                  <strong>{table.number}</strong>
                </div>
                <FakeQr />
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
              <FakeQr />
            </div>

            <button className="th-btn th-btn--glass th-btn--block" type="button" onClick={copyQrLink}>
              {copied ? 'Link copiado' : <><FiCopy /> Copiar link do QR</>}
            </button>

            <div className="table-modal__status">
              <span>Status da mesa</span>
              <div>
                {['Livre', 'Ocupada', 'Reservada'].map((status) => (
                  <button
                    key={status}
                    type="button"
                    className={selectedTable.status === status ? 'is-active' : ''}
                    onClick={() => setTableStatus(selectedTable.number, status)}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <div className="table-modal__order">
              <FiQrCode />
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
