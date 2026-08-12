---
name: testes-de-integracao
description: Esta skill deve ser usada quando o usuário pedir para "escrever testes de integração", "cobrir com testes de integração", "testar a integração", "fortalecer os testes", "meus testes passam mas não pegam nada", "criar testes que provam alguma coisa" ou "revisar a força da suíte". Mapeia os pontos de integração reais do repositório, escreve os testes e valida que cada asserção falha quando o código está errado. Não use para teste unitário puro sem fronteira de integração, nem para teste E2E de UI/browser, nem para só apontar testes fracos num diff (isso é a lente de teste da skill revisao-pr-multiagente).
---

# testes-de-integracao

Escreve testes de integração que provam alguma coisa. O produto não é a suíte que fica verde — é a
suíte que fica **vermelha quando o código está errado**. Uma suíte verde sobre código quebrado é pior
que nenhuma suíte, porque vende confiança falsa: alguém confia nela e para de olhar.

## A tese

Um teste tem um único trabalho: falhar quando o comportamento está errado. Se ele passa tanto com o
código certo quanto com o código quebrado, ele não testa nada — só custa manutenção e ilude. A maior
parte do valor desta skill está em `references/assercoes.md`, que cataloga as formas de asserção que
passam sem provar nada e como convertê-las em asserções que falham de verdade. **Ler essa referência
antes de escrever qualquer asserção.**

## Escopo

**Faz:** mapeia os pontos de integração reais do repositório (fronteiras onde o código cruza para um
banco, um serviço HTTP, uma fila, um cache, outro módulo), escreve testes que exercitam a lógica real
naqueles pontos, e prova que cada teste falha quando o código está errado.

**Não faz:** não escreve teste unitário de função pura sem fronteira — isso não é integração. Não
escreve teste E2E de UI/browser. Não inventa ponto de integração que o código não tem. Não só aponta
testes fracos num diff — isso é a lente `teste` da `revisao-pr-multiagente`; esta skill **escreve** e
**fortalece**, não só sinaliza.

## Entradas

**Obrigatória:** o repositório (ou o módulo/pasta) a cobrir. Na ausência de recorte, começar pelos
pontos de integração de maior risco de negócio.

**Opcionais (config local `qe-kit.local.json`):**
- `frameworkTeste`: framework a usar (vitest, jest, pytest…). Default: detectar pelo que o repo já usa.
- `comandoTeste`: comando para rodar a suíte. Default: o script `test` do `package.json` ou equivalente.

Nunca impor um framework: usar o que o repositório já adota. Teste escrito em ferramenta que o time
não usa não é mantido.

## Passos

### 1. Mapear os pontos de integração reais

Ler o código e localizar onde ele cruza uma fronteira: chamada a banco, cliente HTTP para outro
serviço, publicação/consumo em fila, leitura/escrita em cache, invocação de outro módulo com contrato
próprio. Registrar cada ponto com o arquivo e a função. **Não inventar pontos** — um teste de
integração de algo que não integra nada é teatro de cobertura.

### 2. Para cada ponto, desenhar o cenário que exercita lógica real

O cenário tem de fazer o código **decidir** algo. Antes de escrever, responder: qual ramo do código
este teste exercita, e o mock/estado satisfaz a condição que leva até esse ramo? Se o código faz
`if (config.gateway === 'X')`, o mock precisa ter `gateway: 'X'`, senão o teste passa por um caminho
que não é o que se quer provar. Ver `references/assercoes.md` §"Exercitar o ramo certo".

### 3. Escrever o teste seguindo as regras de factualidade

Escrever a asserção pela referência: valor exato quando é conhecível, tipo **e** código no erro,
tamanho antes de `every`, shape do mock igual à shape que o código consome. Cada teste cria o próprio
estado (setup), age, valida e limpa — nenhum teste depende de outro ter rodado antes.

### 4. Provar que o teste falha quando o código está errado

O passo que separa teste de teatro. Para cada teste novo, confirmar que ele **falha** com o código
quebrado — quebrando temporariamente a linha que ele cobre, ou revertendo o fix se o bug ainda
existe — e **passa** com o código certo. Um teste que passa nas duas situações não prova nada e deve
ser reescrito, não commitado. Ver `references/assercoes.md` §"Prova de regressão".

### 5. Rodar a suíte inteira

Rodar tudo (não só os testes novos) para garantir que nada quebrou e que os novos passam com o código
correto. Reportar o resultado real — se algo falha, dizer o que e por quê, não esconder.

## Critério de pronto

- [ ] Cada teste novo cobre um ponto de integração real e nomeado, não uma função pura.
- [ ] Cada asserção foi checada contra `references/assercoes.md` — nenhuma vacuosa sobreviveu.
- [ ] Cada teste passou pela prova de regressão: falha com o código quebrado, passa com o certo.
- [ ] Cada teste cria o próprio estado e não depende de ordem de execução.
- [ ] A suíte inteira roda; o resultado reportado é o real.

## Saída

Os arquivos de teste no local e formato que o repositório já usa, mais um resumo:

```markdown
# Testes de integração — <módulo>

## Pontos cobertos
- <arquivo:função> — <fronteira> — <cenário>

## Prova de regressão
Para cada teste: com o código quebrado em <linha>, o teste <nome> falha com <mensagem>; com o
código correto, passa.

## Resultado
<saída real da suíte: N passando, M falhando>
```

O bloco de prova de regressão é o que dá ao revisor humano confiança de que os testes provam algo —
sem ele, a suíte verde não distingue teste real de teatro.

## Referências

- **`references/assercoes.md`** — o catálogo de asserções vacuosas e suas correções, a prova de
  regressão, e as regras de factualidade (shape do mock, sobrevivência ao filtro, independência).
  Ler antes de escrever qualquer teste.

## Demonstração

Rodar contra `test/features.test.ts` da branch `exemplo/pr-para-revisar` do `examples/sandbox-cobranca`:
a suíte passa inteira e não pega nenhum dos três bugs. Cada asserção é vacuosa por um motivo
diferente. A skill deve apontar a vacuidade e reescrever as asserções de modo que passem a falhar
enquanto os bugs (idempotência, arredondamento, IDOR) existirem — provando isso pela prova de
regressão do passo 4.
