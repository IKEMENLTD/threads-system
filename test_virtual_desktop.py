#!/usr/bin/env python3
"""
仮想デスクトップ機能テストスクリプト
"""

import sys
import os
import logging
import time

# パスを追加
sys.path.append(os.path.join(os.path.dirname(__file__), 'python'))

from python.browser_automation.virtual_display import VirtualDisplayManager
from python.browser_automation.threads_bot import ThreadsBot

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def test_virtual_display_only():
    """仮想ディスプレイ単体のテスト"""
    print("\n=== 仮想ディスプレイ単体テスト ===")

    try:
        # 仮想ディスプレイマネージャーを作成
        vdm = VirtualDisplayManager(1920, 1080, 24)

        # 起動
        if vdm.start():
            print("✅ 仮想ディスプレイ起動成功")

            # 情報取得
            info = vdm.get_display_info()
            print(f"ディスプレイ情報:")
            for key, value in info.items():
                print(f"  {key}: {value}")

            # スクリーンショットテスト
            screenshot = vdm.take_screenshot("test_virtual_screenshot.png")
            if screenshot:
                print(f"✅ スクリーンショット保存: {screenshot}")
            else:
                print("⚠️ スクリーンショット取得失敗（xwdまたはconvertが必要）")

            # 停止
            vdm.stop()
            print("✅ 仮想ディスプレイ停止成功")
        else:
            print("❌ 仮想ディスプレイ起動失敗")

    except Exception as e:
        print(f"❌ エラー: {e}")
        import traceback
        traceback.print_exc()


def test_threads_bot_with_virtual_display():
    """ThreadsBotと仮想ディスプレイの統合テスト"""
    print("\n=== ThreadsBot仮想デスクトップ統合テスト ===")

    try:
        # コンテキストマネージャーを使用
        with ThreadsBot(headless=True, use_virtual_display=True) as bot:
            print("✅ ThreadsBot初期化成功")

            # 仮想ディスプレイの確認
            if bot.virtual_display:
                info = bot.virtual_display.get_display_info()
                print(f"✅ 仮想ディスプレイ使用中: {info['width']}x{info['height']}")
            else:
                print("⚠️ 仮想ディスプレイ未使用（Windows環境?）")

            # Threads.netにアクセス
            print("Threads.netにアクセス中...")
            bot.driver.get("https://www.threads.net/")
            time.sleep(3)

            # スクリーンショット取得
            screenshot = bot.take_virtual_screenshot("threads_homepage.png")
            if screenshot:
                print(f"✅ スクリーンショット保存: {screenshot}")

            # ページタイトル確認
            title = bot.driver.title
            print(f"ページタイトル: {title}")

            print("✅ 統合テスト成功")

    except Exception as e:
        print(f"❌ エラー: {e}")
        import traceback
        traceback.print_exc()


def test_websocket_server():
    """WebSocketサーバーの仮想ディスプレイテスト"""
    print("\n=== WebSocketサーバーテスト ===")
    print("WebSocketサーバーをテストするには、以下を実行してください:")
    print("1. python python/websocket_server.py")
    print("2. ブラウザで http://localhost:8888 を開く")
    print("3. test_automation.html でテスト")


def check_environment():
    """環境チェック"""
    print("\n=== 環境チェック ===")

    import platform
    print(f"OS: {platform.system()}")
    print(f"Platform: {platform.platform()}")

    # WSL検出
    is_wsl = False
    try:
        with open('/proc/version', 'r') as f:
            if 'microsoft' in f.read().lower():
                is_wsl = True
                print("✅ WSL環境を検出")
    except:
        pass

    if not is_wsl and platform.system() != 'Linux':
        print("⚠️ Windows環境: 仮想ディスプレイは不要です")

    # 必要なコマンドの確認
    commands = ['Xvfb', 'xwd', 'convert', 'wmctrl']
    for cmd in commands:
        import subprocess
        try:
            result = subprocess.run(['which', cmd], capture_output=True)
            if result.returncode == 0:
                print(f"✅ {cmd}: インストール済み")
            else:
                print(f"❌ {cmd}: 未インストール")
        except:
            print(f"❌ {cmd}: 確認失敗")

    # Pythonパッケージの確認
    packages = ['selenium', 'pyvirtualdisplay', 'pytesseract', 'cv2']
    for package in packages:
        try:
            __import__(package)
            print(f"✅ {package}: インストール済み")
        except ImportError:
            print(f"❌ {package}: 未インストール")


def install_dependencies():
    """依存関係のインストール手順"""
    print("\n=== 依存関係インストール手順 ===")
    print("\n【Linux/WSL環境】")
    print("1. システムパッケージ:")
    print("   sudo apt-get update")
    print("   sudo apt-get install -y xvfb x11-apps imagemagick wmctrl")
    print("   sudo apt-get install -y tesseract-ocr tesseract-ocr-jpn")
    print("   sudo apt-get install -y chromium-browser chromium-chromedriver")
    print("\n2. Pythonパッケージ:")
    print("   pip install -r python/requirements_browser.txt")
    print("\n【Windows環境】")
    print("   仮想ディスプレイは不要です。ChromeDriverをダウンロードしてください。")


def main():
    """メイン関数"""
    print("=" * 60)
    print("  Threads仮想デスクトップ自動化 テストスクリプト")
    print("=" * 60)

    import argparse
    parser = argparse.ArgumentParser(description="仮想デスクトップ機能テスト")
    parser.add_argument('--check', action='store_true', help='環境チェック')
    parser.add_argument('--install', action='store_true', help='インストール手順表示')
    parser.add_argument('--display', action='store_true', help='仮想ディスプレイ単体テスト')
    parser.add_argument('--bot', action='store_true', help='ThreadsBot統合テスト')
    parser.add_argument('--all', action='store_true', help='全テスト実行')

    args = parser.parse_args()

    if args.install:
        install_dependencies()
        return

    if args.check or args.all:
        check_environment()

    if args.display or args.all:
        test_virtual_display_only()

    if args.bot or args.all:
        test_threads_bot_with_virtual_display()

    if not any([args.check, args.install, args.display, args.bot, args.all]):
        print("使用方法:")
        print("  python test_virtual_desktop.py --check    # 環境チェック")
        print("  python test_virtual_desktop.py --install  # インストール手順")
        print("  python test_virtual_desktop.py --display  # 仮想ディスプレイテスト")
        print("  python test_virtual_desktop.py --bot      # ThreadsBot統合テスト")
        print("  python test_virtual_desktop.py --all      # 全テスト実行")


if __name__ == "__main__":
    main()