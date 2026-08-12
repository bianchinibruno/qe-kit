# qe-kit

> Skills de engenharia de qualidade para [Claude Code](https://claude.com/claude-code).
> Escopo estreito, contrato definido, saída verificável.

Automação de teste não morre por falta de teste. Morre por teste que passa sem provar nada, por
review que só olha estilo, e por critério de aceite que ninguém rastreia até uma asserção. O
`qe-kit` empacota o que eu faço para atacar isso, em skills pequenas que dá para compor.

**Status:** v0.1.0 — em construção. O roadmap abaixo diz o que já existe e o que ainda não.

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

| Skill | O que faz | Status |
|---|---|---|
| `revisao-pr-multiagente` | Revisa um PR com 6 lentes independentes em paralelo — correção, contrato, teste, dados/estado, segurança e simplificação — depois deduplica e ranqueia por severidade | ⬜ planejada |
| `testes-de-integracao` | Mapeia os pontos de integração reais do repositório, escreve os testes e valida que cada asserção prova alguma coisa | ⬜ planejada |
| `cobertura-de-criterios` | Cruza critérios de aceite com a suíte e devolve uma matriz: coberto, parcial ou descoberto — apontando qual teste prova cada um | ⬜ planejada |
| `diagnostico-de-performance` | Conduz teste de carga com k6 e interpreta o resultado: separa latência de saturação e aponta a causa provável do gargalo | ⬜ planejada |
| `autoria-de-testes-api` | Deriva testes de API do código-fonte — caminho feliz, borda, erro e autorização — e mantém a suíte quando o contrato muda | ⬜ planejada |
| `colecao-api` | Gera uma coleção de API navegável a partir das rotas e schemas do repositório | ⬜ planejada |
| `abrir-pr` | Deriva um pull request dos commits da branch — título em Conventional Commits (inglês) e corpo estruturado (português) com Tarefa, Descrição, Pontos de Impacto, Análise de Riscos e Guia de Fluxo — e abre via `gh` após confirmação | ✅ pronta |

Cada skill declara o que **não** faz. Uma skill que dispara fora de hora custa mais do que uma
que não existe.

---

## O sandbox

`examples/sandbox-cobranca/` é uma API pequena de cobrança, com bugs plantados de propósito e uma
suíte de testes que passa sem provar nada. Serve para rodar qualquer skill deste repositório e
conferir o resultado contra um gabarito — em vez de acreditar no README.

---

## Princípios

**Asserção vacuosa é pior que teste nenhum.** `expect(result).toBeDefined()` passa com qualquer
coisa. `every()` sobre array vazio é verdadeiro por vacuidade. Teste que não falha quando o
código está errado vende confiança falsa, e confiança falsa é mais cara que ausência de teste.

**Lente disjunta rende mais que agente genérico.** Seis revisores com o mesmo prompt devolvem
seis vezes o mesmo achado óbvio. O valor está em cada lente saber o que **não** é problema dela.

**Achado sem evidência vale zero.** Sem `arquivo:linha` e sem um cenário concreto de falha, não
entra no relatório.

**Explicar o porquê, não empilhar MUST.** Instrução com motivo sobrevive ao caso de borda que o
autor não previu.

---

## Licença

MIT — veja [LICENSE](LICENSE).
