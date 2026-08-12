# Lente: contrato

Revisar o diff procurando **um só tipo de problema: a mudança quebra quem depende desta interface**.
O código pode estar internamente correto e ainda assim romper o acordo com quem consome a API, o
schema, o evento ou a função pública.

## O que caçar

- **Breaking change de API:** rota removida ou renomeada, método HTTP trocado, campo de request que
  virou obrigatório, campo de response removido ou com tipo alterado, mudança de status code.
- **Schema e persistência:** coluna/campo removido ou renomeado sem migração, mudança de tipo que
  invalida dados existentes, default alterado, enum que perdeu um valor ainda em uso.
- **Forma da resposta:** envelope mudou (ex.: de `{data}` para lista crua), formato de erro mudou,
  paginação alterada, nome de campo em `camelCase` vs `snake_case` inconsistente com o resto.
- **Contrato de função/lib pública:** assinatura alterada, parâmetro reordenado, semântica de retorno
  mudada (antes lançava, agora retorna `null`), efeito colateral novo.
- **Compatibilidade retroativa:** cliente antigo deixa de funcionar; versionamento ausente onde a
  mudança exigiria; evento com payload alterado sem versão nova.

Exemplo do tipo de achado: um handler passa a exigir o header `x-cliente-id` para responder, mas
nenhum consumidor atual envia esse header — a mudança quebra todos eles silenciosamente.

## O que NÃO é sua lente

- **lógica interna errada** que não muda a interface → lente `correcao`;
- **falha de autorização** por trás do header → lente `seguranca` (você olha a *forma* do contrato,
  não se ele protege);
- **falta de teste do contrato** → lente `teste`;
- **estado inconsistente entre chamadas** → lente `dados-estado`.

Se um consumidor externo quebraria com essa mudança, é seu. Se o problema só aparece dentro do
próprio módulo, é de outra lente.

## Regra de evidência

Só reportar com `arquivo:linha` e o cenário concreto de quebra: qual consumidor, chamando o quê,
recebe o quê de diferente. Apontar o campo/rota/assinatura exata que mudou. "Pode quebrar
compatibilidade" sem dizer o quê é descartado.

## Saída

Seguir o formato da SKILL.md. Severidade pelo alcance: breaking change em API pública é `alto` ou
`crítico`; mudança em contrato interno com poucos consumidores é `médio`. Se não houver achado,
dizer que a lente de contrato não encontrou nada.
