#!/usr/bin/env bash
#
# Valida o contrato comum das skills do qe-kit:
#   - toda pasta em skills/ tem um SKILL.md
#   - todo SKILL.md abre com frontmatter YAML e declara name e description
#   - a description usa terceira pessoa (é o único mecanismo de disparo;
#     descrição em segunda pessoa dispara mal)
#   - todo SKILL.md tem a seção "Não faz", que é o que impede disparo fora de hora
#   - SKILL.md acima de 500 linhas vira aviso: o excedente pertence a references/

set -uo pipefail

cd "$(dirname "$0")/.."

erros=0
avisos=0

if [ ! -d skills ] || [ -z "$(ls -A skills 2>/dev/null)" ]; then
  echo "check-skills: nenhuma skill ainda — nada a validar."
  exit 0
fi

for dir in skills/*/; do
  nome=$(basename "$dir")
  arquivo="${dir}SKILL.md"

  if [ ! -f "$arquivo" ]; then
    echo "ERRO  $nome: falta SKILL.md" >&2
    erros=$((erros + 1))
    continue
  fi

  if [ "$(head -n 1 "$arquivo")" != "---" ]; then
    echo "ERRO  $nome: SKILL.md não começa com frontmatter YAML (---)" >&2
    erros=$((erros + 1))
  fi

  frontmatter=$(awk 'NR>1 && /^---$/{exit} NR>1' "$arquivo")

  if ! echo "$frontmatter" | grep -q '^name:'; then
    echo "ERRO  $nome: frontmatter sem campo 'name'" >&2
    erros=$((erros + 1))
  fi

  if ! echo "$frontmatter" | grep -q '^description:'; then
    echo "ERRO  $nome: frontmatter sem campo 'description'" >&2
    erros=$((erros + 1))
  elif ! echo "$frontmatter" | grep -qiE 'description:.*(esta skill|deve ser usada)'; then
    echo "AVISO $nome: description parece não estar em terceira pessoa" >&2
    avisos=$((avisos + 1))
  fi

  if ! grep -qi 'não faz' "$arquivo"; then
    echo "ERRO  $nome: SKILL.md sem a seção 'Não faz' — a fronteira precisa ser explícita" >&2
    erros=$((erros + 1))
  fi

  linhas=$(wc -l < "$arquivo" | tr -d ' ')
  if [ "$linhas" -gt 500 ]; then
    echo "AVISO $nome: SKILL.md com $linhas linhas — mover o excedente para references/" >&2
    avisos=$((avisos + 1))
  fi
done

echo "check-skills: $erros erro(s), $avisos aviso(s)."
[ "$erros" -eq 0 ]
