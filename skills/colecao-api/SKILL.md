---
name: colecao-api
description: Esta skill deve ser usada quando o usuário pedir para "gerar uma coleção de API", "criar a coleção Bruno", "documentar os endpoints", "montar as requests da API", "gerar as chamadas dos endpoints" ou "atualizar a coleção com os endpoints novos". Descobre as rotas e os contratos no código-fonte e gera (ou atualiza) uma coleção Bruno navegável em arquivos .bru — com ambientes e autenticação — versionável junto do código. Não use para escrever testes de API (isso é autoria-de-testes-api), nem para documentação de arquitetura, nem para executar as chamadas contra a API.
---

# colecao-api

Gera uma coleção de API navegável a partir do código — não de um Postman exportado à mão que envelhece
no primeiro endpoint novo. Descobre as rotas e seus contratos lendo o código-fonte e escreve arquivos
`.bru` (formato aberto do Bruno, texto puro versionável) organizados por recurso, com ambientes e
autenticação. Quando já existe coleção, atualiza só o que mudou.

## Por que gerar do código

Coleção de API mantida à mão diverge do código na primeira semana: alguém adiciona um endpoint e
esquece de documentar, um campo muda e a request fica desatualizada. Gerar do código-fonte — das rotas,
dos schemas de validação, dos tipos — mantém a coleção fiel ao que a API realmente aceita. E em formato
texto (`.bru`), a coleção entra no versionamento e evolui junto do código no mesmo PR, em vez de viver
num export binário que ninguém sabe se está atual.

## Escopo

**Faz:** descobre endpoints e contratos no código, gera uma coleção Bruno em `.bru` organizada por
recurso, com ambientes e autenticação parametrizados, e atualiza a coleção incrementalmente quando ela
já existe.

**Não faz:** não escreve testes de API — isso é a `autoria-de-testes-api`. Não produz documentação de
arquitetura. Não executa as chamadas contra a API — gera a coleção; rodar é decisão do usuário.

## Entradas

**Obrigatória:** o repositório ou o recorte de endpoints.

**Opcionais (config local `qe-kit.local.json`):**
- `saidaColecao`: pasta onde gerar. Default: `docs/api/`.
- `ambientes`: nomes e URLs base por ambiente (local, dev, prod). As URLs de ambiente vêm daqui,
  nunca hardcoded nos `.bru`.
- `auth`: esquema de autenticação (Bearer, API key, header). O **valor** do token nunca vai para a
  coleção — usa-se uma variável de ambiente (ex.: `{{token}}`), e o valor fica fora do versionamento.

## Passos

### 1. Descobrir os endpoints

Ler o código e localizar todas as rotas, seja qual for o framework: definições de rota e controllers
(Express, Fastify, NestJS, Hono…), eventos HTTP em serverless (`serverless.yml`, `template.yaml`),
ou os arquivos de rota equivalentes em outros stacks (Django `urls.py`, Spring `@RequestMapping`…).
Para cada endpoint, extrair método, path e handler.

### 2. Descobrir o contrato

Para cada endpoint, ler o código para entender request e response: schemas de validação (Zod, Joi,
class-validator…) para os campos, tipos/DTOs para a estrutura, enums para os valores válidos, o formato
de sucesso e de erro (envelope, status), o método de autenticação, e as URLs base por ambiente. Montar
o corpo de exemplo a partir do schema, com valores plausíveis — não placeholders vazios que não passam
na validação.

### 3. Verificar coleção existente

Se já há coleção na pasta de saída, ler os `.bru` existentes e identificar o que falta ou está
desatualizado — gerar/atualizar só isso, preservando docs e ajustes manuais que o usuário fez. Se não
há, gerar do zero. Nunca sobrescrever cegamente uma coleção existente.

### 4. Gerar os arquivos

Escrever os `.bru` na estrutura por recurso descrita em `references/formato-bru.md`: `bruno.json` na
raiz, `environments/` para os ambientes, uma pasta por recurso REST com um arquivo por operação. Gerar
apenas as operações que existem — nem todo recurso tem CRUD completo.

### 5. Conferir a consistência

Revisar: toda rota descoberta virou uma request; toda URL de ambiente veio da config, não hardcoded;
nenhum segredo entrou nos arquivos (só variáveis `{{...}}`); os corpos de exemplo satisfazem os schemas
de validação. Reportar o que foi gerado e o que ficou de fora, se algo ficou.

## Critério de pronto

- [ ] Toda rota descoberta no recorte tem uma request na coleção.
- [ ] O contrato de cada request (campos, tipos) veio do código, e o corpo de exemplo passa na
      validação real.
- [ ] Ambientes e auth vêm de config/variáveis — nenhuma URL de ambiente nem token hardcoded.
- [ ] Coleção existente foi atualizada incrementalmente, sem apagar ajustes manuais.
- [ ] O resumo diz o que foi gerado/atualizado e o que ficou de fora.

## Saída

A coleção `.bru` na pasta configurada, mais um resumo:

```markdown
# Coleção de API — <projeto>

## Gerado/atualizado
- <recurso>/ — <N operações>: <lista>

## Ambientes
- <local, dev, prod> com URLs vindas da config

## Ficou de fora
- <endpoints não gerados e por quê, se houver>
```

## Referências

- **`references/formato-bru.md`** — a estrutura da coleção e o formato dos arquivos `.bru`
  (`bruno.json`, `collection.bru`, `environments/`, `folder.bru`, e os blocos de uma request).

## Demonstração

Contra o `examples/sandbox-cobranca`: descobrir `POST /clientes`, `POST /cobrancas`,
`POST /cobrancas/:id/pagamentos` e `GET /cobrancas/:id` (na branch com as features), extrair os campos
dos tipos e das validações, e gerar a coleção com um ambiente `local` apontando para
`http://localhost:3000` e o header `x-cliente-id` como variável. Os corpos de exemplo devem satisfazer
as validações — `valorCentavos` positivo, `nome` não vazio.
