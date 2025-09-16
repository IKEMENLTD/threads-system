@echo off
setlocal EnableDelayedExpansion

echo ================================================
echo   Threads仮想デスクトップ自動化 セットアップ
echo ================================================
echo.

:: WSL検出
wsl --list >nul 2>&1
if %ERRORLEVEL% == 0 (
    echo WSLが検出されました。
    echo.
    echo WSL環境での実行を推奨します:
    echo 1. WSLターミナルを開く
    echo 2. プロジェクトディレクトリに移動
    echo 3. 実行: bash setup_virtual_desktop.sh
    echo.
    echo Windowsネイティブ環境でも続行しますか? (Y/N)
    set /p choice=選択:
    if /i "!choice!" neq "Y" (
        echo セットアップを中止しました。
        pause
        exit /b 0
    )
) else (
    echo Windows環境でのセットアップを開始します。
    echo 注意: 仮想デスクトップ機能はWSL/Linux環境でのみ利用可能です。
)

echo.
echo ========================================
echo 1. Python環境の確認
echo ========================================

:: Pythonの確認
python --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [エラー] Pythonがインストールされていません。
    echo Python 3.9以上をインストールしてください。
    echo https://www.python.org/downloads/
    pause
    exit /b 1
)

python --version
echo.

:: pipの確認
pip --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [エラー] pipがインストールされていません。
    pause
    exit /b 1
)

echo ========================================
echo 2. Python仮想環境のセットアップ
echo ========================================

:: 仮想環境の作成
if not exist "venv" (
    echo Python仮想環境を作成中...
    python -m venv venv
    if %ERRORLEVEL% neq 0 (
        echo [エラー] 仮想環境の作成に失敗しました。
        pause
        exit /b 1
    )
    echo 仮想環境を作成しました。
) else (
    echo 仮想環境は既に存在します。
)

:: 仮想環境の有効化
echo 仮想環境を有効化中...
call venv\Scripts\activate.bat

:: pipのアップグレード
echo pipをアップグレード中...
python -m pip install --upgrade pip

echo.
echo ========================================
echo 3. Python依存関係のインストール
echo ========================================

echo 依存関係をインストール中...
pip install -r python\requirements_browser.txt
if %ERRORLEVEL% neq 0 (
    echo [警告] 一部のパッケージのインストールに失敗しました。
    echo Linux専用パッケージ (pyvirtualdisplay等) はWindowsでは不要です。
)

echo.
echo ========================================
echo 4. ChromeDriverのセットアップ
echo ========================================

:: ChromeDriverの確認
where chromedriver >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ChromeDriverが見つかりません。
    echo.
    echo ChromeDriverをダウンロードしてください:
    echo https://chromedriver.chromium.org/
    echo.
    echo ダウンロード後、PATHに追加するか、プロジェクトフォルダに配置してください。
) else (
    echo ChromeDriverが検出されました。
    chromedriver --version
)

echo.
echo ========================================
echo 5. 環境変数ファイルの作成
echo ========================================

if not exist ".env" (
    if exist ".env.example" (
        echo 環境変数ファイル(.env)を作成中...
        copy .env.example .env >nul
        echo .envファイルを作成しました。必要に応じて編集してください。
    ) else (
        echo [警告] .env.exampleファイルが見つかりません。
    )
) else (
    echo .envファイルは既に存在します。
)

echo.
echo ========================================
echo 6. Tesseract OCRのセットアップ
echo ========================================

:: Tesseractの確認
where tesseract >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Tesseract OCRが見つかりません。
    echo.
    echo Tesseract OCRをインストールしてください:
    echo https://github.com/UB-Mannheim/tesseract/wiki
    echo.
    echo インストール後、PATHに追加してください。
) else (
    echo Tesseract OCRが検出されました。
    tesseract --version
)

echo.
echo ================================================
echo   セットアップ完了！
echo ================================================
echo.

echo 次のステップ:
echo.
echo 1. テスト実行:
echo    python test_virtual_desktop.py --check
echo.
echo 2. WebSocketサーバー起動:
echo    python python\websocket_server.py
echo.
echo 3. ブラウザでアクセス:
echo    http://localhost:8888
echo.

echo 注意事項:
echo - Windows環境では仮想デスクトップ機能は利用できません
echo - WSL環境での実行を推奨します
echo - WSLの場合: wsl bash setup_virtual_desktop.sh
echo.

pause