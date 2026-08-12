# sandbox-cobranca

API pequena de cobrança, usada para demonstrar as skills do `qe-kit` contra código que roda — em
vez de acreditar no README.

Domínio: cliente, cobrança, pagamento e extrato. Armazenamento em memória, sem banco.

## Rodar

```bash
npm install
npm run dev      # sobe em http://localhost:3000
npm test         # roda a suíte de testes
npm run typecheck
```

## As duas faces do sandbox

**`main` é a base limpa.** Só clientes e cobranças em parcela única, com uma suíte de testes real
em `test/cobrancas.test.ts` — cada asserção falha se o comportamento mudar.

**A branch `exemplo/pr-para-revisar` é a mudança sob revisão.** Ela adiciona três features —
parcelamento, pagamentos e extrato — e cada uma carrega um bug plantado de propósito. Os testes que
ela traz passam sem pegar nenhum dos bugs. É o cenário realista que um QA sênior enfrenta: um PR de
feature com defeitos sutis e uma suíte que dá falsa confiança.

```bash
git switch exemplo/pr-para-revisar
```

O gabarito dos bugs fica em `GABARITO.md`, presente apenas naquela branch — existe para o leitor
humano conferir o acerto das skills, não para ser lido pela skill antes da análise.

## Endpoints da base (`main`)

| Método | Rota | O que faz |
|---|---|---|
| `POST` | `/clientes` | Cria um cliente. Body: `{ "nome": "Ana" }` |
| `POST` | `/cobrancas` | Cria uma cobrança em parcela única. Body: `{ "clienteId", "valorCentavos" }` |

## Como cada skill usa este sandbox

- `revisao-pr-multiagente` → revisar a branch `exemplo/pr-para-revisar`. Cada bug deve ser pego pela
  lente correspondente (dados/estado, correção, segurança), e a suíte vacuosa pela lente de teste.
- `testes-de-integracao` → naquela branch, apontar por que a suíte não prova nada e substituí-la por
  asserções que falham enquanto o bug existir.
- `autoria-de-testes-api` / `colecao-api` → gerar testes e coleção a partir dos endpoints reais.

> Artefato de demonstração. Os bugs da branch são intencionais; não use este código em produção.
