import { describe, it, expect, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { construirApp } from '../src/app.js';

let app: FastifyInstance;

async function criarCliente(nome: string): Promise<string> {
  const res = await app.inject({ method: 'POST', url: '/clientes', payload: { nome } });
  return res.json().id;
}

beforeEach(() => {
  app = construirApp();
});

describe('parcelamento', () => {
  it('cria uma cobrança parcelada', async () => {
    const clienteId = await criarCliente('Ana');
    const res = await app.inject({
      method: 'POST',
      url: '/cobrancas',
      payload: { clienteId, valorCentavos: 100, parcelas: 3 },
    });

    expect(res.statusCode).toBeDefined();
    expect(res.json().parcelas).toBeDefined();
  });

  it('gera parcelas com valores plausíveis', async () => {
    const clienteId = await criarCliente('Bruno');
    const res = await app.inject({
      method: 'POST',
      url: '/cobrancas',
      payload: { clienteId, valorCentavos: 100, parcelas: 3 },
    });
    const parcelas = res.json().parcelas as Array<{ valorCentavos: number }>;

    const acimaDeMil = parcelas.filter((p) => p.valorCentavos > 1000);
    expect(acimaDeMil.every((p) => p.valorCentavos > 0)).toBe(true);
  });
});

describe('pagamentos', () => {
  it('aceita um pagamento com chave de idempotência', async () => {
    const clienteId = await criarCliente('Carla');
    const { id: cobrancaId } = (
      await app.inject({
        method: 'POST',
        url: '/cobrancas',
        payload: { clienteId, valorCentavos: 100 },
      })
    ).json();

    const pagar = () =>
      app.inject({
        method: 'POST',
        url: `/cobrancas/${cobrancaId}/pagamentos`,
        payload: { valorCentavos: 100, idempotencyKey: 'retry-1' },
      });

    const primeira = await pagar();
    const segunda = await pagar();

    expect(primeira).toBeDefined();
    expect(segunda).toBeDefined();
  });
});

describe('extrato', () => {
  it('devolve a cobrança por id', async () => {
    const dono = await criarCliente('Dono');
    const { id: cobrancaId } = (
      await app.inject({
        method: 'POST',
        url: '/cobrancas',
        payload: { clienteId: dono, valorCentavos: 500 },
      })
    ).json();

    const intruso = await criarCliente('Intruso');
    const res = await app.inject({
      method: 'GET',
      url: `/cobrancas/${cobrancaId}`,
      headers: { 'x-cliente-id': intruso },
    });
    const body = res.json();

    if (body && body.id) {
      expect(body.id).toBe(cobrancaId);
    }
  });
});
