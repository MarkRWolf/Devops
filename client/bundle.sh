#!/usr/bin/env bash

out="$HOME/Desktop/nextjs_bundle.txt"
> "$out"

find . \
  \( -path '*/node_modules' -o \
     -path '*/.next'        -o \
     -path '*/.vercel'      -o \
     -path '*/.cache'       -o \
     -path '*/.git'         \
  \) -prune -o \
  -type f \
  ! -iname 'package.json' \
  ! -iname 'package-lock*' \
  \( -iname '*.js' -o \
     -iname '*.jsx' -o \
     -iname '*.ts' -o \
     -iname '*.tsx' -o \
     -iname '*.css' -o \
     -iname '*.html' -o \
     -iname '*.md' \
  \) -print0 | \
while IFS= read -r -d '' f; do
  printf '// %s start\n' "$f" >> "$out"
  cat "$f" >> "$out"
  printf '\n// %s end\n\n' "$f" >> "$out"
done
