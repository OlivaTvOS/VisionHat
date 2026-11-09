import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function AppLayout() {
  const [menuAberto, setMenuAberto] = useState(false)
  return <div className="min-h-screen bg-[#0b1120] text-slate-200 md:flex"><Sidebar open={menuAberto} onClose={() => setMenuAberto(false)} /><div className="min-w-0 flex-1"><Topbar onMenu={() => setMenuAberto(true)} /><main className="mx-auto max-w-[1500px] p-5 sm:p-8"><Outlet /></main></div></div>
}
