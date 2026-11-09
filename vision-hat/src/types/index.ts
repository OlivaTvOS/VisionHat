export interface Usuario {
  idUsuario: number
  cpf: string
  nome: string
  email: string
  dataCadastro: string
  status: 'A' | 'I'
}

export interface UsuarioCadastro { cpf: string; nome: string; email: string; senhaHash: string }

export interface Dispositivo {
  idDispositivo: number
  idUsuario: number
  identificador: string
  modelo: string
  dataCadastro: string
  status: 'A' | 'I'
}

export interface DispositivoCadastro { idUsuario: number; identificador: string; modelo: string }

export type StatusAnalise = 'PENDENTE' | 'PROCESSANDO' | 'CONCLUIDA' | 'FALHA'

export interface HistoricoAnalise {
  idAnalise: number
  idDispositivo: number
  idLocalizacao: number | null
  dataHora: string
  referenciaImagem: string | null
  descricaoIa: string | null
  modeloIa: string | null
  status: StatusAnalise
  erroProcessamento: string | null
}

export interface ApiErrorResponse { erro?: string }
