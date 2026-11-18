import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import { Icon } from '../../components/ui/Icons'
import { analisarImagem } from '../../services/analises'
import type { AnaliseImagemResponse } from '../../types'

export default function Visao() {
  const [idDispositivo, setIdDispositivo] = useState('')
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [previsualizacao, setPrevisualizacao] = useState('')
  const previsualizacaoAtual = useRef('')
  const [resultado, setResultado] = useState<AnaliseImagemResponse | null>(null)
  const [erro, setErro] = useState('')
  const [analisando, setAnalisando] = useState(false)

  useEffect(() => () => {
    if (previsualizacaoAtual.current) URL.revokeObjectURL(previsualizacaoAtual.current)
  }, [])

  function atualizarPrevisualizacao(novoArquivo: File | null) {
    if (previsualizacaoAtual.current) URL.revokeObjectURL(previsualizacaoAtual.current)
    if (!novoArquivo) {
      previsualizacaoAtual.current = ''
      setPrevisualizacao('')
      return
    }
    const url = URL.createObjectURL(novoArquivo)
    previsualizacaoAtual.current = url
    setPrevisualizacao(url)
  }

  function selecionarArquivo(event: ChangeEvent<HTMLInputElement>) {
    const novoArquivo = event.target.files?.[0] ?? null
    setResultado(null)
    setErro('')

    if (!novoArquivo) {
      setArquivo(null)
      atualizarPrevisualizacao(null)
      return
    }
    if (novoArquivo.type !== 'image/jpeg') {
      setArquivo(null)
      atualizarPrevisualizacao(null)
      setErro('Selecione uma imagem JPEG (.jpg ou .jpeg).')
      return
    }
    if (novoArquivo.size > 5 * 1024 * 1024) {
      setArquivo(null)
      atualizarPrevisualizacao(null)
      setErro('A imagem deve ter no máximo 5 MB.')
      return
    }
    atualizarPrevisualizacao(novoArquivo)
    setArquivo(novoArquivo)
  }

  async function analisar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const id = Number(idDispositivo)
    if (!Number.isInteger(id) || id <= 0) {
      setErro('Informe um ID de dispositivo maior que zero.')
      return
    }
    if (!arquivo) {
      setErro('Selecione uma imagem JPEG antes de iniciar a análise.')
      return
    }

    setAnalisando(true)
    setErro('')
    setResultado(null)
    try {
      setResultado(await analisarImagem(id, arquivo))
    } catch (error: unknown) {
      setErro(error instanceof Error ? error.message : 'Não foi possível analisar a imagem.')
    } finally {
      setAnalisando(false)
    }
  }

  return <div className="space-y-6">
    <header><p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">Captura assistiva</p><h1 className="mt-2 text-3xl font-bold text-white">Análise de imagem</h1><p className="mt-2 text-slate-400">Envie uma imagem JPEG para receber uma descrição do modelo de IA configurado na API Java.</p></header>
    <Card className="max-w-3xl">
      <div className="mb-6 flex items-start gap-4 rounded-xl border border-blue-400/20 bg-blue-500/10 p-4"><Icon name="vision" className="mt-0.5 h-6 w-6 shrink-0 text-blue-300" /><p className="text-sm leading-6 text-blue-100">A imagem original será enviada diretamente ao backend. Se o modelo principal atingir um limite, a API poderá utilizar o próximo provedor configurado.</p></div>
      <form noValidate className="space-y-5" onSubmit={analisar}>
        <Input label="ID do dispositivo" type="number" min="1" required value={idDispositivo} onChange={(event) => setIdDispositivo(event.target.value)} placeholder="Ex.: 1" />
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-300"><span>Imagem JPEG</span><input className="rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-slate-100 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:font-semibold file:text-white" type="file" accept="image/jpeg,.jpg,.jpeg" onChange={selecionarArquivo} /><span className="text-xs font-normal text-slate-500">Formato aceito: JPG ou JPEG, até 5 MB.</span></label>
        {arquivo && <p className="text-sm text-slate-300">Arquivo selecionado: <span className="font-semibold text-white">{arquivo.name}</span></p>}
        {previsualizacao && <img className="max-h-72 w-full rounded-xl border border-slate-700 object-contain" src={previsualizacao} alt="Pré-visualização da imagem selecionada" />}
        {analisando && <p className="rounded-xl border border-blue-400/30 bg-blue-500/10 px-4 py-3 text-sm text-blue-100">Analisando imagem. Se necessário, outro modelo de IA poderá ser utilizado.</p>}
        {erro && <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{erro}</p>}
        <Button type="submit" disabled={analisando}>{analisando ? 'Analisando...' : 'Iniciar análise'}</Button>
      </form>
    </Card>
    {resultado && <Card className="max-w-3xl border-emerald-400/30"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">Resultado da análise</p><h2 className="mt-2 text-xl font-bold text-white">Descrição recebida da IA</h2></div><Badge variant="success">{resultado.status}</Badge></div><p className="mt-5 whitespace-pre-line leading-7 text-slate-200">{resultado.descricao}</p><div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-400"><span>Modelo utilizado: <strong className="text-slate-100">{resultado.modeloIa}</strong></span>{resultado.usouFallback && <span className="text-amber-300">O modelo principal estava indisponível. Foi utilizado um modelo alternativo.</span>}</div></Card>}
  </div>
}
