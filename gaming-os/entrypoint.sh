#!/usr/bin/env bash
set -euo pipefail
echo "EXE Deck Linux runtime: Wine + Mesa Vulkan userspace"
echo "This container is NOT a secure sandbox, a bootable VM, or a GPU passthrough solution."
echo "Wine: $(command -v wine || echo unavailable)"
echo "Vulkan: $(command -v vulkaninfo || echo unavailable)"
if [[ $# -eq 0 ]]; then
  exec sleep infinity
fi
exec "$@"
