import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { Icon } from '../../components/ui/Icons'
import Input from '../../components/ui/Input'
import { listarUsuarios } from '../../services/usuarios'

type StatusTeste = 'carregando' | 'ok' | 'pendente' | 'erro'

interface Teste {
  titulo: string
  descricao: string
  status: StatusTeste
  acao?: { label: string; destino: string }
}

interface Evidencia {
  id: number
  etapa: string
  resultado: 'Aprovado' | 'Atenção' | 'Pendente'
  observacao: string
  imagem: string | null
  nomeArquivo: string | null
  data: string
}

const chaveEvidencias = 'visionhat-evidencias'

function lerEvidencias(): Evidencia[] {
  try {
    const salvas = localStorage.getItem(chaveEvidencias)
    return salvas ? JSON.parse(salvas) as Evidencia[] : []
  } catch {
    return []
  }
}

const statusLabel: Record<StatusTeste, string> = {
  carregando: 'Verificando',
  ok: 'Validado',
  pendente: 'Evidência pendente',
  erro: 'Atenção necessária',
}

const statusVariant: Record<StatusTeste, 'success' | 'warning' | 'neutral' | 'danger'> = {
  carregando: 'neutral',
  ok: 'success',
  pendente: 'warning',
  erro: 'danger',
}

export default function Testes() {
  const [statusApi, setStatusApi] = useState<StatusTeste>('carregando')
  const [mensagemApi, setMensagemApi] = useState('Consultando /api/usuarios...')
  const [ultimaVerificacao, setUltimaVerificacao] = useState('')
  const [evidencias, setEvidencias] = useState<Evidencia[]>(lerEvidencias)
  const [etapa, setEtapa] = useState('')
  const [resultado, setResultado] = useState<Evidencia['resultado']>('Aprovado')
  const [observacao, setObservacao] = useState('')
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [erroEvidencia, setErroEvidencia] = useState('')

  async function verificarApi() {
    setStatusApi('carregando')
    setMensagemApi('Consultando /api/usuarios...')
    try {
      await listarUsuarios()
      setStatusApi('ok')
      setMensagemApi('A API Java respondeu corretamente à consulta de usuários.')
      setUltimaVerificacao(new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'medium' }).format(new Date()))
    } catch (error: unknown) {
      setStatusApi('erro')
      setMensagemApi(error instanceof Error ? error.message : 'Não foi possível consultar a API Java.')
    }
  }

  useEffect(() => {
    let ativo = true
    listarUsuarios().then(() => {
      if (!ativo) return
      setStatusApi('ok')
      setMensagemApi('A API Java respondeu corretamente à consulta de usuários.')
      setUltimaVerificacao(new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'medium' }).format(new Date()))
    }).catch((error: unknown) => {
      if (!ativo) return
      setStatusApi('erro')
      setMensagemApi(error instanceof Error ? error.message : 'Não foi possível consultar a API Java.')
    })
    return () => { ativo = false }
  }, [])

  function selecionarArquivo(event: ChangeEvent<HTMLInputElement>) {
    setArquivo(event.target.files?.[0] ?? null)
    setErroEvidencia('')
  }

  function salvarEvidencia(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const etapaLimpa = etapa.trim()
    const observacaoLimpa = observacao.trim()
    if (!etapaLimpa || !observacaoLimpa) {
      setErroEvidencia('Informe a etapa e a observação do teste.')
      return
    }
    if (arquivo && arquivo.size > 1024 * 1024) {
      setErroEvidencia('A imagem deve ter no máximo 1 MB para ser guardada no navegador.')
      return
    }

    const concluir = (imagem: string | null) => {
      const novaEvidencia: Evidencia = { id: Date.now(), etapa: etapaLimpa, resultado, observacao: observacaoLimpa, imagem, nomeArquivo: arquivo?.name ?? null, data: new Date().toISOString() }
      const atualizadas = [novaEvidencia, ...evidencias]
      setEvidencias(atualizadas)
      localStorage.setItem(chaveEvidencias, JSON.stringify(atualizadas))
      setEtapa('')
      setResultado('Aprovado')
      setObservacao('')
      setArquivo(null)
      setErroEvidencia('')
      const campoArquivo = event.currentTarget.elements.namedItem('imagem') as HTMLInputElement | null
      if (campoArquivo) campoArquivo.value = ''
    }

    if (!arquivo) {
      concluir(null)
      return
    }
    const leitor = new FileReader()
    leitor.onload = () => concluir(typeof leitor.result === 'string' ? leitor.result : null)
    leitor.readAsDataURL(arquivo)
  }

  const testes: Teste[] = [
    { titulo: 'Interface carregada', descricao: 'O painel, a navegação e os componentes do frontend foram renderizados.', status: 'ok' },
    { titulo: 'Acesso autenticado', descricao: 'A sessão local permite acessar as páginas protegidas do painel.', status: sessionStorage.getItem('visionhat-auth') === 'true' ? 'ok' : 'erro', acao: { label: 'Ir para o login', destino: '/login' } },
    { titulo: 'Integração com a API Java', descricao: mensagemApi, status: statusApi },
    { titulo: 'Persistência Oracle', descricao: 'A confirmação depende da consulta ou cadastro executado com a API conectada ao banco.', status: statusApi === 'ok' ? 'ok' : statusApi === 'erro' ? 'pendente' : 'carregando', acao: { label: 'Consultar usuários', destino: '/usuarios' } },
    { titulo: 'Fluxo de análise visual', descricao: 'A integração está implementada. Execute uma análise com uma chave válida para confirmar a resposta do provedor configurado.', status: 'ok', acao: { label: 'Abrir nova análise', destino: '/visao' } },
    { titulo: 'Recebimento do arquivo de imagem', descricao: 'A API já recebe o arquivo JPEG por multipart/form-data e valida os casos inválidos; falta confirmar uma análise válida com o provedor.', status: 'ok', acao: { label: 'Abrir nova análise', destino: '/visao' } },
  ]

  return <div className="space-y-6">
    <header><p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">Validação do protótipo</p><h1 className="mt-2 text-3xl font-bold text-white">Testes e evidências</h1><p className="mt-2 max-w-3xl text-slate-400">Área para acompanhar os testes do frontend, da API Java e dos fluxos que serão demonstrados na entrega. Os prints finais podem ser adicionados a cada etapa depois da execução.</p></header>

    <Card className="border-blue-400/30 bg-blue-500/10"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><Icon name="info" className="mt-0.5 h-6 w-6 shrink-0 text-blue-300" /><div><h2 className="font-semibold text-white">Roteiro de validação</h2><p className="mt-1 text-sm leading-6 text-blue-100">Execute cada fluxo, registre o resultado e capture a tela somente depois de confirmar a resposta apresentada.</p></div></div><Button variant="secondary" onClick={() => void verificarApi()}>Verificar API novamente</Button></div>{ultimaVerificacao && <p className="mt-4 text-xs text-blue-200/70">Última verificação: {ultimaVerificacao}</p>}</Card>

    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{testes.map((teste, index) => <Card key={teste.titulo} className="flex h-full flex-col"><div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-slate-700 text-sm font-bold text-slate-200">{index + 1}</span><h2 className="font-semibold text-white">{teste.titulo}</h2></div><Badge variant={statusVariant[teste.status]}>{statusLabel[teste.status]}</Badge></div><p className="mt-4 flex-1 text-sm leading-6 text-slate-400">{teste.descricao}</p>{teste.acao && <Link to={teste.acao.destino} className="mt-5 text-sm font-semibold text-blue-300 transition hover:text-blue-200">{teste.acao.label} →</Link>}</Card>)}</section>

    <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <Card><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-400/10 text-violet-300"><Icon name="history" /></div><div><h2 className="font-semibold text-white">Como registrar uma evidência</h2><p className="text-sm text-slate-400">Sequência recomendada para o relatório.</p></div></div><ol className="mt-5 space-y-4 text-sm text-slate-300"><li><span className="mr-2 font-bold text-violet-300">1.</span> Informe os dados de teste ou selecione um ID exibido pelo sistema.</li><li><span className="mr-2 font-bold text-violet-300">2.</span> Execute a ação e aguarde a mensagem de sucesso ou erro.</li><li><span className="mr-2 font-bold text-violet-300">3.</span> Confirme o resultado no banco/API quando o fluxo exigir persistência.</li><li><span className="mr-2 font-bold text-violet-300">4.</span> Capture a tela com o resultado visível e identifique a etapa no documento.</li></ol></Card>
      <Card><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-400/10 text-emerald-300"><Icon name="vision" /></div><div><h2 className="font-semibold text-white">Estado da integração</h2><p className="text-sm text-slate-400">Resumo da conexão no navegador.</p></div></div><div className="mt-5 space-y-3 text-sm"><div className="flex items-center justify-between border-b border-slate-700/70 pb-3"><span className="text-slate-400">Frontend</span><Badge variant="success">Disponível</Badge></div><div className="flex items-center justify-between border-b border-slate-700/70 pb-3"><span className="text-slate-400">API Java</span><Badge variant={statusVariant[statusApi]}>{statusLabel[statusApi]}</Badge></div><div className="flex items-center justify-between"><span className="text-slate-400">Banco Oracle</span><Badge variant={statusApi === 'ok' ? 'success' : 'warning'}>{statusApi === 'ok' ? 'Indiretamente validado' : 'A confirmar'}</Badge></div></div></Card>
    </section>

    <Card><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-400/10 text-amber-300"><Icon name="vision" /></div><div><h2 className="font-semibold text-white">Registrar evidência</h2><p className="text-sm text-slate-400">Guarde o resultado e, opcionalmente, o print do teste neste navegador.</p></div></div><form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={salvarEvidencia}><Input label="Etapa testada" value={etapa} onChange={(event) => setEtapa(event.target.value)} placeholder="Ex.: Cadastro de usuário válido" /><label className="flex flex-col gap-2 text-sm font-medium text-slate-300"><span>Resultado</span><select className="rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-slate-100 outline-none focus:border-blue-500" value={resultado} onChange={(event) => setResultado(event.target.value as Evidencia['resultado'])}><option>Aprovado</option><option>Atenção</option><option>Pendente</option></select></label><label className="flex flex-col gap-2 text-sm font-medium text-slate-300 md:col-span-2"><span>Observação</span><textarea className="min-h-24 rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-slate-100 outline-none placeholder:text-slate-500 focus:border-blue-500" value={observacao} onChange={(event) => setObservacao(event.target.value)} placeholder="Descreva o que foi executado e qual resultado apareceu." /></label><Input className="md:col-span-2 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white" label="Print do teste (opcional, PNG/JPG até 1 MB)" name="imagem" type="file" accept="image/png,image/jpeg,image/webp" onChange={selecionarArquivo} />{erroEvidencia && <p className="md:col-span-2 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{erroEvidencia}</p>}<Button className="md:col-span-2" type="submit">Salvar evidência</Button></form></Card>

    {evidencias.length > 0 && <section><div className="mb-4 flex items-center justify-between gap-4"><div><h2 className="text-2xl font-bold text-white">Evidências registradas</h2><p className="mt-1 text-sm text-slate-400">Ficam salvas apenas neste navegador para apoiar a revisão do relatório.</p></div><Badge variant="neutral">{evidencias.length} {evidencias.length === 1 ? 'registro' : 'registros'}</Badge></div><div className="grid gap-4 md:grid-cols-2">{evidencias.map((evidencia) => <Card key={evidencia.id}><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold text-white">{evidencia.etapa}</h3><p className="mt-1 text-xs text-slate-500">{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(evidencia.data))}</p></div><Badge variant={evidencia.resultado === 'Aprovado' ? 'success' : evidencia.resultado === 'Atenção' ? 'danger' : 'warning'}>{evidencia.resultado}</Badge></div><p className="mt-4 text-sm leading-6 text-slate-300">{evidencia.observacao}</p>{evidencia.imagem && <img className="mt-4 max-h-64 w-full rounded-xl border border-slate-700 object-contain" src={evidencia.imagem} alt={`Print da evidência: ${evidencia.etapa}`} />}{evidencia.nomeArquivo && <p className="mt-3 text-xs text-slate-500">Arquivo: {evidencia.nomeArquivo}</p>}</Card>)}</div></section>}
  </div>
}
