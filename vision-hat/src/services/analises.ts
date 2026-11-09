import type { HistoricoAnalise } from '../types'
import { apiFetch } from './api'

export function listarAnalisesDoDispositivo(idDispositivo: number): Promise<HistoricoAnalise[]> {
  return apiFetch<HistoricoAnalise[]>(`/api/analises/dispositivo/${idDispositivo}`)
}

export function buscarAnalise(idAnalise: number): Promise<HistoricoAnalise> {
  return apiFetch<HistoricoAnalise>(`/api/analises/${idAnalise}`)
}
