import { Link } from 'react-router-dom'
import { FiArrowLeft, FiArrowRight } from 'react-icons/fi'
import './PageNavbar.css'

export default function PageNavbar({
  title,
  previous = { to: '/', label: 'Início' },
  next,
}) {
  return (
    <header className="page-navbar">
      <div className="container page-navbar__inner">
        <Link className="page-navbar__brand" to="/">
          <span className="th-brand__mark">T</span>
          <span>TableHub</span>
        </Link>

        <span className="page-navbar__title">{title}</span>

        <nav className="page-navbar__controls" aria-label="Navegação entre páginas">
          {previous && (
            <Link className="page-navbar__link" to={previous.to}>
              <FiArrowLeft />
              <span>{previous.label}</span>
            </Link>
          )}

          {next && (
            <Link className="page-navbar__link page-navbar__link--next" to={next.to}>
              <span>{next.label}</span>
              <FiArrowRight />
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
