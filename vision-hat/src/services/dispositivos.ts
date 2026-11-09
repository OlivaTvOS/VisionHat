import type { Dispositivo, DispositivoCadastro } from '../types'
import { apiFetch } from './api'

export function listarDispositivosDoUsuario(idUsuario: number): Promise<Dispositivo[]> { return apiFetch<Dispositivo[]>(`/api/dispositivos/usuario/${idUsuario}`) }
export function buscarDispositivo(idDispositivo: number): Promise<Dispositivo> { return apiFetch<Dispositivo>(`/api/dispositivos/${idDispositivo}`) }
export function cadastrarDispositivo(dispositivo: DispositivoCadastro): Promise<void> { return apiFetch<void>('/api/dispositivos', { method: 'POST', body: JSON.stringify(dispositivo) }) }
