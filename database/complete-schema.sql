-- ========================================
-- Threads自動投稿システム - 完全データベーススキーマ
-- ========================================

-- 1. データベース作成（必要に応じて）
-- CREATE DATABASE threads_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE threads_system;

-- PostgreSQL用の拡張機能
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- テーブル削除（再作成用）
-- ========================================
DROP TABLE IF EXISTS post_hashtags CASCADE;
DROP TABLE IF EXISTS post_media CASCADE;
DROP TABLE IF EXISTS hashtags CASCADE;
DROP TABLE IF EXISTS media CASCADE;
DROP TABLE IF EXISTS analytics CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS user_tokens CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ========================================
-- 1. ユーザーテーブル
-- ========================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(200),
    avatar_url TEXT,
    threads_user_id VARCHAR(100),
    threads_access_token TEXT,
    instagram_user_id VARCHAR(100),
    instagram_access_token TEXT,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'user', 'guest')),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    last_login_at TIMESTAMP WITH TIME ZONE,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- インデックス
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_threads_user_id ON users(threads_user_id);
CREATE INDEX idx_users_created_at ON users(created_at);

-- ========================================
-- 2. ユーザートークンテーブル（リフレッシュトークン管理）
-- ========================================
CREATE TABLE user_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_type VARCHAR(50) NOT NULL CHECK (token_type IN ('refresh', 'reset_password', 'email_verification')),
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_tokens_user_id ON user_tokens(user_id);
CREATE INDEX idx_user_tokens_token_hash ON user_tokens(token_hash);
CREATE INDEX idx_user_tokens_expires_at ON user_tokens(expires_at);

-- ========================================
-- 3. 投稿テーブル
-- ========================================
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'publishing', 'published', 'failed', 'deleted')),
    
    -- スケジュール関連
    scheduled_at TIMESTAMP WITH TIME ZONE,
    published_at TIMESTAMP WITH TIME ZONE,
    
    -- Threads投稿情報
    threads_post_id VARCHAR(100),
    threads_media_ids TEXT[], -- 複数メディアID配列
    threads_permalink TEXT,
    
    -- エラー情報
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    last_retry_at TIMESTAMP WITH TIME ZONE,
    
    -- メタデータ
    metadata JSONB DEFAULT '{}',
    
    -- タイムスタンプ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- インデックス
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_scheduled_at ON posts(scheduled_at);
CREATE INDEX idx_posts_published_at ON posts(published_at);
CREATE INDEX idx_posts_created_at ON posts(created_at);
CREATE INDEX idx_posts_threads_post_id ON posts(threads_post_id);

-- ========================================
-- 4. ハッシュタグテーブル
-- ========================================
CREATE TABLE hashtags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_hashtags_name ON hashtags(name);
CREATE INDEX idx_hashtags_usage_count ON hashtags(usage_count);

-- ========================================
-- 5. 投稿-ハッシュタグ関連テーブル
-- ========================================
CREATE TABLE post_hashtags (
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    hashtag_id UUID REFERENCES hashtags(id) ON DELETE CASCADE,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (post_id, hashtag_id)
);

CREATE INDEX idx_post_hashtags_post_id ON post_hashtags(post_id);
CREATE INDEX idx_post_hashtags_hashtag_id ON post_hashtags(hashtag_id);

-- ========================================
-- 6. メディアテーブル
-- ========================================
CREATE TABLE media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    storage_path TEXT NOT NULL,
    public_url TEXT,
    thumbnail_url TEXT,
    width INTEGER,
    height INTEGER,
    duration INTEGER, -- 動画の場合の秒数
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_media_user_id ON media(user_id);
CREATE INDEX idx_media_created_at ON media(created_at);

-- ========================================
-- 7. 投稿-メディア関連テーブル
-- ========================================
CREATE TABLE post_media (
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    media_id UUID REFERENCES media(id) ON DELETE CASCADE,
    position INTEGER DEFAULT 0,
    caption TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (post_id, media_id)
);

CREATE INDEX idx_post_media_post_id ON post_media(post_id);
CREATE INDEX idx_post_media_media_id ON post_media(media_id);

-- ========================================
-- 8. 分析データテーブル
-- ========================================
CREATE TABLE analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    
    -- エンゲージメント指標
    views_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    saves_count INTEGER DEFAULT 0,
    
    -- リーチ指標
    reach_count INTEGER DEFAULT 0,
    impressions_count INTEGER DEFAULT 0,
    profile_visits INTEGER DEFAULT 0,
    
    -- フォロワー変動
    followers_gained INTEGER DEFAULT 0,
    followers_lost INTEGER DEFAULT 0,
    
    -- エンゲージメント率
    engagement_rate DECIMAL(5,2),
    
    -- 記録日時
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(post_id, recorded_at)
);

CREATE INDEX idx_analytics_post_id ON analytics(post_id);
CREATE INDEX idx_analytics_recorded_at ON analytics(recorded_at);
CREATE INDEX idx_analytics_engagement_rate ON analytics(engagement_rate);

-- ========================================
-- トリガー関数
-- ========================================

-- updated_atを自動更新するトリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 各テーブルにトリガーを適用
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hashtags_updated_at BEFORE UPDATE ON hashtags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- ビュー定義
-- ========================================

-- 投稿詳細ビュー
CREATE OR REPLACE VIEW post_details AS
SELECT 
    p.*,
    u.username,
    u.email as user_email,
    u.full_name as user_full_name,
    COUNT(DISTINCT ph.hashtag_id) as hashtag_count,
    COUNT(DISTINCT pm.media_id) as media_count,
    COALESCE(MAX(a.likes_count), 0) as latest_likes,
    COALESCE(MAX(a.comments_count), 0) as latest_comments,
    COALESCE(MAX(a.engagement_rate), 0) as latest_engagement_rate
FROM posts p
LEFT JOIN users u ON p.user_id = u.id
LEFT JOIN post_hashtags ph ON p.id = ph.post_id
LEFT JOIN post_media pm ON p.id = pm.post_id
LEFT JOIN analytics a ON p.id = a.post_id
WHERE p.deleted_at IS NULL
GROUP BY p.id, u.username, u.email, u.full_name;

-- ========================================
-- 初期データ挿入
-- ========================================

-- デフォルト管理者ユーザー
INSERT INTO users (
    email, 
    username, 
    password_hash, 
    full_name, 
    role,
    email_verified
) VALUES (
    'admin@threads-system.com',
    'admin',
    '$2b$10$K7L1OJ0TfUMqE5WqXZPXOuZJL1BQqB0GxqGqXqGqXqGqXqGqXqGqX', -- password: admin123
    'System Administrator',
    'admin',
    true
);

-- サンプルハッシュタグ
INSERT INTO hashtags (name) VALUES
    ('threads'),
    ('socialmedia'),
    ('automation'),
    ('marketing'),
    ('business'),
    ('technology'),
    ('日本'),
    ('ビジネス'),
    ('マーケティング'),
    ('自動化');

-- ========================================
-- 権限設定（PostgreSQL用）
-- ========================================
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO threads_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO threads_user;
-- GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO threads_user;