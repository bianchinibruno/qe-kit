import type { Parcela } from './tipos.js';

/**
 * Divide um valor total em N parcelas.
 *
 * Usa divisão inteira por parcela. Quando o total não é divisível pelo número
 * de parcelas, os centavos que sobram na divisão não são distribuídos.
 */
export function dividirParcelas(valorTotalCentavos: number, quantidade: number): Parcela[] {
  const valorPorParcela = Math.floor(valorTotalCentavos / quantidade);
  return Array.from({ length: quantidade }, (_, i) => ({
    numero: i + 1,
    valorCentavos: valorPorParcela,
  }));
}

export function somaParcelas(parcelas: Parcela[]): number {
  return parcelas.reduce((acc, p) => acc + p.valorCentavos, 0);
}
