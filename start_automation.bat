@echo off
echo ========================================
echo   Threads Browser Automation System
echo ========================================
echo.

REM Pythonチェック
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH
    echo Please install Python 3.9 or higher
    pause
    exit /b 1
)

REM 仮想環境チェック
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

REM 仮想環境有効化
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM パッケージインストール確認
pip show selenium >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing required packages...
    pip install -r python\requirements_browser.txt
)

REM WebSocketサーバー起動
echo.
echo Starting WebSocket server...
echo ========================================
echo Server will run at: http://localhost:8888
echo Press Ctrl+C to stop
echo ========================================
echo.

cd python
python websocket_server.py

pause