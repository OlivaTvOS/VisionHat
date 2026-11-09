import type { ApiErrorResponse } from '../types'

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(endpoint, { ...options, headers: { 'Content-Type': 'application/json', ...options.headers } })
  if (!response.ok) {
    const texto = await response.text()
    let mensagem = texto || 'Não foi possível concluir a solicitação.'
    try { mensagem = (JSON.parse(texto) as ApiErrorResponse).erro ?? mensagem } catch { /* resposta pode não ser JSON */ }
    throw new Error(mensagem)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}
