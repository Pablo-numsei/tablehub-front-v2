import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { FiMail, FiX } from 'react-icons/fi'
import api from '../../services/api.js'
import ThemeToggle from '../../components/layout/ThemeToggle.jsx'
import './PasswordResetModal.css'

export default function PasswordResetModal({ onClose }) {
  const dialogRef = useRef(null)
  const closeRef = useRef(onClose)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [finished, setFinished] = useState(false)
  const [error, setError] = useState('')

  closeRef.current = onClose

  useEffect(() => {
    const previousFocus = document.activeElement
    const oldOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const dialog = dialogRef.current
    dialog?.querySelector('input')?.focus()

    const keydown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeRef.current()
        return
      }
      if (event.key !== 'Tab') return
      const focusable = Array.from(dialog?.querySelectorAll(
        'button:not(:disabled), input:not(:disabled), a[href]'
      ) || [])
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', keydown)
    return () => {
      document.removeEventListener('keydown', keydown)
      document.body.style.overflow = oldOverflow
      previousFocus?.focus?.()
    }
  }, [])

  const submit = async (event) => {
    event.preventDefault()
    if (loading) return
    setError('')
    setLoading(true)
    try {
      await api.post('/api/auth/password-reset/request', { email: email.trim() })
      setFinished(true)
    } catch (requestError) {
      setError(requestError?.response?.status === 429
        ? 'Muitas solicitações. Aguarde um minuto e tente novamente.'
        : requestError?.response?.status === 503
          ? 'O envio de e-mail ainda não está configurado. Contate o administrador.'
          : 'Não foi possível processar a solicitação. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return createPortal(
    <div className="reset-modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section
        ref={dialogRef}
        className="reset-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reset-modal-title"
        aria-describedby="reset-modal-description"
      >
        <header className="reset-modal__header">
          <div className="reset-modal__theme">
            <ThemeToggle compact />
          </div>
          <h2 id="reset-modal-title">Esqueceu a senha?</h2>
          <button type="button" className="reset-modal__close" aria-label="Fechar" onClick={onClose}>
            <FiX />
          </button>
        </header>

        <div className="reset-modal__body">
          {finished ? (
            <div className="reset-modal__result" role="status">
              <FiMail aria-hidden="true" />
              <p>Se o e-mail estiver cadastrado e ativo, você receberá um link para recuperar sua senha.</p>
              <small>O link expira em 15 minutos. Verifique também a caixa de spam.</small>
            </div>
          ) : (
            <form id="reset-request-form" onSubmit={submit}>
              <p id="reset-modal-description">Digite seu e-mail para a recuperação:</p>
              <label htmlFor="reset-request-email" className="reset-modal__label">E-mail</label>
              <input
                id="reset-request-email"
                type="email"
                name="email"
                autoComplete="email"
                placeholder="Insira seu e-mail"
                className="th-input"
                maxLength={180}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
              {error && <div className="auth-error" role="alert">{error}</div>}
            </form>
          )}
        </div>

        <footer className="reset-modal__footer">
          {finished ? (
            <button type="button" className="th-btn th-btn--primary" onClick={onClose}>Voltar ao login</button>
          ) : (
            <>
              <button type="button" className="th-btn th-btn--glass" onClick={onClose} disabled={loading}>Cancelar</button>
              <button type="submit" form="reset-request-form" className="th-btn th-btn--primary" disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar'}
              </button>
            </>
          )}
        </footer>
      </section>
    </div>,
    document.body,
  )
}
