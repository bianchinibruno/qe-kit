# Asserções que provam algo

Referência da skill `testes-de-integracao`. O princípio vale para qualquer framework — os exemplos
usam uma sintaxe estilo `expect(...)`, mas a ideia é sobre o que a asserção *garante*, não sobre a
biblioteca.

## Índice

1. [O princípio: um teste existe para falhar](#1-o-princípio)
2. [Catálogo de asserções vacuosas](#2-catálogo-de-asserções-vacuosas)
3. [Regras de factualidade](#3-regras-de-factualidade)
4. [Prova de regressão](#4-prova-de-regressão)
5. [Independência](#5-independência)
6. [Checklist rápido](#6-checklist-rápido)

---

## 1. O princípio

Um teste tem um único trabalho: **falhar quando o comportamento está errado**. Essa é a definição
operacional de um bom teste — não "cobre a linha", não "fica verde", mas "vira vermelho se o código
quebrar".

Disso segue a regra que orienta tudo o resto: uma asserção só vale o que ela *exclui*. Se existe um
valor errado que passa pela asserção, a asserção não protege contra esse valor. `toBeDefined()` não
exclui quase nada — todo valor não-nulo passa, inclusive o errado. Por isso um teste com asserção
vacuosa é **pior que nenhum teste**: nenhum teste ao menos não engana; o teste vacuoso fica verde,
alguém confia, e para de olhar exatamente onde deveria olhar.

O alvo mental, ao escrever cada asserção: *qual valor errado esta linha deixaria passar?* Se a
resposta for "vários", a asserção está fraca.

---

## 2. Catálogo de asserções vacuosas

### 2.1 `toBeDefined` / `toBeTruthy` sobre algo que sempre existe

```js
// ❌ passa com 200, 400, 500 — qualquer statusCode é "defined"
expect(res.statusCode).toBeDefined();
// ✅ exclui todo status que não seja o esperado
expect(res.statusCode).toBe(201);
```

O mesmo vale para `expect(resultado).toBeTruthy()` quando `resultado` é um objeto que a função sempre
retorna. Aceita o objeto certo e o errado.

### 2.2 `every` / `some` / `filter().length` sobre array que pode estar vazio

```js
// ❌ o filtro esvazia o array; every sobre [] é true por vacuidade
const grandes = parcelas.filter((p) => p.valorCentavos > 1000);
expect(grandes.every((p) => p.valorCentavos > 0)).toBe(true); // sempre passa
```

`[].every(fn)` é `true` para qualquer `fn`. Se o setup não garante que o array tem elementos, a
asserção é vazia. **Checar o tamanho antes**, e de preferência afirmar o tamanho exato:

```js
// ✅ garante que há o que verificar, depois verifica
expect(parcelas).toHaveLength(3);
expect(parcelas.every((p) => p.valorCentavos > 0)).toBe(true);
```

### 2.3 Skip silencioso com `if`

```js
// ❌ se body.id for falso, a asserção nunca roda e o teste passa "vazio"
if (body && body.id) {
  expect(body.id).toBe(esperado);
}
```

O `if` transforma a ausência do dado em aprovação silenciosa. Pior: quando o teste deveria provar que
uma requisição indevida é **recusada**, esse padrão confirma justamente o comportamento bugado (o
corpo veio) em vez de exigir o certo (403/erro). Afirmar diretamente:

```js
// ✅ falha explicitamente se o corpo não veio como devia
expect(res.statusCode).toBe(403);
```

### 2.4 Erro validado só pela existência da mensagem

```js
// ❌ aceita qualquer erro, inclusive o erro errado
expect(error.message).toBeDefined();
expect(error.errorId || error.message).toBeDefined(); // o fallback esconde a falha
```

Um fluxo pode lançar o erro certo pelo motivo errado, ou o erro genérico onde deveria lançar o
específico. Afirmar **tipo e código**:

```js
// ✅ exclui todo erro que não seja exatamente este
expect(error).toBeInstanceOf(BillingError);
expect(error.code).toBe(BillingErrorCode.IDEMPOTENCY_CONFLICT);
```

Ler o código-fonte para descobrir qual código o fluxo lança no cenário testado. Se há `retry()` ou
wrapper, verificar se o erro original é re-emitido ou convertido (ex.: virou `UNKNOWN_ERROR`) — e
afirmar o que realmente chega.

### 2.5 Asserção larga onde o valor exato é conhecível

```js
// ❌ "maior que zero" aceita o valor errado
expect(cobranca.pagoCentavos).toBeGreaterThan(0);
// ✅ o valor exato é conhecido — afirmá-lo
expect(cobranca.pagoCentavos).toBe(100);
```

Faixa só quando o valor genuinamente não é determinístico (timestamp, id gerado). Quando dá para
saber o número exato, afirmar o número exato: é o que pega o débito em dobro (`200` em vez de `100`).

### 2.6 Snapshot gigante aceito como verdade

Um snapshot de centenas de linhas que ninguém lê é aprovado no primeiro `--update` e nunca mais
questionado. Prefira asserções pontuais sobre os campos que importam; snapshot só para estrutura
estável e pequena.

---

## 3. Regras de factualidade

Estas regras garantem que o teste exercita o **código**, não o mock nem um caminho vazio.

### 3.1 Shape do mock igual à shape que o código consome

Ler o código para descobrir quais campos ele acessa (ex.: `pedido.cliente.plano.limite`). Se o mock
não inclui esses campos, uma de duas: o teste falha por `undefined` (motivo errado) ou passa sem
exercitar a lógica. O mock precisa ter a mesma forma que a fonte real produz.

### 3.2 Exercitar o ramo certo

Se o código ramifica em `if (config.gateway === 'STRIPE')`, o mock de config precisa ter
`gateway: 'STRIPE'` para o teste exercitar esse ramo. Antes de escrever a asserção, saber qual ramo
o cenário percorre — e montar o estado que leva até ele. Um teste que percorre o ramo default nunca
prova nada sobre o ramo que interessa.

### 3.3 Dado precisa sobreviver ao filtro

Se o código faz `itens.filter((i) => i.origem.includes('web'))`, o mock precisa conter itens com
`origem` que inclui `'web'`. Senão o resultado é `[]`, e qualquer asserção sobre ele é vacuosa (ver
§2.2). O dado de entrada tem de sobreviver a todas as transformações até o ponto que a asserção
verifica.

### 3.4 Testar o código da aplicação, não a biblioteca

```js
// ❌ testa o Redis, não a aplicação
await cache.set('k', 'v');
expect(await cache.get('k')).toBe('v');
// ✅ testa a integração da aplicação com o Redis
await ParseManager.getClienteByChatId('chat-001'); // usa cache por dentro
```

Com container/serviço real, o teste tem de rotear o tráfego pelo código da aplicação. Se a app tem um
endpoint hardcoded para `localhost:8000` quando offline, garantir que o teste configura as condições
para o client usar o container, não o hardcoded — senão o container sobe e não é exercitado.

### 3.5 Validar o que foi enviado, não só o que interceptou

Para POST/PUT contra um serviço externo mockado, afirmar que o corpo enviado pelo código contém os
campos certos (modelo, params, headers), não apenas que *alguma* requisição foi interceptada. Um
interceptador que casa com qualquer requisição não prova que o código montou a requisição certa.

### 3.6 Uma classe concreta, um grupo de testes

Se `SerpClient`, `ScrapeClient` e `Reranker` são três classes, são três grupos de teste. Agrupar tudo
sob um guarda-chuva ("o serviço de busca") deixa classes concretas sem cobertura própria.

---

## 4. Prova de regressão

O passo que separa teste de teatro, e o item mais importante desta referência.

Um teste só está provado quando se confirma que ele **falha com o código errado e passa com o código
certo**. Verde sozinho não distingue os dois. O procedimento:

1. Com o teste escrito e o código no estado atual, rodar e observar.
2. Introduzir o defeito que o teste deve pegar — quebrar a linha coberta, ou reverter o fix se o bug
   já existia — e rodar de novo. **O teste tem de falhar**, e falhar pela asserção certa (a mensagem
   aponta o valor errado esperado, não um `undefined` acidental).
3. Restaurar o código correto. **O teste tem de passar.**

Se o teste passa nos dois estados, a asserção é vacuosa: reescrever, não commitar. Se falha nos dois,
o teste está acoplado a outra coisa (setup errado, dependência de ordem): corrigir o teste.

Registrar essa prova no resumo de saída — é o que dá ao revisor humano confiança de que a suíte verde
significa algo.

---

## 5. Independência

Cada teste cria o próprio estado, age, valida e limpa. Nenhum teste depende de outro ter rodado
antes, nem de estado global compartilhado.

- Setup por teste (ou `beforeEach`), nunca estado que vaza de um teste para o seguinte.
- Ids e dados criados dentro do teste, não constantes globais que dois testes mutam.
- Se a ordem de execução muda o resultado, há acoplamento — e o teste que passa hoje falha amanhã
  quando o runner paraleliza ou reordena.

Um teste dependente de ordem é um falso positivo esperando acontecer: passa na máquina de quem
escreveu e falha no CI, ou o contrário.

---

## 6. Checklist rápido

Antes de commitar qualquer teste:

- [ ] Existe um valor errado que esta asserção deixaria passar? Se sim, apertar a asserção.
- [ ] O array tem tamanho garantido antes de `every`/`some`?
- [ ] Nenhum `if` engole a asserção em silêncio?
- [ ] Erro afirmado por tipo **e** código, não por existência de mensagem?
- [ ] Valor exato afirmado onde é conhecível?
- [ ] O mock tem a shape que o código consome e o dado sobrevive aos filtros?
- [ ] O cenário exercita o ramo que se quer provar?
- [ ] Passou na prova de regressão (falha com bug, passa sem)?
- [ ] O teste é independente de ordem e cria o próprio estado?
