import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../../components/auth/AuthLayout.jsx'
import api from '../../services/api.js'

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', senha: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const update = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data } = await api.post('/auth/login', form)

      if (data?.token) {
        localStorage.setItem('tablehub_token', data.token)
      }

      navigate('/dashboard')
    } catch {
      setError('Não foi possível entrar. Verifique os dados ou a API.')
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

        {error && <div className="auth-error">{error}</div>}

        <div className="auth-field">
          <label className="th-label" htmlFor="email">E-mail</label>
          <input className="th-input" id="email" name="email" type="email" value={form.email} onChange={update} placeholder="seu@email.com" required />
        </div>

        <div className="auth-field">
          <label className="th-label" htmlFor="senha">Senha</label>
          <input className="th-input" id="senha" name="senha" type="password" value={form.senha} onChange={update} placeholder="Sua senha" required />
        </div>

        <div className="auth-meta">
          <label><input type="checkbox" className="me-2" />Lembrar de mim</label>
          <a href="#recuperar">Esqueci minha senha</a>
        </div>

        <button className="th-btn th-btn--primary th-btn--block" type="submit" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>

        <p className="auth-switch">Não possui conta? <Link to="/cadastro">Criar conta</Link></p>
      </form>
    </AuthLayout>
  )
}
