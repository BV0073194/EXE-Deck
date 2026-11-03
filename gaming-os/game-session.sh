#!/usr/bin/env bash
set -euo pipefail
export DISPLAY=:99
export XDG_RUNTIME_DIR="${XDG_RUNTIME_DIR:-/tmp/exe-deck-runtime}"
mkdir -p "$XDG_RUNTIME_DIR"
chmod 700 "$XDG_RUNTIME_DIR"
Xvfb "$DISPLAY" -screen 0 "${EXE_DECK_SCREEN:-1280x720x24}" -nolisten tcp &
xvfb_pid=$!
cleanup(){ kill "$xvfb_pid" "${vnc_pid:-}" "${web_pid:-}" 2>/dev/null || true; }
trap cleanup EXIT INT TERM
sleep 1
x11vnc -display "$DISPLAY" -localhost -nopw -forever -shared -rfbport 5900 -quiet &
vnc_pid=$!
websockify --web=/usr/share/novnc 0.0.0.0:6080 localhost:5900 &
web_pid=$!
echo "Local browser display: http://127.0.0.1:6080/vnc.html"
echo "WARNING: noVNC has no authentication; never publish publicly."
wait -n "$xvfb_pid" "$vnc_pid" "$web_pid"
