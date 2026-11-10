import type { Ocorrencia } from '../types'
import { apiFetch } from './api'

export function listarOcorrenciasDaAnalise(idAnalise: number): Promise<Ocorrencia[]> {
  return apiFetch<Ocorrencia[]>(`/api/ocorrencias/analise/${idAnalise}`)
}
