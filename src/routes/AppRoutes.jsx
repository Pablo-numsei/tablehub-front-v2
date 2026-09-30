import { Navigate, Route, Routes } from 'react-router-dom'
import Home from '../pages/Home/Home.jsx'
import ComoFunciona from '../pages/ComoFunciona/ComoFunciona.jsx'
import Recursos from '../pages/Recursos/Recursos.jsx'
import Login from '../pages/Login/Login.jsx'
import Register from '../pages/Register/Register.jsx'
import Dashboard from '../pages/Dashboard/Dashboard.jsx'
import Pedidos from '../pages/Pedidos/Pedidos.jsx'
import Mesas from '../pages/Mesas/Mesas.jsx'
import Cardapio from '../pages/Cardapio/Cardapio.jsx'
import Clientes from '../pages/Clientes/Clientes.jsx'
import Financeiro from '../pages/Financeiro/Financeiro.jsx'
import Estoque from '../pages/Estoque/Estoque.jsx'
import Atendimento from '../pages/Atendimento/Atendimento.jsx'
import MenuCliente from '../pages/MenuCliente/MenuCliente.jsx'
import CarrinhoCliente from '../pages/CarrinhoCliente/CarrinhoCliente.jsx'
import ConfirmarPedido from '../pages/ConfirmarPedido/ConfirmarPedido.jsx'
import PedidoConfirmado from '../pages/PedidoConfirmado/PedidoConfirmado.jsx'
import PagamentoCliente from '../pages/PagamentoCliente/PagamentoCliente.jsx'
import ComprovanteCliente from '../pages/ComprovanteCliente/ComprovanteCliente.jsx'
import AcompanharPedido from '../pages/AcompanharPedido/AcompanharPedido.jsx'
import ChamarGarcom from '../pages/ChamarGarcom/ChamarGarcom.jsx'
import SolicitarConta from '../pages/SolicitarConta/SolicitarConta.jsx'
import HistoricoCliente from '../pages/HistoricoCliente/HistoricoCliente.jsx'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/como-funciona" element={<ComoFunciona />} />
      <Route path="/recursos" element={<Recursos />} />

      <Route path="/login" element={<Login />} />
      <Route path="/cadastro" element={<Register />} />

      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/pedidos" element={<Pedidos />} />
      <Route path="/atendimento" element={<Atendimento />} />
      <Route path="/clientes" element={<Clientes />} />
      <Route path="/financeiro" element={<Financeiro />} />
      <Route path="/cardapio" element={<Cardapio />} />
      <Route path="/menu" element={<MenuCliente />} />
      <Route path="/carrinho" element={<CarrinhoCliente />} />
      <Route path="/confirmar-pedido" element={<ConfirmarPedido />} />
      <Route path="/pedido-confirmado" element={<PedidoConfirmado />} />
      <Route path="/pagamento" element={<PagamentoCliente />} />
      <Route path="/comprovante" element={<ComprovanteCliente />} />
      <Route path="/acompanhar-pedido" element={<AcompanharPedido />} />
      <Route path="/chamar-garcom" element={<ChamarGarcom />} />
      <Route path="/solicitar-conta" element={<SolicitarConta />} />
      <Route path="/historico" element={<HistoricoCliente />} />
      <Route path="/mesas" element={<Mesas />} />
      <Route path="/estoque" element={<Estoque />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
