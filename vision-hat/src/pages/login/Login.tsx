import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import { autenticarUsuario } from '../../services/usuarios'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function entrar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!email.trim() || !senha.trim()) {
      setErro('Informe e-mail e senha para continuar.')
      return
    }

    setCarregando(true)
    setErro('')
    try {
      const usuario = await autenticarUsuario(email.trim(), senha)
      sessionStorage.setItem('visionhat-auth', 'true')
      sessionStorage.setItem('visionhat-user-id', String(usuario.idUsuario))
      sessionStorage.setItem('visionhat-user-name', usuario.nome)
      navigate(location.state?.from ?? '/')
    } catch (error: unknown) {
      setErro(error instanceof Error ? error.message : 'Não foi possível entrar. Verifique seus dados.')
    } finally {
      setCarregando(false)
    }
  }

  return <main className="grid min-h-screen place-items-center bg-[#0b1120] px-5 text-slate-200"><Card className="w-full max-w-md"><div className="text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-blue-600 text-2xl font-bold text-white">V</div><h1 className="mt-5 text-2xl font-bold text-white">Entrar no VisionHat</h1><p className="mt-2 text-sm text-slate-400">Acesse o painel assistivo do projeto.</p></div>{location.state?.cadastroConcluido && <p className="mt-5 text-sm text-emerald-300">Conta criada. Agora entre para continuar.</p>}<form noValidate className="mt-8 space-y-4" onSubmit={entrar}><Input label="E-mail" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Ex.: emília@email.com" /><Input label="Senha" type="password" value={senha} onChange={(event) => setSenha(event.target.value)} placeholder="Digite sua senha" />{erro && <p className="text-sm text-red-300">{erro}</p>}<Button className="w-full" type="submit" disabled={carregando}>{carregando ? 'Entrando...' : 'Entrar'}</Button></form><p className="mt-5 text-center text-sm text-slate-400">Ainda não possui conta? <Link className="font-semibold text-blue-400 hover:text-blue-300" to="/cadastro">Criar conta</Link></p></Card></main>
}
