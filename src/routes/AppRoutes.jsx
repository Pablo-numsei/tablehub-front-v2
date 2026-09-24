import { Navigate, Route, Routes } from 'react-router-dom'
import Home from '../pages/Home/Home.jsx'
import Login from '../pages/Login/Login.jsx'
import Register from '../pages/Register/Register.jsx'
import Dashboard from '../pages/Dashboard/Dashboard.jsx'
import PlaceholderPage from '../pages/Placeholder/PlaceholderPage.jsx'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/cadastro" element={<Register />} />

      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/pedidos" element={<PlaceholderPage title="Pedidos" />} />
      <Route path="/clientes" element={<PlaceholderPage title="Clientes" />} />
      <Route path="/financeiro" element={<PlaceholderPage title="Financeiro" />} />
      <Route path="/cardapio" element={<PlaceholderPage title="Cardápio" />} />
      <Route path="/mesas" element={<PlaceholderPage title="Mesas" />} />
      <Route path="/estoque" element={<PlaceholderPage title="Produtos / Estoque" />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
