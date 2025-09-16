#!/bin/bash
# Render起動スクリプト

echo "================================================"
echo "  Threads Automation Server - Render Deployment"
echo "================================================"

# 環境変数設定
export DISPLAY=:99
export PORT=${PORT:-10000}
export HOST=${HOST:-0.0.0.0}

echo "Starting Xvfb on display :99..."
# バックグラウンドでXvfb起動
Xvfb :99 -screen 0 1920x1080x24 -ac +extension GLX +render -noreset &
XVFB_PID=$!

# Xvfbの起動を待機
sleep 3

echo "Xvfb started with PID: $XVFB_PID"
echo "Server will start on $HOST:$PORT"

# WebSocketサーバー起動
echo "Starting WebSocket server..."
python python/websocket_server.py --host $HOST --port $PORT

# 終了時のクリーンアップ
cleanup() {
    echo "Shutting down..."
    kill $XVFB_PID 2>/dev/null
    exit
}

trap cleanup SIGTERM SIGINT

# プロセス監視
wait