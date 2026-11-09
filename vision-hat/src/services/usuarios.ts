import type { Usuario, UsuarioCadastro } from '../types'
import { apiFetch } from './api'

export function listarUsuarios(): Promise<Usuario[]> { return apiFetch<Usuario[]>('/api/usuarios') }
export function buscarUsuario(idUsuario: number): Promise<Usuario> { return apiFetch<Usuario>(`/api/usuarios/${idUsuario}`) }
export function cadastrarUsuario(usuario: UsuarioCadastro): Promise<void> { return apiFetch<void>('/api/usuarios', { method: 'POST', body: JSON.stringify(usuario) }) }
