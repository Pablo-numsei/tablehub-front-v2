import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from '../../components/auth/AuthLayout.jsx'
import api from '../../services/api.js'
import { readResetTokenFromHash, validateNewPassword } from '../../services/passwordRecovery.js'

export default function ResetPassword() {
  const [token] = useState(() => readResetTokenFromHash(window.location.hash))
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [complete, setComplete] = useState(false)

  useEffect(() => {
    // Remove the bearer credential from the browser's visible URL immediately.
    window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search)
  }, [])

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    const invalid = validateNewPassword(newPassword, confirmPassword)
    if (invalid) {
      setError(invalid)
      return
    }
    setLoading(true)
    try {
      await api.post('/api/auth/password-reset/confirm', { token, novaSenha: newPassword })
      setComplete(true)
      setNewPassword('')
      setConfirmPassword('')
    } catch (requestError) {
      setError(requestError?.response?.status === 429
        ? 'Muitas tentativas. Aguarde um minuto para tentar novamente.'
        : requestError?.response?.status === 400
          ? 'O link é inválido, expirou ou já foi usado. Solicite outro pelo login.'
          : 'Não foi possível alterar a senha. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout mode="reset">
      <section className="auth-panel">
        <span className="auth-panel__eyebrow">RECUPERAÇÃO DE ACESSO</span>
        <h2>{complete ? 'Senha atualizada' : 'Criar nova senha'}</h2>
        <p className="auth-panel__sub">
          {complete ? 'Sua senha foi alterada. Faça login com a nova senha.' : 'Digite e confirme sua nova senha de acesso ao TableHub.'}
        </p>

        {!token && !complete && <div className="auth-error" role="alert">
          Link ausente ou inválido. Solicite um novo link na tela de login.
        </div>}

        {error && <div className="auth-error" role="alert">{error}</div>}

        {!complete && token && (
          <form onSubmit={submit}>
            <div className="auth-field">
              <label className="th-label" htmlFor="nova-senha">Nova senha</label>
              <input
                id="nova-senha" className="th-input"
                type="password" autoComplete="new-password"
                minLength={12} maxLength={72}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                required
              />
            </div>
            <div className="auth-field">
              <label className="th-label" htmlFor="confirmar-nova-senha">Confirmar senha</label>
              <input
                id="confirmar-nova-senha" className="th-input"
                type="password" autoComplete="new-password"
                minLength={12} maxLength={72}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
              />
            </div>
            <p className="auth-switch">Use pelo menos 12 caracteres, com até 72 bytes UTF-8.</p>
            <button className="th-btn th-btn--primary th-btn--block" type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Alterar senha'}
            </button>
          </form>
        )}
        <p className="auth-switch">
          <Link to="/login">{complete ? 'Entrar com nova senha' : 'Voltar ao login'}</Link>
        </p>
      </section>
    </AuthLayout>
  )
}
