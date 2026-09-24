import { NavLink } from 'react-router-dom'
import {
  FiBookOpen,
  FiCreditCard,
  FiGrid,
  FiHome,
  FiPackage,
  FiShoppingBag,
  FiUsers,
} from 'react-icons/fi'
import './ManagementSidebar.css'

const navItems = [
  ['Dashboard', '/dashboard', FiHome],
  ['Cardápio', '/cardapio', FiBookOpen],
  ['Pedidos', '/pedidos', FiShoppingBag],
  ['Clientes', '/clientes', FiUsers],
  ['Financeiro', '/financeiro', FiCreditCard],
  ['Mesas', '/mesas', FiGrid],
  ['Produtos / Estoque', '/estoque', FiPackage],
]

export default function ManagementSidebar() {
  return (
    <aside className="management-sidebar">
      <div className="management-brand">
        <span className="management-brand__mark">T</span>
        <span>TableHub</span>
      </div>

      <span className="management-sidebar__label">GESTÃO</span>

      <nav className="management-nav">
        {navItems.map(([label, path, Icon]) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `management-nav__item ${isActive ? 'is-active' : ''}`
            }
          >
            <Icon />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="management-user">
        <div className="management-user__avatar">A</div>
        <div>
          <strong>Administrador</strong>
          <small>TableHub</small>
        </div>
      </div>
    </aside>
  )
}
