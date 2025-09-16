"""
WebSocketサーバー
HTMLインターフェースとPython自動化の橋渡し
"""

import asyncio
import logging
import json
import base64
from datetime import datetime
from typing import Dict, Any, Optional
from aiohttp import web
import aiohttp_cors
import socketio
import os
import sys

# パスを追加
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from browser_automation.threads_bot import ThreadsBot

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class AutomationServer:
    """自動化サーバークラス"""
    
    def __init__(self):
        # Socket.IO サーバー初期化
        self.sio = socketio.AsyncServer(
            async_mode='aiohttp',
            cors_allowed_origins='*',
            logger=True,
            engineio_logger=True
        )
        
        # aiohttp アプリケーション
        self.app = web.Application()
        self.sio.attach(self.app)
        
        # CORS設定
        cors = aiohttp_cors.setup(self.app, defaults={
            "*": aiohttp_cors.ResourceOptions(
                allow_credentials=True,
                expose_headers="*",
                allow_headers="*",
                allow_methods="*"
            )
        })
        
        # ルート設定
        self.setup_routes()
        
        # Socket.IOイベント設定
        self.setup_socket_events()
        
        # ボットインスタンス
        self.bot: Optional[ThreadsBot] = None
        self.automation_running = False
        self.automation_task = None
        
        # セッション管理
        self.sessions = {}
    
    def setup_routes(self):
        """HTTPルートを設定"""
        # 静的ファイル配信
        self.app.router.add_get('/', self.index)
        self.app.router.add_get('/status', self.get_status)
        self.app.router.add_post('/api/login', self.api_login)
        self.app.router.add_post('/api/post', self.api_post)
    
    def setup_socket_events(self):
        """Socket.IOイベントを設定"""
        
        @self.sio.event
        async def connect(sid, environ):
            """クライアント接続"""
            logger.info(f"クライアント接続: {sid}")
            self.sessions[sid] = {
                'connected_at': datetime.now(),
                'authenticated': False
            }
            await self.sio.emit('status', {'message': 'サーバー接続成功'}, to=sid)
        
        @self.sio.event
        async def disconnect(sid):
            """クライアント切断"""
            logger.info(f"クライアント切断: {sid}")
            if sid in self.sessions:
                del self.sessions[sid]
        
        @self.sio.event
        async def test_login(sid, data):
            """ログインテスト"""
            await self.handle_login(sid, data)
        
        @self.sio.event
        async def test_post(sid, data):
            """投稿テスト"""
            await self.handle_post(sid, data)
        
        @self.sio.event
        async def start_automation(sid, data):
            """自動化開始"""
            await self.start_automation(sid)
        
        @self.sio.event
        async def stop_automation(sid, data):
            """自動化停止"""
            await self.stop_automation(sid)
        
        @self.sio.event
        async def capture_screen(sid, data):
            """画面キャプチャ"""
            await self.capture_screen(sid)
    
    async def index(self, request):
        """インデックスページ"""
        html_path = os.path.join(os.path.dirname(__file__), '..', 'test_automation.html')
        if os.path.exists(html_path):
            with open(html_path, 'r', encoding='utf-8') as f:
                html_content = f.read()
            return web.Response(text=html_content, content_type='text/html')
        else:
            return web.Response(text="HTMLファイルが見つかりません", status=404)
    
    async def get_status(self, request):
        """ステータス取得"""
        return web.json_response({
            'server': 'running',
            'bot_initialized': self.bot is not None,
            'automation_running': self.automation_running,
            'sessions': len(self.sessions)
        })
    
    async def api_login(self, request):
        """ログインAPI"""
        try:
            data = await request.json()
            username = data.get('username')
            password = data.get('password')
            
            if not self.bot:
                # 仮想ディスプレイモードで起動（WSL/Linux環境で自動判定）
                self.bot = ThreadsBot(headless=True, use_virtual_display=True)
                self.bot.setup_driver()
            
            success = self.bot.login(username, password)
            
            return web.json_response({
                'success': success,
                'message': 'ログイン成功' if success else 'ログイン失敗'
            })
            
        except Exception as e:
            logger.error(f"ログインAPIエラー: {e}")
            return web.json_response({
                'success': False,
                'error': str(e)
            }, status=500)
    
    async def api_post(self, request):
        """投稿API"""
        try:
            data = await request.json()
            content = data.get('content')
            images = data.get('images', [])
            hashtags = data.get('hashtags', [])
            
            if not self.bot or not self.bot.logged_in:
                return web.json_response({
                    'success': False,
                    'error': 'ログインが必要です'
                }, status=401)
            
            result = self.bot.create_post(content, images, hashtags)
            
            return web.json_response(result)
            
        except Exception as e:
            logger.error(f"投稿APIエラー: {e}")
            return web.json_response({
                'success': False,
                'error': str(e)
            }, status=500)
    
    async def handle_login(self, sid: str, data: Dict[str, Any]):
        """ログイン処理"""
        try:
            await self.sio.emit('status', {'message': 'ログイン処理開始...'}, to=sid)
            
            username = data.get('username')
            password = data.get('password')
            two_factor = data.get('two_factor_code')
            
            # ボット初期化
            if not self.bot:
                await self.sio.emit('status', {'message': 'ブラウザ起動中（仮想デスクトップモード）...'}, to=sid)
                # 仮想ディスプレイモードで起動（WSL/Linux環境で自動判定）
                self.bot = ThreadsBot(headless=True, use_virtual_display=True)
                self.bot.setup_driver()

                # ディスプレイ情報を送信
                if self.bot.virtual_display:
                    display_info = self.bot.virtual_display.get_display_info()
                    await self.sio.emit('status', {
                        'message': f'✅ 仮想ディスプレイ起動: {display_info["width"]}x{display_info["height"]}'
                    }, to=sid)
            
            # ログイン実行
            await self.sio.emit('status', {'message': f'ログイン中: {username}'}, to=sid)
            success = self.bot.login(username, password, two_factor)
            
            if success:
                self.sessions[sid]['authenticated'] = True
                await self.sio.emit('status', {'message': '✅ ログイン成功'}, to=sid)
                
                # スクリーンショット送信
                screenshot = self.bot.capture_screenshot("login_success")
                await self.sio.emit('screenshot', {'image': screenshot}, to=sid)
            else:
                await self.sio.emit('error', {'message': 'ログイン失敗'}, to=sid)
                
        except Exception as e:
            logger.error(f"ログイン処理エラー: {e}")
            await self.sio.emit('error', {'message': f'エラー: {str(e)}'}, to=sid)
    
    async def handle_post(self, sid: str, data: Dict[str, Any]):
        """投稿処理"""
        try:
            await self.sio.emit('status', {'message': '投稿処理開始...'}, to=sid)
            
            if not self.bot or not self.bot.logged_in:
                await self.sio.emit('error', {'message': 'ログインしてください'}, to=sid)
                return
            
            content = data.get('content', '')
            images = data.get('images', [])
            
            # Base64画像を一時ファイルに保存
            image_paths = []
            for i, img_base64 in enumerate(images):
                if img_base64.startswith('data:image'):
                    img_data = img_base64.split(',')[1]
                    img_bytes = base64.b64decode(img_data)
                    
                    temp_path = f'/tmp/upload_image_{i}.png'
                    with open(temp_path, 'wb') as f:
                        f.write(img_bytes)
                    image_paths.append(temp_path)
            
            # 投稿実行
            await self.sio.emit('status', {'message': '投稿中...'}, to=sid)
            result = self.bot.create_post(content, image_paths)
            
            if result['success']:
                await self.sio.emit('status', {'message': '✅ 投稿成功'}, to=sid)
                if 'screenshot' in result:
                    await self.sio.emit('screenshot', {'image': result['screenshot']}, to=sid)
                    
                # メトリクス取得
                metrics = self.bot.get_post_metrics()
                await self.sio.emit('status', {
                    'message': f'📊 いいね: {metrics["likes"]}, コメント: {metrics["comments"]}'
                }, to=sid)
            else:
                await self.sio.emit('error', {'message': f'投稿失敗: {result.get("error")}'}, to=sid)
            
            # 一時ファイル削除
            for path in image_paths:
                if os.path.exists(path):
                    os.remove(path)
                    
        except Exception as e:
            logger.error(f"投稿処理エラー: {e}")
            await self.sio.emit('error', {'message': f'エラー: {str(e)}'}, to=sid)
    
    async def start_automation(self, sid: str):
        """自動化開始"""
        try:
            if self.automation_running:
                await self.sio.emit('status', {'message': '既に自動化が実行中です'}, to=sid)
                return
            
            if not self.bot or not self.bot.logged_in:
                await self.sio.emit('error', {'message': 'ログインしてください'}, to=sid)
                return
            
            self.automation_running = True
            await self.sio.emit('status', {'message': '🚀 自動化プロセス開始'}, to=sid)
            
            # 自動化タスクを非同期で実行
            self.automation_task = asyncio.create_task(self.run_automation(sid))
            
        except Exception as e:
            logger.error(f"自動化開始エラー: {e}")
            await self.sio.emit('error', {'message': f'エラー: {str(e)}'}, to=sid)
    
    async def run_automation(self, sid: str):
        """自動化プロセス実行"""
        try:
            while self.automation_running:
                # データベースから予約投稿を取得（仮実装）
                await self.sio.emit('status', {'message': '予約投稿をチェック中...'}, to=sid)
                
                # 60秒待機
                await asyncio.sleep(60)
                
                # フィードをスクロール（人間らしい動作）
                if self.bot:
                    self.bot.scroll_feed()
                    
        except Exception as e:
            logger.error(f"自動化プロセスエラー: {e}")
            await self.sio.emit('error', {'message': f'自動化エラー: {str(e)}'}, to=sid)
        finally:
            self.automation_running = False
    
    async def stop_automation(self, sid: str):
        """自動化停止"""
        try:
            if not self.automation_running:
                await self.sio.emit('status', {'message': '自動化は実行されていません'}, to=sid)
                return
            
            self.automation_running = False
            
            if self.automation_task:
                self.automation_task.cancel()
                self.automation_task = None
            
            await self.sio.emit('status', {'message': '⏹️ 自動化プロセス停止'}, to=sid)
            
        except Exception as e:
            logger.error(f"自動化停止エラー: {e}")
            await self.sio.emit('error', {'message': f'エラー: {str(e)}'}, to=sid)
    
    async def capture_screen(self, sid: str):
        """画面キャプチャ"""
        try:
            if not self.bot:
                await self.sio.emit('error', {'message': 'ブラウザが起動していません'}, to=sid)
                return

            await self.sio.emit('status', {'message': '📸 画面キャプチャ中...'}, to=sid)

            # 仮想ディスプレイのスクリーンショットを優先的に取得
            if self.bot.virtual_display:
                import tempfile
                temp_file = tempfile.mktemp(suffix='.png')
                screenshot_path = self.bot.take_virtual_screenshot(temp_file)
                if screenshot_path:
                    await self.sio.emit('status', {'message': '仮想ディスプレイからキャプチャ取得'}, to=sid)
                    # ファイルを読み込んでBase64エンコード
                    with open(screenshot_path, 'rb') as f:
                        import base64
                        screenshot_data = base64.b64encode(f.read()).decode()
                        screenshot = f"data:image/png;base64,{screenshot_data}"
                    import os
                    os.remove(temp_file)  # 一時ファイル削除
                else:
                    screenshot = self.bot.capture_screenshot("manual_capture")
            else:
                screenshot = self.bot.capture_screenshot("manual_capture")

            await self.sio.emit('screenshot', {'image': screenshot}, to=sid)
            await self.sio.emit('status', {'message': '✅ キャプチャ完了'}, to=sid)
            
        except Exception as e:
            logger.error(f"キャプチャエラー: {e}")
            await self.sio.emit('error', {'message': f'エラー: {str(e)}'}, to=sid)
    
    def run(self, host: str = '0.0.0.0', port: int = 8888):
        """サーバー起動"""
        logger.info(f"WebSocketサーバー起動: http://{host}:{port}")
        web.run_app(self.app, host=host, port=port)


# メイン実行
if __name__ == "__main__":
    import argparse
    import os

    parser = argparse.ArgumentParser(description="Threads Automation WebSocket Server")
    parser.add_argument("--host", default=os.getenv("HOST", "0.0.0.0"), help="Host address")
    parser.add_argument("--port", type=int, default=int(os.getenv("PORT", "8888")), help="Port number")

    args = parser.parse_args()

    server = AutomationServer()
    server.run(host=args.host, port=args.port)