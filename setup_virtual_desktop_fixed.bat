@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

echo ================================================
echo   Threads Virtual Desktop Setup
echo ================================================
echo.

:: Check WSL
wsl --list >nul 2>&1
if %ERRORLEVEL% == 0 (
    echo WSL detected.
    echo.
    echo Recommended to run in WSL:
    echo 1. Open WSL terminal
    echo 2. cd /mnt/c/Users/RN-^事務所/Downloads/Threads^自動ツールVer003
    echo 3. bash setup_virtual_desktop.sh
    echo.
    echo Continue with Windows setup? [Y/N]
    set /p choice=Choice:
    if /i "!choice!" neq "Y" (
        echo Setup cancelled.
        pause
        exit /b 0
    )
) else (
    echo Starting Windows setup.
    echo Note: Virtual desktop only works in WSL/Linux.
)

echo.
echo ========================================
echo 1. Checking Python
echo ========================================

:: Check Python
python --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Python not found.
    echo Please install Python 3.9 or later.
    echo https://www.python.org/downloads/
    pause
    exit /b 1
)

python --version
echo.

:: Check pip
pip --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] pip not found.
    pause
    exit /b 1
)

echo ========================================
echo 2. Setting up Python venv
echo ========================================

:: Create venv
if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Failed to create venv.
        pause
        exit /b 1
    )
    echo Virtual environment created.
) else (
    echo Virtual environment already exists.
)

:: Activate venv
echo Activating virtual environment...
call venv\Scripts\activate.bat

:: Upgrade pip
echo Upgrading pip...
python -m pip install --upgrade pip

echo.
echo ========================================
echo 3. Installing Python packages
echo ========================================

echo Installing dependencies...
pip install selenium undetected-chromedriver Pillow pytesseract opencv-python
pip install aiohttp aiohttp-cors python-socketio
pip install psycopg2-binary sqlalchemy
pip install python-dotenv pyautogui

echo.
echo ========================================
echo 4. Checking ChromeDriver
echo ========================================

:: Check ChromeDriver
where chromedriver >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ChromeDriver not found.
    echo.
    echo Please download ChromeDriver:
    echo https://chromedriver.chromium.org/
    echo.
) else (
    echo ChromeDriver found.
    chromedriver --version
)

echo.
echo ========================================
echo 5. Creating .env file
echo ========================================

if not exist ".env" (
    if exist ".env.example" (
        echo Creating .env file...
        copy .env.example .env >nul
        echo .env file created.
    )
) else (
    echo .env file already exists.
)

echo.
echo ================================================
echo   Setup Complete!
echo ================================================
echo.

echo Next steps:
echo.
echo 1. Test:
echo    python test_virtual_desktop.py --check
echo.
echo 2. Start WebSocket server:
echo    python python\websocket_server.py
echo.
echo 3. Open browser:
echo    http://localhost:8888
echo.

pause