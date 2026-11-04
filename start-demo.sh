#!/usr/bin/env bash
# Start AasraSewa demo stack: Mongo/MQTT, API, IoT, frontend, rescue portal, AI,
# then the ESP LAN gateway (for the User band on Summar).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

log() { printf '\n==> %s\n' "$*"; }

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Missing required command: $1" >&2
    exit 1
  }
}

need_cmd node
need_cmd npm

NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"
if [[ "$NODE_MAJOR" -lt 22 ]]; then
  echo "Node.js 22+ is required (found $(node -v))." >&2
  exit 1
fi

if [[ ! -f backend/dist/main.js || ! -f iot/dist/main.js || ! -d frontend/node_modules || ! -d rescue-portal/node_modules ]]; then
  log "First-time / incomplete install — running npm run setup"
  npm run setup
fi

if [[ ! -f backend/.env || ! -f iot/.env ]]; then
  echo "Missing backend/.env or iot/.env. Run: npm run setup" >&2
  exit 1
fi

# Free common leftover ports from a previous crash (best effort; ignore errors).
free_port() {
  local port="$1"
  if command -v lsof >/dev/null 2>&1; then
    lsof -ti ":$port" | xargs -r kill -9 2>/dev/null || true
  fi
}

log "Checking demo ports"
for port in 1883 1884 3001 3002 3003 8000; do
  free_port "$port"
done

STACK_PID=""
GATEWAY_PID=""

cleanup() {
  log "Stopping demo processes..."
  if [[ -n "${GATEWAY_PID}" ]] && kill -0 "$GATEWAY_PID" 2>/dev/null; then
    kill "$GATEWAY_PID" 2>/dev/null || true
  fi
  if [[ -n "${STACK_PID}" ]] && kill -0 "$STACK_PID" 2>/dev/null; then
    kill "$STACK_PID" 2>/dev/null || true
    wait "$STACK_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

log "Starting core stack (npm start)"
npm start &
STACK_PID=$!

log "Waiting for apps to become ready"
ready=0
for _ in $(seq 1 90); do
  if curl -sf -o /dev/null --connect-timeout 1 "http://127.0.0.1:3002/" \
    && curl -sf -o /dev/null --connect-timeout 1 "http://127.0.0.1:3003/" \
    && curl -sf -o /dev/null --connect-timeout 1 "http://127.0.0.1:8000/health"; then
    ready=1
    break
  fi
  if ! kill -0 "$STACK_PID" 2>/dev/null; then
    echo "Core stack exited early. Check logs/ and the npm start terminal output." >&2
    exit 1
  fi
  sleep 2
done

if [[ "$ready" -ne 1 ]]; then
  echo "Timed out waiting for frontend/portal/AI. Stack may still be starting — check npm start output." >&2
fi

if [[ -f .env.esp32 ]]; then
  log "Starting ESP MQTT gateway (npm run gateway)"
  npm run gateway &
  GATEWAY_PID=$!
  sleep 2
  if ! kill -0 "$GATEWAY_PID" 2>/dev/null; then
    echo "Gateway failed to stay up (often wrong Wi-Fi IP in .env.esp32). Core stack is still running." >&2
    GATEWAY_PID=""
  fi
else
  log "No .env.esp32 — skipping ESP gateway (software-only demo still works)"
fi

cat <<EOF

AasraSewa demo is up.

  Admin / login : http://localhost:3002/login
  IoT Monitor   : http://localhost:3002/admin/iot
  Rescue Ops    : http://localhost:3002/admin/rescue
  Rescue portal : http://localhost:3003
  API           : http://localhost:3001
  AI docs       : http://localhost:8000/docs

  Demo admin    : +919999999999 / password123

  SOS backup    : in another terminal → npm run demo

Press Ctrl+C here to stop the stack (and gateway).

EOF

wait "$STACK_PID"
