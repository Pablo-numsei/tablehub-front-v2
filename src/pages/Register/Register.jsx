import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../../components/auth/AuthLayout.jsx'
import api from '../../services/api.js'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    perfilId: '',
  })
  const [profiles, setProfiles] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/api/perfis')
      .then(({ data }) => {
        const items = Array.isArray(data) ? data : []
        setProfiles(items)
        if (items.length > 0) {
          setForm((current) => ({
            ...current,
            perfilId: String(current.perfilId || items[0].id),
          }))
        }
      })
      .catch(() => {
        setError('Não foi possível carregar os perfis disponíveis.')
      })
  }, [])

  const update = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }))
  }

  const submit = async (event) => {
    event.preventDefault()
    setError('')

    if (form.senha !== form.confirmarSenha) {
      setError('As senhas não coincidem.')
      return
    }

    if (!form.perfilId) {
      setError('Selecione um perfil.')
      return
    }

    setLoading(true)

    try {
      await api.post('/api/usuarios', {
        perfilId: Number(form.perfilId),
        nome: form.nome,
        email: form.email,
        senha: form.senha,
      })
      navigate('/login')
    } catch (requestError) {
      const response = requestError?.response?.data
      setError(
        typeof response === 'string'
          ? response
          : response?.message ||
              'Não foi possível criar a conta. Verifique os dados.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout mode="register">
      <form className="auth-panel" onSubmit={submit}>
        <span className="auth-panel__eyebrow">NOVO ACESSO</span>
        <h2>Crie sua conta</h2>
        <p className="auth-panel__sub">Cadastre um usuário para a operação do TableHub.</p>

        {error && <div className="auth-error">{error}</div>}

        <div className="auth-field">
          <label className="th-label" htmlFor="nome">Nome completo</label>
          <input className="th-input" id="nome" name="nome" value={form.nome} onChange={update} required />
        </div>

        <div className="auth-field">
          <label className="th-label" htmlFor="email">E-mail</label>
          <input className="th-input" id="email" name="email" type="email" value={form.email} onChange={update} required />
        </div>

        <div className="auth-field">
          <label className="th-label" htmlFor="perfilId">Perfil</label>
          <select className="th-input" id="perfilId" name="perfilId" value={form.perfilId} onChange={update} required>
            {profiles.length === 0 && <option value="">Carregando perfis...</option>}
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.name}
              </option>
            ))}
          </select>
        </div>

        <div className="auth-field">
          <label className="th-label" htmlFor="senha">Senha</label>
          <input className="th-input" id="senha" name="senha" type="password" value={form.senha} onChange={update} required minLength="6" />
        </div>

        <div className="auth-field">
          <label className="th-label" htmlFor="confirmarSenha">Confirmar senha</label>
          <input className="th-input" id="confirmarSenha" name="confirmarSenha" type="password" value={form.confirmarSenha} onChange={update} required minLength="6" />
        </div>

        <button className="th-btn th-btn--primary th-btn--block" type="submit" disabled={loading || profiles.length === 0}>
          {loading ? 'Criando...' : 'Criar conta'}
        </button>
        <p className="auth-switch">Já possui conta? <Link to="/login">Entrar</Link></p>
      </form>
    </AuthLayout>
  )
}
