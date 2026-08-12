# Lente: simplificação

Revisar o diff procurando **um só tipo de problema: o código funciona, mas custa mais do que
deveria para ler e manter**. Nada aqui produz resultado errado — se produzisse, seria de outra
lente. Aqui é dívida: duplicação, código morto, complexidade que não paga.

Esta lente é a de menor severidade por natureza. O papel dela é sinalizar limpeza barata, não
travar merge. Um achado de simplificação nunca é `crítico`.

## O que caçar

- **Duplicação:** o mesmo bloco de lógica repetido em vez de extraído; a mudança do diff copia algo
  que já existe e podia ser reusado. Apontar o trecho já existente que serve.
- **Código morto:** função, variável, import, branch ou flag que ninguém alcança; parâmetro nunca
  usado; `else` após `return` que cobre tudo.
- **Complexidade desnecessária:** aninhamento profundo que um early-return resolve; condição booleana
  que dá para simplificar; abstração de uma chamada só; `try/catch` que só relança; estado mutável
  onde um valor calculado bastava.
- **Inconsistência com o entorno:** o diff resolve à mão algo para o qual o próprio repo já tem
  utilitário/padrão; nomes ou estrutura que destoam do arquivo ao redor sem motivo.

Exemplo do tipo de achado: duas rotas do diff repetem o mesmo bloco de validação de `valorCentavos`
palavra por palavra; extrair para um helper elimina a divergência futura.

## O que NÃO é sua lente

- **qualquer coisa que produza resultado errado** → `correcao`, `dados-estado`, `seguranca`;
- **asserção fraca ou teste faltando** → lente `teste`;
- **breaking change** → lente `contrato`.

A pergunta que separa: "se eu deixar como está, o software se comporta certo?" Se sim e o único custo
é legibilidade/manutenção, é seu. Se o comportamento fica errado, não é.

Cuidado com o falso positivo: complexidade que existe por um motivo real (performance medida, caso de
borda documentado) não é dívida. Na dúvida entre "confuso" e "necessário", não reportar — a lente de
simplificação perde credibilidade rápido se vira lista de preferências de estilo.

## Regra de evidência

Só reportar com `arquivo:linha` e o ganho concreto da mudança: o que fica mais simples e por quê.
Para duplicação, apontar as duas ocorrências. Preferência estética sem ganho de manutenção é
descartada.

## Saída

Seguir o formato da SKILL.md, sempre com severidade `baixo` (ou `médio` só quando a duplicação já
está causando divergência real). Se não houver achado, dizer que a lente de simplificação não
encontrou nada.
