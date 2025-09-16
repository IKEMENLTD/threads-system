@echo off
echo ================================================
echo   Threads Virtual Desktop Setup
echo ================================================
echo.

python --version
if %ERRORLEVEL% neq 0 (
    echo Python not found. Please install Python 3.9+
    pause
    exit
)

echo.
echo Creating virtual environment...
python -m venv venv

echo.
echo Activating virtual environment...
call venv\Scripts\activate.bat

echo.
echo Installing packages...
pip install --upgrade pip
pip install selenium
pip install undetected-chromedriver
pip install Pillow
pip install pytesseract
pip install opencv-python
pip install aiohttp
pip install aiohttp-cors
pip install python-socketio
pip install psycopg2-binary
pip install sqlalchemy
pip install python-dotenv
pip install pyautogui

echo.
echo ================================================
echo Setup Complete!
echo ================================================
echo.
echo Test with: python test_virtual_desktop.py --check
echo.
pause