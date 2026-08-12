export interface Cliente {
  id: string;
  nome: string;
}

export interface Parcela {
  numero: number;
  valorCentavos: number;
}

export interface Pagamento {
  id: string;
  valorCentavos: number;
  idempotencyKey?: string;
  criadoEm: string;
}

export interface Cobranca {
  id: string;
  clienteId: string;
  valorTotalCentavos: number;
  parcelas: Parcela[];
  pagoCentavos: number;
  pagamentos: Pagamento[];
}
