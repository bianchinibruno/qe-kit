# sandbox-cobranca

API pequena de cobrança, usada para demonstrar as skills do `qe-kit` contra código que roda — em
vez de acreditar no README.

Domínio: cliente, cobrança, pagamento e extrato. Armazenamento em memória, sem banco.

> **Você está na branch `exemplo/pr-para-revisar`.** Ela adiciona três features à base da `main` —
> parcelamento, pagamentos e extrato — e cada uma carrega um bug plantado de propósito. Os testes que
> ela traz passam sem pegar nenhum. É o cenário que as skills `revisao-pr-multiagente` e
> `testes-de-integracao` enfrentam. O gabarito está em [GABARITO.md](GABARITO.md) — para o humano
> conferir, não para a skill ler antes da análise.

## Rodar

```bash
npm install
npm run dev      # sobe em http://localhost:3000
npm test         # roda a suíte de testes
npm run typecheck
```

## Endpoints

| Método | Rota | O que faz |
|---|---|---|
| `POST` | `/clientes` | Cria um cliente. Body: `{ "nome": "Ana" }` |
| `POST` | `/cobrancas` | Cria uma cobrança, opcionalmente parcelada. Body: `{ "clienteId", "valorCentavos", "parcelas" }` |
| `POST` | `/cobrancas/:id/pagamentos` | Aplica um pagamento. Body: `{ "valorCentavos", "idempotencyKey" }` |
| `GET` | `/cobrancas/:id` | Consulta o extrato. Header: `x-cliente-id` |

## Como cada skill usa este sandbox

- `revisao-pr-multiagente` → revisar o diff desta branch contra a `main`. Cada bug deve ser pego pela
  lente correspondente (dados/estado, correção, segurança), e a suíte fraca pela lente de teste.
- `testes-de-integracao` → apontar por que `test/features.test.ts` não prova nada e substituí-la por
  asserções que falham enquanto o bug existir.
- `autoria-de-testes-api` / `colecao-api` → gerar testes e coleção a partir dos endpoints reais.

> Artefato de demonstração. Os bugs são intencionais; não use este código em produção.
