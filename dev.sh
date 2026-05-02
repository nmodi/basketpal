#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
BE="$ROOT/basketpal-backend"
FE="$ROOT/basketpal-fe"

MOCK=false
for arg in "$@"; do
  [[ "$arg" == "--mock" ]] && MOCK=true
done

cleanup() {
  echo ""
  echo "Shutting down..."
  kill "$BE_PID" "$FE_PID" 2>/dev/null
  wait "$BE_PID" "$FE_PID" 2>/dev/null
  if [[ "$MOCK" == false ]]; then
    brew services stop redis
  fi
}
trap cleanup INT TERM

# Backend
cd "$BE"
source .venv/bin/activate
if [[ "$MOCK" == true ]]; then
  echo "Mock mode — skipping Redis, NBA API, and OpenAI"
  MOCK_DATA=true uvicorn src.entrypoints.web.main:app --reload --host 127.0.0.1 --port 8001 &
else
  brew services start redis
  uvicorn src.entrypoints.web.main:app --reload --host 127.0.0.1 --port 8001 &
fi
BE_PID=$!

# Frontend
cd "$FE"
npm run dev &
FE_PID=$!

echo "Backend  → http://localhost:8001"
echo "Frontend → http://localhost:5173"
echo "Press Ctrl-C to stop both."

wait "$BE_PID" "$FE_PID"
