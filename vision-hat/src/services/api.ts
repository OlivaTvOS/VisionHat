import type { ApiErrorResponse } from '../types'

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers })

  if (!response.ok) {
    const texto = await response.text()
    let mensagem = texto || 'Não foi possível concluir a solicitação.'
    try {
      const erro = JSON.parse(texto) as ApiErrorResponse
      mensagem = erro.erro ?? erro.detail ?? mensagem
    } catch {
      // A resposta pode não ser JSON.
    }
    throw new Error(mensagem)
  }

  if (response.status === 204 || response.status === 201) return undefined as T
  const texto = await response.text()
  return (texto ? JSON.parse(texto) : undefined) as T
}
