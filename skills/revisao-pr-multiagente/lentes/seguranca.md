# Lente: segurança

Revisar o diff procurando **um só tipo de problema: alguém consegue fazer ou ver o que não deveria**.
O código pode computar tudo certo e ainda assim entregar dado ao ator errado, confiar em entrada não
validada, ou vazar segredo.

## O que caçar

- **Autorização quebrada (o caso mais comum e mais caro):**
  - **IDOR** — o recurso é buscado por id sem checar se pertence a quem pediu; trocar o id na URL lê
    o dado de outro usuário;
  - checagem de dono ausente ou feita depois de já ter agido;
  - papel/escopo não verificado numa rota que exige privilégio;
  - autorização confiando em campo que o cliente controla (header, body) sem validar contra o dono
    real do recurso.
- **Injeção:** entrada concatenada em SQL/shell/template sem parametrização; path traversal; SSRF por
  URL vinda do cliente.
- **Segredo e dado sensível:** token, chave, senha ou credencial versionada ou logada; PII em log, em
  URL (query string) ou em resposta de erro; retorno de mais campos do que o consumidor precisa.
- **Validação de entrada ausente** em fronteira de confiança: tamanho, tipo, faixa não checados antes
  de usar; mass-assignment (aceitar o body inteiro e gravar).
- **Autenticação frouxa:** rota sensível sem exigir sessão; comparação de token não constante;
  ausência de expiração.

Exemplo do tipo de achado: `GET /cobrancas/:id` identifica o solicitante pelo header `x-cliente-id`,
mas devolve a cobrança sem conferir se `cobranca.clienteId` é esse cliente. Qualquer cliente lê a
cobrança de qualquer outro trocando o id — IDOR. Deveria responder 403 para o não-dono.

## O que NÃO é sua lente

- **cálculo errado** que não expõe nem permite nada indevido → lente `correcao`;
- **estado corrompido por retry/corrida** sem componente de acesso indevido → lente `dados-estado`;
- **formato do contrato** (existência do header) → lente `contrato`; você olha se o header
  *autoriza*, não se ele existe;
- **falta de teste de segurança** → lente `teste`.

A pergunta que separa: "um ator mal-intencionado ou apenas o usuário errado ganha acesso ou
capacidade indevida?" Se sim, é seu.

## Regra de evidência

Só reportar com `arquivo:linha` e o cenário concreto de abuso: quem, fazendo qual requisição
específica, acessa ou faz o quê que não deveria. "Pode ter problema de segurança" genérico é
descartado. Nomear a checagem ausente e onde ela deveria estar.

## Saída

Seguir o formato da SKILL.md. Severidade pelo impacto: acesso a dado de outro usuário, injeção ou
segredo exposto é `crítico`; validação de entrada ausente em caminho de baixo risco é `médio`. Se não
houver achado, dizer que a lente de segurança não encontrou nada.
