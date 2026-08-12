# Lente: dados e estado

Revisar o diff procurando **um só tipo de problema: o estado fica errado quando a operação não
acontece exatamente uma vez, em ordem perfeita, sem concorrência**. É a lente que assume o mundo
real — rede que cai no meio, cliente que repete a requisição, dois processos ao mesmo tempo — e
pergunta se o dado sobrevive a isso.

Esta é a lente que mais rende em fluxo de receita (cobrança, pagamento, saldo, estoque), onde um
estado errado não vira reclamação, vira prejuízo.

## O que caçar

- **Idempotência ausente:** operação que deveria ter efeito único aceita uma chave de idempotência
  mas não a verifica; um retry da mesma requisição aplica o efeito de novo. Débito, crédito,
  contador, envio — reaplicados.
- **Retry inseguro:** o código relança/repete uma operação com efeito colateral sem checar se já foi
  feita; erro parcial deixa metade aplicada.
- **Condição de corrida:** leitura-modificação-escrita sem atomicidade; dois pedidos concorrentes
  sobrescrevem um ao outro; `check-then-act` sem trava; saldo lido, decrementado e gravado em passos
  separados.
- **Transação faltando ou mal-escopada:** duas escritas que precisam ser atômicas fora de uma
  transação; commit no meio de um passo que ainda pode falhar; rollback que não desfaz tudo.
- **Consistência quebrada:** total desalinhado da soma das partes após a operação; agregado (saldo,
  contador) que diverge dos eventos que o compõem; cache não invalidado após escrita.

Exemplo do tipo de achado: `POST /pagamentos` recebe `idempotencyKey`, guarda no registro, mas nunca
compara com os pagamentos já aplicados. Dois envios com a mesma chave (um retry legítimo de timeout)
somam o valor duas vezes — `pagoCentavos` fica em 200 para um pagamento de 100.

## O que NÃO é sua lente

- **cálculo errado numa execução única e determinística** (arredondamento, off-by-one) →
  lente `correcao`. Se o erro só aparece com repetição, concorrência ou falha parcial, é seu.
- **quem pode disparar a operação** → lente `seguranca`;
- **mudança no formato da requisição** → lente `contrato`;
- **falta de teste do retry** → lente `teste`.

A pergunta que separa: "o resultado estaria certo se rodasse uma vez, sem concorrência?" Se sim, mas
quebra com retry/corrida, é seu. Se está errado já na primeira execução limpa, é da `correcao`.

## Regra de evidência

Só reportar com `arquivo:linha` e a sequência concreta que corrompe o estado: qual operação, repetida
ou concorrente de que forma, deixa qual dado em que valor errado. "Pode ter problema de concorrência"
sem a interleava concreta é descartado.

## Saída

Seguir o formato da SKILL.md. Severidade pela consequência sobre o dado: dinheiro ou saldo aplicado
em dobro é `crítico`; inconsistência recuperável é `alto` ou `médio`. Se não houver achado, dizer que
a lente de dados/estado não encontrou nada.
