import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { FiMenu, FiX } from 'react-icons/fi'
import './Navbar.css'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`th-navbar ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="container th-navbar__inner">
        <Link className="th-brand" to="/" onClick={() => setOpen(false)}>
          <span className="th-brand__mark">T</span>
          <span>TableHub</span>
        </Link>

        <button
          type="button"
          className="th-navbar__toggle"
          aria-label="Abrir menu"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <FiX /> : <FiMenu />}
        </button>

        <nav className={`th-navbar__links ${open ? 'is-open' : ''}`}>
          <a href="#inicio" onClick={() => setOpen(false)}>Início</a>
          <a href="#fluxo" onClick={() => setOpen(false)}>Como funciona</a>
          <a href="#recursos" onClick={() => setOpen(false)}>Recursos</a>
          <NavLink to="/login" onClick={() => setOpen(false)}>Entrar</NavLink>
          <NavLink className="th-btn th-btn--primary" to="/cadastro" onClick={() => setOpen(false)}>
            Começar
          </NavLink>
        </nav>
      </div>
    </header>
  )
}
