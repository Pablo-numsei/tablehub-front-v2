import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../../components/auth/AuthLayout.jsx'
import api from '../../services/api.js'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ nome: '', email: '', senha: '', confirmarSenha: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const update = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  const submit = async (event) => {
    event.preventDefault()
    setError('')

    if (form.senha !== form.confirmarSenha) {
      setError('As senhas não coincidem.')
      return
    }

    setLoading(true)

    try {
      await api.post('/auth/register', { nome: form.nome, email: form.email, senha: form.senha })
      navigate('/login')
    } catch {
      setError('Não foi possível criar a conta. Verifique os dados ou a API.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout mode="register">
      <form className="auth-panel" onSubmit={submit}>
        <span className="auth-panel__eyebrow">NOVO ACESSO</span>
        <h2>Crie sua conta</h2>
        <p className="auth-panel__sub">Comece a organizar sua operação com o TableHub.</p>

        {error && <div className="auth-error">{error}</div>}

        <div className="auth-field"><label className="th-label" htmlFor="nome">Nome completo</label><input className="th-input" id="nome" name="nome" value={form.nome} onChange={update} required /></div>
        <div className="auth-field"><label className="th-label" htmlFor="email">E-mail</label><input className="th-input" id="email" name="email" type="email" value={form.email} onChange={update} required /></div>
        <div className="auth-field"><label className="th-label" htmlFor="senha">Senha</label><input className="th-input" id="senha" name="senha" type="password" value={form.senha} onChange={update} required minLength="6" /></div>
        <div className="auth-field"><label className="th-label" htmlFor="confirmarSenha">Confirmar senha</label><input className="th-input" id="confirmarSenha" name="confirmarSenha" type="password" value={form.confirmarSenha} onChange={update} required minLength="6" /></div>

        <button className="th-btn th-btn--primary th-btn--block" type="submit" disabled={loading}>{loading ? 'Criando...' : 'Criar conta'}</button>
        <p className="auth-switch">Já possui conta? <Link to="/login">Entrar</Link></p>
      </form>
    </AuthLayout>
  )
}
