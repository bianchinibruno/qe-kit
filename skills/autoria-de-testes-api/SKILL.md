---
name: autoria-de-testes-api
description: Esta skill deve ser usada quando o usuário pedir para "escrever testes de API", "gerar testes para os endpoints", "cobrir a API com testes", "criar testes de request/response", "derivar os casos de teste do contrato" ou "atualizar os testes agora que o contrato mudou". Descobre os endpoints e seus contratos no código-fonte, deriva sistematicamente os casos de teste (caminho feliz, borda, erro de validação, autorização, não encontrado) e escreve a suíte no framework que o repositório já usa, cobrindo também a manutenção quando o contrato muda. Não use para teste de UI/E2E de browser, nem para teste de carga (isso é diagnostico-de-performance).
---

# autoria-de-testes-api

Deriva testes de API a partir do contrato dos endpoints — não a partir da imaginação. Descobre o que
cada rota aceita e devolve lendo o código, enumera os casos que o contrato implica, e escreve a suíte
no framework que o repositório já adota. Cobre também o caminho que mais custa na prática: atualizar os
testes quando o contrato muda.

## Por que derivar do contrato

Teste de API escrito de cabeça cobre o caminho feliz e para. O que pega bug é a completude: todo campo
obrigatório testado ausente, todo status que o endpoint pode retornar exercitado, toda checagem de
autorização provada. Derivar os casos do contrato — os schemas de validação, os tipos, os status
possíveis — transforma "escrevi alguns testes" em "cobri o que a rota promete". E o grosso do custo de
uma suíte de API não é escrevê-la: é mantê-la viva quando o contrato muda. Por isso a manutenção é
parte da skill, não um detalhe.

## Escopo

**Faz:** descobre endpoints e contratos no código, deriva os casos de teste por endpoint, escreve a
suíte no framework do repositório com asserções fortes, e mantém a suíte quando o contrato muda
(detecta drift e aponta os testes afetados).

**Não faz:** não testa UI nem faz E2E de browser. Não faz teste de carga — isso é a
`diagnostico-de-performance`. Não afrouxa asserção para o teste passar: a força da asserção segue o
crivo de `../testes-de-integracao/references/assercoes.md`.

## Entradas

**Obrigatória:** o repositório ou o recorte de endpoints a cobrir.

**Opcionais (config local `qe-kit.local.json`):**
- `frameworkTeste`: framework a usar. Default: detectar o que o repo já usa.
- `comandoTeste`: comando para rodar a suíte. Default: o script `test` do projeto.
- `auth`: como autenticar nas requisições (header, esquema). Passar por config, nunca hardcode de
  token no teste.

## Passos

### 1. Descobrir endpoints e contrato

Ler o código e extrair, para cada endpoint: método e path; schema de validação da entrada (campos
obrigatórios, opcionais, tipos, constraints — de Zod/Joi/class-validator/etc.); a forma da resposta de
sucesso e de erro; os status possíveis; e o esquema de autenticação/autorização. Esse contrato é a
fonte dos casos — não inventar campos que o código não valida, não presumir status que a rota não
retorna.

### 2. Derivar os casos por endpoint

Para cada endpoint, enumerar os casos que o contrato implica, seguindo a taxonomia de
`references/casos.md`: caminho feliz, valores de borda, cada erro de validação, autorização (sem auth,
auth de outro dono, auth correta), recurso inexistente, e efeito colateral repetido quando aplicável.
A completude vem daqui: um endpoint com três campos obrigatórios implica ao menos três testes de
validação, um por campo.

### 3. Escrever a suíte no framework do repositório

Escrever no local e no estilo que o repo já usa. Cada teste com asserção forte — status exato, forma
da resposta conferida, erro validado por código e não por existência de mensagem. Aplicar o crivo de
`assercoes.md`: nenhuma asserção que passaria com a resposta errada. Cada teste cria o próprio estado e
independe de ordem.

### 4. Rodar e provar os testes de regra de negócio

Rodar a suíte. Para os testes que cobrem regra de negócio (não só forma), aplicar a prova de regressão:
confirmar que falham se a regra for violada. Um teste de "422 quando falta o campo X" tem de falhar se
a validação de X sumir.

### 5. Manutenção: reagir ao drift do contrato

Quando o contrato muda, localizar os testes afetados e atualizá-los — não deixar a suíte divergir do
código. Ver `references/casos.md` §"Drift de contrato" para o mapa de qual mudança afeta quais testes:
campo que virou obrigatório, status que mudou, campo de resposta removido, endpoint renomeado. Reportar
o que mudou e o que foi ajustado, para o humano revisar a intenção.

## Critério de pronto

- [ ] Todo endpoint no recorte tem seu contrato extraído do código, não presumido.
- [ ] Os casos derivados cobrem a taxonomia: feliz, borda, cada validação, autorização, não
      encontrado, efeito colateral quando aplicável.
- [ ] Cada asserção passou pelo crivo de `assercoes.md` — nenhuma vacuosa.
- [ ] Os testes de regra de negócio passaram pela prova de regressão.
- [ ] A suíte roda no framework do repo; o resultado reportado é o real.

## Saída

Os arquivos de teste no local/formato do repositório, mais um resumo:

```markdown
# Testes de API — <módulo>

## Cobertura por endpoint
| Endpoint | Feliz | Validação | Autz | Não encontrado | Efeito colateral |
|---|---|---|---|---|---|
| POST /cobrancas | ✓ | 3 casos | — | — | — |
| GET /cobrancas/:id | ✓ | — | 401/403 | 404 | — |

## Prova de regressão
<para os testes de regra: com a regra removida em <linha>, o teste <nome> falha>

## Resultado
<saída real da suíte>
```

A matriz de cobertura por endpoint é o que mostra a completude ao revisor — deixa explícito qual caso
foi coberto e qual ficou de fora de propósito.

## Referências

- **`references/casos.md`** — a taxonomia de casos a derivar de cada endpoint, e o mapa de drift de
  contrato (qual mudança afeta quais testes).
- **`../testes-de-integracao/references/assercoes.md`** — o crivo de força de asserção, reusado aqui:
  a completude dos casos não vale nada se as asserções forem vacuosas.

## Demonstração

Contra o `examples/sandbox-cobranca` (base `main`, endpoints `POST /clientes` e `POST /cobrancas`):
derivar os casos do contrato — cliente sem nome → 400; cobrança de cliente inexistente → 400; valor
não positivo → 400; caminho feliz → 201 com a forma esperada — e escrever a suíte. Conferir contra os
endpoints reais e provar por regressão os casos de validação.
