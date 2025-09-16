"""
Threads ブラウザ自動化ボット
Seleniumを使用したThreadsの自動操作
仮想デスクトップ対応版
"""

import time
import random
import logging
from typing import List, Dict, Any, Optional, Tuple
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import undetected_chromedriver as uc
from PIL import Image
import io
import base64
import pytesseract
import cv2
import numpy as np
import os
import platform

# 仮想ディスプレイモジュールをインポート
try:
    from .virtual_display import VirtualDisplayManager
except ImportError:
    from virtual_display import VirtualDisplayManager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ThreadsBot:
    """Threads自動化ボットクラス"""
    
    def __init__(self, headless: bool = False, use_proxy: Optional[str] = None,
                 use_virtual_display: bool = None):
        """
        Args:
            headless: ヘッドレスモードで実行
            use_proxy: プロキシサーバー設定
            use_virtual_display: 仮想ディスプレイを使用（None: 自動判定）
        """
        self.driver = None
        self.wait = None
        self.headless = headless
        self.proxy = use_proxy
        self.logged_in = False
        self.session_cookies = None

        # 仮想ディスプレイの自動判定
        if use_virtual_display is None:
            # Linux/WSLまたはヘッドレスモードで仮想ディスプレイを使用
            self.use_virtual_display = (
                platform.system() == 'Linux' or
                self._is_wsl() or
                headless
            )
        else:
            self.use_virtual_display = use_virtual_display

        self.virtual_display = None

        # セレクタ定義（変更に対応しやすいよう辞書化）
        self.selectors = {
            'login': {
                'username': 'input[name="username"]',
                'password': 'input[name="password"]',
                'login_button': 'button[type="submit"]',
                'two_factor': 'input[name="verificationCode"]'
            },
            'compose': {
                'new_post_button': '[aria-label*="新しい投稿"]',
                'text_area': '[contenteditable="true"]',
                'post_button': 'button:has-text("投稿")',
                'image_button': '[aria-label*="画像"]',
                'image_input': 'input[type="file"]'
            },
            'post': {
                'like_button': '[aria-label*="いいね"]',
                'comment_button': '[aria-label*="コメント"]',
                'share_button': '[aria-label*="シェア"]',
                'post_text': '[data-testid="post-text"]'
            }
        }

    def _is_wsl(self) -> bool:
        """WSL環境かどうかを検出"""
        try:
            with open('/proc/version', 'r') as f:
                return 'microsoft' in f.read().lower()
        except:
            return False

    def setup_driver(self):
        """ブラウザドライバーをセットアップ"""
        logger.info("ブラウザドライバー初期化中...")

        # 仮想ディスプレイを開始
        if self.use_virtual_display:
            logger.info("仮想ディスプレイを起動します...")
            self.virtual_display = VirtualDisplayManager(1920, 1080)
            if not self.virtual_display.start():
                logger.warning("仮想ディスプレイの起動に失敗しました。通常モードで続行します。")
                self.virtual_display = None

        # Chrome オプション設定
        options = uc.ChromeOptions()
        
        # 基本設定（シンプルに）
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--disable-extensions')
        options.add_argument('--disable-features=VizDisplayCompositor')
        
        # User-Agent設定
        user_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ]
        options.add_argument(f'user-agent={random.choice(user_agents)}')
        
        # ヘッドレスモード
        if self.headless:
            options.add_argument('--headless=new')
            options.add_argument('--window-size=1920,1080')
        
        # プロキシ設定
        if self.proxy:
            options.add_argument(f'--proxy-server={self.proxy}')
        
        # ドライバー作成（Windows環境では標準ドライバーも試行）
        try:
            self.driver = uc.Chrome(options=options)
        except Exception as e:
            logger.warning(f"undetected-chromedriver失敗: {e}")
            logger.info("標準ChromeDriverで再試行...")
            # 標準Seleniumドライバーで試行
            from selenium.webdriver.chrome.service import Service
            from webdriver_manager.chrome import ChromeDriverManager

            service = Service(ChromeDriverManager().install())
            self.driver = webdriver.Chrome(service=service, options=options)
        self.wait = WebDriverWait(self.driver, 20)
        
        # JavaScript実行でWebDriverを隠蔽
        self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        
        logger.info("ブラウザドライバー初期化完了")
    
    def human_typing(self, element, text: str, min_delay: float = 0.05, max_delay: float = 0.15):
        """人間らしいタイピングを模倣"""
        element.clear()
        for char in text:
            element.send_keys(char)
            time.sleep(random.uniform(min_delay, max_delay))
    
    def random_wait(self, min_seconds: float = 1, max_seconds: float = 3):
        """ランダムな待機時間"""
        wait_time = random.uniform(min_seconds, max_seconds)
        time.sleep(wait_time)
    
    def random_mouse_movement(self):
        """ランダムなマウス移動"""
        actions = ActionChains(self.driver)
        for _ in range(random.randint(1, 3)):
            x = random.randint(100, 800)
            y = random.randint(100, 600)
            actions.move_by_offset(x, y).perform()
            time.sleep(random.uniform(0.1, 0.3))
    
    def login(self, username: str, password: str, two_factor_code: Optional[str] = None) -> bool:
        """
        Threadsにログイン
        
        Args:
            username: ユーザー名
            password: パスワード
            two_factor_code: 2段階認証コード
            
        Returns:
            ログイン成功の可否
        """
        try:
            logger.info(f"ログイン開始: {username}")
            
            # Threads ログインページへ
            self.driver.get("https://www.threads.net/login")
            self.random_wait(2, 4)
            
            # ユーザー名入力
            username_input = self.wait.until(
                EC.presence_of_element_located((By.CSS_SELECTOR, self.selectors['login']['username']))
            )
            self.human_typing(username_input, username)
            self.random_wait()
            
            # パスワード入力
            password_input = self.driver.find_element(By.CSS_SELECTOR, self.selectors['login']['password'])
            self.human_typing(password_input, password)
            self.random_wait()
            
            # ログインボタンクリック
            login_button = self.driver.find_element(By.CSS_SELECTOR, self.selectors['login']['login_button'])
            login_button.click()
            self.random_wait(3, 5)
            
            # 2段階認証チェック
            if self.check_two_factor():
                if two_factor_code:
                    self.handle_two_factor(two_factor_code)
                else:
                    logger.warning("2段階認証が必要ですが、コードが提供されていません")
                    return False
            
            # ログイン成功確認
            if self.verify_login():
                self.logged_in = True
                self.save_cookies()
                logger.info("ログイン成功")
                return True
            else:
                logger.error("ログイン失敗")
                return False
                
        except Exception as e:
            logger.error(f"ログインエラー: {e}")
            self.capture_screenshot("login_error")
            return False
    
    def check_two_factor(self) -> bool:
        """2段階認証が必要かチェック"""
        try:
            self.driver.find_element(By.CSS_SELECTOR, self.selectors['login']['two_factor'])
            return True
        except NoSuchElementException:
            return False
    
    def handle_two_factor(self, code: str):
        """2段階認証を処理"""
        two_factor_input = self.driver.find_element(By.CSS_SELECTOR, self.selectors['login']['two_factor'])
        self.human_typing(two_factor_input, code)
        two_factor_input.send_keys(Keys.RETURN)
        self.random_wait(2, 4)
    
    def verify_login(self) -> bool:
        """ログイン成功を確認"""
        try:
            # ホームフィードが表示されているか確認
            self.wait.until(
                EC.presence_of_element_located((By.CSS_SELECTOR, '[role="main"]'))
            )
            return True
        except TimeoutException:
            return False
    
    def save_cookies(self):
        """Cookieを保存"""
        self.session_cookies = self.driver.get_cookies()
        logger.info(f"Cookie保存: {len(self.session_cookies)}個")
    
    def load_cookies(self):
        """保存したCookieを読み込み"""
        if self.session_cookies:
            for cookie in self.session_cookies:
                self.driver.add_cookie(cookie)
            logger.info("Cookie読み込み完了")
    
    def create_post(self, content: str, images: Optional[List[str]] = None, hashtags: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        新規投稿を作成
        
        Args:
            content: 投稿内容
            images: 画像パスのリスト
            hashtags: ハッシュタグのリスト
            
        Returns:
            投稿結果
        """
        try:
            if not self.logged_in:
                logger.error("ログインが必要です")
                return {'success': False, 'error': 'Not logged in'}
            
            logger.info("投稿作成開始")
            result = {'success': False}
            
            # ホームページへ移動
            self.driver.get("https://www.threads.net/")
            self.random_wait(2, 4)
            
            # 新規投稿ボタンをクリック
            new_post_button = self.wait.until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, self.selectors['compose']['new_post_button']))
            )
            new_post_button.click()
            self.random_wait()
            
            # テキストエリアを取得
            text_area = self.wait.until(
                EC.presence_of_element_located((By.CSS_SELECTOR, self.selectors['compose']['text_area']))
            )
            
            # コンテンツを入力
            full_content = content
            if hashtags:
                hashtag_text = ' '.join([f'#{tag}' for tag in hashtags])
                full_content = f"{content}\n\n{hashtag_text}"
            
            self.human_typing(text_area, full_content)
            self.random_wait()
            
            # 画像をアップロード
            if images:
                self.upload_images(images)
                self.random_wait(2, 4)
            
            # 投稿ボタンをクリック
            post_button = self.driver.find_element(By.CSS_SELECTOR, self.selectors['compose']['post_button'])
            post_button.click()
            self.random_wait(3, 5)
            
            # 投稿成功を確認
            if self.verify_post_success():
                result['success'] = True
                result['post_url'] = self.driver.current_url
                result['screenshot'] = self.capture_screenshot("post_success")
                logger.info("投稿成功")
            else:
                result['error'] = "投稿の確認に失敗"
                logger.error("投稿失敗")
            
            return result
            
        except Exception as e:
            logger.error(f"投稿作成エラー: {e}")
            return {
                'success': False,
                'error': str(e),
                'screenshot': self.capture_screenshot("post_error")
            }
    
    def upload_images(self, image_paths: List[str]):
        """画像をアップロード"""
        try:
            # 画像ボタンをクリック
            image_button = self.driver.find_element(By.CSS_SELECTOR, self.selectors['compose']['image_button'])
            image_button.click()
            self.random_wait()
            
            # ファイル入力要素を取得
            file_input = self.driver.find_element(By.CSS_SELECTOR, self.selectors['compose']['image_input'])
            
            # 複数画像を一度にアップロード
            file_paths = '\n'.join(image_paths)
            file_input.send_keys(file_paths)
            
            logger.info(f"{len(image_paths)}枚の画像をアップロード")
            
        except Exception as e:
            logger.error(f"画像アップロードエラー: {e}")
    
    def verify_post_success(self) -> bool:
        """投稿成功を確認（OCR使用）"""
        try:
            # スクリーンショットを取得
            screenshot = self.capture_screenshot("post_verification")
            
            # OCRで「投稿しました」などのテキストを検出
            img = Image.open(io.BytesIO(base64.b64decode(screenshot.split(',')[1])))
            text = pytesseract.image_to_string(img, lang='jpn')
            
            success_keywords = ['投稿しました', '投稿が完了', 'Posted', 'Successfully']
            for keyword in success_keywords:
                if keyword in text:
                    return True
            
            # URL変更でも確認
            if '/post/' in self.driver.current_url:
                return True
                
            return False
            
        except Exception as e:
            logger.error(f"投稿確認エラー: {e}")
            return False
    
    def get_post_metrics(self) -> Dict[str, int]:
        """投稿のメトリクスを取得（OCR使用）"""
        try:
            metrics = {
                'likes': 0,
                'comments': 0,
                'shares': 0
            }
            
            # スクリーンショット取得
            screenshot_base64 = self.capture_screenshot("metrics")
            img_data = base64.b64decode(screenshot_base64.split(',')[1])
            
            # OpenCVで画像処理
            nparr = np.frombuffer(img_data, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
            # OCRで数値を読み取り
            text = pytesseract.image_to_string(gray, config='--psm 6 digits')
            
            # 数値を抽出
            import re
            numbers = re.findall(r'\d+', text)
            
            if len(numbers) >= 3:
                metrics['likes'] = int(numbers[0])
                metrics['comments'] = int(numbers[1])
                metrics['shares'] = int(numbers[2])
            
            logger.info(f"メトリクス取得: {metrics}")
            return metrics
            
        except Exception as e:
            logger.error(f"メトリクス取得エラー: {e}")
            return {'likes': 0, 'comments': 0, 'shares': 0}
    
    def capture_screenshot(self, name: str = "screenshot") -> str:
        """スクリーンショットを撮影してBase64で返す"""
        try:
            screenshot = self.driver.get_screenshot_as_base64()
            logger.info(f"スクリーンショット撮影: {name}")
            return f"data:image/png;base64,{screenshot}"
        except Exception as e:
            logger.error(f"スクリーンショット撮影エラー: {e}")
            return ""
    
    def detect_captcha(self) -> bool:
        """キャプチャの検出"""
        captcha_indicators = [
            'recaptcha',
            'captcha',
            'challenge',
            '確認してください',
            'verify you are human'
        ]
        
        page_source = self.driver.page_source.lower()
        for indicator in captcha_indicators:
            if indicator in page_source:
                logger.warning("キャプチャが検出されました")
                return True
        return False
    
    def handle_error_dialog(self):
        """エラーダイアログを処理"""
        try:
            # エラーダイアログの閉じるボタンを探す
            close_buttons = self.driver.find_elements(By.CSS_SELECTOR, '[aria-label*="閉じる"], [aria-label*="Close"]')
            for button in close_buttons:
                if button.is_displayed():
                    button.click()
                    logger.info("エラーダイアログを閉じました")
                    self.random_wait()
                    break
        except Exception as e:
            logger.debug(f"エラーダイアログ処理: {e}")
    
    def scroll_feed(self, scroll_times: int = 3):
        """フィードをスクロール（人間らしい動作）"""
        for _ in range(scroll_times):
            # ランダムな量スクロール
            scroll_amount = random.randint(300, 700)
            self.driver.execute_script(f"window.scrollBy(0, {scroll_amount});")
            self.random_wait(1, 2)
            
            # たまに上にも少しスクロール
            if random.random() < 0.3:
                self.driver.execute_script(f"window.scrollBy(0, -{random.randint(50, 150)});")
                self.random_wait(0.5, 1)
    
    def quit(self):
        """ブラウザと仮想ディスプレイを終了"""
        if self.driver:
            self.driver.quit()
            logger.info("ブラウザ終了")

        if self.virtual_display:
            self.virtual_display.stop()
            logger.info("仮想ディスプレイ終了")

    def __del__(self):
        """デストラクタ: リソースのクリーンアップ"""
        try:
            self.quit()
        except:
            pass

    def __enter__(self):
        """コンテキストマネージャー: 開始"""
        self.setup_driver()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """コンテキストマネージャー: 終了"""
        self.quit()

    def take_virtual_screenshot(self, filename: str = None) -> Optional[str]:
        """仮想ディスプレイのスクリーンショットを取得"""
        if self.virtual_display:
            import tempfile
            if not filename:
                filename = tempfile.mktemp(suffix='.png')
            return self.virtual_display.take_screenshot(filename)
        else:
            # 通常のSeleniumスクリーンショット
            if filename:
                self.driver.save_screenshot(filename)
                return filename
            return None


# 使用例
if __name__ == "__main__":
    # 仮想デスクトップモードでボットを初期化
    # WSL/Linux環境では自動的に仮想ディスプレイが使用される

    # 方法1: 通常の使用
    bot = ThreadsBot(headless=True, use_virtual_display=True)

    try:
        # ドライバー初期化
        bot.setup_driver()

        logger.info(f"仮想ディスプレイ使用: {bot.use_virtual_display}")
        if bot.virtual_display:
            info = bot.virtual_display.get_display_info()
            logger.info(f"ディスプレイ情報: {info}")

        # ログイン
        success = bot.login("your_username", "your_password")

        if success:
            # 投稿作成
            result = bot.create_post(
                content="仮想デスクトップからの自動投稿テストです！",
                hashtags=["test", "automation", "threads", "virtual"]
            )
            print(f"投稿結果: {result}")

            # 仮想ディスプレイのスクリーンショット
            screenshot = bot.take_virtual_screenshot("virtual_screenshot.png")
            if screenshot:
                print(f"スクリーンショット保存: {screenshot}")

            # メトリクス取得
            metrics = bot.get_post_metrics()
            print(f"メトリクス: {metrics}")

    finally:
        bot.quit()

    # 方法2: コンテキストマネージャー使用（推奨）
    print("\n--- コンテキストマネージャー使用例 ---")
    with ThreadsBot(headless=True, use_virtual_display=True) as bot:
        # 自動的にsetup_driver()が実行される
        success = bot.login("your_username", "your_password")
        if success:
            result = bot.create_post(content="コンテキストマネージャーテスト")
            print(f"投稿結果: {result}")
        # 自動的にquit()が実行される