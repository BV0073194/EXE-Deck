#!/usr/bin/env bash
set -euo pipefail
export DISPLAY=:99
export XDG_RUNTIME_DIR="${XDG_RUNTIME_DIR:-/tmp/exe-deck-runtime}"
mkdir -p "$XDG_RUNTIME_DIR"
chmod 700 "$XDG_RUNTIME_DIR"
Xvfb "$DISPLAY" -screen 0 "${EXE_DECK_SCREEN:-1280x720x24}" -nolisten tcp &
xvfb_pid=$!
cleanup(){
 for pid in "${terminal_pid:-}" "${wm_pid:-}" "${web_pid:-}" "${vnc_pid:-}" "$xvfb_pid"; do
   [[ -z "$pid" ]] || kill "$pid" 2>/dev/null || true
 done
}
trap cleanup EXIT INT TERM
for i in $(seq 1 40); do
 if xdpyinfo -display "$DISPLAY" >/dev/null 2>&1; then break; fi
 sleep 0.25
done
xdpyinfo -display "$DISPLAY" >/dev/null 2>&1 || { echo "X display failed" >&2; exit 1; }
openbox &
wm_pid=$!
xterm -title "EXE Deck Linux" -geometry 100x30+40+40 &
terminal_pid=$!
x11vnc -display "$DISPLAY" -localhost -nopw -forever -shared -rfbport 5900 -quiet &
vnc_pid=$!
websockify --web=/usr/share/novnc 0.0.0.0:6080 localhost:5900 &
web_pid=$!
echo "Browser display: http://127.0.0.1:6080/vnc.html (host loopback only)"
echo "WARNING: noVNC itself is unauthenticated. Use the GitHub OAuth gateway for remote access."
wait -n "$xvfb_pid" "$wm_pid" "$vnc_pid" "$web_pid"
