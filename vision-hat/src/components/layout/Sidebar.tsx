import { NavLink } from 'react-router-dom'
import { Icon } from '../ui/Icons'

interface SidebarProps { open: boolean; onClose: () => void }
const links = [
  { to: '/', label: 'Dashboard', icon: 'dashboard' as const },
  { to: '/visao', label: 'Visão', icon: 'vision' as const },
  { to: '/historico', label: 'Histórico', icon: 'history' as const },
  { to: '/dispositivos', label: 'Dispositivos', icon: 'device' as const },
  { to: '/sobre', label: 'Sobre o projeto', icon: 'info' as const },
]

export default function Sidebar({ open, onClose }: SidebarProps) {
  return <>
    {open && <button aria-label="Fechar menu" className="fixed inset-0 z-30 bg-slate-950/70 md:hidden" onClick={onClose} />}
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-700/60 bg-[#1b2638] px-5 py-6 transition-transform duration-200 md:static md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="mb-10 flex items-center gap-3 px-2"><div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-900/30"><Icon name="vision" className="h-6 w-6" /></div><div><p className="text-lg font-bold tracking-tight text-white">VisionHat</p><p className="text-xs text-slate-400">Assistive vision</p></div></div>
      <nav className="space-y-2" aria-label="Navegação principal">{links.map((link) => <NavLink key={link.to} to={link.to} end={link.to === '/'} onClick={onClose} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-950/30' : 'text-slate-300 hover:bg-slate-700/60 hover:text-white'}`}><Icon name={link.icon} /><span>{link.label}</span></NavLink>)}</nav>
      <div className="mt-auto rounded-2xl border border-red-400/20 bg-red-500/10 p-4"><div className="mb-3 flex items-center gap-2 text-red-300"><Icon name="alert" className="h-5 w-5" /><span className="text-sm font-semibold">Emergência</span></div><p className="text-xs leading-5 text-slate-400">Acesso rápido para registrar uma ocorrência.</p><button className="mt-4 w-full rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-400">Abrir ocorrência</button></div>
    </aside>
  </>
}
