import Fastify, { type FastifyInstance } from 'fastify';
import { novoStore, novoId, type Store } from './store.js';
import { dividirParcelas } from './dinheiro.js';
import type { Cobranca, Pagamento } from './tipos.js';

// Constrói a app sem escutar em porta, para que os testes possam usar
// `app.inject()` sem subir servidor de rede.
export function construirApp(store: Store = novoStore()): FastifyInstance {
  const app = Fastify({ logger: false });

  // POST /clientes — cria um cliente.
  app.post('/clientes', async (req, reply) => {
    const body = req.body as { nome?: unknown };
    if (typeof body?.nome !== 'string' || body.nome.trim() === '') {
      return reply.code(400).send({ erro: 'nome é obrigatório' });
    }
    const cliente = { id: novoId('cli'), nome: body.nome };
    store.clientes.set(cliente.id, cliente);
    return reply.code(201).send(cliente);
  });

  // POST /cobrancas — cria uma cobrança, opcionalmente dividida em parcelas.
  app.post('/cobrancas', async (req, reply) => {
    const body = req.body as {
      clienteId?: unknown;
      valorCentavos?: unknown;
      parcelas?: unknown;
    };

    if (typeof body?.clienteId !== 'string' || !store.clientes.has(body.clienteId)) {
      return reply.code(400).send({ erro: 'clienteId inválido' });
    }
    if (typeof body?.valorCentavos !== 'number' || body.valorCentavos <= 0) {
      return reply.code(400).send({ erro: 'valorCentavos deve ser positivo' });
    }
    const quantidade =
      typeof body?.parcelas === 'number' && body.parcelas >= 1 ? body.parcelas : 1;

    const cobranca: Cobranca = {
      id: novoId('cob'),
      clienteId: body.clienteId,
      valorTotalCentavos: body.valorCentavos,
      parcelas: dividirParcelas(body.valorCentavos, quantidade),
      pagoCentavos: 0,
      pagamentos: [],
    };
    store.cobrancas.set(cobranca.id, cobranca);
    return reply.code(201).send(cobranca);
  });

  // POST /cobrancas/:id/pagamentos — aplica um pagamento à cobrança.
  // Aceita uma idempotencyKey para o cliente poder repetir a requisição com
  // segurança em caso de timeout de rede.
  app.post('/cobrancas/:id/pagamentos', async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = req.body as { valorCentavos?: unknown; idempotencyKey?: unknown };

    const cobranca = store.cobrancas.get(id);
    if (!cobranca) {
      return reply.code(404).send({ erro: 'cobrança não encontrada' });
    }
    if (typeof body?.valorCentavos !== 'number' || body.valorCentavos <= 0) {
      return reply.code(400).send({ erro: 'valorCentavos deve ser positivo' });
    }

    const idempotencyKey =
      typeof body?.idempotencyKey === 'string' ? body.idempotencyKey : undefined;

    const pagamento: Pagamento = {
      id: novoId('pag'),
      valorCentavos: body.valorCentavos,
      idempotencyKey,
      criadoEm: new Date().toISOString(),
    };
    cobranca.pagamentos.push(pagamento);
    cobranca.pagoCentavos += body.valorCentavos;

    return reply.code(200).send({
      cobrancaId: cobranca.id,
      pagamentoId: pagamento.id,
      pagoCentavos: cobranca.pagoCentavos,
      saldoCentavos: cobranca.valorTotalCentavos - cobranca.pagoCentavos,
    });
  });

  // GET /cobrancas/:id — consulta o extrato da cobrança. O cliente que consulta
  // é identificado pelo header `x-cliente-id`.
  app.get('/cobrancas/:id', async (req, reply) => {
    const { id } = req.params as { id: string };

    const cobranca = store.cobrancas.get(id);
    if (!cobranca) {
      return reply.code(404).send({ erro: 'cobrança não encontrada' });
    }

    return reply.code(200).send(cobranca);
  });

  return app;
}
