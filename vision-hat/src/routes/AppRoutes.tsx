import { Route, Routes } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import PlaceholderPage from '../pages/PlaceholderPage'
import Home from '../pages/home/Home'
import Dispositivos from '../pages/dispositivos/Dispositivos'
import Historico from '../pages/historico/Historico'

export default function AppRoutes() {
  return <Routes><Route element={<AppLayout />}><Route path="/" element={<Home />} /><Route path="/visao" element={<PlaceholderPage title="Visão" description="A captura e a análise visual serão conectadas ao backend no próximo bloco." />} /><Route path="/historico" element={<Historico />} /><Route path="/dispositivos" element={<Dispositivos />} /><Route path="/sobre" element={<PlaceholderPage title="Sobre o projeto" description="A apresentação institucional do VisionHat será refinada em um bloco posterior." />} /><Route path="/ocorrencias" element={<PlaceholderPage title="Ocorrências" description="As ocorrências detectadas serão exibidas nesta área após a integração com a API." />} /><Route path="*" element={<PlaceholderPage title="Página não encontrada" description="A rota informada não existe no VisionHat." />} /></Route></Routes>
}
