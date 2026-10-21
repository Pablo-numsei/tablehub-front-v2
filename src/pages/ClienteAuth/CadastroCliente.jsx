import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthLayout from '../../components/auth/AuthLayout.jsx'
import api from '../../services/api.js'
import { safeCustomerReturn, saveCustomerSession } from '../../services/customerSession.js'
import './ClienteAuth.css'

export default function CadastroCliente() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = safeCustomerReturn(location.state?.from)
  const [form, setForm] = useState({ nomeUsuario: '', pin: '', pinConfirmacao: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const update = event => {
    const { name, value } = event.target
    setForm(current => ({ ...current, [name]: name.startsWith('pin') ? value.replace(/\D/g, '').slice(0, 4) : value }))
  }

  const submit = async event => {
    event.preventDefault()
    if (loading) return
    setError('')
    if (!/^\d{4}$/.test(form.pin) || form.pin !== form.pinConfirmacao) {
      setError('Escolha um PIN de 4 números e repita-o corretamente.')
      return
    }
    setLoading(true)
    try {
      const payload = { nomeUsuario: form.nomeUsuario.trim(), pin: form.pin }
      await api.post('/api/clientes/cadastro', payload)
      const { data } = await api.post('/api/clientes/login', payload)
      saveCustomerSession(data)
      navigate(from, { replace: true })
    } catch (failure) {
      setError(failure?.response?.status === 429
        ? 'Muitas tentativas. Tente novamente mais tarde.'
        : failure?.response?.data?.message || failure?.message ||
          'Não foi possível criar ou acessar a conta.')
    } finally { setLoading(false) }
  }

  return (
    <AuthLayout mode="customer-signup">
      <form className="auth-panel" onSubmit={submit}>
        <span className="auth-panel__eyebrow">CLIENTE · TABLEHUB</span>
        <h2>Crie seu acesso</h2>
        <p className="auth-panel__sub">Basta escolher um usuário e um PIN de quatro números.</p>
        <div className="customer-auth-info">
          O cardápio pode ser visto sem cadastro. Para colocar produtos no carrinho, crie uma conta.
          O QR Code da mesa continua necessário para fazer pedidos.
        </div>
        {error && <div className="auth-error" role="alert">{error}</div>}
        <div className="auth-field">
          <label className="th-label" htmlFor="customer-name">Nome de usuário</label>
          <input className="th-input" id="customer-name" name="nomeUsuario"
            autoComplete="username" placeholder="Ex.: pablo123"
            minLength={3} maxLength={40} value={form.nomeUsuario}
            onChange={update} required disabled={loading} />
        </div>
        <div className="auth-field">
          <label className="th-label" htmlFor="customer-pin">PIN de 4 dígitos</label>
          <input className="th-input" id="customer-pin" name="pin" type="password"
            inputMode="numeric" pattern="[0-9]{4}" minLength={4} maxLength={4}
            autoComplete="new-password" placeholder="••••" value={form.pin}
            onChange={update} required disabled={loading} />
        </div>
        <div className="auth-field">
          <label className="th-label" htmlFor="customer-pin-confirm">Confirme seu PIN</label>
          <input className="th-input" id="customer-pin-confirm" name="pinConfirmacao" type="password"
            inputMode="numeric" pattern="[0-9]{4}" minLength={4} maxLength={4}
            autoComplete="new-password" placeholder="••••" value={form.pinConfirmacao}
            onChange={update} required disabled={loading} />
        </div>
        <p className="customer-auth-warning">
          Evite sequências previsíveis como 1234. Sem e-mail, o PIN não poderá ser recuperado automaticamente.
        </p>
        <button className="th-btn th-btn--primary th-btn--block" type="submit" disabled={loading}>
          {loading ? 'Criando conta...' : 'Criar conta e continuar'}
        </button>
        <div className="customer-auth-links">
          <Link to="/login-cliente" state={{ from }}>Já tenho conta — entrar com PIN</Link>
          <Link to={from}>Voltar à vitrine do cardápio</Link>
        </div>
      </form>
    </AuthLayout>
  )
}
