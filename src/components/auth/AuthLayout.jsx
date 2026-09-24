import { useEffect, useRef } from 'react'
import { animate } from 'animejs'
import { Link } from 'react-router-dom'
import { FiBarChart2, FiGrid, FiShoppingBag } from 'react-icons/fi'
import './AuthLayout.css'

export default function AuthLayout({ children, mode = 'login' }) {
  const sceneRef = useRef(null)

  useEffect(() => {
    animate('.auth-float-card', {
      y: [-7, 7],
      duration: 2600,
      alternate: true,
      loop: true,
      ease: 'inOutSine',
    })

    const onMove = (event) => {
      if (!sceneRef.current || window.innerWidth < 900) return
      const x = (event.clientX / window.innerWidth - .5) * 12
      const y = (event.clientY / window.innerHeight - .5) * -9
      sceneRef.current.style.transform =
        `perspective(900px) rotateY(${x}deg) rotateX(${y}deg)`
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  return (
    <main className="auth-page">
      <Link to="/" className="auth-brand">
        <span className="th-brand__mark">T</span>
        <span>TableHub</span>
      </Link>

      <section className="auth-visual">
        <div ref={sceneRef} className="auth-scene">
          <article className="auth-float-card auth-float-card--one">
            <FiShoppingBag />
            <div><small>Pedido #1028</small><strong>Preparando</strong></div>
          </article>
          <article className="auth-float-card auth-float-card--two">
            <FiGrid />
            <div><small>Mesas</small><strong>8 / 12 ocupadas</strong></div>
          </article>
          <article className="auth-float-card auth-float-card--three">
            <FiBarChart2 />
            <div><small>Hoje</small><strong>R$ 3.840</strong></div>
          </article>

          <div className="auth-visual__copy">
            <span>TABLEHUB</span>
            <h1>{mode === 'register' ? 'Uma operação mais conectada.' : 'Sua operação em um só lugar.'}</h1>
            <p>Pedidos, mesas, pagamentos e gestão com uma interface criada para manter tudo em fluxo.</p>
          </div>
        </div>
      </section>

      <section className="auth-form-side">
        {children}
      </section>
    </main>
  )
}
