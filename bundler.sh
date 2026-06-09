#!/usr/bin/env bash
set -euo pipefail

OUT=source.txt
: > "$OUT"

ROOTS=(
  ./src
)

EXCLUDE_DIRS=(
  '*/.git/*'
  '*/catalyst/*'
  '*/dist/*'
  '*/logs/*'
  '*/mocks/*'
  '*/node_modules/*'
  '*/backend/local/storage/*'
)

EXCLUDE_FILES=(
  '.DS_Store'
  '.prettierignore'
  '.prettierrc'
  'Desktop.ini'
  'Dockerfile'
  'package-lock.json'
  'package.json'
  'source.txt'
  'Thumbs.db'
  'README.md'
)

expr=()
for p in "${EXCLUDE_DIRS[@]}"; do expr+=(-path "$p" -o); done
for p in "${EXCLUDE_FILES[@]}"; do expr+=(-name "$p" -o); done
unset 'expr[${#expr[@]}-1]'

find "${ROOTS[@]}" \( "${expr[@]}" \) -prune -o -type f -print0 |
perl -0ne 'print unless $seen{$_}++' |
while IFS= read -r -d '' f; do
  printf 'Writing: %s\n' "$f" >&2
  
  printf '===== %s =====\n' "$f" >> "$OUT"
  cat "$f" >> "$OUT"
  printf '\n' >> "$OUT"
done

printf '\n✅ Done! Output written to %s\n' "$OUT" >&2