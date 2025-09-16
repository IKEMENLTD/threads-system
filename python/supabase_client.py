"""
Supabase Client for Python
Threads自動化システムのデータベース操作
"""

import os
import json
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()
logger = logging.getLogger(__name__)


class SupabaseClient:
    """Supabaseクライアントクラス"""

    def __init__(self):
        """初期化"""
        self.supabase_url = os.getenv('SUPABASE_URL')
        self.supabase_key = os.getenv('SUPABASE_SERVICE_KEY') or os.getenv('SUPABASE_ANON_KEY')

        if not self.supabase_url or not self.supabase_key:
            raise ValueError("Supabase credentials not found in environment variables")

        self.client: Client = create_client(self.supabase_url, self.supabase_key)
        logger.info("Supabase client initialized")

    # ========================================
    # ユーザー操作
    # ========================================

    def create_user(self, email: str, username: str, password_hash: str, display_name: Optional[str] = None) -> Dict[str, Any]:
        """ユーザー作成"""
        try:
            data = self.client.table('users').insert({
                'email': email,
                'username': username,
                'password_hash': password_hash,
                'display_name': display_name or username,
                'role': 'user'
            }).execute()

            logger.info(f"User created: {username}")
            return data.data[0] if data.data else None
        except Exception as e:
            logger.error(f"Error creating user: {e}")
            raise

    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """メールでユーザー取得"""
        try:
            data = self.client.table('users').select('*').eq('email', email).single().execute()
            return data.data
        except Exception as e:
            if 'PGRST116' in str(e):  # No rows returned
                return None
            logger.error(f"Error getting user by email: {e}")
            raise

    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """IDでユーザー取得"""
        try:
            data = self.client.table('users').select('*').eq('id', user_id).single().execute()
            return data.data
        except Exception as e:
            if 'PGRST116' in str(e):  # No rows returned
                return None
            logger.error(f"Error getting user by id: {e}")
            raise

    def update_user(self, user_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
        """ユーザー情報更新"""
        try:
            update_data['updated_at'] = datetime.now().isoformat()
            data = self.client.table('users').update(update_data).eq('id', user_id).execute()

            logger.info(f"User updated: {user_id}")
            return data.data[0] if data.data else None
        except Exception as e:
            logger.error(f"Error updating user: {e}")
            raise

    # ========================================
    # 投稿操作
    # ========================================

    def create_post(self, user_id: str, content: str, title: Optional[str] = None,
                   image_urls: Optional[List[str]] = None, hashtags: Optional[List[str]] = None,
                   status: str = 'draft', scheduled_at: Optional[str] = None) -> Dict[str, Any]:
        """投稿作成"""
        try:
            # 投稿を作成
            post_data = {
                'user_id': user_id,
                'content': content,
                'title': title or '',
                'image_urls': image_urls or [],
                'status': status,
                'scheduled_at': scheduled_at
            }

            post_response = self.client.table('posts').insert(post_data).execute()
            post = post_response.data[0] if post_response.data else None

            if not post:
                raise Exception("Failed to create post")

            # ハッシュタグ処理
            if hashtags:
                for tag in hashtags:
                    # ハッシュタグを取得または作成
                    hashtag = self._get_or_create_hashtag(tag)

                    # 関連付けを作成
                    self.client.table('post_hashtags').insert({
                        'post_id': post['id'],
                        'hashtag_id': hashtag['id']
                    }).execute()

            logger.info(f"Post created: {post['id']}")
            return post

        except Exception as e:
            logger.error(f"Error creating post: {e}")
            raise

    def _get_or_create_hashtag(self, tag_name: str) -> Dict[str, Any]:
        """ハッシュタグ取得または作成"""
        try:
            # 既存のハッシュタグを検索
            response = self.client.table('hashtags').select('*').eq('name', tag_name).execute()

            if response.data:
                hashtag = response.data[0]
                # 使用回数を増やす
                self.client.table('hashtags').update({
                    'usage_count': hashtag['usage_count'] + 1
                }).eq('id', hashtag['id']).execute()
                return hashtag
            else:
                # 新規作成
                new_hashtag = self.client.table('hashtags').insert({
                    'name': tag_name,
                    'usage_count': 1
                }).execute()
                return new_hashtag.data[0]

        except Exception as e:
            logger.error(f"Error with hashtag {tag_name}: {e}")
            raise

    def get_posts(self, user_id: Optional[str] = None, status: Optional[str] = None,
                 limit: int = 50) -> List[Dict[str, Any]]:
        """投稿一覧取得"""
        try:
            query = self.client.table('post_with_hashtags').select('*')

            if user_id:
                query = query.eq('user_id', user_id)
            if status:
                query = query.eq('status', status)

            query = query.order('created_at', desc=True).limit(limit)

            response = query.execute()
            return response.data or []

        except Exception as e:
            logger.error(f"Error getting posts: {e}")
            raise

    def get_post_by_id(self, post_id: str) -> Optional[Dict[str, Any]]:
        """IDで投稿取得"""
        try:
            data = self.client.table('post_with_hashtags').select('*').eq('id', post_id).single().execute()
            return data.data
        except Exception as e:
            if 'PGRST116' in str(e):  # No rows returned
                return None
            logger.error(f"Error getting post: {e}")
            raise

    def update_post(self, post_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
        """投稿更新"""
        try:
            update_data['updated_at'] = datetime.now().isoformat()

            # ハッシュタグを別途処理
            hashtags = update_data.pop('hashtags', None)

            # 投稿を更新
            response = self.client.table('posts').update(update_data).eq('id', post_id).execute()
            post = response.data[0] if response.data else None

            # ハッシュタグ更新
            if hashtags is not None:
                # 既存の関連を削除
                self.client.table('post_hashtags').delete().eq('post_id', post_id).execute()

                # 新しいハッシュタグを追加
                if hashtags:
                    for tag in hashtags:
                        hashtag = self._get_or_create_hashtag(tag)
                        self.client.table('post_hashtags').insert({
                            'post_id': post_id,
                            'hashtag_id': hashtag['id']
                        }).execute()

            logger.info(f"Post updated: {post_id}")
            return post

        except Exception as e:
            logger.error(f"Error updating post: {e}")
            raise

    def delete_post(self, post_id: str) -> bool:
        """投稿削除"""
        try:
            # 関連を削除
            self.client.table('post_hashtags').delete().eq('post_id', post_id).execute()

            # 投稿を削除
            self.client.table('posts').delete().eq('id', post_id).execute()

            logger.info(f"Post deleted: {post_id}")
            return True

        except Exception as e:
            logger.error(f"Error deleting post: {e}")
            raise

    def get_scheduled_posts(self) -> List[Dict[str, Any]]:
        """予約投稿取得"""
        try:
            now = datetime.now().isoformat()
            response = self.client.table('posts').select('*') \
                .eq('status', 'scheduled') \
                .lte('scheduled_at', now) \
                .order('scheduled_at').execute()

            return response.data or []

        except Exception as e:
            logger.error(f"Error getting scheduled posts: {e}")
            raise

    def update_post_status(self, post_id: str, status: str, error_message: Optional[str] = None) -> Dict[str, Any]:
        """投稿ステータス更新"""
        try:
            update_data = {
                'status': status,
                'error_message': error_message,
                'updated_at': datetime.now().isoformat()
            }

            if status == 'published':
                update_data['published_at'] = datetime.now().isoformat()

            response = self.client.table('posts').update(update_data).eq('id', post_id).execute()

            logger.info(f"Post status updated: {post_id} -> {status}")
            return response.data[0] if response.data else None

        except Exception as e:
            logger.error(f"Error updating post status: {e}")
            raise

    # ========================================
    # 統計操作
    # ========================================

    def record_post_stats(self, post_id: str, view_count: int = 0,
                         like_count: int = 0, reply_count: int = 0) -> Dict[str, Any]:
        """投稿統計記録"""
        try:
            stats_data = {
                'post_id': post_id,
                'view_count': view_count,
                'like_count': like_count,
                'reply_count': reply_count,
                'fetched_at': datetime.now().isoformat()
            }

            response = self.client.table('post_stats').insert(stats_data).execute()

            logger.info(f"Stats recorded for post: {post_id}")
            return response.data[0] if response.data else None

        except Exception as e:
            logger.error(f"Error recording stats: {e}")
            raise

    def get_latest_stats(self, post_id: str) -> Optional[Dict[str, Any]]:
        """最新統計取得"""
        try:
            response = self.client.table('post_stats').select('*') \
                .eq('post_id', post_id) \
                .order('fetched_at', desc=True) \
                .limit(1).execute()

            return response.data[0] if response.data else None

        except Exception as e:
            logger.error(f"Error getting latest stats: {e}")
            raise

    # ========================================
    # テンプレート操作
    # ========================================

    def create_template(self, user_id: str, name: str, content: str,
                       hashtags: Optional[List[str]] = None, is_active: bool = True) -> Dict[str, Any]:
        """テンプレート作成"""
        try:
            template_data = {
                'user_id': user_id,
                'name': name,
                'content': content,
                'hashtags': ', '.join(hashtags) if hashtags else '',
                'is_active': is_active
            }

            response = self.client.table('templates').insert(template_data).execute()

            logger.info(f"Template created: {name}")
            return response.data[0] if response.data else None

        except Exception as e:
            logger.error(f"Error creating template: {e}")
            raise

    def get_templates(self, user_id: str) -> List[Dict[str, Any]]:
        """テンプレート一覧取得"""
        try:
            response = self.client.table('templates').select('*') \
                .eq('user_id', user_id) \
                .order('created_at', desc=True).execute()

            return response.data or []

        except Exception as e:
            logger.error(f"Error getting templates: {e}")
            raise

    def delete_template(self, template_id: str) -> bool:
        """テンプレート削除"""
        try:
            self.client.table('templates').delete().eq('id', template_id).execute()

            logger.info(f"Template deleted: {template_id}")
            return True

        except Exception as e:
            logger.error(f"Error deleting template: {e}")
            raise

    # ========================================
    # ユーティリティ
    # ========================================

    def test_connection(self) -> bool:
        """接続テスト"""
        try:
            response = self.client.table('users').select('count').limit(1).execute()
            logger.info("✅ Supabase connection successful")
            return True
        except Exception as e:
            logger.error(f"❌ Supabase connection failed: {e}")
            return False


# メイン実行
if __name__ == "__main__":
    # テスト実行
    client = SupabaseClient()

    if client.test_connection():
        print("Supabase connection successful!")

        # テスト: 投稿一覧取得
        posts = client.get_posts(limit=5)
        print(f"Found {len(posts)} posts")

        for post in posts:
            print(f"- {post.get('title', 'No title')}: {post.get('status', 'unknown')}")