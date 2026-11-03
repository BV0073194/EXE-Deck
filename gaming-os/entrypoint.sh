#!/usr/bin/env bash
set -euo pipefail
echo "EXE Deck gaming container: Wine + Mesa Vulkan + optional Steam + noVNC"
echo "WARNING: container isolation is not a security boundary for untrusted Windows binaries."
if [[ $# -eq 0 ]]; then
  exec /usr/local/bin/exe-deck-session
fi
exec "$@"
