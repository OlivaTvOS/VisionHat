import type { HistoricoAnalise, HistoricoAnaliseCadastro } from '../types'
import { apiFetch } from './api'

export function listarAnalisesDoDispositivo(idDispositivo: number): Promise<HistoricoAnalise[]> {
  return apiFetch<HistoricoAnalise[]>(`/api/analises/dispositivo/${idDispositivo}`)
}

export function buscarAnalise(idAnalise: number): Promise<HistoricoAnalise> {
  return apiFetch<HistoricoAnalise>(`/api/analises/${idAnalise}`)
}

export function registrarAnalise(analise: HistoricoAnaliseCadastro): Promise<void> {
  return apiFetch<void>('/api/analises', { method: 'POST', body: JSON.stringify(analise) })
}
