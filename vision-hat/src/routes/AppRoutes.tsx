import { Route, Routes } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import PlaceholderPage from '../pages/PlaceholderPage'
import Home from '../pages/home/Home'
import Dispositivos from '../pages/dispositivos/Dispositivos'
import Historico from '../pages/historico/Historico'
import Ocorrencias from '../pages/ocorrencias/Ocorrencias'
import Visao from '../pages/visao/Visao'
import Sobre from '../pages/sobre/Sobre'
import Faq from '../pages/faq/Faq'
import Contato from '../pages/contato/Contato'
import Integrantes from '../pages/integrantes/Integrantes'
import Usuarios from '../pages/usuarios/Usuarios'
import Login from '../pages/login/Login'
import RequireAuth from './RequireAuth'
import Cadastro from '../pages/cadastro/Cadastro'
import Testes from '../pages/testes/Testes'

export default function AppRoutes() {
  return <Routes><Route path="/login" element={<Login />} /><Route path="/cadastro" element={<Cadastro />} /><Route element={<RequireAuth />}><Route element={<AppLayout />}><Route path="/" element={<Home />} /><Route path="/visao" element={<Visao />} /><Route path="/historico" element={<Historico />} /><Route path="/dispositivos" element={<Dispositivos />} /><Route path="/usuarios" element={<Usuarios />} /><Route path="/testes" element={<Testes />} /><Route path="/sobre" element={<Sobre />} /><Route path="/faq" element={<Faq />} /><Route path="/contato" element={<Contato />} /><Route path="/integrantes" element={<Integrantes />} /><Route path="/ocorrencias" element={<Ocorrencias />} /><Route path="*" element={<PlaceholderPage title="Página não encontrada" description="A rota informada não existe no VisionHat." />} /></Route></Route></Routes>
}
