# Interpretar carga

Referência da skill `diagnostico-de-performance`. Como transformar o relatório do k6 em uma hipótese
de causa.

## Índice

1. [Percentis, não média](#1-percentis-não-média)
2. [Latência vs saturação](#2-latência-vs-saturação)
3. [Assinaturas de gargalo](#3-assinaturas-de-gargalo)
4. [Isolar a variável](#4-isolar-a-variável)
5. [Erros sob carga](#5-erros-sob-carga)

---

## 1. Percentis, não média

A média é a métrica que mais engana em performance, porque uma cauda ruim some nela. Se 95% das
respostas levam 50ms e 5% levam 2s, a média fica em ~150ms e parece boa — mas 1 em 20 usuários espera
2 segundos. O que o usuário sente é a cauda, e a cauda se lê em percentil:

- **p50 (mediana):** o caso típico. Útil para a linha de base, inútil para achar problema.
- **p95:** o alvo usual de SLO — a experiência do usuário azarado, mas ainda comum.
- **p99:** onde moram os picos de GC, lock e retry. Um p99 muito acima do p95 é sinal, não ruído.

Regra: definir SLO e julgar resultado sempre em percentil. Se alguém reporta "a média está ótima",
pedir o p95 e o p99 — é lá que o problema aparece.

## 2. Latência vs saturação

São dois fenômenos diferentes e a correção de cada um é diferente. Distingui-los é o primeiro corte do
diagnóstico.

- **Latência** é o tempo de uma request quando o sistema **não** está sob pressão. Se está alta já com
  1 usuário virtual, o problema é o caminho do código (uma query lenta, uma chamada externa síncrona,
  trabalho demais por request) — não a carga. Aumentar réplica não resolve.
- **Saturação** é o teto de throughput. A latência está boa em carga baixa e **descola** a partir de um
  ponto: o RPS para de subir mesmo com mais usuários, e a latência dispara porque as requests entram em
  fila. Aí o problema é capacidade (um recurso finito esgotou), não o caminho do código.

O gráfico que separa: latência no eixo Y, RPS no eixo X. Enquanto a latência fica plana e o RPS sobe,
há folga. O **joelho** — onde a latência vira para cima e o RPS achata — é o ponto de saturação. Rodar
em rampa (passo 3 da skill) existe para achar esse joelho; um único ponto de carga não o mostra.

## 3. Assinaturas de gargalo

A forma da degradação aponta a causa provável. Cada assinatura abaixo é uma hipótese a confirmar, não
um veredito — mas orienta onde olhar.

### Pool de conexão esgotado
Latência sobe **em degrau** quando a concorrência passa de um número fixo (o tamanho do pool). Abaixo
dele, rápido; acima, cada request espera uma conexão livre. Throughput trava num platô. O número
mágico costuma bater com `pool size` configurado (DB, HTTP keep-alive). Confirmar: subir o pool e ver
o degrau se mover.

### Query N+1 ou trabalho proporcional ao dado
Latência cresce com o **tamanho do dado**, não com a concorrência. Uma request sobre 10 itens é
rápida; sobre 1000, lenta — mesmo com um único usuário. Sinal de laço que faz uma query por item, ou
processamento O(n) escondido. Confirmar: variar o tamanho do payload com concorrência fixa em 1.

### GC, lock ou stop-the-world
Latência com **picos periódicos**: p50 baixo, p99 muito acima, e o alto se repete em intervalos
regulares. É pausa de garbage collection, lock global, ou flush de buffer. Throughput médio pode
parecer ok — o dano está na cauda. Confirmar: correlacionar os picos com métricas de GC/heap ou
contenção de lock.

### Dependência externa lenta
A latência do endpoint **espelha** a de um serviço abaixo: sobe e desce junto com ele, e não responde
a mais réplica local. Timeout em cascata quando a dependência degrada. Confirmar: medir a dependência
isolada e ver se a curva coincide; checar se a chamada é síncrona no caminho da request.

### CPU-bound
Throughput trava perto do número de núcleos e a latência sobe por fila. Uso de CPU em ~100% no ponto
de saturação. Trabalho pesado por request (serialização grande, criptografia, compressão). Confirmar:
observar CPU no momento do joelho; se está saturada, é capacidade de processamento.

## 4. Isolar a variável

Para transformar assinatura em causa confirmada, variar **uma dimensão por vez**:

- concorrência fixa, payload crescente → isola trabalho proporcional ao dado (N+1);
- payload fixo, concorrência crescente → isola limites de capacidade (pool, CPU, saturação).

Mudar as duas ao mesmo tempo mistura os sinais e o diagnóstico vira chute. Uma boa investigação de
carga é uma sequência de rodadas, cada uma mexendo em uma variável.

## 5. Erros sob carga

Erro que só aparece **acima** de um certo RPS raramente é bug funcional — é sintoma de saturação: o
recurso esgotou e o servidor passou a rejeitar (5xx, timeout, connection refused). Ler a taxa de erro
junto com a curva de latência: se os 5xx começam no joelho, é o mesmo gargalo se manifestando como
falha em vez de lentidão. Um teste de carga que ignora `checks` de correção pode confundir "rápido
porque respondeu erro 500 na hora" com boa performance — por isso o script sempre valida a resposta,
não só o tempo.
