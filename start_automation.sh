#!/bin/bash

echo "========================================"
echo "  Threads Browser Automation System"
echo "========================================"
echo

# Pythonチェック
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python 3 is not installed"
    echo "Please install Python 3.9 or higher"
    exit 1
fi

# Tesseractチェック
if ! command -v tesseract &> /dev/null; then
    echo "[WARNING] Tesseract OCR is not installed"
    echo "Installing Tesseract..."
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        brew install tesseract tesseract-lang
    else
        # Linux
        sudo apt-get update
        sudo apt-get install -y tesseract-ocr tesseract-ocr-jpn
    fi
fi

# 仮想環境チェック
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# 仮想環境有効化
echo "Activating virtual environment..."
source venv/bin/activate

# パッケージインストール確認
if ! pip show selenium &> /dev/null; then
    echo "Installing required packages..."
    pip install -r python/requirements_browser.txt
fi

# Xvfbチェック（Linuxでヘッドレス実行用）
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    if ! command -v xvfb-run &> /dev/null; then
        echo "Installing Xvfb for headless mode..."
        sudo apt-get install -y xvfb
    fi
fi

# WebSocketサーバー起動
echo
echo "Starting WebSocket server..."
echo "========================================"
echo "Server will run at: http://localhost:8888"
echo "Press Ctrl+C to stop"
echo "========================================"
echo

cd python

# ヘッドレスモードのオプション
if [ "$1" == "--headless" ]; then
    echo "Running in headless mode..."
    xvfb-run -a python3 websocket_server.py
else
    python3 websocket_server.py
fi