import http from 'k6/http';
import { check } from 'k6';

// Script base de teste de carga. Adaptar o alvo e o SLO à API sob teste.
//
// A URL base vem por variável de ambiente, nunca hardcoded — assim o mesmo
// script roda contra local, staging e prod sem editar código e sem vazar URL
// de ambiente no repositório:
//   k6 run -e BASE_URL=http://localhost:3000 carga.js
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  // Rampa em estágios para achar o joelho da curva, não um ponto fixo.
  stages: [
    { duration: '30s', target: 10 }, // sobe para 10 VUs
    { duration: '1m', target: 50 }, // sobe para 50 VUs
    { duration: '1m', target: 100 }, // sobe para 100 VUs
    { duration: '30s', target: 0 }, // desce
  ],
  // O SLO vira threshold: o teste FALHA se não for cumprido. Ajustar aos alvos
  // reais da API. p95/p99 em vez de média — a cauda é o que o usuário sente.
  thresholds: {
    http_req_duration: ['p(95)<300', 'p(99)<800'],
    http_req_failed: ['rate<0.01'], // menos de 1% de erro
    checks: ['rate>0.99'], // menos de 1% de resposta incorreta
  },
};

// Setup roda uma vez: cria o estado que os VUs vão reusar (ex.: um cliente).
export function setup() {
  const res = http.post(`${BASE_URL}/clientes`, JSON.stringify({ nome: 'carga' }), {
    headers: { 'Content-Type': 'application/json' },
  });
  return { clienteId: res.json('id') };
}

export default function (data) {
  const payload = JSON.stringify({
    clienteId: data.clienteId,
    valorCentavos: 10000,
    parcelas: 3,
  });
  const res = http.post(`${BASE_URL}/cobrancas`, payload, {
    headers: { 'Content-Type': 'application/json' },
  });

  // Checar a CORREÇÃO da resposta, não só o tempo. Latência baixa com resposta
  // errada é erro rápido, não performance.
  check(res, {
    'status 201': (r) => r.status === 201,
    'tem id de cobrança': (r) => typeof r.json('id') === 'string',
  });
}
