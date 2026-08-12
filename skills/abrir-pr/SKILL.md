---
name: abrir-pr
description: Esta skill deve ser usada quando o usuário pedir "abrir PR", "criar pull request", "subir PR", "manda o PR", "preparar o PR", "gerar a descrição do PR" ou qualquer variação de abrir um pull request. Produz título em Conventional Commits (inglês) e corpo estruturado (português) a partir dos commits da branch, e cria o PR via gh após confirmação. Não use para escrever mensagens de commit (isso é da skill de commit), para revisar o conteúdo de um PR já aberto, nem para fazer merge.
---

# abrir-pr

Abrir um bom PR é um ato de comunicação, não de burocracia. Quem revisa precisa entender em trinta
segundos **o que mudou**, **onde bate** e **o que pode quebrar** — sem abrir o diff inteiro. Esta
skill deriva isso dos commits da branch e monta um PR que responde essas três perguntas antes que
o revisor precise fazê-las.

## Escopo

**Faz:** analisa os commits entre a branch atual e a base, gera um título em Conventional Commits
(inglês), monta um corpo estruturado em português, cria a branch se necessário, faz o push e abre o
PR via `gh` — sempre depois de mostrar o texto e confirmar.

**Não faz:** não escreve nem reescreve mensagens de commit (isso é da skill de commit); não faz
merge, não aprova, não fecha PR; não altera código para "melhorar" o diff; não abre PR sem a
confirmação explícita do usuário sobre o texto final.

## Entradas

**Obrigatórias (descobertas do repositório, não perguntadas):**
- Branch atual e branch base (a base vem da config; sem config, é a branch padrão do repositório).
- Commits e diff entre base e branch atual — a matéria-prima do título e do corpo.

**Opcionais (config local, ver `references/configuracao.md`):**
- Issue tracker (nome + base URL + padrão do ID) para o link da tarefa. Sem config, usa as Issues
  do próprio repositório no GitHub.
- Branch base alternativa e fluxo de PR duplo (main + release), quando o time usa esse modelo.

Ler a config de `qe-kit.local.json` na raiz do repositório, se existir. Esse arquivo é ignorado
pelo git de propósito — é onde mora tudo que é específico da empresa (URL do tracker, nomes de
branch), para que a skill permaneça genérica e o repositório público não vaze contexto interno.

## Passos

Seguir na ordem. Cada passo tem uma saída verificável antes de prosseguir.

### 1. Ler a configuração e resolver base

Carregar `qe-kit.local.json` se existir (esquema em `references/configuracao.md`). Resolver a
branch base: `pr.baseBranch` da config, ou a branch padrão do repositório
(`git remote show origin` / `gh repo view --json defaultBranchRef`). **Saída:** base definida e
impressa.

### 2. Garantir que a branch atual não é a base

Nunca abrir PR a partir da própria base. Se a branch atual for a base, criar uma branch de trabalho
a partir das mudanças pendentes ou dos últimos commits, com nome derivado do tipo e do escopo
(ex.: `feat/pagamento-idempotente`). Se a config declarar um padrão de nome de branch, seguir esse
padrão. **Saída:** branch de trabalho confirmada, diferente da base.

### 3. Coletar commits e diff

`git log <base>..HEAD --oneline` e `git diff <base>...HEAD --stat` para o panorama, e o diff
completo quando precisar entender uma mudança. Ler os arquivos tocados o suficiente para descrever
impacto e risco com precisão — descrição vaga de PR é a que ninguém confia. **Saída:** lista de
commits e conjunto de arquivos alterados em mãos.

### 4. Gerar o título (inglês, Conventional Commits)

Formato `<type>: <description>`. Tipos: `feat`, `fix`, `refactor`, `chore`, `test`, `docs`, `perf`,
`build`, `ci`. Derivar o tipo do conjunto dominante de mudanças; a descrição é curta, no imperativo,
em inglês. Nunca usar `update`, `changes`, `wip`, `fix stuff`. **Saída:** título proposto.

### 5. Detectar o ID da tarefa

Procurar o ID do tracker (padrão da config, ex.: `[A-Z]+-[0-9]+`) na branch, nos commits e no que o
usuário disse. Se encontrar, montar o link com a base URL da config. Se não encontrar e a config
exigir tracker, perguntar o ID ao usuário — uma vez, de forma direta. Sem tracker configurado, usar
`#<numero>` de uma issue do GitHub se houver, ou omitir a seção Tarefa. **Saída:** link da tarefa,
ou decisão explícita de omitir.

### 6. Montar o corpo (português)

Usar o modelo de `references/modelo-corpo.md`, com **todas** as seções, nesta ordem:

1. `## Tarefa` — link do tracker no topo (ou omitida se não houver).
2. `## Descrição` — 1 a 5 bullets do que foi feito, no passado, factual.
3. `## Pontos de Impacto` — módulos, serviços e áreas tocados. Vem dos arquivos do passo 3.
4. `## Análise de Riscos` — cada risco no formato `**Risco**: … → **Mitigação**: …`. Se não houver
   risco real, dizer isso em uma linha em vez de inventar risco genérico.
5. `## Guia de Fluxo` — passo a passo para o revisor validar a mudança (comandos, rota, tela, dado
   de teste). É a seção que mais economiza tempo de quem revisa.

**Saída:** corpo completo em markdown.

### 7. Confirmar antes de abrir

Abrir um PR publica conteúdo em nome do usuário — é uma ação que exige aprovação. Mostrar o título e
o corpo completos e a branch de destino, e **esperar o "sim"**. Só então: `git push -u origin
<branch>` e `gh pr create --base <base> --title "<titulo>" --body "<corpo>"`. **Saída:** URL do PR
criado.

### 8. Fluxo de PR duplo (só se a config pedir)

Se `pr.dualTarget.enabled` for verdadeiro, após o primeiro PR: criar a segunda branch com o sufixo
configurado, aplicar os mesmos commits sobre a segunda base via cherry-pick, resolver conflito se
houver, e abrir o segundo PR. Detalhes em `references/configuracao.md`. Sem essa config, ignorar
este passo por completo.

## Critério de pronto

- [ ] Título em Conventional Commits, em inglês, sem palavra proibida.
- [ ] Corpo em português com as cinco seções na ordem (Tarefa pode ser omitida se não houver tracker).
- [ ] Cada risco no formato `**Risco**: … → **Mitigação**: …`.
- [ ] Guia de Fluxo com passos concretos, não "testar normalmente".
- [ ] Branch de trabalho ≠ base; push feito.
- [ ] Usuário confirmou o texto antes do `gh pr create`.
- [ ] Segundo PR aberto **apenas** se a config declarou dualTarget.

## Saída

Uma ou duas URLs de PR (conforme dualTarget), reportadas como links markdown clicáveis, com o título
e a branch de destino de cada uma.

## Recursos

- **`references/configuracao.md`** — esquema do `qe-kit.local.json`, detecção de tracker e branch
  padrão, e o fluxo de PR duplo passo a passo.
- **`references/modelo-corpo.md`** — o modelo do corpo do PR e um exemplo preenchido de ponta a ponta.
