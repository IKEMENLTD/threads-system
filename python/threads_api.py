"""
Threads API Wrapper
Threads公式APIとの連携を管理するモジュール
"""

import requests
import json
import logging
from typing import Optional, Dict, List, Any
from datetime import datetime, timedelta
import os
from urllib.parse import urlencode

# ロギング設定
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ThreadsAPI:
    """Threads API クライアント"""
    
    def __init__(self, access_token: str):
        """
        Args:
            access_token: Threads APIアクセストークン
        """
        self.access_token = access_token
        self.base_url = "https://graph.threads.net/v1.0"
        self.session = requests.Session()
        self.session.headers.update({
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        })
    
    def create_media_container(self, 
                             content: str, 
                             media_type: str = "TEXT",
                             image_url: Optional[str] = None,
                             video_url: Optional[str] = None,
                             is_carousel: bool = False) -> Dict[str, Any]:
        """
        メディアコンテナを作成
        
        Args:
            content: 投稿テキスト内容
            media_type: メディアタイプ (TEXT, IMAGE, VIDEO, CAROUSEL)
            image_url: 画像URL
            video_url: 動画URL
            is_carousel: カルーセル投稿かどうか
            
        Returns:
            作成されたメディアコンテナ情報
        """
        endpoint = f"{self.base_url}/me/threads"
        
        params = {
            "media_type": media_type,
            "text": content,
            "access_token": self.access_token
        }
        
        if media_type == "IMAGE" and image_url:
            params["image_url"] = image_url
        elif media_type == "VIDEO" and video_url:
            params["video_url"] = video_url
        elif media_type == "CAROUSEL":
            params["is_carousel_item"] = is_carousel
            
        try:
            response = self.session.post(endpoint, params=params)
            response.raise_for_status()
            data = response.json()
            logger.info(f"メディアコンテナ作成成功: {data.get('id')}")
            return data
        except requests.exceptions.RequestException as e:
            logger.error(f"メディアコンテナ作成エラー: {e}")
            raise
    
    def publish_media(self, container_id: str) -> Dict[str, Any]:
        """
        メディアコンテナを公開
        
        Args:
            container_id: 公開するコンテナID
            
        Returns:
            公開結果
        """
        endpoint = f"{self.base_url}/me/threads_publish"
        
        params = {
            "creation_id": container_id,
            "access_token": self.access_token
        }
        
        try:
            response = self.session.post(endpoint, params=params)
            response.raise_for_status()
            data = response.json()
            logger.info(f"投稿公開成功: {data.get('id')}")
            return data
        except requests.exceptions.RequestException as e:
            logger.error(f"投稿公開エラー: {e}")
            raise
    
    def get_media_status(self, media_id: str) -> Dict[str, Any]:
        """
        メディアのステータスを取得
        
        Args:
            media_id: メディアID
            
        Returns:
            メディアステータス情報
        """
        endpoint = f"{self.base_url}/{media_id}"
        
        params = {
            "fields": "id,media_type,media_url,permalink,owner,username,text,timestamp,shortcode,is_quote_post",
            "access_token": self.access_token
        }
        
        try:
            response = self.session.get(endpoint, params=params)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"メディアステータス取得エラー: {e}")
            raise
    
    def get_insights(self, thread_id: str, metrics: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        投稿の分析データを取得
        
        Args:
            thread_id: ThreadsのメディアID
            metrics: 取得するメトリクス（デフォルト: 全て）
            
        Returns:
            分析データ
        """
        if metrics is None:
            metrics = ["views", "likes", "replies", "reposts", "quotes", "shares", "reach", "impressions"]
        
        endpoint = f"{self.base_url}/{thread_id}/insights"
        
        params = {
            "metric": ",".join(metrics),
            "access_token": self.access_token
        }
        
        try:
            response = self.session.get(endpoint, params=params)
            response.raise_for_status()
            data = response.json()
            
            # データを整形
            insights = {}
            for item in data.get("data", []):
                metric_name = item.get("name")
                values = item.get("values", [{}])[0]
                insights[metric_name] = values.get("value", 0)
            
            logger.info(f"インサイト取得成功: {thread_id}")
            return insights
        except requests.exceptions.RequestException as e:
            logger.error(f"インサイト取得エラー: {e}")
            raise
    
    def get_user_threads(self, user_id: Optional[str] = None, limit: int = 25) -> List[Dict[str, Any]]:
        """
        ユーザーの投稿一覧を取得
        
        Args:
            user_id: ユーザーID（省略時は自分）
            limit: 取得件数
            
        Returns:
            投稿リスト
        """
        user_id = user_id or "me"
        endpoint = f"{self.base_url}/{user_id}/threads"
        
        params = {
            "fields": "id,media_type,media_url,permalink,text,timestamp",
            "limit": limit,
            "access_token": self.access_token
        }
        
        try:
            response = self.session.get(endpoint, params=params)
            response.raise_for_status()
            data = response.json()
            return data.get("data", [])
        except requests.exceptions.RequestException as e:
            logger.error(f"投稿一覧取得エラー: {e}")
            raise
    
    def get_user_profile(self, user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        ユーザープロフィール情報を取得
        
        Args:
            user_id: ユーザーID（省略時は自分）
            
        Returns:
            プロフィール情報
        """
        user_id = user_id or "me"
        endpoint = f"{self.base_url}/{user_id}"
        
        params = {
            "fields": "id,username,name,threads_profile_picture_url,threads_biography",
            "access_token": self.access_token
        }
        
        try:
            response = self.session.get(endpoint, params=params)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"プロフィール取得エラー: {e}")
            raise
    
    def reply_to_thread(self, thread_id: str, content: str) -> Dict[str, Any]:
        """
        スレッドに返信
        
        Args:
            thread_id: 返信先のスレッドID
            content: 返信内容
            
        Returns:
            返信結果
        """
        # まずコンテナを作成
        endpoint = f"{self.base_url}/me/threads"
        
        params = {
            "media_type": "TEXT",
            "text": content,
            "reply_to_id": thread_id,
            "access_token": self.access_token
        }
        
        try:
            response = self.session.post(endpoint, params=params)
            response.raise_for_status()
            container = response.json()
            
            # コンテナを公開
            return self.publish_media(container["id"])
        except requests.exceptions.RequestException as e:
            logger.error(f"返信エラー: {e}")
            raise
    
    def delete_thread(self, thread_id: str) -> bool:
        """
        スレッドを削除
        
        Args:
            thread_id: 削除するスレッドID
            
        Returns:
            削除成功の可否
        """
        endpoint = f"{self.base_url}/{thread_id}"
        
        params = {
            "access_token": self.access_token
        }
        
        try:
            response = self.session.delete(endpoint, params=params)
            response.raise_for_status()
            logger.info(f"スレッド削除成功: {thread_id}")
            return True
        except requests.exceptions.RequestException as e:
            logger.error(f"削除エラー: {e}")
            return False


class ThreadsAuth:
    """Threads OAuth認証処理"""
    
    def __init__(self, client_id: str, client_secret: str, redirect_uri: str):
        """
        Args:
            client_id: アプリケーションID
            client_secret: アプリケーションシークレット
            redirect_uri: リダイレクトURI
        """
        self.client_id = client_id
        self.client_secret = client_secret
        self.redirect_uri = redirect_uri
        self.auth_base_url = "https://threads.net/oauth/authorize"
        self.token_url = "https://graph.threads.net/oauth/access_token"
    
    def get_authorization_url(self, state: str, scope: str = "threads_basic,threads_publish,threads_manage_insights") -> str:
        """
        認証URLを生成
        
        Args:
            state: CSRF防止用のランダム文字列
            scope: 要求する権限スコープ
            
        Returns:
            認証URL
        """
        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "scope": scope,
            "response_type": "code",
            "state": state
        }
        return f"{self.auth_base_url}?{urlencode(params)}"
    
    def exchange_code_for_token(self, code: str) -> Dict[str, Any]:
        """
        認証コードをアクセストークンに交換
        
        Args:
            code: 認証コード
            
        Returns:
            トークン情報
        """
        params = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "grant_type": "authorization_code",
            "redirect_uri": self.redirect_uri,
            "code": code
        }
        
        try:
            response = requests.post(self.token_url, data=params)
            response.raise_for_status()
            data = response.json()
            logger.info("アクセストークン取得成功")
            return data
        except requests.exceptions.RequestException as e:
            logger.error(f"トークン交換エラー: {e}")
            raise
    
    def refresh_access_token(self, refresh_token: str) -> Dict[str, Any]:
        """
        アクセストークンを更新
        
        Args:
            refresh_token: リフレッシュトークン
            
        Returns:
            新しいトークン情報
        """
        params = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "grant_type": "refresh_token",
            "refresh_token": refresh_token
        }
        
        try:
            response = requests.post(self.token_url, data=params)
            response.raise_for_status()
            data = response.json()
            logger.info("トークン更新成功")
            return data
        except requests.exceptions.RequestException as e:
            logger.error(f"トークン更新エラー: {e}")
            raise


# 使用例
if __name__ == "__main__":
    # 環境変数から設定を読み込み
    from dotenv import load_dotenv
    load_dotenv()
    
    access_token = os.getenv("THREADS_ACCESS_TOKEN")
    
    if access_token:
        # API初期化
        api = ThreadsAPI(access_token)
        
        # プロフィール取得
        profile = api.get_user_profile()
        print(f"ユーザー名: {profile.get('username')}")
        
        # テスト投稿
        # container = api.create_media_container("Pythonからのテスト投稿です！")
        # result = api.publish_media(container["id"])
        # print(f"投稿完了: {result.get('id')}")
    else:
        print("アクセストークンが設定されていません")