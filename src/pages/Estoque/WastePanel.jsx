import { useEffect, useMemo, useRef, useState } from 'react'
import { FiAlertTriangle, FiClipboard, FiPlus, FiRefreshCw, FiTrash2, FiX } from 'react-icons/fi'
import api from '../../services/api.js'
import './WastePanel.css'
const MOTIVOS = {
  VENCIMENTO: 'Vencimento informado',
  DANIFICADO: 'Produto danificado',
  PREPARO: 'Erro de preparo',
  OUTRO: 'Outro motivo',
}
const moeda = (value) =>
  Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const dataLocal = (value) => {
  if (!value) return '—'
  const date = new Date(/[zZ]$|[+-]\d{2}:?\d{2}$/.test(value) ? value : value + 'Z')
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}
export default function WastePanel({ inventory, onStockChanged }) {
  const [registros, setRegistros] = useState([])
  const [resumo, setResumo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState('')
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [productId, setProductId] = useState('')
  const [qty, setQty] = useState('1')
  const [reason, setReason] = useState('DANIFICADO')
  const [observation, setObservation] = useState('')
  const [cost, setCost] = useState('')
  const modalRef = useRef(null)
  const openButtonRef = useRef(null)
  const selected = useMemo(
    () => inventory.find((item) => String(item.id) === productId),
    [inventory, productId],
  )
  const refreshHistory = async () => {
    setLoading(true)
    try {
      const [items, aggregate] = await Promise.all([
        api.get('/api/desperdicios'),
        api.get('/api/desperdicios/resumo'),
      ])
      setRegistros(Array.isArray(items.data) ? items.data : [])
      setResumo(aggregate.data)
      setListError('')
    } catch (error) {
      setListError(error?.response?.data?.message || 'Não foi possível consultar o histórico de descartes.')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { refreshHistory() }, [])
  useEffect(() => {
    if (!modalOpen) return undefined
    const previousFocus = document.activeElement
    modalRef.current?.querySelector('select')?.focus()
    const handleKeys = (event) => {
      if (event.key === 'Escape' && !saving) {
        setModalOpen(false)
      }
      if (event.key !== 'Tab') return
      const controls = [...(modalRef.current?.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled)') || [])]
      if (!controls.length) return
      if (event.shiftKey && document.activeElement === controls[0]) {
        event.preventDefault()
        controls[controls.length - 1].focus()
      } else if (!event.shiftKey && document.activeElement === controls[controls.length - 1]) {
        event.preventDefault()
        controls[0].focus()
      }
    }
    document.addEventListener('keydown', handleKeys)
    return () => { document.removeEventListener('keydown', handleKeys); previousFocus?.focus() }
  }, [modalOpen, saving])
  const openModal = () => {
    setProductId(inventory[0] ? String(inventory[0].id) : '')
    setQty('1')
    setReason('DANIFICADO')
    setObservation('')
    setCost('')
    setFormError('')
    setSuccess('')
    setModalOpen(true)
  }
  const register = async (event) => {
    event.preventDefault()
    if (saving) return
    const amount = Number(qty)
    const normalizedCost = cost.trim().replace(',', '.')
    const costIsValid = !normalizedCost || /^\d{1,8}(\.\d{1,2})?$/.test(normalizedCost)
    if (!selected || !Number.isInteger(amount) || amount < 1 || amount > 1000000) {
      setFormError('Selecione o produto e informe uma quantidade inteira válida.')
      return
    }
    if (amount > selected.stock) {
      setFormError('A quantidade excede o estoque disponível.')
      return
    }
    if (!costIsValid) {
      setFormError('Custo opcional inválido. Use até duas casas decimais.')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      await api.post('/api/desperdicios', {
        produtoId: selected.id,
        quantidade: amount,
        motivo: reason,
        observacao: observation.trim() || null,
        custoUnitarioInformado: normalizedCost ? Number(normalizedCost) : null,
        estoqueEsperado: selected.stock,
      })
      setModalOpen(false)
      setSuccess(`Descarte de ${amount} un. de ${selected.name} registrado com sucesso.`)
      const [, stockResult] = await Promise.allSettled([
        refreshHistory(),
        onStockChanged(),
      ])
      if (stockResult.status === 'rejected') {
        setListError('Descarte registrado, mas não foi possível atualizar o estoque. Recarregue a página.')
      }
    } catch (error) {
      const status = error?.response?.status
      setFormError(error?.response?.data?.message || 'Não foi possível registrar o descarte.')
      if (status === 409) await onStockChanged()
    } finally {
      setSaving(false)
    }
  }
  return (
    <section className="waste-section" aria-labelledby="waste-heading">
      <div className="waste-heading">
        <div>
          <span className="management-eyebrow">SUSTENTABILIDADE · ODS 12.3 / CONTRIBUIÇÃO INDIRETA À ODS 2</span>
          <h2 id="waste-heading">Controle de desperdício</h2>
          <p>Registre descartes reais de produtos do cardápio. As quantidades são medidas em unidades, não em quilos ou ingredientes.</p>
        </div>
        <div className="waste-header-actions">
          <button className="th-btn th-btn--glass" type="button" onClick={refreshHistory} disabled={loading}>
            <FiRefreshCw /> {loading ? 'Atualizando...' : 'Atualizar'}
          </button>
          <button ref={openButtonRef} className="th-btn th-btn--primary" type="button" onClick={openModal} disabled={!inventory.length}>
            <FiPlus /> Registrar descarte
          </button>
        </div>
      </div>
      {success && <div className="waste-alert waste-alert--success" role="status">{success}</div>}
      {listError && <div className="waste-alert waste-alert--error" role="alert">{listError}</div>}
      {!resumo && loading && <p role="status">Carregando indicadores...</p>}
      {resumo && (
        <div className="waste-kpis">
          <article><FiClipboard /><span>Descartes registrados (30 dias)</span><strong>{resumo.registros}</strong></article>
          <article><FiTrash2 /><span>Unidades descartadas (30 dias)</span><strong>{resumo.unidades}</strong></article>
          <article><FiAlertTriangle /><span>Custos declarados (30 dias)</span><strong>{moeda(resumo.prejuizo || 0)}</strong>
            <small>{resumo.registrosSemCusto > 0
              ? `${resumo.registrosSemCusto} registro(s) sem custo informado: soma parcial.`
              : 'Somente valores informados pelos operadores.'}</small>
          </article>
        </div>
      )}
      <div className="waste-log">
        <div className="waste-log-heading">
          <h3>Histórico de descartes</h3>
          <p>Últimos 100 registros de descartes cadastrados.</p>
        </div>
        {!loading && !listError && registros.length === 0 && (
          <div className="waste-empty">Nenhum descarte registrado. Utilize “Registrar descarte” para começar.</div>
        )}
        {registros.length > 0 && (
          <div className="waste-table-wrap">
            <table className="waste-table">
              <thead><tr><th>Data</th><th>Produto</th><th>Qtd.</th><th>Motivo</th><th>Responsável</th><th>Custo declarado</th></tr></thead>
              <tbody>
                {registros.map((item) => (
                  <tr key={item.id}>
                    <td>{dataLocal(item.registradoEm)}</td>
                    <td>{item.produtoNome}</td>
                    <td>{item.quantidade} un.</td>
                    <td title={item.observacao || ''}>{MOTIVOS[item.motivo] || item.motivo}</td>
                    <td>{item.registradoPor}</td>
                    <td>{item.valorTotal == null ? 'Não informado' : moeda(item.valorTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {modalOpen && (
        <div className="waste-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setModalOpen(false) }}>
          <section className="waste-modal" ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="waste-modal-title">
            <div className="waste-modal-head">
              <div><span className="management-eyebrow">REGISTRO DE ESTOQUE</span><h2 id="waste-modal-title">Registrar descarte</h2></div>
              <button type="button" className="waste-close" aria-label="Fechar" disabled={saving} onClick={() => setModalOpen(false)}><FiX /></button>
            </div>
            <p>Essa operação reduzirá o estoque de forma definitiva. Registre somente perdas realmente ocorridas.</p>
            <form onSubmit={register} className="waste-form">
              <label>Produto
                <select required value={productId} onChange={(event) => { setProductId(event.target.value); setFormError('') }} disabled={saving}>
                  {inventory.map((item) => <option key={item.id} value={item.id}>{item.name} — {item.stock} un. disponíveis</option>)}
                </select>
              </label>
              <label>Quantidade descartada (unidades)
                <input required type="number" min="1" max={selected?.stock || 1} step="1" value={qty} onChange={(event) => setQty(event.target.value)} disabled={saving || !selected} />
              </label>
              <label>Motivo
                <select required value={reason} onChange={(event) => setReason(event.target.value)} disabled={saving}>
                  {Object.entries(MOTIVOS).map(([key, title]) => <option key={key} value={key}>{title}</option>)}
                </select>
              </label>
              <label>Observação (opcional)
                <textarea maxLength={255} rows={3} placeholder="Descreva o ocorrido, sem dados pessoais." value={observation} onChange={(event) => setObservation(event.target.value)} disabled={saving} />
              </label>
              <label>Custo unitário informado (R$, opcional)
                <input type="text" inputMode="decimal" placeholder="Ex.: 8,50" value={cost} onChange={(event) => setCost(event.target.value)} disabled={saving} />
                <small>Não use o preço de venda como custo real. Deixe vazio se não souber.</small>
              </label>
              {formError && <div className="waste-alert waste-alert--error" role="alert">{formError}</div>}
              <div className="waste-modal-actions">
                <button className="th-btn th-btn--glass" type="button" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</button>
                <button className="th-btn th-btn--primary" type="submit" disabled={saving || !selected || selected.stock < 1}>
                  {saving ? 'Registrando...' : 'Confirmar descarte'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  )
}