import { useEffect, useMemo, useState } from 'react'
import { FiAlertTriangle, FiClipboard, FiRefreshCw, FiTrendingDown } from 'react-icons/fi'
import api from '../../services/api.js'
import { WASTE_REASONS, validateWasteCost, validateWasteInput } from '../../utils/desperdicios.js'
import './DesperdicioPanel.css'

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const motiveLabel = Object.fromEntries(WASTE_REASONS.map(({ value, label }) => [value, label]))

function formatDate(value) {
  if (!value) return '—'
  // O SQL armazena registrado_em em UTC; LocalDateTime chega sem fuso horario.
  const date = new Date(value.endsWith('Z') ? value : value + 'Z')
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('pt-BR')
}

function serverError(error, fallback) {
  return error?.response?.data?.message || fallback
}

export default function DesperdicioPanel({ inventory, onRegistered }) {
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [unitCost, setUnitCost] = useState('')
  const [reason, setReason] = useState('VENCIMENTO')
  const [observation, setObservation] = useState('')
  const [history, setHistory] = useState([])
  const [summary, setSummary] = useState(null)
  const [revision, setRevision] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [fetchError, setFetchError] = useState('')
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState('')

  const product = useMemo(
    () => inventory.find((item) => String(item.id) === productId),
    [inventory, productId],
  )

  useEffect(() => {
    let active = true
    setLoading(true)
    Promise.all([
      api.get('/api/desperdicios/resumo'),
      api.get('/api/desperdicios'),
    ]).then(([summaryResponse, historyResponse]) => {
      if (!active) return
      setSummary(summaryResponse.data)
      setHistory(Array.isArray(historyResponse.data) ? historyResponse.data : [])
      setFetchError('')
    }).catch((error) => {
      if (active) setFetchError(serverError(error, 'Nao foi possivel carregar os registros de desperdicio. Confira a API e a tabela SQL.'))
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [revision])

  const register = async (event) => {
    event.preventDefault()
    if (saving) return
    setFormError('')
    setSuccess('')
    const invalid = validateWasteInput(product, quantity) || validateWasteCost(unitCost)
    if (invalid) {
      setFormError(invalid)
      return
    }

    setSaving(true)
    try {
      const response = await api.post('/api/desperdicios', {
        produtoId: product.id,
        quantidade: Number(quantity),
        estoqueEsperado: product.stock,
        custoUnitarioInformado: Number(unitCost.trim().replace(',', '.')),
        motivo: reason,
        observacao: observation.trim() || null,
      })
      setQuantity('1')
      setUnitCost('')
      setObservation('')
      setSuccess(
        'Perda registrada: ' + response.data.quantidade + ' un. de ' +
        response.data.produtoNome + '. Estoque atualizado.',
      )
      await onRegistered()
      setRevision((current) => current + 1)
    } catch (error) {
      if (error.response?.status === 409) {
        await onRegistered()
      }
      setFormError(serverError(error, 'Nao foi possivel registrar o desperdicio.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="waste-panel" aria-labelledby="waste-heading">
      <div className="waste-heading">
        <div>
          <span className="management-eyebrow">CONTROLE DE PERDAS</span>
          <h2 id="waste-heading">Desperdicio alimentar</h2>
          <p>Registre produtos descartados para atualizar o estoque e acompanhar as perdas.</p>
        </div>
        <button type="button" className="waste-refresh" disabled={loading || saving} onClick={() => setRevision((value) => value + 1)}>
          <FiRefreshCw aria-hidden="true" /> Atualizar
        </button>
      </div>

      <div className="waste-summary">
        <article><FiClipboard aria-hidden="true" /><span>Registros nos ultimos 30 dias</span><strong>{loading && !summary ? '...' : summary?.registros ?? '—'}</strong></article>
        <article><FiAlertTriangle aria-hidden="true" /><span>Unidades perdidas (30 dias)</span><strong>{loading && !summary ? '...' : summary?.unidades ?? '—'}</strong></article>
        <article><FiTrendingDown aria-hidden="true" /><span>Custo registrado das perdas (30 dias)</span><strong>{summary ? currency.format(Number(summary.prejuizo || 0)) : '—'}</strong></article>
      </div>

      {fetchError && <div className="waste-alert" role="alert">{fetchError}</div>}
      {formError && <div className="waste-alert" role="alert">{formError}</div>}
      {success && <div className="waste-success" role="status">{success}</div>}

      <form className="waste-form" onSubmit={register}>
        <label>
          Produto
          <select value={productId} onChange={(event) => { setProductId(event.target.value); setFormError('') }} required disabled={saving}>
            <option value="">Selecione o produto</option>
            {inventory.map((item) => (
              <option key={item.id} value={String(item.id)} disabled={item.stock <= 0}>
                {item.name} — {item.stock} un. em estoque
              </option>
            ))}
          </select>
        </label>
        <label>
          Quantidade descartada
          <input type="number" min="1" max={product?.stock || undefined} step="1" inputMode="numeric" value={quantity} onChange={(event) => setQuantity(event.target.value)} required disabled={saving} />
        </label>
        <label>
          Custo unitário informado (R$)
          <input type="number" min="0" step="0.01" placeholder="Ex.: 3.50" inputMode="decimal" value={unitCost} onChange={(event) => setUnitCost(event.target.value)} required disabled={saving} />
        </label>
        <label>
          Motivo
          <select value={reason} onChange={(event) => setReason(event.target.value)} disabled={saving}>
            {WASTE_REASONS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="waste-form__wide">
          Observacao (opcional)
          <textarea maxLength="255" rows="2" placeholder="Ex.: produto vencido ou danificado" value={observation} onChange={(event) => setObservation(event.target.value)} disabled={saving} />
        </label>
        <div className="waste-form__actions">
          <small>O lancamento reduz o estoque e nao pode ser desfeito nesta tela.</small>
          <button type="submit" disabled={saving || !product || product.stock <= 0}>
            {saving ? 'Registrando...' : 'Registrar perda'}
          </button>
        </div>
      </form>

      <div className="waste-history-head">
        <h3>Historico de desperdicios</h3>
        <span>Ultimos 100 registros</span>
      </div>
      {loading && <p className="waste-empty">Carregando historico...</p>}
      {!loading && !fetchError && history.length === 0 && <p className="waste-empty">Nenhuma perda registrada ainda.</p>}
      {!loading && history.length > 0 && (
        <div className="waste-table-wrap">
          <table className="waste-table">
            <thead><tr><th>Data</th><th>Produto</th><th>Quantidade</th><th>Motivo</th><th>Perda pelo custo informado</th><th>Registrado por</th></tr></thead>
            <tbody>
              {history.map((entry) => (
                <tr key={entry.id}>
                  <td>{formatDate(entry.registradoEm)}</td>
                  <td><strong>{entry.produtoNome}</strong>{entry.observacao && <small>{entry.observacao}</small>}</td>
                  <td>{entry.quantidade} un.</td>
                  <td>{motiveLabel[entry.motivo] || entry.motivo}</td>
                  <td>{entry.valorTotal == null ? 'Não informado' : currency.format(Number(entry.valorTotal))}</td>
                  <td>{entry.registradoPor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
