---
name: cobertura-de-criterios
description: Esta skill deve ser usada quando o usuário pedir para "verificar cobertura dos critérios de aceite", "cruzar os critérios de aceite com os testes", "montar a matriz de rastreabilidade", "ver se a task está coberta", "quais critérios não têm teste" ou "os testes cobrem o que o card pede?". Cruza os critérios de aceite de uma tarefa com a suíte de testes e devolve uma matriz de aderência — cada critério marcado como coberto, parcial ou descoberto, com o teste que o prova. Não use para escrever os testes que faltam (isso é testes-de-integracao), nem para revisar se o código está correto (isso é revisao-pr-multiagente).
---

# cobertura-de-criterios

Cruza os critérios de aceite de uma tarefa com a suíte de testes e devolve uma matriz: cada critério
marcado como **coberto**, **parcial** ou **descoberto**, apontando o teste que o prova. Critério
ambíguo ou não testável é sinalizado como defeito do próprio critério — não como falha do código.

## Por que rastrear critério até asserção

"Tem 80% de cobertura" não diz se o que o negócio pediu está garantido — diz quantas linhas o teste
executou. As duas coisas se descolam o tempo todo: dá para ter cobertura alta e o critério mais
importante da tarefa sem um único teste que falhe se ele for violado. Esta skill mede a dimensão que
importa para quem aceita a entrega: cada critério de aceite tem uma asserção que o defende?

O ganho a mais vem de olhar o critério com olho de produto. Um critério que não dá para testar
("a experiência deve ser fluida") não é um problema de QA — é um requisito mal escrito, e é muito
mais barato devolver isso no refinamento do que descobrir na produção que ninguém sabia o que
"fluida" significava.

## Escopo

**Faz:** normaliza os critérios de aceite em itens atômicos e verificáveis, cruza cada um com a suíte
de testes, classifica a aderência (coberto/parcial/descoberto) e sinaliza critérios não testáveis
como defeito do critério. Entrega uma matriz de rastreabilidade.

**Não faz:** não escreve os testes que faltam — aponta o buraco; escrever é a `testes-de-integracao`.
Não julga se o código está correto — isso é a `revisao-pr-multiagente`. Não inventa critério que a
tarefa não tem, e não afrouxa um critério para poder marcá-lo como coberto.

## Entradas

**Obrigatórias:**
1. os critérios de aceite — em Gherkin, bullets de um card, ou texto solto;
2. a suíte de testes a cruzar (o repositório, ou um recorte).

**Opcionais (config local `qe-kit.local.json`):**
- `tracker`: base URL do issue tracker, para buscar os critérios direto da tarefa quando o usuário
  passa só o id. Sem config, usar os critérios que o usuário colar. Nenhum tracker é assumido.

## Passos

### 1. Normalizar os critérios em itens atômicos

Quebrar os critérios em uma lista onde cada linha é **uma** afirmação verificável. Um critério
composto ("o usuário recebe o e-mail **e** o pedido muda de status") vira dois itens — senão a matriz
esconde meia-cobertura sob um "parcial" que não diz qual metade falta. Preservar a referência à origem
(qual card, qual cenário Gherkin) para rastreabilidade.

### 2. Julgar a testabilidade de cada item

Antes de procurar teste, decidir se o item **pode** ser testado: ele afirma algo observável e
mensurável? "Retorna 403 para quem não é dono" é testável; "deve ser seguro" não é — é uma intenção
sem critério de verificação. Itens não testáveis saem da contagem de cobertura e vão para uma seção
própria, marcados como **defeito do critério**, com a pergunta que o tornaria testável. Isso é a
contribuição de produto: devolver o requisito, não fingir que dá para cobri-lo.

### 3. Cruzar cada item testável com a suíte

Para cada item, procurar na suíte o teste que o exercita. Não basta o teste tocar o mesmo endpoint:
ele tem de **provar** o critério — falhar se o critério for violado. Um teste que exercita o fluxo mas
com asserção vacuosa (ver a skill `testes-de-integracao`) não cobre o critério; cobre a aparência
dele. Na dúvida sobre a força da asserção, aplicar o crivo de `assercoes.md` daquela skill.

### 4. Classificar a aderência

- **Coberto:** existe um teste que falha se o critério for violado.
- **Parcial:** há teste que toca o critério, mas não prova o caso todo (ex.: cobre o caminho feliz,
  não o de erro que o critério exige; ou a asserção prova menos do que o critério afirma).
- **Descoberto:** nenhum teste, ou só testes vacuosos.

Para "parcial" e "descoberto", registrar concretamente o que falta — o caso ou a asserção ausente.

### 5. Entregar a matriz

Produzir a matriz no formato da seção *Saída*, ordenada por risco: descobertos de critério importante
primeiro. Fechar com uma linha de veredito factual (quantos cobertos de quantos testáveis), sem
recomendar aprovar ou reprovar — a decisão é de quem aceita a entrega.

## Critério de pronto

- [ ] Cada critério foi quebrado em itens atômicos e verificáveis.
- [ ] Cada item foi julgado quanto à testabilidade; os não testáveis estão na seção de defeito do
      critério, com a pergunta que os tornaria testáveis.
- [ ] Cada item testável está classificado, e o teste que o prova está nomeado (`arquivo:linha`).
- [ ] "Parcial" e "descoberto" dizem concretamente o que falta.
- [ ] Nenhum item foi marcado como coberto com base em teste vacuoso.

## Saída

```markdown
# Cobertura de critérios — <tarefa>

| # | Critério (atômico) | Status | Prova / o que falta |
|---|--------------------|--------|---------------------|
| 1 | <afirmação verificável> | Coberto | <arquivo:linha do teste> |
| 2 | <afirmação verificável> | Parcial | toca em <arquivo:linha>, falta <caso/asserção> |
| 3 | <afirmação verificável> | Descoberto | nenhum teste prova este critério |

## Critérios não testáveis (defeito do critério)
- <critério vago> — para testar, precisaria definir: <a pergunta que falta>

## Veredito
<N> de <M> critérios testáveis cobertos. Descobertos de maior risco: <lista>.
```

## Demonstração

Contra a branch `exemplo/pr-para-revisar` do `examples/sandbox-cobranca`, com estes critérios de
aceite escritos à mão para a tarefa "parcelamento, pagamentos e extrato":

1. A soma das parcelas é igual ao valor total da cobrança.
2. Um pagamento repetido com a mesma chave de idempotência não debita duas vezes.
3. Só o dono da cobrança consegue consultá-la.

A suíte `test/features.test.ts` toca os três fluxos, mas com asserções vacuosas. A matriz correta
marca os três como **descoberto** (ou parcial), porque nenhum teste falha se o critério for violado —
apesar de a suíte estar verde. É a diferença entre "tem teste" e "o critério está garantido".
