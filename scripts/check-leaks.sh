#!/usr/bin/env bash
#
# Impede que contexto de empregador anterior, identificador de ticket ou segredo
# chegue a um repositório público. Saída vazia e exit 0 são a condição de push.
#
# Para ampliar: acrescentar alternativas ao PATTERN abaixo. Antes de tornar o
# repositório público, incluir também nomes de ex-colegas, de clientes e de
# produtos internos — na prática essas referências escapam dentro de blocos de
# código de exemplo, não nos títulos, e por isso a varredura cobre o repo inteiro.

set -uo pipefail

cd "$(dirname "$0")/.."

PATTERN='omni|atlassian|whizz'
PATTERN="$PATTERN"'|\b(MAN|WC|WR)-[0-9]+\b'
PATTERN="$PATTERN"'|gh[pousr]_[A-Za-z0-9]{16,}'
PATTERN="$PATTERN"'|AKIA[0-9A-Z]{16}'
PATTERN="$PATTERN"'|-----BEGIN [A-Z ]*PRIVATE KEY-----'

# O próprio script contém os padrões e sempre casaria consigo mesmo.
hits=$(grep -rniE "$PATTERN" . \
  --exclude-dir=.git \
  --exclude-dir=node_modules \
  --exclude-dir=dist \
  --exclude="check-leaks.sh" \
  2>/dev/null || true)

if [ -n "$hits" ]; then
  echo "check-leaks: vazamento potencial encontrado" >&2
  echo "" >&2
  echo "$hits" >&2
  echo "" >&2
  echo "Remova as referências. Se for falso positivo, ajuste o PATTERN em scripts/check-leaks.sh." >&2
  exit 1
fi

echo "check-leaks: ok, nenhuma referência interna ou segredo encontrado."
