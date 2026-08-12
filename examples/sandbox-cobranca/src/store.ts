import type { Cliente, Cobranca } from './tipos.js';

// Armazenamento em memória. Zerado a cada boot — suficiente para uma API de
// demonstração, sem dependência de banco. Um teste de integração de verdade
// deve criar o próprio estado e não depender da ordem de execução.
export interface Store {
  clientes: Map<string, Cliente>;
  cobrancas: Map<string, Cobranca>;
}

export function novoStore(): Store {
  return {
    clientes: new Map(),
    cobrancas: new Map(),
  };
}

let contador = 0;
export function novoId(prefixo: string): string {
  contador += 1;
  return `${prefixo}_${contador}`;
}
