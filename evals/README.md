# Evals de disparo

O que garante que cada skill dispara no gatilho certo — e, mais difícil numa suíte de skills irmãs,
que **não** dispara no lugar da irmã. As skills do `qe-kit` compartilham vocabulário (teste, API,
cobertura, PR, endpoint), então o risco real não é a query óbvia: é o vizinho próximo.

`disparo.json` tem as queries, cada uma marcada com a skill que deve disparar (`alvo`) ou `null`
quando nenhuma deve. As queries são realistas — como um usuário fala, com gíria, contexto e caminho de
arquivo — porque query genérica não testa disparo.

## Como validar

Rodar cada query num Claude Code com o plugin instalado e observar qual skill é consultada. A forma
automatizada usa o `claude -p` em loop (ver a skill `skill-creator` do ecossistema); a forma manual é
colar a query e ver o disparo. O critério: a skill consultada é a do campo `alvo`, e nenhuma skill
dispara quando `alvo` é `null`.

## Colisões que o conjunto cobre de propósito

As queries `null` e os pares abaixo são os casos difíceis — onde um match ingênuo por palavra-chave
dispararia a skill errada:

| Vizinhos | O que separa |
|---|---|
| `revisao-pr-multiagente` × `abrir-pr` | revisar um PR existente vs **abrir** um novo. "revisa esse PR" ≠ "abre o PR". |
| `testes-de-integracao` × `autoria-de-testes-api` | fortalecer/provar testes de integração vs **derivar** casos do contrato de API. "testes de integração" ≠ "testes de API dos endpoints". |
| `autoria-de-testes-api` × `colecao-api` | escrever testes que exercitam a API vs **documentar** os endpoints numa coleção navegável. |
| `cobertura-de-criterios` × `testes-de-integracao` | cruzar critérios de aceite com a suíte (medir) vs escrever teste (produzir). |
| qualquer skill de teste × `null` | teste unitário de função pura, E2E de browser, **explicar** conceito, e **consertar** bug não são trabalho de nenhuma skill daqui. |

## O que a análise de disparo revelou

Revisão das 22 queries contra as descrições atuais: todas resolvem para o `alvo` esperado. Os pontos
que exigiram descrição bem calibrada:

- **A fronteira "Não faz" carrega o peso.** As queries `null` (`conserta o bug`, `teste unitário
  puro`, `E2E no navegador`, `explica a diferença`, `doc de arquitetura`) só não disparam porque cada
  skill declara explicitamente o que recusa. Sem a seção "Não faz", `conserta o bug de idempotência
  que a revisão apontou` puxaria a `revisao-pr-multiagente` pela palavra "revisão".
- **O verbo de ação desambigua os irmãos.** "revisar/abrir", "fortalecer/derivar/documentar",
  "medir/produzir" — as descrições disparam por verbo de intenção, não por substantivo de domínio, e é
  isso que separa skills que falam do mesmo assunto.

Este conjunto é o ponto de partida da iteração: quando uma skill nova entrar ou uma descrição mudar,
rodar de novo e adicionar as queries do novo par de vizinhos.
