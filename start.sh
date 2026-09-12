#!/bin/bash
set -e

echo "=== Starting AI Video Assistant Services ==="

# Check and start BgUtils POT Provider server on port 4416
if [ -f "/opt/pot-provider/build/main.js" ]; then
    echo "Starting BgUtils POT Provider HTTP server on 127.0.0.1:4416..."
    node /opt/pot-provider/build/main.js --host 0.0.0.0 --port 4416 &
    POT_PID=$!
    echo "POT Provider started (PID: $POT_PID)"
    sleep 2
elif [ -f "/app/bgutil-ytdlp-pot-provider/server/build/main.js" ]; then
    echo "Starting BgUtils POT Provider HTTP server from /app on 127.0.0.1:4416..."
    node /app/bgutil-ytdlp-pot-provider/server/build/main.js --host 0.0.0.0 --port 4416 &
    POT_PID=$!
    echo "POT Provider started (PID: $POT_PID)"
    sleep 2
else
    echo "Notice: POT provider build not found at /opt/pot-provider. Running backend standalone."
fi

# Set default POT provider URL for the backend if not set
export YT_POT_PROVIDER_URL="${YT_POT_PROVIDER_URL:-http://127.0.0.1:4416}"

# Start FastAPI backend
PORT="${PORT:-10000}"
echo "Starting FastAPI backend on port $PORT..."
exec uvicorn main:app --host 0.0.0.0 --port "$PORT"
