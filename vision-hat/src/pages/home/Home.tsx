import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Badge from '../../components/ui/Badge'
import Card from '../../components/ui/Card'
import { Icon } from '../../components/ui/Icons'
import { listarUsuarios } from '../../services/usuarios'

export default function Home() {
  const [usuarios, setUsuarios] = useState(0)
  const [statusApi, setStatusApi] = useState<'carregando' | 'online' | 'offline'>('carregando')
  const [erroApi, setErroApi] = useState('')

  useEffect(() => {
    let ativo = true
    listarUsuarios().then((resposta) => {
      if (!ativo) return
      setUsuarios(resposta.length)
      setStatusApi('online')
    }).catch((error: unknown) => {
      if (!ativo) return
      setStatusApi('offline')
      setErroApi(error instanceof Error ? error.message : 'Não foi possível consultar a API Java.')
    })
    return () => { ativo = false }
  }, [])

  const indicadores = [
    { label: 'Usuários cadastrados', value: statusApi === 'carregando' ? '...' : String(usuarios), helper: 'Dados reais da API', icon: 'vision' as const, color: 'text-blue-400' },
    { label: 'Dispositivos', value: '—', helper: 'Consulte por usuário', icon: 'device' as const, color: 'text-emerald-400' },
    { label: 'Ocorrências', value: '—', helper: 'Consulte por análise', icon: 'alert' as const, color: 'text-amber-400' },
    { label: 'Histórico', value: '—', helper: 'Consulte por dispositivo', icon: 'history' as const, color: 'text-violet-400' },
  ]

  return <div className="space-y-8">
    <section className="rounded-2xl border border-emerald-400/70 bg-emerald-950/25 p-4 shadow-[0_0_24px_rgba(16,185,129,0.08)] sm:p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><span className="h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" /><p className="font-medium text-slate-100">Sistema pronto para receber uma análise</p></div><Link to="/visao" className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-white"><Icon name="vision" className="h-4 w-4" /> Abrir visão</Link></div></section>
    <section className="py-4 text-center sm:py-8"><div className="mx-auto mb-6 grid h-24 w-24 place-items-center rounded-full bg-blue-600 text-white shadow-xl shadow-blue-950/40"><Icon name="vision" className="h-12 w-12" /></div><p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-blue-400">Tecnologia assistiva</p><h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">VisionHat</h1><p className="mx-auto mt-4 max-w-2xl text-lg text-slate-400">Uma interface para acompanhar análises visuais, dispositivos e ocorrências do protótipo.</p></section>
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{indicadores.map((indicator) => <article key={indicator.label} className="rounded-2xl border border-slate-700/80 bg-[#1b2638] p-6"><div className="flex items-center justify-between"><p className="text-sm text-slate-400">{indicator.label}</p><Icon name={indicator.icon} className={`h-5 w-5 ${indicator.color}`} /></div><p className="mt-5 text-4xl font-bold text-white">{indicator.value}</p><p className="mt-2 text-sm text-slate-500">{indicator.helper}</p></article>)}</section>
    <Card><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Integração</p><h2 className="mt-2 text-xl font-bold text-white">API Java</h2><p className="mt-2 text-sm text-slate-400">O Dashboard consulta o backend sem duplicar dados no frontend.</p></div><Badge variant={statusApi === 'online' ? 'success' : statusApi === 'offline' ? 'danger' : 'warning'}>{statusApi === 'online' ? 'Conectada' : statusApi === 'offline' ? 'Indisponível' : 'Consultando...'}</Badge></div>{erroApi && <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-200">{erroApi}</p>}<div className="mt-5 flex flex-wrap gap-3"><Link to="/dispositivos" className="rounded-lg border border-slate-600 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-700">Consultar dispositivos</Link><Link to="/historico" className="rounded-lg border border-slate-600 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-700">Ver histórico</Link></div></Card>
    <section><h2 className="mb-4 text-2xl font-bold text-white">Ações rápidas</h2><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><QuickAction to="/visao" icon="vision" title="Nova análise" description="Iniciar uma captura visual" color="bg-blue-600" /><QuickAction to="/dispositivos" icon="device" title="Dispositivos" description="Consultar óculos cadastrados" color="bg-emerald-600" /><QuickAction to="/historico" icon="history" title="Histórico" description="Ver análises anteriores" color="bg-violet-600" /><QuickAction to="/ocorrencias" icon="alert" title="Ocorrências" description="Consultar detecções" color="bg-amber-600" /></div></section>
  </div>
}

function QuickAction({ to, icon, title, description, color }: { to: string; icon: 'vision' | 'device' | 'history' | 'alert'; title: string; description: string; color: string }) {
  return <Link to={to} className={`group rounded-2xl ${color} p-5 text-white shadow-lg shadow-slate-950/20 transition hover:-translate-y-1 hover:brightness-110`}><Icon name={icon} className="h-8 w-8" /><p className="mt-8 text-lg font-bold">{title}</p><p className="mt-1 text-sm text-white/75">{description}</p></Link>
}

