#!/usr/bin/env python3
"""
シンプルなブラウザテスト
"""

import sys
import os
import logging

# パスを追加
sys.path.append(os.path.join(os.path.dirname(__file__), 'python'))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_basic_selenium():
    """基本的なSeleniumテスト"""
    print("=== 基本的なSeleniumテスト ===")

    try:
        from selenium import webdriver
        from selenium.webdriver.chrome.options import Options
        from selenium.webdriver.chrome.service import Service
        from webdriver_manager.chrome import ChromeDriverManager

        # Chrome オプション設定
        options = Options()
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--disable-extensions')
        # ヘッドレスモードでテスト
        options.add_argument('--headless=new')
        options.add_argument('--window-size=1920,1080')

        # ChromeDriver自動管理
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=options)

        print("✅ Chrome起動成功")

        # Googleにアクセス
        driver.get("https://www.google.com")
        print(f"✅ Google接続成功: {driver.title}")

        # スクリーンショット
        driver.save_screenshot("test_screenshot.png")
        print("✅ スクリーンショット保存成功")

        # 終了
        driver.quit()
        print("✅ テスト完了")

        return True

    except Exception as e:
        print(f"❌ エラー: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_undetected_chrome():
    """undetected-chromedriverテスト"""
    print("\n=== undetected-chromedriverテスト ===")

    try:
        import undetected_chromedriver as uc

        # シンプルなオプション設定
        options = uc.ChromeOptions()
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--headless=new')
        options.add_argument('--window-size=1920,1080')

        # ドライバー作成
        driver = uc.Chrome(options=options)

        print("✅ undetected-chrome起動成功")

        # Googleにアクセス
        driver.get("https://www.google.com")
        print(f"✅ Google接続成功: {driver.title}")

        # 終了
        driver.quit()
        print("✅ undetected-chromeテスト完了")

        return True

    except Exception as e:
        print(f"❌ エラー: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    print("=" * 50)
    print("  ブラウザ機能テスト")
    print("=" * 50)

    # 標準Seleniumテスト
    selenium_ok = test_basic_selenium()

    # undetected-chromedriverテスト
    undetected_ok = test_undetected_chrome()

    print("\n" + "=" * 50)
    print("  テスト結果")
    print("=" * 50)
    print(f"標準Selenium: {'✅ 成功' if selenium_ok else '❌ 失敗'}")
    print(f"undetected-chrome: {'✅ 成功' if undetected_ok else '❌ 失敗'}")

    if selenium_ok or undetected_ok:
        print("\n✅ ブラウザ自動化は利用可能です！")
    else:
        print("\n❌ ブラウザ自動化に問題があります。")

if __name__ == "__main__":
    main()