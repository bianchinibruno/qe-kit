# Configuração — `abrir-pr`

Tudo que é específico de um time ou empresa mora em `qe-kit.local.json`, na raiz do repositório.
Esse arquivo é ignorado pelo git de propósito: mantém a skill genérica e impede que URL de tracker,
nome de branch interno ou convenção de empresa vazem para um repositório público.

Sem esse arquivo, a skill opera nos padrões descritos ao final.

## Esquema

```json
{
  "pr": {
    "tracker": {
      "name": "Jira",
      "baseUrl": "https://tracker.example.com/browse/",
      "idPattern": "[A-Z]{2,}-[0-9]+",
      "required": true
    },
    "baseBranch": "main",
    "branchNamePattern": "<type>/<slug>",
    "dualTarget": {
      "enabled": false,
      "secondBase": "develop",
      "branchSuffix": "-develop"
    }
  }
}
```

### `pr.tracker`

- **`name`** — nome do tracker, só para exibição (`Jira`, `Linear`, `GitHub Issues`).
- **`baseUrl`** — prefixo do link. O ID da tarefa é concatenado no final. Ex.: base
  `https://tracker.example.com/browse/` + ID `ABC-1073` = link completo.
- **`idPattern`** — regex para achar o ID na branch, nos commits e no texto do usuário.
- **`required`** — se `true`, a skill pergunta o ID quando não o encontra, em vez de omitir a seção
  Tarefa. Se `false`, omite silenciosamente quando não houver ID.

### `pr.baseBranch`

Branch de destino padrão do PR. Sem config, a skill descobre a branch padrão do repositório com
`gh repo view --json defaultBranchRef -q .defaultBranchRef.name`.

### `pr.branchNamePattern`

Modelo do nome de branch de trabalho quando a skill precisa criar uma (passo 2 do SKILL.md).
`<type>` é o tipo Conventional Commits derivado das mudanças; `<slug>` é um resumo curto em
kebab-case. Sem config, usa `<type>/<slug>`.

### `pr.dualTarget`

Só para times que mantêm duas linhas de release (ex.: um PR para `main` e outro para uma branch de
desenvolvimento). Mantido opcional porque é a exceção, não a regra.

- **`enabled`** — liga o segundo PR. Padrão `false`.
- **`secondBase`** — a segunda branch base.
- **`branchSuffix`** — sufixo da segunda branch de trabalho (ex.: `feat/x` → `feat/x-develop`).

## Fluxo de PR duplo (passo 8 do SKILL.md)

Executar **apenas** com `dualTarget.enabled: true`, e **apenas após** o primeiro PR estar criado e
confirmado.

1. A partir da branch de trabalho já enviada, identificar os commits que compõem o PR
   (`git log <baseBranch>..HEAD`).
2. Criar a segunda branch a partir de `secondBase` atualizada:
   `git fetch origin && git checkout -b <branch><branchSuffix> origin/<secondBase>`.
3. Aplicar os mesmos commits via `git cherry-pick`. Se houver conflito, parar e pedir orientação —
   não resolver conflito no escuro.
4. `git push -u origin <branch><branchSuffix>`.
5. Abrir o segundo PR com o **mesmo título** e um corpo que reaproveita as seções, ajustando o Guia
   de Fluxo se a validação na segunda base diferir.
6. Reportar as duas URLs.

Nunca fazer merge de uma base na outra para "sincronizar" — o cherry-pick mantém as duas linhas
independentes, que é a razão de existir o fluxo duplo.

## Comportamento padrão (sem `qe-kit.local.json`)

- **Base:** branch padrão do repositório.
- **Tracker:** Issues do próprio repositório no GitHub. Se um `#<numero>` aparecer nos commits ou no
  texto do usuário, vira link; senão, a seção Tarefa é omitida.
- **Nome de branch:** `<type>/<slug>`.
- **PR duplo:** desligado.
