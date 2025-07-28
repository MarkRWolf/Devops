#!/usr/bin/env bash

out="$HOME/Desktop/nextjs_bundle.txt"
> "$out"

find . \
  -path './node_modules'   -prune -o \
  -path './.next'          -prune -o \
  -path './.vercel'        -prune -o \
  -path './.cache'         -prune -o \
  -path './.git'           -prune -o \
  -type f                  -a \
  ! -iname 'package.json'  -a \
  ! -iname 'package-lock*' -a \
  \( \
     -iname '*.js'  -o \
     -iname '*.jsx' -o \
     -iname '*.ts'  -o \
     -iname '*.tsx' -o \
     -iname '*.css' -o \
     -iname '*.html' -o \
     -iname '*.md'  \
  \) -print0 | \
while IFS= read -r -d '' f; do
  printf '// %s start\n' "$f" >> "$out"
  cat "$f" >> "$out"
  printf '\n// %s end\n\n' "$f" >> "$out"
done
