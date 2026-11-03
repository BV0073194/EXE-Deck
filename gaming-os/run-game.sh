#!/usr/bin/env bash
set -euo pipefail
[[ $# -eq 1 ]] || { echo "Usage: exe-deck-run-game /path/to/trusted.exe" >&2; exit 2; }
target="$(realpath -- "$1")"
[[ -f "$target" ]] || { echo "File not found" >&2; exit 1; }
case "${target,,}" in
 *.msi) exec wine msiexec /i "$target" ;;
 *.exe) exec wine "$target" ;;
 *.bat|*.cmd) exec wine cmd /c "$target" ;;
 *) echo "Unsupported extension" >&2; exit 2 ;;
esac
