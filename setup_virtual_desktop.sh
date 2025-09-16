#!/bin/bash
# 仮想デスクトップ環境セットアップスクリプト

echo "================================================"
echo "  Threads仮想デスクトップ自動化 セットアップ"
echo "================================================"

# 色付き出力の定義
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# OS検出
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if grep -q Microsoft /proc/version; then
            echo "WSL"
        else
            echo "Linux"
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo "Mac"
    else
        echo "Unknown"
    fi
}

OS=$(detect_os)
echo -e "${GREEN}検出されたOS: $OS${NC}"

# WSL/Linux環境のセットアップ
setup_linux() {
    echo -e "\n${YELLOW}Linux/WSL環境のセットアップを開始します...${NC}"

    # システムパッケージのインストール
    echo -e "\n${YELLOW}1. システムパッケージのインストール${NC}"
    sudo apt-get update

    # Xvfbと関連ツール
    echo "Xvfb (仮想フレームバッファ) のインストール..."
    sudo apt-get install -y xvfb

    # X11アプリケーション
    echo "X11アプリケーションのインストール..."
    sudo apt-get install -y x11-apps

    # ImageMagick (画像変換用)
    echo "ImageMagickのインストール..."
    sudo apt-get install -y imagemagick

    # wmctrl (ウィンドウ管理)
    echo "wmctrlのインストール..."
    sudo apt-get install -y wmctrl

    # Tesseract OCR
    echo "Tesseract OCRのインストール..."
    sudo apt-get install -y tesseract-ocr tesseract-ocr-jpn

    # Chrome/Chromium
    echo "Chromiumブラウザのインストール..."
    sudo apt-get install -y chromium-browser chromium-chromedriver

    # 日本語フォント
    echo "日本語フォントのインストール..."
    sudo apt-get install -y fonts-noto-cjk

    # Python開発ツール
    echo "Python開発ツールのインストール..."
    sudo apt-get install -y python3-dev python3-pip python3-venv

    echo -e "${GREEN}システムパッケージのインストール完了！${NC}"
}

# Mac環境のセットアップ
setup_mac() {
    echo -e "\n${YELLOW}Mac環境のセットアップを開始します...${NC}"

    # Homebrewの確認
    if ! command -v brew &> /dev/null; then
        echo -e "${RED}Homebrewがインストールされていません。${NC}"
        echo "インストール: /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
        exit 1
    fi

    # ChromeDriver
    echo "ChromeDriverのインストール..."
    brew install chromedriver

    # Tesseract OCR
    echo "Tesseract OCRのインストール..."
    brew install tesseract

    echo -e "${GREEN}Macのセットアップ完了！${NC}"
}

# Python仮想環境のセットアップ
setup_python_env() {
    echo -e "\n${YELLOW}2. Python仮想環境のセットアップ${NC}"

    # 仮想環境の作成
    if [ ! -d "venv" ]; then
        echo "Python仮想環境を作成中..."
        python3 -m venv venv
    fi

    # 仮想環境の有効化
    source venv/bin/activate

    # pipのアップグレード
    echo "pipをアップグレード中..."
    pip install --upgrade pip

    # 依存関係のインストール
    echo "Python依存関係をインストール中..."
    pip install -r python/requirements_browser.txt

    echo -e "${GREEN}Python環境のセットアップ完了！${NC}"
}

# Xvfbのテスト
test_xvfb() {
    echo -e "\n${YELLOW}3. Xvfbの動作テスト${NC}"

    # Xvfbの起動テスト
    echo "Xvfbの起動テスト中..."
    Xvfb :99 -screen 0 1920x1080x24 &
    XVFB_PID=$!
    sleep 2

    if ps -p $XVFB_PID > /dev/null; then
        echo -e "${GREEN}✅ Xvfbは正常に動作しています${NC}"
        kill $XVFB_PID
    else
        echo -e "${RED}❌ Xvfbの起動に失敗しました${NC}"
    fi
}

# 設定ファイルの作成
create_config() {
    echo -e "\n${YELLOW}4. 設定ファイルの作成${NC}"

    if [ ! -f ".env" ]; then
        echo "環境変数ファイル(.env)を作成中..."
        cp .env.example .env
        echo -e "${GREEN}.envファイルを作成しました。必要に応じて編集してください。${NC}"
    else
        echo ".envファイルは既に存在します。"
    fi
}

# メイン処理
main() {
    case $OS in
        "Linux"|"WSL")
            setup_linux
            setup_python_env
            test_xvfb
            create_config
            ;;
        "Mac")
            setup_mac
            setup_python_env
            create_config
            ;;
        *)
            echo -e "${RED}サポートされていないOS: $OSTYPE${NC}"
            echo "手動でセットアップしてください。"
            exit 1
            ;;
    esac

    echo -e "\n${GREEN}================================================${NC}"
    echo -e "${GREEN}  セットアップ完了！${NC}"
    echo -e "${GREEN}================================================${NC}"

    echo -e "\n次のステップ:"
    echo "1. テスト実行:"
    echo "   python test_virtual_desktop.py --all"
    echo ""
    echo "2. WebSocketサーバー起動:"
    echo "   python python/websocket_server.py"
    echo ""
    echo "3. ブラウザでアクセス:"
    echo "   http://localhost:8888"
}

# 実行
main