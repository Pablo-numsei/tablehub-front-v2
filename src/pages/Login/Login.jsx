import { useState } from 'react'
import PasswordResetModal from './PasswordResetModal.jsx'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import AuthLayout from '../../components/auth/AuthLayout.jsx'
import api from '../../services/api.js'
import { canAccessRoute, landingPage, saveAuthSession } from '../../services/authSession.js'
import { useAuth } from '../../components/auth/AuthProvider.jsx'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [form, setForm] = useState({ email: '', senha: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [remember, setRemember] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)

  if (user) return <Navigate to={landingPage(user.role)} replace />

  const update = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data } = await api.post('/api/auth/login', form)

      const session = saveAuthSession(data, remember)
      const destination = canAccessRoute(session.user.role, location.state?.from)
        ? location.state.from : landingPage(session.user.role)
      navigate(destination, { replace: true })
    } catch (requestError) {
      setError(requestError?.response?.status === 429
        ? 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.'
        : requestError?.response ? 'E-mail ou senha inválidos, ou acesso indisponível.'
          : requestError?.message || 'Não foi possível entrar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout mode="login">
      <form className="auth-panel" onSubmit={submit}>
        <span className="auth-panel__eyebrow">ACESSO</span>
        <h2>Bem-vindo de volta</h2>
        <p className="auth-panel__sub">Entre para continuar no TableHub.</p>

        {error && <div className="auth-error" role="alert">{error}</div>}

        <div className="auth-field">
          <label className="th-label" htmlFor="email">E-mail</label>
          <input className="th-input" id="email" name="email" type="email" autoComplete="username" maxLength={254} value={form.email} onChange={update} placeholder="seu@email.com" required />
        </div>

        <div className="auth-field">
          <label className="th-label" htmlFor="senha">Senha</label>
          <input className="th-input" id="senha" name="senha" type="password" autoComplete="current-password" value={form.senha} onChange={update} placeholder="Sua senha" required />
        </div>

        <div className="auth-meta">
          <label><input type="checkbox" className="me-2" checked={remember} onChange={(event) => setRemember(event.target.checked)} />Manter acesso neste dispositivo</label>
          <button className="auth-reset-trigger" type="button" onClick={() => setResetOpen(true)}>
            Esqueceu a senha?
          </button>
        </div>

        <button className="th-btn th-btn--primary th-btn--block" type="submit" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>

        <p className="auth-switch">Não possui conta? Solicite acesso ao administrador do restaurante.</p>
      </form>
      {resetOpen && <PasswordResetModal onClose={() => setResetOpen(false)} />}
    </AuthLayout>
  )
}
