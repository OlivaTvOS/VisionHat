import { useState, type FormEvent } from 'react'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import { Icon } from '../../components/ui/Icons'
import { listarOcorrenciasDaAnalise } from '../../services/ocorrencias'
import type { NivelAtencao, Ocorrencia } from '../../types'

const nivelLabel: Record<NivelAtencao, string> = { BAIXO: 'Baixo', MEDIO: 'Médio', ALTO: 'Alto', INDETERMINADO: 'Indeterminado' }
const nivelVariant: Record<NivelAtencao, 'success' | 'warning' | 'danger' | 'neutral'> = { BAIXO: 'success', MEDIO: 'warning', ALTO: 'danger', INDETERMINADO: 'neutral' }

export default function Ocorrencias() {
  const [idAnalise, setIdAnalise] = useState('')
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([])
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [consultado, setConsultado] = useState(false)

  async function consultar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const id = Number(idAnalise)
    if (!Number.isInteger(id) || id <= 0) {
      setErro('Informe um ID de análise maior que zero.')
      setOcorrencias([])
      setConsultado(false)
      return
    }

    setCarregando(true)
    setErro('')
    try {
      setOcorrencias(await listarOcorrenciasDaAnalise(id))
      setConsultado(true)
    } catch (error: unknown) {
      setOcorrencias([])
      setConsultado(false)
      setErro(error instanceof Error ? error.message : 'Não foi possível consultar as ocorrências.')
    } finally {
      setCarregando(false)
    }
  }

  return <div className="space-y-6">
    <header><p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">Detecções</p><h1 className="mt-2 text-3xl font-bold text-white">Ocorrências</h1><p className="mt-2 text-slate-400">Consulte os obstáculos identificados em uma análise.</p></header>
    <Card><form className="flex flex-col gap-4 sm:flex-row sm:items-end" onSubmit={consultar}><Input label="ID da análise" type="number" min="1" value={idAnalise} onChange={(event) => setIdAnalise(event.target.value)} placeholder="Ex.: 1" /><Button type="submit" disabled={carregando}>{carregando ? 'Consultando...' : 'Consultar ocorrências'}</Button></form></Card>
    {erro && <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{erro}</p>}
    {consultado && ocorrencias.length === 0 && <Card className="text-center"><Icon name="alert" className="mx-auto h-10 w-10 text-slate-500" /><h2 className="mt-4 text-lg font-semibold text-white">Nenhuma ocorrência encontrada</h2><p className="mt-2 text-sm text-slate-400">A análise consultada não possui obstáculos registrados.</p></Card>}
    {ocorrencias.length > 0 && <section className="grid gap-4 md:grid-cols-2">{ocorrencias.map((ocorrencia) => <Card key={ocorrencia.idOcorrencia}><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Ocorrência #{ocorrencia.idOcorrencia}</p><h2 className="mt-2 text-lg font-semibold text-white">{ocorrencia.descricao}</h2></div><Badge variant={nivelVariant[ocorrencia.nivelAtencao]}>{nivelLabel[ocorrencia.nivelAtencao]}</Badge></div><div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-400"><span>Confiança: <strong className="text-slate-200">{ocorrencia.confianca === null ? 'não informada' : `${ocorrencia.confianca}%`}</strong></span>{ocorrencia.idTipoObstaculo !== null && <span>Tipo: <strong className="text-slate-200">#{ocorrencia.idTipoObstaculo}</strong></span>}</div></Card>)}</section>}
  </div>
}
