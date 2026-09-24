import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { animate, stagger } from 'animejs'
import { FiArrowRight, FiCheck, FiCreditCard, FiGrid, FiPackage, FiSmartphone } from 'react-icons/fi'
import Navbar from '../../components/layout/Navbar.jsx'
import './Home.css'

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value))
const range = (value, start, end) => clamp((value - start) / (end - start))

export default function Home() {
  const storyRef = useRef(null)
  const sceneRef = useRef(null)
  const introRef = useRef(null)
  const qrRef = useRef(null)
  const orderRef = useRef(null)
  const kitchenRef = useRef(null)
  const ecosystemRef = useRef(null)
  const pointer = useRef({ x: 0, y: 0 })
  const pointerSmooth = useRef({ x: 0, y: 0 })
  const targetProgress = useRef(0)
  const currentProgress = useRef(0)
  const raf = useRef(0)

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

  useEffect(() => {
    const updateTargetProgress = () => {
      const story = storyRef.current
      if (!story) return

      const rect = story.getBoundingClientRect()
      const travel = story.offsetHeight - window.innerHeight
      targetProgress.current = clamp(-rect.top / Math.max(travel, 1))
    }

    updateTargetProgress()
    window.addEventListener('scroll', updateTargetProgress, { passive: true })
    window.addEventListener('resize', updateTargetProgress)

    return () => {
      window.removeEventListener('scroll', updateTargetProgress)
      window.removeEventListener('resize', updateTargetProgress)
    }
  }, [])

  useEffect(() => {
    const onPointerMove = (event) => {
      if (window.innerWidth <= 900) return

      pointer.current = {
        x: (event.clientX / window.innerWidth - .5) * 9,
        y: (event.clientY / window.innerHeight - .5) * -6,
      }
    }

    const show = (node, opacity, transform) => {
      if (!node) return
      node.style.opacity = String(opacity)
      node.style.transform = transform
    }

    const render = () => {
      const scrollEase = window.innerWidth <= 900 ? 0.12 : 0.075
      const pointerEase = 0.08

      currentProgress.current +=
        (targetProgress.current - currentProgress.current) * scrollEase

      pointerSmooth.current.x +=
        (pointer.current.x - pointerSmooth.current.x) * pointerEase
      pointerSmooth.current.y +=
        (pointer.current.y - pointerSmooth.current.y) * pointerEase

      const p = currentProgress.current
      const a = range(p, .12, .32)
      const b = range(p, .30, .50)
      const c = range(p, .48, .70)
      const d = range(p, .68, .94)

      const rx = -7 * a + 8 * b - 4 * c
      const ry = 10 * a - 18 * b + 12 * c - 4 * d
      const z = 80 * a - 45 * b - 20 * c + 10 * d

      if (sceneRef.current) {
        sceneRef.current.style.transform =
          `perspective(1100px) rotateX(${rx + pointerSmooth.current.y}deg) rotateY(${ry + pointerSmooth.current.x}deg) translateZ(${z}px)`
      }

      show(
        introRef.current,
        1 - range(p, .08, .23),
        `translate(-50%, calc(-50% - ${50 * range(p, .08, .23)}px))`,
      )

      show(
        qrRef.current,
        range(p, .14, .25) * (1 - range(p, .36, .46)),
        `translate3d(${40 - 40 * a}px, ${30 - 30 * a}px, ${120 * a}px) rotateY(${12 - 28 * a}deg)`,
      )

      show(
        orderRef.current,
        range(p, .31, .42) * (1 - range(p, .52, .62)),
        `translate3d(${-70 + 70 * b}px, ${40 - 40 * b}px, ${90 * b}px) rotateY(${-18 + 18 * b}deg)`,
      )

      show(
        kitchenRef.current,
        range(p, .49, .60) * (1 - range(p, .70, .80)),
        `translate3d(${80 - 80 * c}px, ${30 - 30 * c}px, ${70 * c}px) rotateY(${18 - 18 * c}deg)`,
      )

      show(
        ecosystemRef.current,
        range(p, .70, .84),
        `translate(-50%, -50%) translateY(${45 - 45 * d}px) scale(${.9 + .1 * d})`,
      )

      raf.current = requestAnimationFrame(render)
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true })
    raf.current = requestAnimationFrame(render)

    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      cancelAnimationFrame(raf.current)
    }
  }, [])

  return (
    <main>
      <Navbar />

      <section id="inicio" className="hero-section">
        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="hero-eyebrow hero-stagger">RESTAURANT OPERATING SYSTEM</div>
            <h1 className="hero-stagger">Restaurantes mais inteligentes <span>começam aqui.</span></h1>
            <p className="hero-stagger">Pedidos, mesas, pagamentos e gestão conectados em uma única experiência.</p>
            <div className="hero-actions hero-stagger">
              <Link to="/cadastro" className="th-btn th-btn--primary th-btn--lg">Começar agora <FiArrowRight /></Link>
              <a href="#fluxo" className="th-btn th-btn--glass th-btn--lg">Ver como funciona</a>
            </div>
          </div>

          <div className="hero-visual hero-stagger">
            <div className="hero-device scene-float">
              <div className="hero-device__top"><span>TableHub</span><span className="status-dot" /></div>
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

      <section id="fluxo" ref={storyRef} className="scroll-story">
        <div className="scroll-stage">
          <div ref={sceneRef} className="scene-3d">
            <div ref={introRef} className="story-intro">
              <span>UMA EXPERIÊNCIA CONTÍNUA</span>
              <h2>Do QR à gestão, o fluxo inteiro conectado.</h2>
              <p>Role a página para acompanhar o pedido avançando pelo TableHub.</p>
            </div>

            <article ref={qrRef} className="story-card story-card--qr">
              <div className="qr-code" aria-hidden="true">{Array.from({ length: 9 }).map((_, i) => <span key={i} />)}</div>
              <div><small>01 · MESA</small><h3>Escaneie o QR</h3><p>O cliente acessa o cardápio da própria mesa.</p></div>
            </article>

            <article ref={orderRef} className="story-card story-card--order">
              <small>02 · PEDIDO</small><h3>Pedido #1028</h3>
              <ul>
                <li><span>2x Smash Table</span><strong>R$ 48</strong></li>
                <li><span>1x Batata</span><strong>R$ 18</strong></li>
                <li><span>1x Bebida</span><strong>R$ 12,90</strong></li>
              </ul>
              <div className="story-total">Total <strong>R$ 78,90</strong></div>
            </article>

            <article ref={kitchenRef} className="story-card story-card--kitchen">
              <small>03 · COZINHA</small><h3>Status em tempo real</h3>
              <div className="status-line is-done"><FiCheck /> Recebido</div>
              <div className="status-line is-active">Preparando</div>
              <div className="status-line">Pronto</div>
            </article>

            <article ref={ecosystemRef} className="ecosystem-card">
              <div className="ecosystem-center">TableHub</div>
              <span className="eco eco--one">Pedidos</span>
              <span className="eco eco--two">Mesas</span>
              <span className="eco eco--three">Financeiro</span>
              <span className="eco eco--four">Estoque</span>
              <span className="eco eco--five">Clientes</span>
              <div className="ecosystem-copy">
                <small>04 · GESTÃO</small>
                <h3>Do pedido à gestão. Tudo conectado.</h3>
                <Link className="th-btn th-btn--primary" to="/cadastro">Criar minha conta</Link>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section id="recursos" className="feature-section">
        <div className="container">
          <div className="feature-heading">
            <span>RECURSOS</span>
            <h2>Uma base preparada para o restaurante inteiro.</h2>
          </div>
          <div className="row g-4">
            {[
              ['Pedidos', 'Acompanhe cada pedido e seu status em tempo real.'],
              ['Mesas + QR', 'Gerencie mesas e a experiência de acesso por QR Code.'],
              ['Financeiro', 'Visualize faturamento, ticket médio e movimentações.'],
              ['Estoque', 'Organize produtos, disponibilidade e alertas de estoque.'],
            ].map(([title, text]) => (
              <div className="col-12 col-md-6" key={title}>
                <article className="feature-card"><span>TH</span><h3>{title}</h3><p>{text}</p></article>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="final-cta">
        <div className="container">
          <div className="final-cta__panel">
            <span>TABLEHUB</span>
            <h2>Pronto para reconstruir a experiência do seu restaurante?</h2>
            <Link to="/cadastro" className="th-btn th-btn--primary th-btn--lg">Criar conta <FiArrowRight /></Link>
          </div>
        </div>
      </section>
    </main>
  )
}
