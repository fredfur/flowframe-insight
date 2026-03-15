#!/usr/bin/env bash
# Reinicia backend .NET (5050), gateway Python Vision OEE (8000) e frontend (8080).
# Uso: ./scripts/restart-all.sh   (a partir da raiz flowframe-insight ou Vision OEE)

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VISION_ROOT="$(cd "$(dirname "$0")/../.." && pwd)/Vision OEE"

kill_port() {
  local port=$1
  if command -v lsof &>/dev/null; then
    local pid=$(lsof -ti :"$port" 2>/dev/null || true)
    if [ -n "$pid" ]; then
      echo "A parar processo na porta $port (PID $pid)..."
      kill "$pid" 2>/dev/null || kill -9 "$pid" 2>/dev/null || true
      sleep 1
    fi
  fi
}

echo "=== Parar serviços nas portas 5050, 8000, 8080 ==="
kill_port 5050
kill_port 8000
kill_port 8080
sleep 2

echo "=== Iniciar backend .NET (porta 5050) ==="
cd "$ROOT/backend"
dotnet run &
BACKEND_PID=$!
sleep 3

echo "=== Iniciar gateway Python Vision OEE (porta 8000) ==="
if [ -d "$VISION_ROOT" ] && [ -f "$VISION_ROOT/main.py" ]; then
  cd "$VISION_ROOT"
  if [ -d ".venv" ]; then
    .venv/bin/python main.py &
  else
    python3 main.py &
  fi
  GATEWAY_PID=$!
  sleep 2
else
  echo "Aviso: Vision OEE não encontrado em $VISION_ROOT"
fi

echo "=== Iniciar frontend (porta 8080) ==="
cd "$ROOT"
npm run dev &
FRONT_PID=$!

echo ""
echo "Backend: http://localhost:5050 (ou http://\$(hostname -I | awk '{print \$1}'):5050 no browser Windows)"
echo "Gateway Python: http://localhost:8000"
echo "Frontend: http://localhost:8080"
echo ""
echo "Para parar: kill $BACKEND_PID $GATEWAY_PID $FRONT_PID  (ou fechar este terminal)"

wait
