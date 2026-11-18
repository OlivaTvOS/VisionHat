import type { AnaliseImagemResponse, HistoricoAnalise, HistoricoAnaliseCadastro } from '../types'
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

export function analisarImagem(idDispositivo: number, imagem: File): Promise<AnaliseImagemResponse> {
  const formulario = new FormData()
  formulario.append('idDispositivo', String(idDispositivo))
  formulario.append('imagem', imagem)
  return apiFetch<AnaliseImagemResponse>('/api/analises/imagem', {
    method: 'POST',
    body: formulario,
  })
}
