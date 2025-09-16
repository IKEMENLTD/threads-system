"""
仮想デスクトップ/ディスプレイ管理モジュール
Linux/WSL環境でのヘッドレス実行をサポート
"""

import os
import sys
import platform
import logging
from typing import Optional, Tuple, Dict, Any
import subprocess

logger = logging.getLogger(__name__)


class VirtualDisplayManager:
    """仮想ディスプレイ管理クラス"""

    def __init__(self, width: int = 1920, height: int = 1080, color_depth: int = 24):
        """
        Args:
            width: 画面幅
            height: 画面高さ
            color_depth: 色深度
        """
        self.width = width
        self.height = height
        self.color_depth = color_depth
        self.display = None
        self.xvfb_process = None
        self.is_wsl = self._detect_wsl()
        self.is_linux = platform.system() == 'Linux'

    def _detect_wsl(self) -> bool:
        """WSL環境かどうかを検出"""
        try:
            with open('/proc/version', 'r') as f:
                return 'microsoft' in f.read().lower()
        except:
            return False

    def start(self) -> bool:
        """仮想ディスプレイを開始"""
        try:
            # Windows環境では仮想ディスプレイ不要
            if platform.system() == 'Windows' and not self.is_wsl:
                logger.info("Windows環境: 仮想ディスプレイは不要です")
                return True

            # Linux/WSL環境でpyvirtualdisplayを使用
            if self.is_linux or self.is_wsl:
                try:
                    from pyvirtualdisplay import Display

                    logger.info(f"仮想ディスプレイ起動中: {self.width}x{self.height}")
                    self.display = Display(
                        visible=False,
                        size=(self.width, self.height),
                        color_depth=self.color_depth,
                        backend='xvfb'
                    )
                    self.display.start()

                    # DISPLAY環境変数を設定
                    os.environ['DISPLAY'] = self.display.new_display_var
                    logger.info(f"仮想ディスプレイ起動成功: DISPLAY={os.environ.get('DISPLAY')}")
                    return True

                except ImportError:
                    logger.warning("pyvirtualdisplayがインストールされていません。Xvfbを直接使用します。")
                    return self._start_xvfb_directly()

        except Exception as e:
            logger.error(f"仮想ディスプレイ起動エラー: {e}")
            return False

    def _start_xvfb_directly(self) -> bool:
        """Xvfbを直接起動"""
        try:
            # 利用可能なディスプレイ番号を探す
            display_num = self._find_free_display()

            # Xvfbコマンドを構築
            xvfb_cmd = [
                'Xvfb',
                f':{display_num}',
                '-screen', '0',
                f'{self.width}x{self.height}x{self.color_depth}',
                '-ac',  # アクセス制御を無効化
                '+extension', 'GLX',  # OpenGL拡張を有効化
                '+extension', 'RANDR',  # 画面回転・リサイズ拡張
                '-nolisten', 'tcp'  # TCPリスニングを無効化（セキュリティ）
            ]

            logger.info(f"Xvfb起動コマンド: {' '.join(xvfb_cmd)}")

            # Xvfbプロセスを起動
            self.xvfb_process = subprocess.Popen(
                xvfb_cmd,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )

            # DISPLAY環境変数を設定
            os.environ['DISPLAY'] = f':{display_num}'
            logger.info(f"Xvfb起動成功: DISPLAY=:{display_num}")

            return True

        except FileNotFoundError:
            logger.error("Xvfbがインストールされていません。インストールしてください: sudo apt-get install xvfb")
            return False
        except Exception as e:
            logger.error(f"Xvfb起動エラー: {e}")
            return False

    def _find_free_display(self) -> int:
        """利用可能なディスプレイ番号を探す"""
        for i in range(99, 200):
            lock_file = f'/tmp/.X{i}-lock'
            if not os.path.exists(lock_file):
                return i
        raise RuntimeError("利用可能なディスプレイ番号が見つかりません")

    def stop(self):
        """仮想ディスプレイを停止"""
        try:
            if self.display:
                self.display.stop()
                logger.info("仮想ディスプレイ停止")

            if self.xvfb_process:
                self.xvfb_process.terminate()
                self.xvfb_process.wait(timeout=5)
                logger.info("Xvfbプロセス停止")

        except Exception as e:
            logger.error(f"仮想ディスプレイ停止エラー: {e}")

    def take_screenshot(self, filename: str = "screenshot.png") -> Optional[str]:
        """仮想ディスプレイのスクリーンショットを取得"""
        try:
            if not (self.is_linux or self.is_wsl):
                logger.warning("スクリーンショットはLinux/WSL環境でのみ利用可能")
                return None

            # xwdコマンドでスクリーンショット取得
            import tempfile
            temp_xwd = tempfile.mktemp(suffix='.xwd')

            # xwdでキャプチャ
            subprocess.run([
                'xwd',
                '-root',
                '-out', temp_xwd
            ], check=True, env=os.environ)

            # ImageMagickでPNGに変換
            subprocess.run([
                'convert',
                temp_xwd,
                filename
            ], check=True)

            # 一時ファイル削除
            os.remove(temp_xwd)

            logger.info(f"スクリーンショット保存: {filename}")
            return filename

        except subprocess.CalledProcessError as e:
            logger.error(f"スクリーンショット取得エラー: {e}")
            return None
        except FileNotFoundError:
            logger.error("xwdまたはconvertコマンドが見つかりません。インストールしてください: sudo apt-get install x11-apps imagemagick")
            return None

    def get_display_info(self) -> Dict[str, Any]:
        """ディスプレイ情報を取得"""
        return {
            'width': self.width,
            'height': self.height,
            'color_depth': self.color_depth,
            'display_var': os.environ.get('DISPLAY'),
            'is_wsl': self.is_wsl,
            'is_linux': self.is_linux,
            'is_running': self.display is not None or self.xvfb_process is not None
        }

    def __enter__(self):
        """コンテキストマネージャー: 開始"""
        self.start()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """コンテキストマネージャー: 終了"""
        self.stop()


class WindowManager:
    """ウィンドウ管理クラス（仮想デスクトップ内でのウィンドウ操作）"""

    def __init__(self):
        self.display_manager = None

    def list_windows(self) -> list:
        """開いているウィンドウのリストを取得"""
        try:
            result = subprocess.run(
                ['wmctrl', '-l'],
                capture_output=True,
                text=True,
                check=True
            )

            windows = []
            for line in result.stdout.strip().split('\n'):
                if line:
                    parts = line.split(None, 3)
                    if len(parts) >= 4:
                        windows.append({
                            'id': parts[0],
                            'desktop': parts[1],
                            'host': parts[2],
                            'title': parts[3]
                        })
            return windows

        except (subprocess.CalledProcessError, FileNotFoundError):
            logger.warning("wmctrlが利用できません")
            return []

    def focus_window(self, window_id: str):
        """指定したウィンドウにフォーカス"""
        try:
            subprocess.run(['wmctrl', '-ia', window_id], check=True)
            logger.info(f"ウィンドウフォーカス: {window_id}")
        except (subprocess.CalledProcessError, FileNotFoundError):
            logger.warning("ウィンドウフォーカス失敗")

    def resize_window(self, window_id: str, width: int, height: int):
        """ウィンドウサイズ変更"""
        try:
            subprocess.run([
                'wmctrl', '-ir', window_id,
                '-e', f'0,-1,-1,{width},{height}'
            ], check=True)
            logger.info(f"ウィンドウリサイズ: {width}x{height}")
        except (subprocess.CalledProcessError, FileNotFoundError):
            logger.warning("ウィンドウリサイズ失敗")

    def move_window(self, window_id: str, x: int, y: int):
        """ウィンドウ位置変更"""
        try:
            subprocess.run([
                'wmctrl', '-ir', window_id,
                '-e', f'0,{x},{y},-1,-1'
            ], check=True)
            logger.info(f"ウィンドウ移動: ({x}, {y})")
        except (subprocess.CalledProcessError, FileNotFoundError):
            logger.warning("ウィンドウ移動失敗")


# テスト実行
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)

    print("仮想ディスプレイテスト開始...")

    # 仮想ディスプレイマネージャーを使用
    with VirtualDisplayManager(1920, 1080) as vdm:
        print(f"ディスプレイ情報: {vdm.get_display_info()}")

        # ここでSeleniumなどを実行可能
        input("Enterキーで終了...")