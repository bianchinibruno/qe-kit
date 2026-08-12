import { describe, it, expect, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { construirApp } from '../src/app.js';

// Suíte da base. Ao contrário da suíte que a branch exemplo/pr-para-revisar
// adiciona, cada asserção aqui falha se o comportamento mudar: valida status
// exato, valor exato e a regra de negócio, não só a existência do campo.

let app: FastifyInstance;

async function criarCliente(nome: string): Promise<string> {
  const res = await app.inject({ method: 'POST', url: '/clientes', payload: { nome } });
  return res.json().id;
}

beforeEach(() => {
  app = construirApp();
});

describe('clientes', () => {
  it('cria um cliente e devolve id', async () => {
    const res = await app.inject({ method: 'POST', url: '/clientes', payload: { nome: 'Ana' } });
    expect(res.statusCode).toBe(201);
    expect(res.json().nome).toBe('Ana');
    expect(res.json().id).toMatch(/^cli_/);
  });

  it('recusa cliente sem nome', async () => {
    const res = await app.inject({ method: 'POST', url: '/clientes', payload: {} });
    expect(res.statusCode).toBe(400);
  });
});

describe('cobranças', () => {
  it('cria uma cobrança em parcela única com o valor total', async () => {
    const clienteId = await criarCliente('Bruno');
    const res = await app.inject({
      method: 'POST',
      url: '/cobrancas',
      payload: { clienteId, valorCentavos: 500 },
    });

    expect(res.statusCode).toBe(201);
    const cobranca = res.json();
    expect(cobranca.valorTotalCentavos).toBe(500);
    expect(cobranca.parcelas).toHaveLength(1);
    expect(cobranca.parcelas[0].valorCentavos).toBe(500);
    expect(cobranca.pagoCentavos).toBe(0);
  });

  it('recusa cobrança de cliente inexistente', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/cobrancas',
      payload: { clienteId: 'cli_inexistente', valorCentavos: 500 },
    });
    expect(res.statusCode).toBe(400);
  });

  it('recusa valor não positivo', async () => {
    const clienteId = await criarCliente('Carla');
    const res = await app.inject({
      method: 'POST',
      url: '/cobrancas',
      payload: { clienteId, valorCentavos: 0 },
    });
    expect(res.statusCode).toBe(400);
  });
});
