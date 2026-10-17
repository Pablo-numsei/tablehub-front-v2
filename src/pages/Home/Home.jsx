import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { animate, stagger } from 'animejs'
import {
  FiArrowRight,
  FiCreditCard,
  FiGrid,
  FiPackage,
  FiSmartphone,
  FiUserPlus,
} from 'react-icons/fi'
import Navbar from '../../components/layout/Navbar.jsx'
import api from '../../services/api.js'
import './Home.css'

export default function Home() {
  const [signup, setSignup] = useState({ username: '', email: '', password: '' })
  const [signupLoading, setSignupLoading] = useState(false)
  const [signupError, setSignupError] = useState('')
  const [signupSuccess, setSignupSuccess] = useState('')

  const updateSignup = (event) => {
    const { name, value } = event.target
    setSignup((current) => ({ ...current, [name]: value }))
  }

  const submitSignup = async (event) => {
    event.preventDefault()
    if (signupLoading) return
    setSignupError('')
    setSignupSuccess('')

    if (signup.password.length < 12 || new TextEncoder().encode(signup.password).length > 72) {
      setSignupError('Use uma senha de pelo menos 12 caracteres e até 72 bytes.')
      return
    }

    setSignupLoading(true)
    try {
      const { data } = await api.post('/api/clientes/cadastro', {
        nomeUsuario: signup.username.trim(),
        email: signup.email.trim(),
        senha: signup.password,
      })
      setSignupSuccess(data?.message || 'Conta criada. Use o QR Code da mesa para fazer pedidos.')
      setSignup({ username: '', email: '', password: '' })
    } catch (failure) {
      const response = failure.response?.data
      setSignupError(
        response?.message ||
        (failure.response?.status === 429
          ? 'Muitas tentativas. Tente novamente em um minuto.'
          : 'Não foi possível criar sua conta. Verifique os dados e tente novamente.'),
      )
    } finally {
      setSignupLoading(false)
    }
  }

  useEffect(() => {
    animate('.hero-stagger', {
      opacity: [0, 1],
      y: [24, 0],
      delay: stagger(90),
      duration: 700,
      ease: 'outCubic',
    })

    animate('.scene-float', {
      y: [-8, 8],
      duration: 2800,
      alternate: true,
      loop: true,
      ease: 'inOutSine',
    })
  }, [])

  return (
    <main className="home-page">
      <Navbar />

      <section className="hero-section">
        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="hero-eyebrow hero-stagger">
              RESTAURANT OPERATING SYSTEM
            </div>

            <h1 className="hero-stagger">
              Restaurantes mais inteligentes <span>começam aqui.</span>
            </h1>

            <p className="hero-stagger">
              Pedidos, mesas, pagamentos e gestão conectados em uma única experiência.
            </p>

            <div className="hero-actions hero-stagger">
              <Link to="/login" className="th-btn th-btn--primary th-btn--lg">
                Acessar gestão <FiArrowRight />
              </Link>

              <a href="#cadastro-cliente" className="th-btn th-btn--glass th-btn--lg">
                Criar conta de cliente <FiUserPlus />
              </a>

              <Link to="/como-funciona" className="th-btn th-btn--glass th-btn--lg">
                Como funciona <FiArrowRight />
              </Link>
            </div>

            <div className="hero-page-links hero-stagger">
              <Link to="/recursos">
                <small>01</small>
                <span>Recursos</span>
              </Link>
            </div>
          </div>

          <div className="hero-visual hero-stagger">
            <section className="customer-signup-card" id="cadastro-cliente" aria-labelledby="customer-signup-title">
              <div className="customer-signup-card__eyebrow"><FiUserPlus aria-hidden="true" /> CONTA DE CLIENTE · OPCIONAL</div>
              <h2 id="customer-signup-title">Crie sua conta.</h2>
              <p>Cadastre-se em poucos passos. Você também pode explorar o cardápio sem criar uma conta.</p>

              <form className="customer-signup-form" onSubmit={submitSignup}>
                <div className="customer-signup-field">
                  <label htmlFor="signup-username">Nome de usuário</label>
                  <input id="signup-username" name="username" type="text" autoComplete="username"
                    placeholder="Como quer ser chamado?" value={signup.username} onChange={updateSignup}
                    minLength={3} maxLength={40} required disabled={signupLoading} />
                </div>
                <div className="customer-signup-field">
                  <label htmlFor="signup-email">E-mail</label>
                  <input id="signup-email" name="email" type="email" autoComplete="email"
                    placeholder="voce@exemplo.com" value={signup.email} onChange={updateSignup}
                    maxLength={180} required disabled={signupLoading} />
                </div>
                <div className="customer-signup-field">
                  <label htmlFor="signup-password">Senha</label>
                  <input id="signup-password" name="password" type="password" autoComplete="new-password"
                    placeholder="Mínimo de 12 caracteres" value={signup.password} onChange={updateSignup}
                    minLength={12} maxLength={72} required disabled={signupLoading} />
                </div>
                {signupError && <p className="customer-signup-message customer-signup-message--error" role="alert">{signupError}</p>}
                {signupSuccess && <p className="customer-signup-message customer-signup-message--success" role="status">{signupSuccess}</p>}
                <button className="th-btn th-btn--primary th-btn--block customer-signup-submit"
                  type="submit" disabled={signupLoading}>
                  {signupLoading ? 'Criando conta...' : 'Criar minha conta'} <FiArrowRight aria-hidden="true" />
                </button>
              </form>

              <Link className="customer-signup-skip" to="/menu">
                Continuar sem cadastro <FiArrowRight aria-hidden="true" />
              </Link>
              <small className="customer-signup-footnote">Para fazer pedidos, escaneie o QR Code da mesa no restaurante.</small>
            </section>
            <div className="hero-device scene-float">
              <div className="hero-device__top">
                <span>TableHub</span>
                <span className="status-dot" />
              </div>

              <div className="hero-device__card">
                <small>Mesa 04</small>
                <strong>Pedido #1028</strong>
                <span>3 itens · R$ 78,90</span>
              </div>

              <div className="hero-device__grid">
                <span><FiGrid /> 12 mesas</span>
                <span><FiCreditCard /> 8 pagos</span>
                <span><FiPackage /> 4 preparando</span>
                <span><FiSmartphone /> QR ativo</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
