#!/usr/bin/env bash
out="$HOME/Desktop/code_bundle.txt"
> "$out"

find . \( \
  -path '*/node_modules/*'  -o \
  -path '*/.next/*'         -o \
  -path '*/.git/*'          -o \
  -path '*/.vs/*'           -o \
  -path '*/bin/*'           -o \
  -path '*/obj/*'           -o \
  -path '*/dist/*'          -o \
  -path '*/build/*'         -o \
  -path '*/out/*'           -o \
  -path '*/Migrations/*'    -o \
  -iname '*.db'             -o \
  -iname '*.dll'            -o \
  -iname '*.pdb'            -o \
  -iname '*.exe'            -o \
  -iname '.env*'            \
\) -prune -o -type f -print0 | \
while IFS= read -r -d '' f; do
  file -b --mime "$f" | grep -q '^text/' || continue
  printf '// %s start\n' "$f" >> "$out"
  cat "$f" >> "$out"
  printf '\n// %s end\n\n' "$f" >> "$out"
done
