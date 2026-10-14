import { useState } from 'react'
import { FiX } from 'react-icons/fi'
import api from '../../services/api.js'
import './CatalogDialogs.css'

const parsePrice = (value) => Number(String(value).replace(',', '.').trim())

export default function CatalogDialogs({ dialog, categories, onClose, onSaved }) {
  const editing = dialog.kind === 'product' && !!dialog.product
  const product = dialog.product
  const [name, setName] = useState(product?.name || '')
  const [description, setDescription] = useState(product?.description || '')
  const [categoryId, setCategoryId] = useState(
    String(product?.categoryId ?? categories[0]?.id ?? ''),
  )
  const [price, setPrice] = useState(product ? String(product.price) : '')
  const [stock, setStock] = useState(product ? String(product.stock) : '0')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    if (saving) return

    const normalizedName = name.trim()
    const normalizedDescription = description.trim()
    if (!normalizedName) {
      setError('Informe o nome.')
      return
    }

    setSaving(true)
    setError('')

    try {
      if (dialog.kind === 'category') {
        await api.post('/api/v1/categorias', {
          nome: normalizedName,
          descricao: normalizedDescription,
        })
      } else {
        const parsedPrice = parsePrice(price)
        const parsedStock = Number(stock)
        const parsedCategoryId = Number(categoryId)

        if (!Number.isFinite(parsedPrice) || parsedPrice <= 0 ||
          Math.round(parsedPrice * 100) !== parsedPrice * 100) {
          throw new Error('Informe um preço válido com no máximo duas casas decimais.')
        }

        if (!Number.isInteger(parsedStock) || parsedStock < 0) {
          throw new Error('O estoque precisa ser um número inteiro não negativo.')
        }

        if (!categories.some((category) => category.id === parsedCategoryId)) {
          throw new Error('Escolha uma categoria cadastrada.')
        }

        const payload = {
          name: normalizedName,
          description: normalizedDescription,
          category: { id: parsedCategoryId },
          price: parsedPrice,
          stockQuantity: parsedStock,
        }

        if (editing) {
          await api.put(`/api/v1/produtos/${product.id}`, payload)
        } else {
          await api.post('/api/v1/produtos', payload)
        }
      }

      onSaved()
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
        requestError?.response?.data?.detail ||
        requestError?.message ||
        'Não foi possível salvar. Confira os dados e tente novamente.',
      )
    } finally {
      setSaving(false)
    }
  }

  const title = dialog.kind === 'category'
    ? 'Nova categoria'
    : editing ? 'Editar produto' : 'Novo produto'

  return (
    <div className="catalog-dialog-backdrop" onClick={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="catalog-dialog"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => { if (event.key === 'Escape') onClose() }}
      >
        <button
          type="button"
          className="catalog-dialog__close"
          aria-label="Fechar"
          onClick={onClose}
          disabled={saving}
        >
          <FiX />
        </button>
        <span className="management-eyebrow">CARDÁPIO</span>
        <h2>{title}</h2>

        <form onSubmit={submit} className="catalog-dialog__form">
          <label>
            Nome
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              maxLength={dialog.kind === 'category' ? 100 : 150}
              placeholder={dialog.kind === 'category' ? 'Ex.: Lanches' : 'Ex.: Hambúrguer Artesanal'}
            />
          </label>

          {dialog.kind === 'product' && (
            <>
              <label>
                Categoria
                <select
                  value={categoryId}
                  onChange={(event) => setCategoryId(event.target.value)}
                  required
                >
                  {categories.map((category) => (
                    <option value={category.id} key={category.id}>{category.name}</option>
                  ))}
                </select>
              </label>
              <div className="catalog-dialog__split">
                <label>
                  Preço (R$)
                  <input
                    type="text"
                    inputMode="decimal"
                    value={price}
                    onChange={(event) => setPrice(event.target.value)}
                    required
                    placeholder="29,90"
                  />
                </label>
                <label>
                  Estoque
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={stock}
                    onChange={(event) => setStock(event.target.value)}
                    readOnly={editing}
                    required
                  />
                </label>
              </div>
              {editing && (
                <small className="catalog-dialog__hint">
                  Para alterar o estoque, utilize a página Produtos / Estoque.
                </small>
              )}
            </>
          )}

          <label>
            Descrição
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              maxLength={dialog.kind === 'category' ? 300 : 500}
              placeholder="Descrição opcional"
            />
          </label>

          {error && <p className="catalog-dialog__error" role="alert">{error}</p>}

          <div className="catalog-dialog__actions">
            <button type="button" className="th-btn th-btn--glass" onClick={onClose} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="th-btn th-btn--primary" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
