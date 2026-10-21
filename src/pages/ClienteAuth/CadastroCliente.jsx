import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../../components/auth/AuthLayout.jsx'
import api from '../../services/api.js'
import './ClienteAuth.css'

export default function CadastroCliente() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ nomeUsuario: '', email: '', senha: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const update = event => {
    const { name, value } = event.target
    setForm(current => ({ ...current, [name]: value }))
  }

  const submit = async event => {
    event.preventDefault()
    if (loading) return
    setError('')

    const passwordBytes = new TextEncoder().encode(form.senha).length
    if (form.senha.length < 12 || passwordBytes > 72) {
      setError('Use uma senha de pelo menos 12 caracteres e no máximo 72 bytes UTF-8.')
      return
    }

    setLoading(true)
    try {
      await api.post('/api/clientes/cadastro', {
        nomeUsuario: form.nomeUsuario.trim(),
        email: form.email.trim(),
        senha: form.senha,
      })
      navigate('/login-cliente', {
        replace: true,
        state: { registered: true, email: form.email.trim() },
      })
    } catch (failure) {
      setError(failure?.response?.status === 429
        ? 'Muitas tentativas. Aguarde um minuto e tente novamente.'
        : failure?.response?.data?.message ||
          'Não foi possível concluir o cadastro. Verifique os dados e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout mode="customer-signup">
      <form className="auth-panel" onSubmit={submit}>
        <span className="auth-panel__eyebrow">ÁREA DO CLIENTE</span>
        <h2>Criar conta</h2>
        <p className="auth-panel__sub">Cadastre-se para voltar ao TableHub usando seu e-mail e senha.</p>
        <div className="customer-auth-info">
          O cadastro é opcional. Você pode consultar o cardápio sem conta, mas pedidos precisam do QR Code válido da mesa.
        </div>
        {error && <div className="auth-error" role="alert">{error}</div>}
        <div className="auth-field">
          <label className="th-label" htmlFor="customer-name">Nome de usuário</label>
          <input className="th-input" id="customer-name" name="nomeUsuario"
            autoComplete="username" placeholder="Como deseja ser chamado?"
            minLength={3} maxLength={40} value={form.nomeUsuario} onChange={update}
            required disabled={loading} />
        </div>
        <div className="auth-field">
          <label className="th-label" htmlFor="customer-register-email">E-mail</label>
          <input className="th-input" id="customer-register-email" name="email"
            type="email" autoComplete="email" maxLength={180}
            placeholder="voce@exemplo.com" value={form.email} onChange={update}
            required disabled={loading} />
        </div>
        <div className="auth-field">
          <label className="th-label" htmlFor="customer-register-password">Senha</label>
          <input className="th-input" id="customer-register-password" name="senha"
            type="password" autoComplete="new-password" minLength={12} maxLength={72}
            placeholder="Pelo menos 12 caracteres" value={form.senha} onChange={update}
            required disabled={loading} />
        </div>
        <button className="th-btn th-btn--primary th-btn--block" type="submit" disabled={loading}>
          {loading ? 'Criando conta...' : 'Criar conta de cliente'}
        </button>
        <div className="customer-auth-links">
          <Link to="/login-cliente">Já tenho conta — entrar</Link>
          <Link to="/menu">Continuar sem cadastro</Link>
          <Link to="/">Voltar à página inicial</Link>
        </div>
      </form>
    </AuthLayout>
  )
}
