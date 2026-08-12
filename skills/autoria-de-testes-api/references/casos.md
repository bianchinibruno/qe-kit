# Derivar casos de um endpoint

Referência da skill `autoria-de-testes-api`. A taxonomia de casos que um contrato de endpoint implica,
e o mapa de manutenção quando o contrato muda.

## Índice

1. [A taxonomia de casos](#1-a-taxonomia-de-casos)
2. [Como enumerar sem inflar](#2-como-enumerar-sem-inflar)
3. [Drift de contrato](#3-drift-de-contrato)

---

## 1. A taxonomia de casos

Para cada endpoint, percorrer estas categorias. Nem todo endpoint tem todas — mas passar por todas é o
que garante a completude, em vez de parar no caminho feliz.

### Caminho feliz
Entrada válida e completa → o status de sucesso esperado e a **forma** da resposta conferida (não só o
status). Se o contrato diz que retorna `{ id, valorTotal, parcelas[] }`, o teste afirma esses campos e
seus tipos, não só que veio 200.

### Borda
Valores no limite do que o contrato aceita:
- numéricos: zero, negativo, o mínimo e o máximo permitidos, estouro;
- strings: vazia, só espaço, o comprimento máximo, unicode/emoji, caractere de controle;
- coleções: lista vazia, um elemento, o tamanho máximo;
- opcionais: presentes e ausentes — os dois caminhos, porque o código ramifica neles.

A borda é onde mora o off-by-one e o `<=` trocado. Um campo "1 a 12 parcelas" implica teste de 1, de
12, e de 0 e 13 (que devem falhar).

### Erro de validação
Um caso por regra de validação do schema: cada campo obrigatório **ausente**, cada campo com **tipo
errado**, cada constraint violada (formato, faixa, enum fora da lista). Cada um deve retornar o status
de erro certo (400/422) e, se o contrato especifica, apontar o campo. Um endpoint com três campos
obrigatórios implica no mínimo três testes de ausência — não um teste genérico de "entrada inválida".

### Autorização
A categoria que mais protege em fluxo sensível:
- **sem autenticação** → 401;
- **autenticado, mas sem permissão** sobre aquele recurso (outro dono, papel insuficiente) → 403;
- **autenticado e autorizado** → sucesso.
Testar os três: só o caso de sucesso não prova que a rota recusa quem deve recusar. Trocar o id do
recurso pelo de outro dono é o teste que pega IDOR.

### Recurso inexistente
Id que não existe → 404 (não 500, não 200 com corpo vazio). Vale para todo endpoint que recebe id.

### Efeito colateral e idempotência
Para endpoints que escrevem (POST/PUT/DELETE): repetir a operação e verificar o efeito. Se a rota
promete idempotência (chave de idempotência, PUT), repetir com a mesma entrada tem de deixar o mesmo
estado — não aplicar duas vezes. Se não promete, documentar o que acontece na repetição.

### Contrato de resposta
A forma da resposta bate com o tipo declarado: campos presentes, tipos certos, nada de campo interno
vazando (senha, hash, flag de sistema). Um teste que confere a forma pega o dia em que alguém adiciona
um campo sensível ao objeto retornado.

## 2. Como enumerar sem inflar

Completude não é escrever mil testes — é cobrir cada caso **distinto** uma vez. Guias para não inflar:

- **Um caso por regra, não por combinação.** Testar cada campo obrigatório ausente isoladamente; não
  testar todas as 2^n combinações de campos ausentes. A combinação raramente exercita lógica nova.
- **Classe de equivalência.** "Valor negativo" é uma classe: testar `-1` cobre `-1000` também. Testar
  um representante por classe, mais os limites.
- **Não testar o framework.** Se a validação de tipo é do Zod/Joi, um teste por campo confirma que o
  schema está ligado àquela rota; não é preciso reprovar toda a matriz de tipos do validador.
- **Parar quando o próximo caso não muda o ramo exercitado.** Se dois casos percorrem exatamente o
  mesmo caminho do código, um basta.

## 3. Drift de contrato

A parte de manutenção. Quando o contrato muda, estes são os testes a tocar — o mapa evita tanto deixar
a suíte divergir quanto reescrever tudo à toa.

| Mudança no contrato | Testes afetados |
|---|---|
| Campo opcional virou **obrigatório** | Adicionar teste de ausência (→ agora deve dar erro); o caminho feliz que não mandava o campo agora precisa mandá-lo. |
| Campo obrigatório virou **opcional** | O teste de ausência que esperava erro agora deve esperar sucesso; adicionar o caso "ausente → default aplicado". |
| **Novo status** possível (ex.: 409 de conflito) | Adicionar o caso que dispara esse status; ele não existia na suíte. |
| **Status mudou** (ex.: 200 → 201) | Atualizar a asserção de status nos testes daquele endpoint. |
| Campo de **resposta removido** | Remover a asserção sobre ele; verificar que nenhum consumidor de teste dependia dele. |
| Campo de **resposta adicionado** | Adicionar asserção sobre o novo campo; conferir que não é dado sensível vazando. |
| **Endpoint renomeado/movido** | Atualizar o path nos testes; o antigo, se deve dar 404, vira um teste disso. |
| Regra de **validação afrouxada/apertada** | Mover o caso de borda: o valor que antes passava e agora falha (ou o contrário) troca de lado. |

Regra ao aplicar drift: reportar o que mudou e o que foi ajustado, e deixar o humano confirmar a
**intenção**. Uma mudança de status pode ser proposital ou um bug — a skill ajusta o teste ao código,
mas sinaliza para revisão, porque atualizar o teste para casar com um bug é como não ter teste.
