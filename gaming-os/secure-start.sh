#!/usr/bin/env bash
# Single-owner deployment preflight. Requires Docker Compose 2.24+.
set -euo pipefail
cd "$(dirname "$0")"
: "${EXE_DECK_DOMAIN:?Set domain}"
: "${EXE_DECK_ACME_EMAIL:?Set ACME email}"
: "${EXE_DECK_GITHUB_CLIENT_ID:?Set OAuth app ID}"
: "${EXE_DECK_GITHUB_CLIENT_SECRET:?Set OAuth app secret}"
: "${EXE_DECK_COOKIE_SECRET:?Set cookie secret}"
: "${EXE_DECK_GITHUB_ALLOWED_USERS:?Set ONE authorized GitHub username}"
if [[ ! "$EXE_DECK_GITHUB_ALLOWED_USERS" =~ ^[a-zA-Z0-9]([a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$ ]]; then
 echo "Only one GitHub username is supported in single-owner mode." >&2
 exit 1
fi
if [[ "${#EXE_DECK_COOKIE_SECRET}" -lt 32 ]]; then
 echo "Cookie secret must be at least 32 characters." >&2
 exit 1
fi
if [[ "$EXE_DECK_DOMAIN" == *:* || "$EXE_DECK_DOMAIN" == */* || "$EXE_DECK_DOMAIN" == *" "* ]]; then
 echo "Provide a DNS hostname, not a URL." >&2
 exit 1
fi
if ! docker compose version >/dev/null 2>&1; then
 echo "Docker Compose v2 is required." >&2
 exit 1
fi
args=(-f compose.yaml -f compose.remote.yaml -f compose.github.yaml -f compose.github.caddy.yaml -f compose.isolated.yaml)
if [[ "${EXE_DECK_ENABLE_DRM_GPU:-0}" == 1 ]]; then
 if [[ "$(uname -s)" != Linux || ! -d /dev/dri ]]; then
  echo "DRM GPU device mapping requires a compatible Linux host." >&2
  exit 1
 fi
 args+=(-f compose.gpu.yaml)
fi
docker compose "${args[@]}" config --quiet
echo "Starting single-owner GitHub-protected EXE Deck on ${EXE_DECK_DOMAIN}."
docker compose "${args[@]}" up --build -d
