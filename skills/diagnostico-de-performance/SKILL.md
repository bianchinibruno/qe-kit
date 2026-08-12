---
name: diagnostico-de-performance
description: Esta skill deve ser usada quando o usuário pedir para "rodar teste de carga", "teste de performance", "diagnosticar lentidão", "por que a API está lenta", "medir o throughput", "achar o gargalo", "testar sob carga com k6" ou "a latência subiu, investiga". Conduz um teste de carga com k6 de ponta a ponta — define carga e SLO antes de rodar, executa em estágios e interpreta o resultado, separando latência de saturação e apontando a causa provável do gargalo. Não use para teste funcional, nem para profiling de código linha a linha, nem para consertar o gargalo (esta skill diagnostica e aponta a hipótese, não corrige).
---

# diagnostico-de-performance

Conduz um teste de carga com k6 e entrega um diagnóstico — não um dump de números. O produto é uma
hipótese de causa do gargalo, sustentada pelos dados, e o próximo passo de investigação. "A média foi
120ms" não é diagnóstico; "a latência sobe em degrau quando a concorrência passa de 10, sinal de pool
de conexão esgotado" é.

## Por que interpretar, não só medir

Rodar k6 e colar o relatório é a parte fácil e a menos útil. O número sozinho não diz o que fazer: um
p95 de 800ms pode ser saturação de CPU, fila de conexão, uma query N+1 ou uma dependência externa
lenta — e a correção de cada um é diferente. O valor está em ler a *forma* da degradação e cruzar com
a assinatura do gargalo. É por isso que a queda de tempo de resposta que se consegue num diagnóstico
vem quase sempre de descobrir a causa, não de rodar o teste.

## Escopo

**Faz:** define o perfil de carga e o SLO antes de medir, escreve/adapta o script k6, roda em estágios
para achar o ponto de degradação, e interpreta o resultado — percentis, latência vs saturação,
assinatura de gargalo — entregando uma hipótese de causa e o próximo passo.

**Não faz:** não roda teste funcional (é carga, não correção). Não faz profiling linha a linha do
código — olha de fora para dentro e aponta onde investigar por dentro. Não corrige o gargalo: entrega
o diagnóstico; a correção é decisão e trabalho seguinte.

## Entradas

**Obrigatórias:**
1. o alvo — URL base e o(s) endpoint(s) a exercitar;
2. um SLO, ou o aceite de defini-lo junto (ex.: p95 < 300ms a 50 RPS). Sem alvo, o número medido não
   tem contra o que ser julgado.

**Opcionais (config local `qe-kit.local.json`):**
- `comandoK6`: como invocar o k6. Default: `k6`.
- `baseUrl`: URL base por ambiente. Nunca commitar URL de ambiente no script — passá-la por variável.

Requer o k6 instalado (https://k6.io). Se não estiver, dizer isso e parar — não simular resultado de
carga, que seria inventar dado.

## Passos

### 1. Definir SLO e perfil de carga antes de rodar

Fixar, antes de medir: o SLO (percentil e alvo — ex.: p95 < 300ms), a taxa de erro aceitável (ex.:
< 1%), e o perfil de carga (quantos usuários virtuais, por quanto tempo, com qual rampa). Medir sem
alvo produz um número que ninguém sabe se é bom. O SLO vira `threshold` no k6 — o teste passa ou falha
contra ele, não contra o olho.

### 2. Escrever ou adaptar o script

Partir de `examples/carga.js`. Parametrizar a URL base por variável de ambiente (`-e BASE_URL=...`),
nunca hardcode. Incluir `checks` (a resposta veio correta?) além das métricas — latência baixa com
resposta errada não é performance, é erro rápido.

### 3. Rodar em estágios, não em um ponto

Subir a carga em rampa (ex.: 0→10→50→100 VUs) e observar **onde** a latência descola do throughput.
Um único ponto de carga não revela o joelho da curva. O objetivo é achar o ponto de degradação, não
confirmar um número.

### 4. Interpretar

Ler o resultado pela `references/interpretacao.md`:
- percentis (p95/p99), nunca a média — a média esconde a cauda que o usuário sente;
- latência vs saturação — tempo por request cresce, ou o throughput bateu no teto e a fila subiu?
- assinatura de gargalo — a forma da degradação aponta a causa provável (pool, N+1, GC/lock,
  dependência externa, CPU).

### 5. Entregar o diagnóstico

Relatório no formato da *Saída*: o que foi medido, contra qual SLO, se passou, e — se degradou — a
hipótese de causa com a evidência que a sustenta e o próximo passo para confirmá-la.

## Critério de pronto

- [ ] SLO e perfil de carga definidos **antes** de rodar, e o SLO virou threshold no script.
- [ ] A URL base foi passada por variável, não hardcoded no script.
- [ ] O teste rodou em rampa e identificou o ponto de degradação (ou confirmou folga até o alvo).
- [ ] A leitura usa percentis, não média, e distingue latência de saturação.
- [ ] O relatório traz uma hipótese de causa com evidência e um próximo passo — não só números.

## Saída

```markdown
# Diagnóstico de performance — <endpoint>

## Alvo e SLO
Carga: <perfil>. SLO: <p95 < Xms a Y RPS>, erro < Z%.

## Resultado
| Métrica | Valor | SLO | Passou? |
|---|---|---|---|
| p95 | … | … | … |
| p99 | … | … | … |
| RPS sustentado | … | … | … |
| Taxa de erro | … | … | … |

## Onde degrada
<em que ponto da rampa a latência descolou do throughput>

## Hipótese de causa
<a assinatura observada → o gargalo provável, com a evidência>

## Próximo passo
<a medição ou mudança que confirma ou refuta a hipótese>
```

## Referências e exemplos

- **`references/interpretacao.md`** — como ler os números: percentis, latência vs saturação, e o
  catálogo de assinaturas de gargalo (pool, N+1, GC/lock, dependência externa, CPU). Ler antes de
  concluir qualquer causa.
- **`examples/carga.js`** — script k6 base, com rampa em estágios, thresholds de SLO e checks.

## Demonstração

Com o `examples/sandbox-cobranca` rodando local (`npm run dev`), apontar o script para
`http://localhost:3000` e exercitar `POST /cobrancas`. Sendo uma API em memória, o esperado é folga
grande e nenhum gargalo — e o diagnóstico correto diz exatamente isso: "SLO atendido com folga até N
RPS, sem sinal de saturação", que é um resultado tão válido quanto achar um gargalo. Para exercitar a
leitura de uma assinatura real, introduzir um atraso artificial num handler e observar a forma da
degradação mudar.
