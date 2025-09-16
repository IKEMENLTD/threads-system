"""
投稿スケジューラー
予約投稿の自動実行を管理するモジュール
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import psycopg2
from psycopg2.extras import RealDictCursor
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.triggers.cron import CronTrigger
import os
from dotenv import load_dotenv

from threads_api import ThreadsAPI

# 環境変数読み込み
load_dotenv()

# ロギング設定
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class PostScheduler:
    """投稿スケジューラークラス"""
    
    def __init__(self, db_url: str = None):
        """
        Args:
            db_url: データベース接続URL
        """
        self.db_url = db_url or os.getenv("DATABASE_URL")
        self.scheduler = AsyncIOScheduler()
        self.threads_apis = {}  # ユーザーID別のAPI インスタンス
        
    def get_db_connection(self):
        """データベース接続を取得"""
        return psycopg2.connect(self.db_url, cursor_factory=RealDictCursor)
    
    async def initialize(self):
        """スケジューラーを初期化"""
        logger.info("スケジューラー初期化開始")
        
        # 定期ジョブを設定
        self.scheduler.add_job(
            self.check_scheduled_posts,
            IntervalTrigger(minutes=1),
            id="check_scheduled_posts",
            name="予約投稿チェック",
            replace_existing=True
        )
        
        self.scheduler.add_job(
            self.retry_failed_posts,
            IntervalTrigger(minutes=5),
            id="retry_failed_posts",
            name="失敗投稿リトライ",
            replace_existing=True
        )
        
        self.scheduler.add_job(
            self.update_analytics,
            IntervalTrigger(hours=1),
            id="update_analytics",
            name="分析データ更新",
            replace_existing=True
        )
        
        # スケジューラー開始
        self.scheduler.start()
        logger.info("スケジューラー初期化完了")
    
    async def check_scheduled_posts(self):
        """予約投稿をチェックして実行"""
        logger.info("予約投稿チェック開始")
        
        conn = None
        try:
            conn = self.get_db_connection()
            cur = conn.cursor()
            
            # 実行時刻が来た投稿を取得
            cur.execute("""
                SELECT 
                    p.id,
                    p.user_id,
                    p.title,
                    p.content,
                    p.scheduled_at,
                    t.access_token,
                    t.threads_user_id,
                    array_agg(h.name) as hashtags
                FROM posts p
                LEFT JOIN threads_auth t ON p.user_id = t.user_id
                LEFT JOIN post_hashtags ph ON p.id = ph.post_id
                LEFT JOIN hashtags h ON ph.hashtag_id = h.id
                WHERE p.status = 'scheduled' 
                  AND p.scheduled_at <= NOW()
                  AND p.deleted_at IS NULL
                  AND t.access_token IS NOT NULL
                GROUP BY p.id, p.user_id, p.title, p.content, p.scheduled_at, 
                         t.access_token, t.threads_user_id
                ORDER BY p.scheduled_at ASC
                LIMIT 10
            """)
            
            posts = cur.fetchall()
            logger.info(f"実行待ち投稿数: {len(posts)}")
            
            # 各投稿を処理
            for post in posts:
                await self.publish_post(post, conn)
                
        except Exception as e:
            logger.error(f"予約投稿チェックエラー: {e}")
        finally:
            if conn:
                conn.close()
    
    async def publish_post(self, post_data: Dict[str, Any], conn: Any):
        """投稿を公開"""
        post_id = post_data['id']
        user_id = post_data['user_id']
        
        logger.info(f"投稿開始: {post_id} - {post_data['title']}")
        
        try:
            # Threads APIクライアントを取得または作成
            if user_id not in self.threads_apis:
                self.threads_apis[user_id] = ThreadsAPI(post_data['access_token'])
            
            api = self.threads_apis[user_id]
            
            # コンテンツを準備
            content = post_data['content']
            
            # ハッシュタグを追加
            if post_data['hashtags'] and post_data['hashtags'][0]:
                hashtags = ' '.join([f"#{tag}" for tag in post_data['hashtags'] if tag])
                content = f"{content}\n\n{hashtags}"
            
            # メディアコンテナ作成
            container = api.create_media_container(content=content)
            
            # 投稿を公開
            result = api.publish_media(container['id'])
            
            # ステータスを更新
            self.update_post_status(
                conn,
                post_id,
                'published',
                threads_post_id=result.get('id'),
                published_at=datetime.now()
            )
            
            logger.info(f"投稿成功: {post_id} -> Threads ID: {result.get('id')}")
            
            # 投稿キューから削除
            self.remove_from_queue(conn, post_id)
            
        except Exception as e:
            error_message = str(e)
            logger.error(f"投稿失敗: {post_id} - {error_message}")
            
            # エラー情報を記録
            self.update_post_status(
                conn,
                post_id,
                'failed',
                error_message=error_message
            )
            
            # リトライキューに追加
            self.add_to_retry_queue(conn, post_id, error_message)
    
    def update_post_status(self, conn: Any, post_id: str, status: str, 
                          threads_post_id: str = None, 
                          published_at: datetime = None,
                          error_message: str = None):
        """投稿ステータスを更新"""
        cur = conn.cursor()
        
        update_fields = ["status = %s", "updated_at = NOW()"]
        params = [status]
        
        if threads_post_id:
            update_fields.append("threads_post_id = %s")
            params.append(threads_post_id)
        
        if published_at:
            update_fields.append("published_at = %s")
            params.append(published_at)
        
        if error_message:
            update_fields.append("error_message = %s")
            params.append(error_message)
        
        params.append(post_id)
        
        query = f"""
            UPDATE posts 
            SET {', '.join(update_fields)}
            WHERE id = %s
        """
        
        cur.execute(query, params)
        conn.commit()
    
    def add_to_retry_queue(self, conn: Any, post_id: str, error_message: str):
        """リトライキューに追加"""
        cur = conn.cursor()
        
        # 既存のキューエントリを確認
        cur.execute("""
            SELECT id, attempts, error_log 
            FROM post_queue 
            WHERE post_id = %s AND status != 'completed'
        """, (post_id,))
        
        existing = cur.fetchone()
        
        if existing:
            # 既存エントリを更新
            error_log = existing['error_log'] or []
            error_log.append({
                'timestamp': datetime.now().isoformat(),
                'error': error_message
            })
            
            cur.execute("""
                UPDATE post_queue 
                SET attempts = attempts + 1,
                    status = 'pending',
                    next_retry_at = %s,
                    error_log = %s
                WHERE id = %s
            """, (
                datetime.now() + timedelta(minutes=5 * (existing['attempts'] + 1)),
                json.dumps(error_log),
                existing['id']
            ))
        else:
            # 新規エントリ作成
            cur.execute("""
                INSERT INTO post_queue (post_id, status, attempts, next_retry_at, error_log)
                VALUES (%s, 'pending', 1, %s, %s)
            """, (
                post_id,
                datetime.now() + timedelta(minutes=5),
                json.dumps([{
                    'timestamp': datetime.now().isoformat(),
                    'error': error_message
                }])
            ))
        
        conn.commit()
    
    def remove_from_queue(self, conn: Any, post_id: str):
        """キューから削除"""
        cur = conn.cursor()
        cur.execute("""
            UPDATE post_queue 
            SET status = 'completed', processed_at = NOW()
            WHERE post_id = %s
        """, (post_id,))
        conn.commit()
    
    async def retry_failed_posts(self):
        """失敗した投稿をリトライ"""
        logger.info("失敗投稿リトライ開始")
        
        conn = None
        try:
            conn = self.get_db_connection()
            cur = conn.cursor()
            
            # リトライ対象を取得
            cur.execute("""
                SELECT 
                    q.id as queue_id,
                    q.attempts,
                    p.id,
                    p.user_id,
                    p.title,
                    p.content,
                    t.access_token,
                    t.threads_user_id,
                    array_agg(h.name) as hashtags
                FROM post_queue q
                JOIN posts p ON q.post_id = p.id
                LEFT JOIN threads_auth t ON p.user_id = t.user_id
                LEFT JOIN post_hashtags ph ON p.id = ph.post_id
                LEFT JOIN hashtags h ON ph.hashtag_id = h.id
                WHERE q.status = 'pending'
                  AND q.next_retry_at <= NOW()
                  AND q.attempts < q.max_attempts
                  AND p.deleted_at IS NULL
                  AND t.access_token IS NOT NULL
                GROUP BY q.id, q.attempts, p.id, p.user_id, p.title, p.content,
                         t.access_token, t.threads_user_id
                LIMIT 5
            """)
            
            posts = cur.fetchall()
            logger.info(f"リトライ対象投稿数: {len(posts)}")
            
            for post in posts:
                logger.info(f"リトライ実行: {post['id']} (試行回数: {post['attempts']})")
                await self.publish_post(post, conn)
                
        except Exception as e:
            logger.error(f"リトライ処理エラー: {e}")
        finally:
            if conn:
                conn.close()
    
    async def update_analytics(self):
        """投稿の分析データを更新"""
        logger.info("分析データ更新開始")
        
        conn = None
        try:
            conn = self.get_db_connection()
            cur = conn.cursor()
            
            # 更新対象の投稿を取得
            cur.execute("""
                SELECT 
                    p.id,
                    p.user_id,
                    p.threads_post_id,
                    t.access_token
                FROM posts p
                JOIN threads_auth t ON p.user_id = t.user_id
                WHERE p.status = 'published'
                  AND p.threads_post_id IS NOT NULL
                  AND p.published_at > NOW() - INTERVAL '7 days'
                  AND t.access_token IS NOT NULL
                ORDER BY p.published_at DESC
                LIMIT 50
            """)
            
            posts = cur.fetchall()
            logger.info(f"分析更新対象投稿数: {len(posts)}")
            
            for post in posts:
                try:
                    # APIクライアント取得
                    user_id = post['user_id']
                    if user_id not in self.threads_apis:
                        self.threads_apis[user_id] = ThreadsAPI(post['access_token'])
                    
                    api = self.threads_apis[user_id]
                    
                    # インサイト取得
                    insights = api.get_insights(post['threads_post_id'])
                    
                    # データベースに保存
                    cur.execute("""
                        INSERT INTO analytics (
                            post_id, views_count, likes_count, comments_count,
                            shares_count, reach_count, impressions_count,
                            engagement_rate, recorded_at
                        ) VALUES (
                            %s, %s, %s, %s, %s, %s, %s, %s, NOW()
                        )
                        ON CONFLICT (post_id, recorded_at) DO UPDATE SET
                            views_count = EXCLUDED.views_count,
                            likes_count = EXCLUDED.likes_count,
                            comments_count = EXCLUDED.comments_count,
                            shares_count = EXCLUDED.shares_count,
                            reach_count = EXCLUDED.reach_count,
                            impressions_count = EXCLUDED.impressions_count,
                            engagement_rate = EXCLUDED.engagement_rate
                    """, (
                        post['id'],
                        insights.get('views', 0),
                        insights.get('likes', 0),
                        insights.get('replies', 0),
                        insights.get('shares', 0),
                        insights.get('reach', 0),
                        insights.get('impressions', 0),
                        self.calculate_engagement_rate(insights)
                    ))
                    
                except Exception as e:
                    logger.error(f"分析データ更新エラー (Post: {post['id']}): {e}")
                    continue
            
            conn.commit()
            logger.info("分析データ更新完了")
            
        except Exception as e:
            logger.error(f"分析更新処理エラー: {e}")
        finally:
            if conn:
                conn.close()
    
    def calculate_engagement_rate(self, insights: Dict[str, int]) -> float:
        """エンゲージメント率を計算"""
        total_engagements = (
            insights.get('likes', 0) +
            insights.get('replies', 0) +
            insights.get('shares', 0) +
            insights.get('reposts', 0)
        )
        reach = insights.get('reach', 0)
        
        if reach > 0:
            return round((total_engagements / reach) * 100, 2)
        return 0.0
    
    async def shutdown(self):
        """スケジューラーをシャットダウン"""
        logger.info("スケジューラーシャットダウン開始")
        self.scheduler.shutdown(wait=True)
        logger.info("スケジューラーシャットダウン完了")


# メイン実行
async def main():
    """メインエントリーポイント"""
    scheduler = PostScheduler()
    
    try:
        await scheduler.initialize()
        logger.info("スケジューラー起動完了。終了するにはCtrl+Cを押してください。")
        
        # 永続実行
        while True:
            await asyncio.sleep(60)
            
    except KeyboardInterrupt:
        logger.info("終了シグナル受信")
    finally:
        await scheduler.shutdown()


if __name__ == "__main__":
    import json
    asyncio.run(main())