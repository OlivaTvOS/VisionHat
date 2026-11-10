import { useState, type FormEvent } from 'react'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import { Icon } from '../../components/ui/Icons'
import { registrarAnalise } from '../../services/analises'

export default function Visao() {
  const [idDispositivo, setIdDispositivo] = useState('')
  const [referenciaImagem, setReferenciaImagem] = useState('')
  const [modeloIa, setModeloIa] = useState('')
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [salvando, setSalvando] = useState(false)

  async function registrar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const id = Number(idDispositivo)
    if (!Number.isInteger(id) || id <= 0) {
      setSucesso('')
      setErro('Informe um ID de dispositivo maior que zero.')
      return
    }

    setSalvando(true)
    setErro('')
    setSucesso('')
    try {
      await registrarAnalise({ idDispositivo: id, referenciaImagem: referenciaImagem || undefined, modeloIa: modeloIa || undefined })
      setSucesso('Análise registrada como pendente. O processamento poderá ser conectado ao serviço de IA posteriormente.')
      setReferenciaImagem('')
      setModeloIa('')
    } catch (error: unknown) {
      setErro(error instanceof Error ? error.message : 'Não foi possível registrar a análise.')
    } finally {
      setSalvando(false)
    }
  }

  return <div className="space-y-6">
    <header><p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">Captura assistiva</p><h1 className="mt-2 text-3xl font-bold text-white">Nova análise</h1><p className="mt-2 text-slate-400">Registre uma captura para processamento posterior pelo VisionHat.</p></header>
    <Card className="max-w-3xl"><div className="mb-6 flex items-start gap-4 rounded-xl border border-blue-400/20 bg-blue-500/10 p-4"><Icon name="vision" className="mt-0.5 h-6 w-6 shrink-0 text-blue-300" /><p className="text-sm leading-6 text-blue-100">Nesta etapa, a tela registra a análise no estado <strong>PENDENTE</strong>. A captura física e o processamento de IA serão conectados quando os módulos de hardware e IA estiverem prontos.</p></div><form className="space-y-5" onSubmit={registrar}><Input label="ID do dispositivo" type="number" min="1" required value={idDispositivo} onChange={(event) => setIdDispositivo(event.target.value)} placeholder="Ex.: 1" /><Input label="Referência da imagem (opcional)" value={referenciaImagem} onChange={(event) => setReferenciaImagem(event.target.value)} placeholder="Caminho, URL ou identificador externo" /><Input label="Modelo de IA (opcional)" value={modeloIa} onChange={(event) => setModeloIa(event.target.value)} placeholder="Ex.: modelo-vision-01" />{erro && <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{erro}</p>}{sucesso && <p className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{sucesso}</p>}<Button type="submit" disabled={salvando}>{salvando ? 'Registrando...' : 'Registrar análise pendente'}</Button></form></Card>
  </div>
}
