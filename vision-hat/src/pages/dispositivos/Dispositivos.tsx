import { useState, type FormEvent } from 'react'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import { Icon } from '../../components/ui/Icons'
import { listarDispositivosDoUsuario } from '../../services/dispositivos'
import type { Dispositivo } from '../../types'

function formatarData(data: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(data))
}

export default function Dispositivos() {
  const [idUsuario, setIdUsuario] = useState('')
  const [dispositivos, setDispositivos] = useState<Dispositivo[]>([])
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [consultado, setConsultado] = useState(false)

  async function consultar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const id = Number(idUsuario)
    if (!Number.isInteger(id) || id <= 0) {
      setErro('Informe um ID de usuário maior que zero.')
      setDispositivos([])
      setConsultado(false)
      return
    }

    setCarregando(true)
    setErro('')
    try {
      setDispositivos(await listarDispositivosDoUsuario(id))
      setConsultado(true)
    } catch (error: unknown) {
      setDispositivos([])
      setConsultado(false)
      setErro(error instanceof Error ? error.message : 'Não foi possível consultar os dispositivos.')
    } finally {
      setCarregando(false)
    }
  }

  return <div className="space-y-6">
    <header><p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">Inventário</p><h1 className="mt-2 text-3xl font-bold text-white">Dispositivos</h1><p className="mt-2 text-slate-400">Consulte os óculos cadastrados para um usuário.</p></header>
    <Card><form className="flex flex-col gap-4 sm:flex-row sm:items-end" onSubmit={consultar}><Input label="ID do usuário" type="number" min="1" value={idUsuario} onChange={(event) => setIdUsuario(event.target.value)} placeholder="Ex.: 1" error={erro && !consultado ? erro : undefined} /><Button type="submit" disabled={carregando}>{carregando ? 'Consultando...' : 'Consultar dispositivos'}</Button></form></Card>
    {erro && consultado === false && <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{erro}</p>}
    {consultado && dispositivos.length === 0 && <Card className="text-center"><Icon name="device" className="mx-auto h-10 w-10 text-slate-500" /><h2 className="mt-4 text-lg font-semibold text-white">Nenhum dispositivo encontrado</h2><p className="mt-2 text-sm text-slate-400">O usuário consultado ainda não possui dispositivos cadastrados.</p></Card>}
    {dispositivos.length > 0 && <section className="grid gap-4 md:grid-cols-2">{dispositivos.map((dispositivo) => <Card key={dispositivo.idDispositivo}><div className="flex items-start justify-between gap-4"><div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-400/10 text-emerald-300"><Icon name="device" /></div><div><h2 className="font-semibold text-white">{dispositivo.modelo}</h2><p className="text-sm text-slate-400">{dispositivo.identificador}</p></div></div><Badge variant={dispositivo.status === 'A' ? 'success' : 'neutral'}>{dispositivo.status === 'A' ? 'Ativo' : 'Inativo'}</Badge></div><p className="mt-5 text-xs text-slate-500">Cadastrado em {formatarData(dispositivo.dataCadastro)}</p></Card>)}</section>}
  </div>
}
