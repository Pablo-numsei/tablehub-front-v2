/** Password reset links keep the credential in the URL fragment, never in query parameters. */
export const readResetTokenFromHash = (hash) => {
  if (typeof hash !== 'string' || !hash.startsWith('#')) return ''
  const token = new URLSearchParams(hash.slice(1)).get('token') || ''
  return token.length <= 2048 && /^[A-Za-z0-9._-]+$/.test(token) ? token : ''
}

export const validateNewPassword = (password, confirmation) => {
  if (password.length < 12 || password.length > 72) {
    return 'A senha deve ter entre 12 e 72 caracteres.'
  }
  if (new TextEncoder().encode(password).length > 72) {
    return 'A senha deve ter no máximo 72 bytes UTF-8.'
  }
  if (password !== confirmation) return 'As senhas digitadas não coincidem.'
  return ''
}
