import Card from '../../components/ui/Card'
import { Icon } from '../../components/ui/Icons'

export default function Contato() { return <div className="space-y-6"><header><p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">Comunicação</p><h1 className="mt-2 text-3xl font-bold text-white">Contato</h1><p className="mt-2 text-slate-400">Espaço reservado para os canais de apresentação e acompanhamento do projeto.</p></header><Card className="max-w-2xl"><Icon name="info" className="h-8 w-8 text-blue-400" /><h2 className="mt-5 text-xl font-bold text-white">Projeto acadêmico VisionHat</h2><p className="mt-3 leading-7 text-slate-400">As informações de contato da equipe e os links de entrega serão adicionados na etapa de documentação final.</p></Card></div> }
