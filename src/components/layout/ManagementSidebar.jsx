import { NavLink } from 'react-router-dom'
import {
  FiBell,
  FiBookOpen,
  FiCreditCard,
  FiGrid,
  FiHome,
  FiPackage,
  FiShoppingBag,
  FiUsers,
  FiLogOut,
  FiUserPlus,
} from 'react-icons/fi'
import ThemeToggle from './ThemeToggle.jsx'
import { useAuth } from '../auth/AuthProvider.jsx'
import { canAccessRoute } from '../../services/authSession.js'
import './ManagementSidebar.css'

const navItems = [
  ['Dashboard', '/dashboard', FiHome],
  ['Cardápio', '/cardapio', FiBookOpen],
  ['Pedidos', '/pedidos', FiShoppingBag],
  ['Atendimento', '/atendimento', FiBell],
  ['Clientes', '/clientes', FiUsers],
  ['Financeiro', '/financeiro', FiCreditCard],
  ['Mesas', '/mesas', FiGrid],
  ['Produtos / Estoque', '/estoque', FiPackage],
  ['Usuários', '/cadastro', FiUserPlus],
]

export default function ManagementSidebar() {
  const { user, logout } = useAuth()
  return (
    <aside className="management-sidebar">
      <div className="management-brand">
        <span className="management-brand__mark">T</span>
        <span>TableHub</span>
      </div>

      <span className="management-sidebar__label">GESTÃO</span>

      <nav className="management-nav">
        {navItems.filter(([, path]) => canAccessRoute(user?.role, path)).map(([label, path, Icon]) => (
          <NavLink
            key={path}
            to={path}
            aria-label={label}
            title={label}
            className={({ isActive }) =>
              `management-nav__item ${isActive ? 'is-active' : ''}`
            }
          >
            <Icon />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="management-theme">
        <ThemeToggle />
        <button className="management-logout" type="button" onClick={logout} aria-label="Sair da conta" title="Sair da conta"><FiLogOut /><span>Sair</span></button>
      </div>

      <div className="management-user">
        <div className="management-user__avatar">{user?.nome?.[0]?.toUpperCase() || 'U'}</div>
        <div>
          <strong>{user?.nome}</strong>
          <small>{user?.perfil}</small>
        </div>
      </div>
    </aside>
  )
}
