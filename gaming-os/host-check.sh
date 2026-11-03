#!/usr/bin/env bash
set -euo pipefail
echo "EXE Deck host readiness"
echo "OS: $(uname -s) / $(uname -m)"
for cmd in docker vulkaninfo nvidia-smi vainfo; do
 if command -v "$cmd" >/dev/null 2>&1; then
  echo "$cmd: available"
 else
  echo "$cmd: unavailable"
 fi
done
if command -v docker >/dev/null 2>&1; then
 docker compose version || true
fi
if [[ -e /dev/dri/renderD128 ]]; then
 echo "DRM render device: detected"
else
 echo "DRM render device: not detected (GPU passthrough unavailable)"
fi
echo "Browser access to GPU is not equivalent to guest GPU passthrough."
