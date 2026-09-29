import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { animate, stagger } from 'animejs'
import {
  FiArrowRight,
  FiCreditCard,
  FiGrid,
  FiPackage,
  FiSmartphone,
} from 'react-icons/fi'
import Navbar from '../../components/layout/Navbar.jsx'
import './Home.css'

export default function Home() {
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
              <Link to="/cadastro" className="th-btn th-btn--primary th-btn--lg">
                Começar agora <FiArrowRight />
              </Link>

              <Link to="/como-funciona" className="th-btn th-btn--glass th-btn--lg">
                Como funciona <FiArrowRight />
              </Link>
            </div>

            <div className="hero-page-links hero-stagger">
              <Link to="/como-funciona">
                <small>01</small>
                <span>Como funciona</span>
              </Link>
              <Link to="/recursos">
                <small>02</small>
                <span>Recursos</span>
              </Link>
            </div>
          </div>

          <div className="hero-visual hero-stagger">
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
