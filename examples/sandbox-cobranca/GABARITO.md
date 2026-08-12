# Gabarito — bugs plantados nesta branch

Este arquivo existe **apenas na branch `exemplo/pr-para-revisar`** e é para o leitor humano conferir
o acerto das skills. **Não** faça a skill lê-lo antes de analisar: o valor da demonstração está em a
skill encontrar os bugs sozinha, contra o código, sem gabarito.

Esta branch adiciona três features à base — parcelamento, pagamentos e extrato — e cada uma carrega
um bug plantado de propósito. Nenhum comentário no código-fonte denuncia os bugs; eles se parecem
com o que um dev escreveria sem perceber o defeito. Os testes que a branch traz
(`test/features.test.ts`) passam sem pegar nenhum deles.

## Bug #1 — Idempotência (lente dados/estado)

**Onde:** `src/app.ts`, handler `POST /cobrancas/:id/pagamentos`.

**O quê:** a `idempotencyKey` é recebida e guardada no pagamento, mas nunca verificada contra os
pagamentos já aplicados. Um retry da mesma requisição (mesma chave) aplica o valor de novo e debita
o saldo em dobro.

**Prova:** dois `POST` de 100 centavos com a mesma `idempotencyKey` deixam `pagoCentavos = 200`.

**Correção:** antes de aplicar, procurar um pagamento com a mesma `idempotencyKey`; se existir,
retornar o resultado original em vez de aplicar de novo.

## Bug #2 — Arredondamento (lente correção)

**Onde:** `src/dinheiro.ts`, função `dividirParcelas`.

**O quê:** usa `Math.floor(total / quantidade)` por parcela e descarta o resto. Quando o total não
é divisível pela quantidade, a soma das parcelas fica menor que o total.

**Prova:** 100 centavos em 3 parcelas vira 33 + 33 + 33 = 99. Some 1 centavo.

**Correção:** distribuir o resto (`total % quantidade`) entre as primeiras parcelas, de modo que a
soma das parcelas seja sempre igual ao total.

## Bug #3 — Autorização (lente segurança)

**Onde:** `src/app.ts`, handler `GET /cobrancas/:id`.

**O quê:** o dono do recurso não é validado. O cliente que faz a requisição é identificado pelo
header `x-cliente-id`, mas a cobrança é devolvida sem conferir se pertence a esse cliente. É um
IDOR — qualquer cliente lê a cobrança de qualquer outro.

**Prova:** `GET /cobrancas/:id` com `x-cliente-id` de um cliente que não é o dono responde 200 com
o corpo completo.

**Correção:** responder 403 quando `x-cliente-id` difere de `cobranca.clienteId`.

## Por que a suíte de features não pega nenhum

Cada teste em `test/features.test.ts` passa por um motivo diferente de vacuidade — é o material da
tese da skill `testes-de-integracao`:

- **`toBeDefined`** aceita qualquer coisa: `expect(res.statusCode).toBeDefined()` passa com 200, 400
  ou 500. Nunca checa que a soma das parcelas é igual ao total.
- **`every()` sobre array vazio** é verdadeiro por vacuidade: o filtro `valorCentavos > 1000` não
  deixa nenhum elemento, e `every` sobre `[]` é sempre `true`. O tamanho nunca é checado antes.
- **Skip silencioso** com `if (body && body.id)`: a asserção só roda se o corpo veio, e ainda assim
  confirma exatamente o comportamento bugado (devolveu a cobrança). Nunca afirma que deveria ter
  sido 403 para o não-dono.

Teste que não falha quando o código está errado vende confiança falsa — por isso é pior que teste
nenhum, que ao menos não engana.
