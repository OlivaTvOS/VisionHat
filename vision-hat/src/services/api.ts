import type { ApiErrorResponse } from '../types'

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  const response = await fetch(endpoint, { ...options, headers })
  if (!response.ok) {
    const texto = await response.text()
    let mensagem = texto || 'Não foi possível concluir a solicitação.'
    try { mensagem = (JSON.parse(texto) as ApiErrorResponse).erro ?? mensagem } catch { /* resposta pode não ser JSON */ }
    throw new Error(mensagem)
  }
  if (response.status === 204 || response.status === 201) return undefined as T
  const texto = await response.text()
  return (texto ? JSON.parse(texto) : undefined) as T
}
