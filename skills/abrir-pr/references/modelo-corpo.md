# Modelo do corpo do PR

O corpo é em português, com as cinco seções nesta ordem exata. A ordem não é estética: ela segue a
pergunta que o revisor faz a cada momento — o que é isto (Tarefa), o que mudou (Descrição), onde
bate (Pontos de Impacto), o que pode quebrar (Análise de Riscos), como eu confirmo (Guia de Fluxo).

## Modelo

```markdown
## Tarefa

[<ID>](<baseUrl><ID>)

## Descrição

- <bullet no passado, factual, do que foi feito>
- <bullet>
- <até 5 bullets>

## Pontos de Impacto

- <módulo/serviço/área tocado e por quê>
- <bullet>

## Análise de Riscos

- **Risco**: <o que pode dar errado> → **Mitigação**: <o que reduz esse risco>
- **Risco**: … → **Mitigação**: …

## Guia de Fluxo

1. <passo concreto para validar — comando, rota, tela, dado de teste>
2. <passo>
3. <resultado esperado>
```

Se não houver tracker configurado nem número de issue, omitir a seção `## Tarefa` inteira — não
deixar um cabeçalho vazio.

Se não houver risco real (ex.: mudança só de documentação), escrever uma linha honesta em vez de
inventar risco genérico:

```markdown
## Análise de Riscos

- Mudança restrita a documentação, sem impacto em runtime. Sem risco identificado.
```

## Exemplo preenchido

Contexto: branch `fix/pagamento-idempotente`, dois commits, tracker Jira configurado, tarefa
`PAY-204`.

```markdown
## Tarefa

[PAY-204](https://tracker.example.com/browse/PAY-204)

## Descrição

- Adicionada chave de idempotência na aplicação de pagamento, persistida antes de debitar o saldo.
- Retry com a mesma chave passa a retornar o resultado original em vez de aplicar o valor de novo.
- Cobertos os dois caminhos (primeira chamada e retry) com teste de integração contra o banco real.

## Pontos de Impacto

- `services/payment`: fluxo de aplicação de pagamento e assinatura do método `apply`.
- `db/migrations`: nova coluna `idempotency_key` com índice único.
- Consumidores da fila de pagamento, que passam a enviar a chave no payload.

## Análise de Riscos

- **Risco**: chamadas antigas na fila sem `idempotency_key` → **Mitigação**: a coluna aceita nulo e
  o código cai no comportamento anterior quando a chave está ausente, sem quebrar o consumo.
- **Risco**: índice único falhar em dado legado duplicado → **Mitigação**: migração roda dedupe
  antes de criar o índice; validado em cópia do banco de staging.

## Guia de Fluxo

1. Subir o serviço: `npm run dev` em `services/payment`.
2. `POST /pagamentos` com header `Idempotency-Key: teste-1` e valor 100.
3. Repetir a **mesma** chamada com a mesma chave.
4. Esperado: o saldo é debitado uma vez só; a segunda resposta traz o mesmo `paymentId` da primeira.
```

Note que o Guia de Fluxo dá o comando, a rota, o header e o resultado esperado — o revisor
reproduz sem perguntar nada. Esse é o padrão de qualidade; "testar o pagamento" não é.
