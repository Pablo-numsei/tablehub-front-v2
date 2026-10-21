import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { FiCamera, FiLogOut } from 'react-icons/fi'
import AuthLayout from '../../components/auth/AuthLayout.jsx'
import TableQrScanner from '../../components/customer/TableQrScanner.jsx'
import api from '../../services/api.js'
import { clearCustomerSession, readCustomerSession, saveCustomerSession } from '../../services/customerSession.js'
import './ClienteAuth.css'

export default function LoginCliente() {
  const navigate = useNavigate()
  const location = useLocation()
  const [session, setSession] = useState(readCustomerSession)
  const [form, setForm] = useState({ email: location.state?.email || '', senha: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [scannerOpen, setScannerOpen] = useState(false)

  // Confirm that a restored session was actually signed by the server.
  useEffect(() => {
    if (!session?.token) return
    let active = true
    const controller = new AbortController()
    const apiUrl = (import.meta.env?.VITE_API_URL || 'http://localhost:8080').replace(/\/$/, '')
    fetch(`${apiUrl}/api/clientes/me`, {
      headers: { Authorization: `Bearer ${session.token}` },
      signal: controller.signal,
    }).then(response => {
      if (response.status === 401 && active) {
        clearCustomerSession()
        setSession(null)
        setError('Sua sessão expirou. Faça login novamente.')
      }
    }).catch(() => { /* Backend offline: QR validation still happens on the server. */ })
    return () => { active = false; controller.abort() }
  }, [session?.token])

  const update = event => {
    const { name, value } = event.target
    setForm(current => ({ ...current, [name]: value }))
  }

  const submit = async event => {
    event.preventDefault()
    if (loading) return
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/api/clientes/login', {
        email: form.email.trim(),
        senha: form.senha,
      })
      const saved = saveCustomerSession(data)
      setSession(saved)
      setForm(current => ({ ...current, senha: '' }))
    } catch (failure) {
      setError(failure?.response?.status === 429
        ? 'Muitas tentativas de acesso. Aguarde um minuto.'
        : failure?.response?.status === 401
          ? 'E-mail ou senha inválidos.'
          : failure?.message && !failure?.response
            ? failure.message
            : 'Não foi possível entrar. Verifique sua conexão e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    clearCustomerSession()
    setSession(null)
    setScannerOpen(false)
  }

  return (
    <AuthLayout mode="customer-login">
      <section className="auth-panel">
        <span className="auth-panel__eyebrow">ÁREA DO CLIENTE</span>
        {session ? (
          <>
            <h2>Olá, {session.customer.nomeUsuario}.</h2>
            <p className="auth-panel__sub">Você entrou na sua conta de cliente.</p>
            <div className="customer-auth-info">
              Para fazer um pedido, escaneie o QR Code da mesa. Sua conta não concede acesso à área de gestão nem a pedidos anteriores de outras sessões.
            </div>
            {error && <div className="auth-error" role="alert">{error}</div>}
            <div className="customer-auth-actions">
              <button type="button" className="th-btn th-btn--primary th-btn--block"
                onClick={() => setScannerOpen(true)}>
                <FiCamera aria-hidden="true" /> Escanear QR Code da mesa
              </button>
              <Link className="th-btn th-btn--glass th-btn--block" to="/menu">
                Explorar cardápio
              </Link>
              <button type="button" className="th-btn th-btn--glass th-btn--block" onClick={logout}>
                <FiLogOut aria-hidden="true" /> Sair da conta
              </button>
            </div>
          </>
        ) : (
          <>
            <h2>Entrar como cliente</h2>
            <p className="auth-panel__sub">Acesse sua conta sem utilizar o login dos funcionários.</p>
            {location.state?.registered && (
              <div className="customer-auth-success" role="status">
                Cadastro realizado. Entre com o e-mail e a senha que você criou.
              </div>
            )}
            {error && <div className="auth-error" role="alert">{error}</div>}
            <form onSubmit={submit}>
              <div className="auth-field">
                <label className="th-label" htmlFor="customer-login-email">E-mail</label>
                <input className="th-input" id="customer-login-email" type="email"
                  name="email" autoComplete="username" maxLength={180}
                  placeholder="voce@exemplo.com" value={form.email}
                  onChange={update} required disabled={loading} />
              </div>
              <div className="auth-field">
                <label className="th-label" htmlFor="customer-login-password">Senha</label>
                <input className="th-input" id="customer-login-password" type="password"
                  name="senha" autoComplete="current-password" maxLength={72}
                  placeholder="Sua senha de cliente" value={form.senha}
                  onChange={update} required disabled={loading} />
              </div>
              <button className="th-btn th-btn--primary th-btn--block" type="submit" disabled={loading}>
                {loading ? 'Entrando...' : 'Entrar como cliente'}
              </button>
            </form>
            <div className="customer-auth-links">
              <Link to="/cadastro-cliente">Não tem conta? Criar conta</Link>
              <Link to="/menu">Continuar sem cadastro</Link>
              <Link to="/">Voltar à página inicial</Link>
            </div>
          </>
        )}
        {session && <p className="customer-auth-extra">
          O histórico e os pedidos permanecem vinculados aos tokens de cada pedido, não ao cadastro de cliente.
        </p>}
      </section>
      {scannerOpen && (
        <TableQrScanner
          onClose={() => setScannerOpen(false)}
          onDetected={route => {
            setScannerOpen(false)
            navigate(route)
          }}
        />
      )}
    </AuthLayout>
  )
}
