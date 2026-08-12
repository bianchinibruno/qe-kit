import Fastify, { type FastifyInstance } from 'fastify';
import { novoStore, novoId, type Store } from './store.js';
import type { Cobranca } from './tipos.js';

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

  // POST /cobrancas — cria uma cobrança em parcela única.
  // O parcelamento em N parcelas ainda não existe: é o que a branch
  // `exemplo/pr-para-revisar` adiciona.
  app.post('/cobrancas', async (req, reply) => {
    const body = req.body as { clienteId?: unknown; valorCentavos?: unknown };

    if (typeof body?.clienteId !== 'string' || !store.clientes.has(body.clienteId)) {
      return reply.code(400).send({ erro: 'clienteId inválido' });
    }
    if (typeof body?.valorCentavos !== 'number' || body.valorCentavos <= 0) {
      return reply.code(400).send({ erro: 'valorCentavos deve ser positivo' });
    }

    const cobranca: Cobranca = {
      id: novoId('cob'),
      clienteId: body.clienteId,
      valorTotalCentavos: body.valorCentavos,
      parcelas: [{ numero: 1, valorCentavos: body.valorCentavos }],
      pagoCentavos: 0,
      pagamentos: [],
    };
    store.cobrancas.set(cobranca.id, cobranca);
    return reply.code(201).send(cobranca);
  });

  return app;
}
