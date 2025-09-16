-- ========================================
-- Threads自動投稿システム - 追加機能用SQL
-- ========================================
-- このファイルは complete-schema.sql の後に実行してください

-- ========================================
-- 1. Threads API連携テーブル
-- ========================================

-- Threads認証トークン管理
CREATE TABLE IF NOT EXISTS threads_auth (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_type VARCHAR(50) DEFAULT 'Bearer',
    expires_at TIMESTAMP WITH TIME ZONE,
    scope TEXT,
    threads_user_id VARCHAR(100),
    instagram_business_account VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- 投稿キュー（失敗時のリトライ用）
CREATE TABLE IF NOT EXISTS post_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    priority INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    next_retry_at TIMESTAMP WITH TIME ZONE,
    error_log JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE
);

-- API呼び出しログ
CREATE TABLE IF NOT EXISTS api_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    request_body JSONB,
    response_body JSONB,
    status_code INTEGER,
    duration_ms INTEGER,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_threads_auth_user_id ON threads_auth(user_id);
CREATE INDEX IF NOT EXISTS idx_threads_auth_expires_at ON threads_auth(expires_at);
CREATE INDEX IF NOT EXISTS idx_post_queue_status ON post_queue(status);
CREATE INDEX IF NOT EXISTS idx_post_queue_next_retry ON post_queue(next_retry_at);
CREATE INDEX IF NOT EXISTS idx_api_logs_created_at ON api_logs(created_at);

-- ========================================
-- 2. スケジューラー関連
-- ========================================

-- スケジューラージョブ管理
CREATE TABLE IF NOT EXISTS scheduler_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_name VARCHAR(100) UNIQUE NOT NULL,
    job_type VARCHAR(50) NOT NULL,
    cron_expression VARCHAR(100),
    next_run_at TIMESTAMP WITH TIME ZONE,
    last_run_at TIMESTAMP WITH TIME ZONE,
    last_status VARCHAR(20),
    last_error TEXT,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 最適投稿時間分析
CREATE TABLE IF NOT EXISTS optimal_posting_times (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
    hour INTEGER CHECK (hour BETWEEN 0 AND 23),
    average_engagement_rate DECIMAL(5,2),
    sample_size INTEGER,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, day_of_week, hour)
);

-- ビュー：次の予約投稿
CREATE OR REPLACE VIEW upcoming_scheduled_posts AS
SELECT 
    p.*,
    u.username,
    u.email,
    t.access_token IS NOT NULL as has_threads_auth
FROM posts p
JOIN users u ON p.user_id = u.id
LEFT JOIN threads_auth t ON p.user_id = t.user_id
WHERE p.status = 'scheduled'
  AND p.scheduled_at > NOW()
  AND p.deleted_at IS NULL
ORDER BY p.scheduled_at ASC;

-- ========================================
-- 3. メディア処理
-- ========================================

-- メディア処理キュー
CREATE TABLE IF NOT EXISTS media_processing_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    operation VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    input_path TEXT NOT NULL,
    output_path TEXT,
    options JSONB DEFAULT '{}',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- CDN配信URL管理
CREATE TABLE IF NOT EXISTS media_cdn_urls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    cdn_provider VARCHAR(50) NOT NULL,
    url TEXT NOT NULL,
    region VARCHAR(20),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- 4. 高度な分析機能
-- ========================================

-- エンゲージメント予測モデル
CREATE TABLE IF NOT EXISTS engagement_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    predicted_likes INTEGER,
    predicted_comments INTEGER,
    predicted_shares INTEGER,
    predicted_engagement_rate DECIMAL(5,2),
    confidence_score DECIMAL(3,2),
    model_version VARCHAR(20),
    features_used JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- A/Bテスト結果
CREATE TABLE IF NOT EXISTS ab_test_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_name VARCHAR(100) NOT NULL,
    variant_a_post_id UUID REFERENCES posts(id),
    variant_b_post_id UUID REFERENCES posts(id),
    metric_name VARCHAR(50),
    variant_a_value DECIMAL(10,2),
    variant_b_value DECIMAL(10,2),
    statistical_significance DECIMAL(3,2),
    winner VARCHAR(1),
    test_duration_hours INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ハッシュタグパフォーマンス
CREATE TABLE IF NOT EXISTS hashtag_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hashtag_id UUID NOT NULL REFERENCES hashtags(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_posts INTEGER DEFAULT 0,
    avg_likes DECIMAL(10,2),
    avg_comments DECIMAL(10,2),
    avg_engagement_rate DECIMAL(5,2),
    trending_score DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(hashtag_id, period_start, period_end)
);

-- 集計ビュー：週次パフォーマンス
CREATE OR REPLACE VIEW weekly_performance AS
SELECT 
    u.username,
    DATE_TRUNC('week', p.published_at) as week,
    COUNT(p.id) as total_posts,
    AVG(a.likes_count) as avg_likes,
    AVG(a.comments_count) as avg_comments,
    AVG(a.engagement_rate) as avg_engagement_rate,
    SUM(a.reach_count) as total_reach
FROM posts p
JOIN users u ON p.user_id = u.id
LEFT JOIN analytics a ON p.id = a.post_id
WHERE p.status = 'published'
  AND p.published_at IS NOT NULL
GROUP BY u.username, DATE_TRUNC('week', p.published_at)
ORDER BY week DESC, u.username;

-- ========================================
-- 5. 通知システム
-- ========================================

-- 通知設定
CREATE TABLE IF NOT EXISTS notification_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    channel VARCHAR(20) NOT NULL CHECK (channel IN ('email', 'slack', 'webhook', 'push')),
    event_type VARCHAR(50) NOT NULL,
    is_enabled BOOLEAN DEFAULT true,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, channel, event_type)
);

-- 通知履歴
CREATE TABLE IF NOT EXISTS notification_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    channel VARCHAR(20) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    title VARCHAR(200),
    message TEXT,
    metadata JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'sent',
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- 6. レポート機能
-- ========================================

-- 月次レポート
CREATE TABLE IF NOT EXISTS monthly_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    report_month DATE NOT NULL,
    total_posts INTEGER DEFAULT 0,
    total_likes INTEGER DEFAULT 0,
    total_comments INTEGER DEFAULT 0,
    total_shares INTEGER DEFAULT 0,
    total_reach INTEGER DEFAULT 0,
    avg_engagement_rate DECIMAL(5,2),
    top_performing_post_id UUID REFERENCES posts(id),
    worst_performing_post_id UUID REFERENCES posts(id),
    follower_growth INTEGER,
    report_data JSONB DEFAULT '{}',
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, report_month)
);

-- ========================================
-- 7. ユーザー行動追跡
-- ========================================

-- ユーザーアクティビティログ
CREATE TABLE IF NOT EXISTS user_activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_created_at ON user_activity_logs(created_at);

-- ========================================
-- 8. コンテンツテンプレート
-- ========================================

-- 投稿テンプレート
CREATE TABLE IF NOT EXISTS post_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    content_template TEXT NOT NULL,
    hashtags_template TEXT[],
    category VARCHAR(50),
    variables JSONB DEFAULT '{}',
    usage_count INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- 9. 管理者機能
-- ========================================

-- システムメトリクス
CREATE TABLE IF NOT EXISTS system_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(20,2),
    metric_unit VARCHAR(20),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- ========================================
-- トリガー更新
-- ========================================

-- threads_auth の updated_at 自動更新
CREATE TRIGGER update_threads_auth_updated_at BEFORE UPDATE ON threads_auth
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- scheduler_jobs の updated_at 自動更新
CREATE TRIGGER update_scheduler_jobs_updated_at BEFORE UPDATE ON scheduler_jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- post_templates の updated_at 自動更新
CREATE TRIGGER update_post_templates_updated_at BEFORE UPDATE ON post_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 便利なクエリ関数
-- ========================================

-- 今日の投稿統計を取得
CREATE OR REPLACE FUNCTION get_today_stats(p_user_id UUID)
RETURNS TABLE(
    total_posts BIGINT,
    scheduled_posts BIGINT,
    published_posts BIGINT,
    failed_posts BIGINT,
    total_engagement INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) as total_posts,
        COUNT(*) FILTER (WHERE status = 'scheduled') as scheduled_posts,
        COUNT(*) FILTER (WHERE status = 'published') as published_posts,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_posts,
        COALESCE(SUM(
            (SELECT likes_count + comments_count 
             FROM analytics 
             WHERE analytics.post_id = posts.id 
             ORDER BY recorded_at DESC LIMIT 1)
        ), 0)::INTEGER as total_engagement
    FROM posts
    WHERE user_id = p_user_id
      AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- データ整合性チェック
-- ========================================

-- 孤立したレコードを検出
CREATE OR REPLACE VIEW orphaned_records AS
SELECT 'post_hashtags' as table_name, COUNT(*) as count
FROM post_hashtags ph
WHERE NOT EXISTS (SELECT 1 FROM posts WHERE id = ph.post_id)
   OR NOT EXISTS (SELECT 1 FROM hashtags WHERE id = ph.hashtag_id)
UNION ALL
SELECT 'post_media', COUNT(*)
FROM post_media pm
WHERE NOT EXISTS (SELECT 1 FROM posts WHERE id = pm.post_id)
   OR NOT EXISTS (SELECT 1 FROM media WHERE id = pm.media_id)
UNION ALL
SELECT 'analytics', COUNT(*)
FROM analytics a
WHERE NOT EXISTS (SELECT 1 FROM posts WHERE id = a.post_id);

-- ========================================
-- 実行確認用クエリ
-- ========================================

-- 追加したテーブルの確認
SELECT table_name, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM information_schema.tables t
JOIN pg_stat_user_tables p ON t.table_name = p.tablename
WHERE table_schema = 'public' 
  AND table_name IN (
    'threads_auth', 'post_queue', 'api_logs',
    'scheduler_jobs', 'optimal_posting_times',
    'media_processing_queue', 'media_cdn_urls',
    'engagement_predictions', 'ab_test_results',
    'hashtag_performance', 'notification_settings',
    'notification_history', 'monthly_reports',
    'user_activity_logs', 'post_templates',
    'system_metrics'
  )
ORDER BY table_name;