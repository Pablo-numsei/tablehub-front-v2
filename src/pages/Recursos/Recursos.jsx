import { Link } from 'react-router-dom'
import {
  FiArrowLeft,
  FiArrowRight,
  FiBarChart2,
  FiCreditCard,
  FiGrid,
  FiPackage,
  FiShoppingBag,
  FiUsers,
} from 'react-icons/fi'
import PageNavbar from '../../components/layout/PageNavbar.jsx'
import './Recursos.css'

const resources = [
  {
    icon: FiShoppingBag,
    title: 'Pedidos',
    text: 'Acompanhe o pedido da criação até a entrega, com status claros para a operação.',
  },
  {
    icon: FiGrid,
    title: 'Mesas + QR',
    text: 'Associe o atendimento à mesa e deixe o cliente entrar no cardápio pelo QR Code.',
  },
  {
    icon: FiCreditCard,
    title: 'Financeiro',
    text: 'Concentre pagamentos, faturamento e indicadores de venda no mesmo ambiente.',
  },
  {
    icon: FiPackage,
    title: 'Produtos e estoque',
    text: 'Controle disponibilidade, produtos, categorias e alertas de estoque.',
  },
  {
    icon: FiUsers,
    title: 'Clientes',
    text: 'Organize dados de clientes e tenha contexto sobre o histórico de pedidos.',
  },
  {
    icon: FiBarChart2,
    title: 'Visão da operação',
    text: 'Transforme atividade do restaurante em métricas úteis para o dia a dia.',
  },
]

export default function Recursos() {
  return (
    <main className="resources-page">
      <PageNavbar
        title="Recursos"
        previous={{ to: '/como-funciona', label: 'Como funciona' }}
        next={{ to: '/cadastro', label: 'Criar conta' }}
      />

      <section className="resources-hero">
        <div className="container resources-hero__content">
          <span>RECURSOS</span>
          <h1>Cada parte do restaurante conectada sem virar uma tela confusa.</h1>
          <p>
            Em vez de colocar tudo em uma longa sequência na Home, os recursos ficam
            concentrados em uma página própria e navegável.
          </p>
        </div>
      </section>

      <section className="resources-grid-section">
        <div className="container">
          <div className="resources-grid">
            {resources.map(({ icon: Icon, title, text }, index) => (
              <article className="resource-card" key={title}>
                <div className="resource-card__top">
                  <span className="resource-card__icon"><Icon /></span>
                  <small>0{index + 1}</small>
                </div>
                <h2>{title}</h2>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="resources-cta">
        <div className="container resources-cta__panel">
          <span>PRÓXIMA ETAPA</span>
          <h2>Agora você pode entrar ou criar uma conta.</h2>
          <Link className="th-btn th-btn--primary th-btn--lg" to="/cadastro">
            Criar conta <FiArrowRight />
          </Link>
        </div>
      </section>

      <section className="page-pager">
        <div className="container page-pager__inner">
          <Link className="page-pager__link" to="/como-funciona">
            <FiArrowLeft /> Como funciona
          </Link>
          <Link className="page-pager__link page-pager__link--next" to="/cadastro">
            Criar conta <FiArrowRight />
          </Link>
        </div>
      </section>
    </main>
  )
}
