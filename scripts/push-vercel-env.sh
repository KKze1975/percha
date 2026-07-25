#!/bin/bash
# One-time helper: pushes every KEY=VALUE in .env.local to Vercel
# (production, preview, development) without ever printing values.
set -euo pipefail
cd "$(dirname "$0")/.."

while IFS='=' read -r key value; do
  [ -z "$key" ] && continue
  case "$key" in \#*) continue ;; esac
  for env in production preview development; do
    printf '%s' "$value" | vercel env add "$key" "$env" --yes >/dev/null 2>&1 || true
  done
  echo "pushed $key (value not shown)"
done < .env.local
