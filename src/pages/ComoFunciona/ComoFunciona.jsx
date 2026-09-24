import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { FiArrowLeft, FiArrowRight, FiCheck } from 'react-icons/fi'
import PageNavbar from '../../components/layout/PageNavbar.jsx'
import './ComoFunciona.css'

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value))
const range = (value, start, end) => clamp((value - start) / (end - start))

export default function ComoFunciona() {
  const storyRef = useRef(null)
  const sceneRef = useRef(null)
  const introRef = useRef(null)
  const qrRef = useRef(null)
  const orderRef = useRef(null)
  const kitchenRef = useRef(null)
  const ecosystemRef = useRef(null)
  const targetProgress = useRef(0)
  const currentProgress = useRef(0)
  const pointer = useRef({ x: 0, y: 0 })
  const pointerSmooth = useRef({ x: 0, y: 0 })
  const raf = useRef(0)

  useEffect(() => {
    const updateTarget = () => {
      const story = storyRef.current
      if (!story) return

      const rect = story.getBoundingClientRect()
      const travel = story.offsetHeight - window.innerHeight
      targetProgress.current = clamp(-rect.top / Math.max(travel, 1))
    }

    updateTarget()
    window.addEventListener('scroll', updateTarget, { passive: true })
    window.addEventListener('resize', updateTarget)

    return () => {
      window.removeEventListener('scroll', updateTarget)
      window.removeEventListener('resize', updateTarget)
    }
  }, [])

  useEffect(() => {
    const onPointerMove = (event) => {
      if (window.innerWidth <= 900) return
      pointer.current = {
        x: (event.clientX / window.innerWidth - .5) * 5,
        y: (event.clientY / window.innerHeight - .5) * -4,
      }
    }

    const show = (node, opacity, transform) => {
      if (!node) return
      node.style.opacity = String(opacity)
      node.style.transform = transform
    }

    const render = () => {
      const scrollEase = window.innerWidth <= 900 ? .12 : .075
      currentProgress.current +=
        (targetProgress.current - currentProgress.current) * scrollEase

      pointerSmooth.current.x +=
        (pointer.current.x - pointerSmooth.current.x) * .08
      pointerSmooth.current.y +=
        (pointer.current.y - pointerSmooth.current.y) * .08

      const p = currentProgress.current
      const a = range(p, .12, .32)
      const b = range(p, .30, .50)
      const c = range(p, .48, .70)
      const d = range(p, .68, .94)

      if (sceneRef.current) {
        sceneRef.current.style.transform =
          `perspective(1200px) rotateX(${pointerSmooth.current.y}deg) rotateY(${pointerSmooth.current.x}deg)`
      }

      show(
        introRef.current,
        1 - range(p, .07, .21),
        `translate(-50%, -50%) translateY(${-40 * range(p, .07, .21)}px) scale(${1 - .04 * range(p, .07, .21)})`,
      )

      show(
        qrRef.current,
        range(p, .13, .25) * (1 - range(p, .34, .44)),
        `translate(-50%, -50%) translate3d(0, ${28 - 28 * a}px, ${120 * a}px) scale(${.9 + .1 * a}) rotateY(${12 - 12 * a}deg)`,
      )

      show(
        orderRef.current,
        range(p, .31, .43) * (1 - range(p, .52, .62)),
        `translate(-50%, -50%) translate3d(0, ${32 - 32 * b}px, ${110 * b}px) scale(${.9 + .1 * b}) rotateY(${-12 + 12 * b}deg)`,
      )

      show(
        kitchenRef.current,
        range(p, .50, .61) * (1 - range(p, .70, .80)),
        `translate(-50%, -50%) translate3d(0, ${32 - 32 * c}px, ${100 * c}px) scale(${.9 + .1 * c})`,
      )

      show(
        ecosystemRef.current,
        range(p, .70, .84),
        `translate(-50%, -50%) translateY(${40 - 40 * d}px) scale(${.9 + .1 * d})`,
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
    <main className="how-page">
      <PageNavbar
        title="Como funciona"
        previous={{ to: '/', label: 'Início' }}
        next={{ to: '/recursos', label: 'Recursos' }}
      />

      <section className="how-intro">
        <div className="container how-intro__content">
          <span>COMO FUNCIONA</span>
          <h1>Um pedido atravessa o restaurante sem perder o contexto.</h1>
          <p>
            O foco desta página é mostrar o fluxo do TableHub. A experiência permanece
            sincronizada ao scroll, mas agora todos os momentos acontecem no centro da tela.
          </p>
        </div>
      </section>

      <section ref={storyRef} className="how-story">
        <div className="how-stage">
          <div ref={sceneRef} className="how-scene">
            <div ref={introRef} className="how-story__intro">
              <span>FLUXO TABLEHUB</span>
              <h2>Do QR à gestão.</h2>
              <p>Role para acompanhar cada etapa.</p>
            </div>

            <article ref={qrRef} className="how-card how-card--qr">
              <div className="how-qr" aria-hidden="true">
                {Array.from({ length: 9 }).map((_, i) => <span key={i} />)}
              </div>
              <div>
                <small>01 · MESA</small>
                <h3>Escaneie o QR</h3>
                <p>O cliente abre o cardápio associado à própria mesa.</p>
              </div>
            </article>

            <article ref={orderRef} className="how-card">
              <small>02 · PEDIDO</small>
              <h3>Pedido #1028</h3>
              <ul className="how-order-list">
                <li><span>2x Smash Table</span><strong>R$ 48</strong></li>
                <li><span>1x Batata</span><strong>R$ 18</strong></li>
                <li><span>1x Bebida</span><strong>R$ 12,90</strong></li>
              </ul>
              <div className="how-total">Total <strong>R$ 78,90</strong></div>
            </article>

            <article ref={kitchenRef} className="how-card">
              <small>03 · COZINHA</small>
              <h3>Status em tempo real</h3>
              <div className="how-status is-done"><FiCheck /> Recebido</div>
              <div className="how-status is-active">Preparando</div>
              <div className="how-status">Pronto</div>
            </article>

            <article ref={ecosystemRef} className="how-ecosystem">
              <div className="how-ecosystem__core">TableHub</div>
              <span className="how-eco how-eco--one">Pedidos</span>
              <span className="how-eco how-eco--two">Mesas</span>
              <span className="how-eco how-eco--three">Financeiro</span>
              <span className="how-eco how-eco--four">Estoque</span>
              <span className="how-eco how-eco--five">Clientes</span>
              <div className="how-ecosystem__copy">
                <small>04 · GESTÃO</small>
                <h3>O pedido termina. Os dados continuam.</h3>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="page-pager">
        <div className="container page-pager__inner">
          <Link className="page-pager__link" to="/">
            <FiArrowLeft /> Início
          </Link>
          <Link className="page-pager__link page-pager__link--next" to="/recursos">
            Recursos <FiArrowRight />
          </Link>
        </div>
      </section>
    </main>
  )
}
