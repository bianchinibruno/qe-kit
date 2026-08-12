# Lente: correção

Revisar o diff procurando **um só tipo de problema: o código faz a coisa errada**. A lógica está
incorreta para alguma entrada válida — não porque falta teste, não porque é inseguro, mas porque o
resultado computado está errado.

## O que caçar

- **Erro de borda:** off-by-one, `<` onde devia ser `<=`, laço que ignora o primeiro ou o último
  elemento, índice fora do intervalo.
- **Null / undefined:** acesso a propriedade de algo que pode ser `undefined`; valor opcional tratado
  como obrigatório; `0`, `''` ou `false` tratados como ausência.
- **Aritmética e arredondamento:** divisão inteira que descarta resto, `Math.floor`/`Math.round` que
  perde ou cria centavos, ordem de operações que muda o resultado, overflow.
- **Condição invertida ou incompleta:** `&&` onde devia ser `||`, negação a mais, `case` sem `break`,
  branch que nunca é alcançado, comparação por referência onde devia ser por valor.
- **Contrato interno quebrado:** a função promete uma invariante (ex.: a soma das partes é igual ao
  todo) que o código não mantém.

Exemplo do tipo de achado: uma função divide 100 em 3 parcelas com `Math.floor(100/3)` por parcela e
retorna 33+33+33 = 99. A soma das parcelas devia ser igual ao total; some 1 centavo.

## O que NÃO é sua lente

Para não duplicar o trabalho das outras lentes, ignorar:
- **falta de teste** ou asserção fraca → lente `teste`;
- **retry, idempotência, corrida, transação** → lente `dados-estado` (mesmo que o sintoma seja um
  número errado, se a causa é reaplicação de operação, é de lá);
- **autorização, injeção, dado exposto** → lente `seguranca`;
- **mudança de forma de request/response** → lente `contrato`;
- **duplicação e código morto** que não produzem resultado errado → lente `simplificacao`.

Se o defeito é "computou o valor errado para uma entrada válida", é seu. Se é "não protegeu",
"não testou" ou "não é elegante", é de outra lente.

## Regra de evidência

Só reportar achado com `arquivo:linha` concreto e um cenário de falha concreto: uma entrada
específica e o resultado errado que ela produz. "Pode dar problema de borda" sem a entrada que
dispara o erro não é achado — é palpite, e será descartado na consolidação.

## Saída

Seguir o formato de achado da SKILL.md. Severidade pela consequência: cálculo financeiro errado é
`alto` ou `crítico`; erro de borda em caminho raro é `médio`. Se não houver achado, dizer
explicitamente que a lente de correção não encontrou nada — silêncio informado.
