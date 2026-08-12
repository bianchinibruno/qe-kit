# Formato da coleção Bruno

Referência da skill `colecao-api`. A estrutura de pastas e o formato dos arquivos `.bru` — texto puro,
versionável, do Bruno (https://www.usebruno.com). O foco aqui é gerar arquivos consistentes; adaptar a
árvore aos endpoints reais descobertos.

## Estrutura de diretórios

```
docs/api/
├── bruno.json                       # configuração da coleção
├── collection.bru                   # metadados e documentação geral (opcional)
├── environments/
│   ├── local.bru
│   ├── dev.bru
│   └── prod.bru
└── {recurso}/                       # uma pasta por recurso REST
    ├── folder.bru                   # metadados da pasta (opcional)
    ├── Create {Recurso}.bru
    ├── Get {Recurso} by Id.bru
    ├── List {Recurso}s.bru
    └── {sub-recurso}/               # subpastas para sub-rotas
        └── ...
```

Gerar apenas as operações que existem — nem todo recurso tem CRUD completo.

## `bruno.json`

Extrair o nome do projeto do `package.json`, `pyproject.toml`, `pom.xml` ou equivalente.

```json
{
  "version": "1",
  "name": "<nome do projeto>",
  "type": "collection"
}
```

## Ambientes — `environments/<nome>.bru`

As URLs base vêm da config (`ambientes`), nunca hardcoded a partir de um valor observado no código de
produção. Segredos entram como variáveis vazias, preenchidas fora do versionamento.

```
vars {
  baseUrl: http://localhost:3000
  token:
}
```

Referenciar nas requests como `{{baseUrl}}` e `{{token}}`.

## Uma request — `{Operação}.bru`

Cada arquivo descreve uma operação. Os blocos:

```
meta {
  name: Create Cobrança
  type: http
  seq: 1
}

post {
  url: {{baseUrl}}/cobrancas
  body: json
  auth: none
}

headers {
  Content-Type: application/json
  x-cliente-id: {{clienteId}}
}

body:json {
  {
    "clienteId": "{{clienteId}}",
    "valorCentavos": 10000,
    "parcelas": 3
  }
}

docs {
  Cria uma cobrança para o cliente, opcionalmente dividida em parcelas.
  valorCentavos deve ser positivo; parcelas >= 1.
}
```

Regras ao gerar o corpo:
- **Satisfazer a validação real.** O exemplo tem de passar no schema — `valorCentavos` positivo,
  `nome` não vazio, enum com valor da lista. Corpo de exemplo que não passa na validação é inútil.
- **Valores plausíveis, não placeholders.** `"valorCentavos": 10000`, não `"valorCentavos": 0` nem
  `"valorCentavos": "<int>"`.
- **Variáveis para o que encadeia.** Ids que vêm de outra request viram `{{clienteId}}`, para a
  coleção ser navegável em sequência.

## Blocos por método

- `get { url: ... }` — sem `body`; query params no próprio `url` ou em bloco `params:query`.
- `post` / `put` / `patch` — com `body: json` e o bloco `body:json`.
- `delete` — em geral sem corpo.

## Documentação

Usar o bloco `docs {}` de cada request para descrever o que o endpoint faz e as constraints dos campos
— é o que torna a coleção navegável como documentação viva, não só um executor de chamadas.
