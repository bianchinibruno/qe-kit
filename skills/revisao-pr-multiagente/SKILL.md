---
name: revisao-pr-multiagente
description: Esta skill deve ser usada quando o usuário pedir para "revisar o PR", "revisar essa branch", "fazer code review", "revisão de código", "revisar antes de mergear" ou "olhar esse diff antes de subir". Revisa um conjunto de mudanças com seis lentes independentes em paralelo — correção, contrato, teste, dados/estado, segurança e simplificação — deduplica os achados e ranqueia por severidade. Não use para gerar o pull request (isso é a skill abrir-pr), nem para revisar um arquivo inteiro que não faz parte de um diff.
---

# revisao-pr-multiagente

Revisa um diff com seis lentes disjuntas rodando em paralelo, cada uma cega ao veredito das outras,
e consolida tudo em um relatório único, deduplicado e ranqueado por severidade.

## Por que seis lentes em vez de um revisor

Um único revisor generalista lê o diff uma vez e para no primeiro tipo de problema que reconhece —
quase sempre estilo e correção óbvia. Bugs de idempotência, quebra de contrato e IDOR passam porque
o revisor já "gastou" a atenção. Seis lentes com mandato estreito forçam seis leituras diferentes do
mesmo diff: a lente de dados/estado *precisa* procurar retry duplicado mesmo que o código pareça
limpo. O ganho não vem de rodar mais agentes — vem de cada um saber o que **não** é problema dele, o
que evita seis cópias do mesmo achado óbvio.

## Escopo

**Faz:** revisa um diff (PR, branch contra base, ou working tree) sob seis lentes, consolida e
ranqueia os achados, e entrega um relatório. Opcionalmente posta os achados como comentários no PR
ou aplica as correções, se o usuário pedir explicitamente.

**Não faz:** não gera o pull request — isso é a `abrir-pr`. Não revisa arquivo solto fora de um
diff. Não aplica correção sem o usuário pedir. Não aprova nem faz merge — a decisão é do humano.

## Entradas

**Obrigatória:** um alvo de revisão. Na ordem de precedência:
1. número de PR, se o usuário passar (ex.: "revisar o PR 42")
2. uma branch/ref, comparada contra a base
3. nada informado → o working tree atual (`git diff` + `git diff --staged`)

**Opcionais (config local `qe-kit.local.json`, na raiz do repo, fora do versionamento):**
- `baseBranch`: a base para o diff quando o alvo é uma branch. Default: `main`.
- `severidadeMinima`: menor severidade a incluir no relatório. Default: `baixo`.

Ler a config com o utilitário compartilhado descrito em `../_shared/config.md` (se presente). Na
ausência de config, usar os defaults acima — a skill nunca trava por falta de configuração.

## Passos

### 1. Resolver o alvo e materializar o diff

Determinar o alvo pela precedência acima. Produzir o diff uma única vez e gravá-lo em um arquivo
temporário — os seis subagentes revisam exatamente o mesmo diff, senão os achados não são
comparáveis.

- PR: `gh pr diff <n> --patch > <tmp>/diff.patch` e capturar a lista de arquivos.
- Branch: `git diff <baseBranch>...<ref>` (three-dot: compara com o ponto de divergência, não com o
  estado atual da base).
- Working tree: `git diff HEAD`.

Se o diff estiver vazio, parar e dizer isso — não há o que revisar.

### 2. Rodar as seis lentes em paralelo

Disparar **na mesma mensagem** seis subagentes (um por lente), cada um recebendo:
- o conteúdo de `lentes/<nome>.md` como instrução;
- o caminho do `diff.patch` e a raiz do repo (a lente lê os arquivos ao redor para contexto, mas só
  reporta sobre linhas do diff);
- o formato de achado da seção *Saída*.

As seis lentes: `correcao`, `contrato`, `teste`, `dados-estado`, `seguranca`, `simplificacao`.
Rodar em paralelo importa por dois motivos: latência, e independência — nenhuma lente vê o resultado
da outra, então não há ancoragem nem convergência artificial.

Cada subagente é read-only. Nenhuma lente edita código nesta fase.

### 3. Consolidar

Reunir os achados das seis lentes e aplicar, nesta ordem:

1. **Descarte por evidência.** Todo achado sem `arquivo:linha` concreto **e** sem um cenário de
   falha concreto (entradas específicas → resultado errado) sai. Sem exceção. Achado vago é ruído, e
   ruído faz o humano ignorar o relatório inteiro — inclusive os achados reais.
2. **Deduplicação.** Dois achados no mesmo `arquivo:linha` apontando a mesma causa viram um só.
   Manter o de maior severidade; se empatar, o da lente mais específica (dados/estado e segurança
   ganham de correção genérica). Registrar quais lentes concordaram — concordância é sinal de
   confiança, não motivo para listar duas vezes.
3. **Ranqueamento.** Ordenar por severidade: `crítico` > `alto` > `médio` > `baixo`. Aplicar o corte
   de `severidadeMinima`.

### 4. Entregar o relatório

Produzir o relatório no formato da seção *Saída*. Se o usuário pediu `--comentar`, postar cada
achado como comentário inline no PR (requer alvo do tipo PR e confirmação). Se pediu `--corrigir`,
aplicar as correções no working tree **depois** de mostrar o relatório e obter o aval — nunca antes.

## Critério de pronto

- [ ] O diff foi materializado uma vez e as seis lentes revisaram o mesmo conteúdo.
- [ ] As seis lentes rodaram em paralelo, cada uma com seu prompt disjunto.
- [ ] Todo achado no relatório tem `arquivo:linha` e um cenário de falha concreto — os que não têm
      foram descartados, não incluídos "por via das dúvidas".
- [ ] Achados duplicados foram fundidos, com as lentes concordantes registradas.
- [ ] O relatório está ranqueado por severidade e respeita `severidadeMinima`.
- [ ] Correção ou comentário no PR só aconteceu se o usuário pediu, e depois do relatório.

## Saída

Cada lente retorna uma lista de achados neste formato:

```
### [<severidade>] <título curto>
- **Lente:** <nome da lente>
- **Local:** <arquivo>:<linha>
- **Falha:** <entradas concretas → resultado errado concreto>
- **Correção:** <a mudança mínima que resolve>
```

O relatório consolidado do orquestrador:

```markdown
# Revisão — <alvo> (<N> arquivos, <M> achados)

## Crítico
<achados>

## Alto
<achados>

## Médio / Baixo
<achados>

## Lentes sem achado
<lentes que rodaram e não acharam nada — silêncio informado, não omissão>

## Resumo
<1–3 linhas: o que impede o merge, o que é limpeza. Sem veredito de aprovação — a decisão é do humano.>
```

Listar as lentes que não acharam nada importa: diz ao humano que aquela dimensão foi olhada e está
limpa, em vez de deixá-lo sem saber se a lente rodou.

## Lentes

Os seis prompts de lente vivem em `lentes/`. Cada um define o mandato da lente, o que ela
explicitamente ignora (para não invadir a lente vizinha), e exemplos do tipo de achado que ela
persegue:

- **`lentes/correcao.md`** — lógica, borda, null/undefined, off-by-one, erro de arredondamento.
- **`lentes/contrato.md`** — breaking change de API/schema, retrocompatibilidade, forma de resposta.
- **`lentes/teste.md`** — o que mudou está coberto? a asserção falha quando o código está errado?
- **`lentes/dados-estado.md`** — idempotência, retry, transação, corrida, consistência.
- **`lentes/seguranca.md`** — autorização, injeção, segredo exposto, PII, IDOR.
- **`lentes/simplificacao.md`** — duplicação, código morto, complexidade desnecessária.

## Demonstração

Rodar contra a branch `exemplo/pr-para-revisar` do `examples/sandbox-cobranca`: o diff introduz três
bugs (idempotência, arredondamento, IDOR) e uma suíte de testes que passa sem pegá-los. Uma revisão
correta acha os três, cada um pela lente esperada, e a lente de teste sinaliza a suíte vacuosa — sem
inundar o relatório de ruído. O gabarito está em `GABARITO.md` daquela branch (para conferência
humana, não para a skill ler antes).
