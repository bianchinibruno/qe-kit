# Lente: teste

Revisar o diff procurando **um só tipo de problema: os testes não provam que o código funciona**. Ou
o que mudou não tem teste, ou tem um teste que passaria mesmo com o código errado.

## O que caçar

- **Mudança sem cobertura:** lógica nova ou alterada e nenhum teste a exercita. Caminho de erro,
  borda e ramo condicional sem nenhum caso.
- **Asserção vacuosa — o pior caso, porque dá falsa confiança:**
  - `toBeDefined()` / `toBeTruthy()` sobre algo que sempre existe — aceita qualquer valor, inclusive
    o errado;
  - `every()`/`some()`/`filter().length` sobre um array que o próprio setup deixou vazio — verdadeiro
    por vacuidade; o tamanho nunca é checado antes;
  - `if (x) { expect(...) }` — a asserção é pulada em silêncio quando `x` é falso, e o teste passa
    sem verificar nada;
  - asserção de erro por `toBeDefined` na mensagem, em vez do tipo e do código do erro;
  - snapshot gigante que ninguém lê, aceito como verdade.
- **Teste que testa o mock, não o código:** tudo mockado a ponto de o teste passar mesmo que a função
  sob teste seja deletada.
- **Teste acoplado à ordem:** depende de outro teste ter rodado antes, ou de estado global.

Exemplo do tipo de achado: um teste aplica o mesmo pagamento duas vezes com a mesma chave e afirma
`expect(segundaResposta).toBeDefined()`. Passa com qualquer resposta — nunca verifica que o saldo
foi debitado uma vez só, então o bug de idempotência passa reto.

## O que NÃO é sua lente

- **o bug em si** que o teste deveria pegar → é da lente de `correcao`, `dados-estado` ou `seguranca`
  conforme a natureza. Você reporta que *o teste não pega*, não o bug de novo. (Se ambas as lentes
  apontarem o mesmo `arquivo:linha`, a consolidação funde e registra a concordância.)
- **estilo do teste** sem impacto na força da asserção → lente `simplificacao`.

Se a pergunta é "esse teste falharia se o código estivesse errado?", é sua. Se é "o código está
errado?", é de outra.

## Regra de evidência

Só reportar com `arquivo:linha` do teste e o motivo concreto da vacuidade: qual asserção, e qual
valor errado passaria por ela. Para ausência de cobertura, nomear a linha de código nova que ficou
sem teste. "Cobertura fraca" genérico é descartado.

## Saída

Seguir o formato da SKILL.md. Severidade pelo risco que o teste falso esconde: asserção vacuosa sobre
lógica financeira ou de segurança é `alto`; falta de teste em caminho secundário é `médio`. Se não
houver achado, dizer que a lente de teste não encontrou nada.
