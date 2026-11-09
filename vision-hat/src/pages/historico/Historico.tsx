import { useState, type FormEvent } from 'react'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import { Icon } from '../../components/ui/Icons'
import { listarAnalisesDoDispositivo } from '../../services/analises'
import type { HistoricoAnalise, StatusAnalise } from '../../types'

const statusLabel: Record<StatusAnalise, string> = { PENDENTE: 'Pendente', PROCESSANDO: 'Processando', CONCLUIDA: 'Concluída', FALHA: 'Falha' }
const statusVariant: Record<StatusAnalise, 'warning' | 'neutral' | 'success' | 'danger'> = { PENDENTE: 'warning', PROCESSANDO: 'neutral', CONCLUIDA: 'success', FALHA: 'danger' }

function formatarData(data: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(data))
}

export default function Historico() {
  const [idDispositivo, setIdDispositivo] = useState('')
  const [analises, setAnalises] = useState<HistoricoAnalise[]>([])
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [consultado, setConsultado] = useState(false)

  async function consultar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const id = Number(idDispositivo)
    if (!Number.isInteger(id) || id <= 0) {
      setErro('Informe um ID de dispositivo maior que zero.')
      setAnalises([])
      setConsultado(false)
      return
    }

    setCarregando(true)
    setErro('')
    try {
      setAnalises(await listarAnalisesDoDispositivo(id))
      setConsultado(true)
    } catch (error: unknown) {
      setAnalises([])
      setConsultado(false)
      setErro(error instanceof Error ? error.message : 'Não foi possível consultar o histórico.')
    } finally {
      setCarregando(false)
    }
  }

  return <div className="space-y-6">
    <header><p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">Acompanhamento</p><h1 className="mt-2 text-3xl font-bold text-white">Histórico de análises</h1><p className="mt-2 text-slate-400">Consulte as capturas e os resultados registrados para um dispositivo.</p></header>
    <Card><form className="flex flex-col gap-4 sm:flex-row sm:items-end" onSubmit={consultar}><Input label="ID do dispositivo" type="number" min="1" value={idDispositivo} onChange={(event) => setIdDispositivo(event.target.value)} placeholder="Ex.: 1" /><Button type="submit" disabled={carregando}>{carregando ? 'Consultando...' : 'Consultar histórico'}</Button></form></Card>
    {erro && <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{erro}</p>}
    {consultado && analises.length === 0 && <Card className="text-center"><Icon name="history" className="mx-auto h-10 w-10 text-slate-500" /><h2 className="mt-4 text-lg font-semibold text-white">Nenhuma análise encontrada</h2><p className="mt-2 text-sm text-slate-400">Este dispositivo ainda não possui registros no histórico.</p></Card>}
    {analises.length > 0 && <section className="space-y-4">{analises.map((analise) => <Card key={analise.idAnalise}><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Análise #{analise.idAnalise}</p><h2 className="mt-1 text-lg font-semibold text-white">{analise.descricaoIa || 'Análise sem descrição'}</h2><p className="mt-1 text-sm text-slate-400">{formatarData(analise.dataHora)}</p></div><Badge variant={statusVariant[analise.status]}>{statusLabel[analise.status]}</Badge></div>{analise.modeloIa && <p className="mt-4 text-sm text-slate-400">Modelo: <span className="text-slate-200">{analise.modeloIa}</span></p>}{analise.erroProcessamento && <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-200">{analise.erroProcessamento}</p>}</Card>)}</section>}
  </div>
}
