import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthLayout from '../../components/auth/AuthLayout.jsx'
import api from '../../services/api.js'
import { clearCustomerSession, readCustomerSession, safeCustomerReturn, saveCustomerSession } from '../../services/customerSession.js'
import './ClienteAuth.css'

export default function LoginCliente() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = safeCustomerReturn(location.state?.from)
  const [session, setSession] = useState(readCustomerSession)
  const [form, setForm] = useState({ nomeUsuario: location.state?.nomeUsuario || '', pin: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!session?.token) return
    let active = true
    api.get('/api/clientes/me', {
      headers: { Authorization: `Bearer ${session.token}` },
    }).then(() => {
      if (active) navigate(from, { replace: true })
    }).catch(failure => {
      if (!active) return
      if ([401, 403].includes(failure?.response?.status)) {
        clearCustomerSession()
        setSession(null)
        setError('Sua sessão expirou. Entre novamente.')
      }
    })
    return () => { active = false }
  }, [session?.token, from, navigate])

  const submit = async event => {
    event.preventDefault()
    if (loading) return
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/api/clientes/login', {
        nomeUsuario: form.nomeUsuario.trim(), pin: form.pin,
      })
      saveCustomerSession(data)
      navigate(from, { replace: true })
    } catch (failure) {
      setError(failure?.response?.status === 429
        ? 'Muitas tentativas de PIN. Tente novamente mais tarde.'
        : failure?.response?.status === 401
          ? 'Nome de usuário ou PIN inválidos.'
          : failure?.response?.data?.message || failure?.message ||
            'Não foi possível acessar a conta.')
    } finally { setLoading(false) }
  }

  return (
    <AuthLayout mode="customer-login">
      <form className="auth-panel" onSubmit={submit}>
        <span className="auth-panel__eyebrow">CLIENTE · TABLEHUB</span>
        <h2>Entrar como cliente</h2>
        <p className="auth-panel__sub">Use o nome de usuário e o PIN que você escolheu.</p>
        {error && <div className="auth-error" role="alert">{error}</div>}
        <div className="auth-field">
          <label className="th-label" htmlFor="customer-username">Nome de usuário</label>
          <input className="th-input" id="customer-username" name="nomeUsuario"
            placeholder="Ex.: pablo123" autoComplete="username"
            minLength={3} maxLength={40} value={form.nomeUsuario}
            onChange={e => setForm(f => ({ ...f, nomeUsuario: e.target.value }))}
            disabled={loading} required />
        </div>
        <div className="auth-field">
          <label className="th-label" htmlFor="customer-pin">Seu PIN (4 dígitos)</label>
          <input className="th-input" id="customer-pin" name="pin" type="password"
            inputMode="numeric" pattern="[0-9]{4}" minLength={4} maxLength={4}
            autoComplete="current-password" autoFocus={Boolean(location.state?.nomeUsuario)}
            placeholder="••••" value={form.pin}
            onChange={e => setForm(f => ({ ...f, pin: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
            disabled={loading} required />
        </div>
        <button className="th-btn th-btn--primary th-btn--block" type="submit" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar e continuar'}
        </button>
        <div className="customer-auth-links">
          <Link to="/cadastro-cliente" state={{ from }}>Primeira vez? Criar usuário e PIN</Link>
          <Link to={from}>Voltar à vitrine do cardápio</Link>
        </div>
      </form>
    </AuthLayout>
  )
}
