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
          `perspective(1200px) rotateX(${pointerSmooth.current.y * .3}deg) rotateY(${pointerSmooth.current.x * .3}deg)`
      }

      show(
        introRef.current,
        1 - range(p, .07, .21),
        `translateY(${-40 * range(p, .07, .21)}px) scale(${1 - .04 * range(p, .07, .21)})`,
      )

      show(
        qrRef.current,
        range(p, .13, .25) * (1 - range(p, .34, .44)),
        `translate3d(0, ${28 - 28 * a}px, ${120 * a}px) scale(${.9 + .1 * a}) rotateY(${12 - 12 * a}deg)`,
      )

      show(
        orderRef.current,
        range(p, .31, .43) * (1 - range(p, .52, .62)),
        `translate3d(0, ${32 - 32 * b}px, ${110 * b}px) scale(${.9 + .1 * b}) rotateY(${-12 + 12 * b}deg)`,
      )

      show(
        kitchenRef.current,
        range(p, .50, .61) * (1 - range(p, .70, .80)),
        `translate3d(0, ${32 - 32 * c}px, ${100 * c}px) scale(${.9 + .1 * c})`,
      )

      show(
        ecosystemRef.current,
        range(p, .70, .84),
        `translateY(${28 - 28 * d}px) scale(${.9 + .1 * d})`,
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
          <span>CONHEÇA O TABLEHUB</span>
          <h1>Do pedido à entrega, tudo conectado em um só sistema.</h1>
          <p>
            O TableHub conecta clientes, cozinha e equipe de atendimento.
            Pelo QR Code da mesa, o cliente consulta o cardápio digital,
            realiza pedidos e acompanha o preparo. A equipe gerencia
            pedidos, mesas, estoque e atendimentos em um único sistema.
          </p>
        </div>
      </section>

      <section ref={storyRef} className="how-story">
        <div className="how-stage">
          <div ref={sceneRef} className="how-scene">
            <div ref={introRef} className="how-story__intro">
              <span>A EXPERIÊNCIA TABLEHUB</span>
              <h2>Do QR Code à gestão do restaurante.</h2>
              <p>Uma jornada integrada para clientes e equipe.</p>
            </div>

            <article ref={qrRef} className="how-card how-card--qr">
              <div className="how-qr" aria-hidden="true">
                {Array.from({ length: 9 }).map((_, i) => <span key={i} />)}
              </div>
              <div>
                <small>01 · ACESSO À MESA</small>
                <h3>Escaneie o QR Code</h3>
                <p>O QR Code identifica a mesa e permite consultar o cardápio digital sem instalar aplicativos.</p>
              </div>
            </article>

            <article ref={orderRef} className="how-card">
              <small>02 · PEDIDO DIGITAL · EXEMPLO</small>
              <h3>Escolha, confira e envie</h3>
              <ul className="how-order-list">
                <li><span>2x Smash Table</span><strong>R$ 48</strong></li>
                <li><span>1x Batata</span><strong>R$ 18</strong></li>
                <li><span>1x Bebida</span><strong>R$ 12,90</strong></li>
              </ul>
              <div className="how-total">Total <strong>R$ 78,90</strong></div>
            </article>

            <article ref={kitchenRef} className="how-card">
              <small>03 · COZINHA E ENTREGA</small>
              <h3>Acompanhe cada etapa</h3>
              <div className="how-status is-done"><FiCheck /> Recebido</div>
              <div className="how-status is-active">Em preparo</div>
              <div className="how-status">Pronto</div>
              <div className="how-status">Entregue</div>
            </article>

            <article ref={ecosystemRef} className="how-ecosystem">
              <div className="how-ecosystem__core">TableHub</div>
              <span className="how-eco how-eco--one">Pedidos</span>
              <span className="how-eco how-eco--two">Mesas</span>
              <span className="how-eco how-eco--three">Financeiro</span>
              <span className="how-eco how-eco--four">Estoque</span>
              <span className="how-eco how-eco--five">Atendimento</span>
              <div className="how-ecosystem__copy">
                <small>04 · GESTÃO INTEGRADA</small>
                <h3>Mais controle para o restaurante.</h3>
                <p>Pedidos, mesas, estoque e solicitações de atendimento ficam conectados. Os pagamentos desta versão são simulados.</p>
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
