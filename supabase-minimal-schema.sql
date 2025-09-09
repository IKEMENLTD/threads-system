-- ====================================
-- Threads System 最小限データベース設計
-- 実用的でシンプルなスキーマ
-- ====================================

-- 拡張機能
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================================
-- 1. ユーザーテーブル（必須）
-- ====================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- ====================================
-- 2. 投稿テーブル（必須）
-- ====================================
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- 投稿内容
    content TEXT NOT NULL,
    image_urls TEXT[], -- 画像URLの配列（最大4枚）
    
    -- ステータス（シンプルに）
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'failed')),
    
    -- スケジュール
    scheduled_at TIMESTAMP,
    published_at TIMESTAMP,
    
    -- エラー情報
    error_message TEXT,
    
    -- タイムスタンプ
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_scheduled_at ON posts(scheduled_at) WHERE status = 'scheduled';

-- ====================================
-- 3. ハッシュタグテーブル（シンプル版）
-- ====================================
CREATE TABLE hashtags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_hashtags_name ON hashtags(name);
CREATE INDEX idx_hashtags_usage ON hashtags(usage_count DESC);

-- ====================================
-- 4. 投稿-ハッシュタグ関連（必須）
-- ====================================
CREATE TABLE post_hashtags (
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    hashtag_id UUID REFERENCES hashtags(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, hashtag_id)
);

-- ====================================
-- 5. テンプレート（シンプル版）
-- ====================================
CREATE TABLE templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    hashtags TEXT, -- カンマ区切りのシンプルな文字列
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_templates_user_id ON templates(user_id);

-- ====================================
-- 6. 投稿履歴（分析用・オプション）
-- ====================================
CREATE TABLE post_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID UNIQUE REFERENCES posts(id) ON DELETE CASCADE,
    
    -- 基本的な統計のみ
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    
    -- 最終更新
    fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_post_stats_post_id ON post_stats(post_id);

-- ====================================
-- トリガー（自動更新）
-- ====================================

-- updated_at自動更新
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ====================================
-- ハッシュタグ使用回数の自動更新
-- ====================================
CREATE OR REPLACE FUNCTION update_hashtag_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE hashtags SET usage_count = usage_count + 1 
        WHERE id = NEW.hashtag_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE hashtags SET usage_count = usage_count - 1 
        WHERE id = OLD.hashtag_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_hashtag_usage
AFTER INSERT OR DELETE ON post_hashtags
FOR EACH ROW EXECUTE FUNCTION update_hashtag_count();

-- ====================================
-- Row Level Security (RLS)
-- ====================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のデータのみアクセス可能
CREATE POLICY users_own_data ON users
    FOR ALL USING (auth.uid() = id);

CREATE POLICY posts_own_data ON posts
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY templates_own_data ON templates
    FOR ALL USING (auth.uid() = user_id);

-- ====================================
-- ビュー（便利な集計）
-- ====================================

-- 投稿一覧ビュー（ハッシュタグ付き）
CREATE VIEW post_with_hashtags AS
SELECT 
    p.*,
    u.username,
    u.display_name,
    STRING_AGG(h.name, ', ' ORDER BY h.name) as hashtags
FROM posts p
LEFT JOIN users u ON p.user_id = u.id
LEFT JOIN post_hashtags ph ON p.id = ph.post_id
LEFT JOIN hashtags h ON ph.hashtag_id = h.id
GROUP BY p.id, u.id;

-- 月次投稿サマリー
CREATE VIEW monthly_post_summary AS
SELECT 
    user_id,
    DATE_TRUNC('month', created_at) as month,
    COUNT(*) as total_posts,
    COUNT(*) FILTER (WHERE status = 'published') as published_posts,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_posts
FROM posts
GROUP BY user_id, DATE_TRUNC('month', created_at);

-- ====================================
-- 初期データ（最小限）
-- ====================================

-- よく使うハッシュタグ
INSERT INTO hashtags (name) VALUES
    ('threads'),
    ('threadsapp'),
    ('初投稿'),
    ('フォロバ100'),
    ('相互フォロー')
ON CONFLICT (name) DO NOTHING;

-- ====================================
-- 便利な関数
-- ====================================

-- 投稿をスケジュールする関数
CREATE OR REPLACE FUNCTION schedule_post(
    p_user_id UUID,
    p_content TEXT,
    p_scheduled_at TIMESTAMP,
    p_hashtags TEXT[]
) RETURNS UUID AS $$
DECLARE
    v_post_id UUID;
    v_hashtag_id UUID;
    v_hashtag TEXT;
BEGIN
    -- 投稿を作成
    INSERT INTO posts (user_id, content, status, scheduled_at)
    VALUES (p_user_id, p_content, 'scheduled', p_scheduled_at)
    RETURNING id INTO v_post_id;
    
    -- ハッシュタグを処理
    IF p_hashtags IS NOT NULL THEN
        FOREACH v_hashtag IN ARRAY p_hashtags
        LOOP
            -- ハッシュタグを取得または作成
            INSERT INTO hashtags (name)
            VALUES (v_hashtag)
            ON CONFLICT (name) DO NOTHING
            RETURNING id INTO v_hashtag_id;
            
            IF v_hashtag_id IS NULL THEN
                SELECT id INTO v_hashtag_id FROM hashtags WHERE name = v_hashtag;
            END IF;
            
            -- 関連を作成
            INSERT INTO post_hashtags (post_id, hashtag_id)
            VALUES (v_post_id, v_hashtag_id);
        END LOOP;
    END IF;
    
    RETURN v_post_id;
END;
$$ LANGUAGE plpgsql;

-- ====================================
-- 完了
-- ====================================
DO $$
BEGIN
    RAISE NOTICE '✅ 最小限のデータベーススキーマ作成完了';
    RAISE NOTICE 'テーブル数: 6（必要最小限）';
    RAISE NOTICE '複雑な機能は省略し、実用性を重視';
END $$;