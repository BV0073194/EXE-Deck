#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
docker build -t exe-deck-gaming:local .
echo "Built exe-deck-gaming:local (container image, NOT bootable VM ISO)."
