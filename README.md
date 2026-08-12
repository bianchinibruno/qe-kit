# qe-kit

[![ci](https://github.com/bianchinibruno/qe-kit/actions/workflows/ci.yml/badge.svg)](https://github.com/bianchinibruno/qe-kit/actions/workflows/ci.yml)

> Skills de engenharia de qualidade para [Claude Code](https://claude.com/claude-code).
> Escopo estreito, contrato definido, saída verificável.

Automação de teste não morre por falta de teste. Morre por teste que passa sem provar nada, por
review que só olha estilo, e por critério de aceite que ninguém rastreia até uma asserção. O
`qe-kit` empacota o que eu faço para atacar isso, em skills pequenas que dá para compor.

Cada skill vem com uma demonstração que roda contra código de verdade — o `examples/sandbox-cobranca`,
uma API com bugs plantados. A ideia é que você **prove**, não acredite.

---

## Prova em 2 minutos

O sandbox tem uma branch com três bugs plantados (idempotência, arredondamento, autorização) e uma
suíte de testes que fica verde sem pegar nenhum deles. Dá para conferir o cenário sozinho:

```bash
git clone https://github.com/bianchinibruno/qe-kit
cd qe-kit/examples/sandbox-cobranca && npm install
git switch exemplo/pr-para-revisar
npm test        # a suíte passa — verde enganoso
```

A suíte verde é o ponto de partida. `revisao-pr-multiagente` acha os três bugs no diff dessa branch;
`testes-de-integracao` mostra por que a suíte não prova nada e reescreve as asserções para falharem
enquanto o bug existir. O gabarito dos bugs está em `examples/sandbox-cobranca/GABARITO.md`.

---

## O que foi demonstrado

Resultados gerados contra o sandbox, reproduzíveis — não números de folder:

**`revisao-pr-multiagente` — a revisão pegou os três bugs, cada um pela lente certa.** No diff da
branch `exemplo/pr-para-revisar`, as seis lentes em paralelo produziram:

| Achado | Lente | Severidade |
|---|---|---|
| `idempotencyKey` aceita mas não verificada → retry debita em dobro (`pago=200` para 100) | dados-estado | crítico |
| `GET /cobrancas/:id` não confere o dono → IDOR | segurança | crítico |
| `Math.floor(100/3)` por parcela → soma 99 ≠ 100 | correção | alto |
| suíte que passa sem pegar os bugs acima | teste | alto |

A lente de contrato ficou corretamente silenciosa (endpoints novos, nada quebra) — a prova de que as
lentes são disjuntas e não repetem o mesmo achado.

**`testes-de-integracao` — a prova de regressão.** As asserções vacuosas da branch
(`toBeDefined`, `every()` sobre array vazio, skip com `if`) foram reescritas. As reforçadas **falham**
com o código bugado e **passam** com o fix:

```
✗ soma das parcelas = total          expected 99  to be 100
✗ retry não debita em dobro          expected 200 to be 100
✗ não-dono recebe 403                 expected 200 to be 403
```

Um teste que passa nos dois estados não prova nada. Estes falham quando o código está errado — que é o
único trabalho de um teste.

---

## Instalação

```bash
/plugin marketplace add bianchinibruno/qe-kit
```

Depois, instale o plugin:

```bash
/plugin install qe-kit@qe-kit
```

Para desenvolver localmente, sem instalar:

```bash
claude --plugin-dir /caminho/para/qe-kit
```

---

## As skills

| Skill | O que faz |
|---|---|
| `revisao-pr-multiagente` | Revisa um PR com 6 lentes independentes em paralelo — correção, contrato, teste, dados/estado, segurança e simplificação — depois deduplica e ranqueia por severidade |
| `testes-de-integracao` | Mapeia os pontos de integração reais do repositório, escreve os testes e prova que cada asserção falha quando o código está errado |
| `cobertura-de-criterios` | Cruza critérios de aceite com a suíte e devolve uma matriz: coberto, parcial ou descoberto — apontando qual teste prova cada um |
| `diagnostico-de-performance` | Conduz teste de carga com k6 e interpreta o resultado: separa latência de saturação e aponta a causa provável do gargalo |
| `autoria-de-testes-api` | Deriva testes de API do código-fonte — caminho feliz, borda, erro e autorização — e mantém a suíte quando o contrato muda |
| `colecao-api` | Gera uma coleção de API navegável a partir das rotas e schemas do repositório |
| `abrir-pr` | Deriva um pull request dos commits da branch — título em Conventional Commits (inglês) e corpo estruturado (português) — e abre via `gh` após confirmação |

Cada skill declara o que **não** faz. Uma skill que dispara fora de hora custa mais do que uma que não
existe. O disparo de cada uma é coberto por `evals/` — inclusive os vizinhos próximos que não devem
disparar.

---

## O sandbox

`examples/sandbox-cobranca/` é uma API pequena de cobrança. A `main` é a base limpa, com testes reais;
a branch `exemplo/pr-para-revisar` adiciona três features com um bug plantado cada e uma suíte que não
os pega. É o alvo das demonstrações — rode qualquer skill contra ele e confira o resultado no
`GABARITO.md`, em vez de acreditar neste README.

---

## Princípios

**Asserção vacuosa é pior que teste nenhum.** `expect(result).toBeDefined()` passa com qualquer coisa.
`every()` sobre array vazio é verdadeiro por vacuidade. Teste que não falha quando o código está
errado vende confiança falsa, e confiança falsa é mais cara que ausência de teste.

**Lente disjunta rende mais que agente genérico.** Seis revisores com o mesmo prompt devolvem seis
vezes o mesmo achado óbvio. O valor está em cada lente saber o que **não** é problema dela.

**Achado sem evidência vale zero.** Sem `arquivo:linha` e sem um cenário concreto de falha, não entra
no relatório.

**Explicar o porquê, não empilhar MUST.** Instrução com motivo sobrevive ao caso de borda que o autor
não previu.

---

## Licença

MIT — veja [LICENSE](LICENSE).
