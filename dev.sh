#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
BE="$ROOT/basketpal-backend"
FE="$ROOT/basketpal-fe"

cleanup() {
  echo ""
  echo "Shutting down..."
  kill "$BE_PID" "$FE_PID" 2>/dev/null
  wait "$BE_PID" "$FE_PID" 2>/dev/null
  brew services stop redis
}
trap cleanup INT TERM

# Redis
brew services start redis

# Backend
cd "$BE"
source .venv/bin/activate
uvicorn src.entrypoints.web.main:app --reload --host 127.0.0.1 --port 8001 &
BE_PID=$!

# Frontend
cd "$FE"
npm run dev &
FE_PID=$!

echo "Backend  → http://localhost:8001"
echo "Frontend → http://localhost:5173"
echo "Press Ctrl-C to stop both."

wait "$BE_PID" "$FE_PID"
