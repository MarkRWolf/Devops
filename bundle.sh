#!/usr/bin/env bash
set -euo pipefail

########################################################################
#  OUTPUT
########################################################################
OUT="$HOME/Desktop/project_bundle.txt"
> "$OUT"                       # truncate

########################################################################
#  EXTRA ONE-OFF FILES / GLOBS  (edit to taste)
########################################################################
EXTRA_FILES=(
  "Dockerfile"
  "Devops/Dockerfile"
  "client/Dockerfile"
  "nginx/nginx.conf"
  "docker-compose.yml"
  ".github/workflows/*.yml"
  "azure-pipelines.yml"
)

########################################################################
#  HELPERS
########################################################################
add() {                               # add a *text* file with markers
  local f="$1"
  [[ -f "$f" ]] || return 0
  file -b --mime "$f" | grep -q '^text/' || return 0
  printf '// %s start\n' "$f" >>"$OUT"
  cat    "$f"                 >>"$OUT"
  printf '\n// %s end\n\n' "$f" >>"$OUT"
}

bundle_dir_client() {                 # === your old client/bundle.sh ===
  find "$1" \
    \( -path '*/node_modules' -o -path '*/.next' -o -path '*/.vercel' \
       -o -path '*/.cache' -o -path '*/.git' \) -prune -o \
    -type f \
    ! -iname 'package.json' ! -iname 'package-lock*' \
    \( -iname '*.js' -o -iname '*.jsx' -o -iname '*.ts' -o -iname '*.tsx' \
       -o -iname '*.css' -o -iname '*.html' -o -iname '*.md' \) -print0 |
  while IFS= read -r -d '' f; do add "$f"; done
}

bundle_dir_server() {                 # === your old Devops/bundle.sh ===
  find "$1" \
    \( -path '*/node_modules/*' -o -path '*/.next/*' -o -path '*/.git/*' \
       -o -path '*/.vs/*' -o -path '*/bin/*' -o -path '*/obj/*' \
       -o -path '*/dist/*' -o -path '*/build/*' -o -path '*/out/*' \
       -o -path '*/Migrations/*' -o -iname '*.db' -o -iname '*.dll' \
       -o -iname '*.pdb' -o -iname '*.exe' -o -iname '.env*' \) -prune -o \
    -type f -print0 |
  while IFS= read -r -d '' f; do add "$f"; done
}

########################################################################
#  RUN
########################################################################
bundle_dir_client "client"
bundle_dir_server "Devops"

for pattern in "${EXTRA_FILES[@]}"; do
  for f in $pattern; do add "$f"; done
done

echo "✓ Bundle written to $OUT"
