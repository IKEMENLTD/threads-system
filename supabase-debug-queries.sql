-- ====================================
-- Supabase デバッグ用クエリ集
-- データベース構造とデータを確認するための便利なSQL
-- ====================================

-- ====================================
-- 1. テーブル構造を確認
-- ====================================

-- 全テーブルのリスト表示
SELECT 
    schemaname as スキーマ,
    tablename as テーブル名,
    tableowner as オーナー
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 特定テーブルのカラム詳細表示
SELECT 
    column_name as カラム名,
    data_type as データ型,
    character_maximum_length as 最大長,
    column_default as デフォルト値,
    is_nullable as NULL許可,
    ordinal_position as 順序
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'users'  -- ← テーブル名を変更して使用
ORDER BY ordinal_position;

-- 全テーブルの全カラムを一覧表示（最も便利）
SELECT 
    t.table_name as テーブル,
    c.column_name as カラム,
    c.data_type as 型,
    CASE 
        WHEN c.character_maximum_length IS NOT NULL 
        THEN c.data_type || '(' || c.character_maximum_length || ')'
        ELSE c.data_type 
    END as 型詳細,
    c.is_nullable as NULL可,
    c.column_default as デフォルト
FROM information_schema.tables t
JOIN information_schema.columns c 
    ON t.table_name = c.table_name 
    AND t.table_schema = c.table_schema
WHERE t.table_schema = 'public' 
    AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name, c.ordinal_position;

-- ====================================
-- 2. インデックス確認
-- ====================================

-- 全インデックスを表示
SELECT 
    schemaname as スキーマ,
    tablename as テーブル,
    indexname as インデックス名,
    indexdef as 定義
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ====================================
-- 3. 外部キー制約の確認
-- ====================================

SELECT
    tc.table_name as テーブル,
    kcu.column_name as カラム,
    ccu.table_name as 参照先テーブル,
    ccu.column_name as 参照先カラム,
    tc.constraint_name as 制約名
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- ====================================
-- 4. データ件数の確認
-- ====================================

-- 各テーブルのレコード数を取得
SELECT 
    schemaname,
    tablename,
    n_live_tup as レコード数,
    n_dead_tup as 削除済み,
    last_vacuum as 最終VACUUM,
    last_autovacuum as 最終自動VACUUM
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;

-- ====================================
-- 5. 実際のデータ確認
-- ====================================

-- usersテーブルの全データ
SELECT * FROM users LIMIT 10;

-- postsテーブルの全データ（最新順）
SELECT 
    p.id,
    p.content,
    p.status,
    p.scheduled_at,
    p.published_at,
    u.username,
    p.created_at
FROM posts p
LEFT JOIN users u ON p.user_id = u.id
ORDER BY p.created_at DESC
LIMIT 20;

-- hashtagsの使用頻度順
SELECT 
    name as ハッシュタグ,
    usage_count as 使用回数
FROM hashtags
ORDER BY usage_count DESC
LIMIT 20;

-- テンプレート一覧
SELECT 
    t.name as テンプレート名,
    t.content as 内容,
    u.username as 作成者,
    t.created_at as 作成日
FROM templates t
LEFT JOIN users u ON t.user_id = u.id
ORDER BY t.created_at DESC;

-- ====================================
-- 6. 統計情報
-- ====================================

-- 投稿ステータス別の集計
SELECT 
    status,
    COUNT(*) as 件数,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as 割合
FROM posts
GROUP BY status
ORDER BY 件数 DESC;

-- ユーザー別投稿数
SELECT 
    u.username,
    COUNT(p.id) as 投稿数,
    COUNT(CASE WHEN p.status = 'published' THEN 1 END) as 公開済み,
    COUNT(CASE WHEN p.status = 'scheduled' THEN 1 END) as 予約中,
    COUNT(CASE WHEN p.status = 'draft' THEN 1 END) as 下書き
FROM users u
LEFT JOIN posts p ON u.id = p.user_id
GROUP BY u.id, u.username
ORDER BY 投稿数 DESC;

-- 日別投稿数（過去30日）
SELECT 
    DATE(created_at) as 日付,
    COUNT(*) as 投稿数
FROM posts
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY 日付 DESC;

-- ====================================
-- 7. RLSポリシー確認
-- ====================================

SELECT 
    schemaname,
    tablename,
    policyname as ポリシー名,
    permissive as 許可型,
    roles as 対象ロール,
    cmd as コマンド,
    qual as 条件
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ====================================
-- 8. トリガー確認
-- ====================================

SELECT 
    trigger_schema as スキーマ,
    event_object_table as テーブル,
    trigger_name as トリガー名,
    event_manipulation as イベント,
    action_timing as タイミング,
    action_statement as アクション
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- ====================================
-- 9. ビュー確認
-- ====================================

SELECT 
    table_name as ビュー名,
    view_definition as 定義
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

-- ====================================
-- 10. ストレージ使用量
-- ====================================

-- テーブルごとのディスク使用量
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as 合計サイズ,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as テーブルサイズ,
    pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) as インデックスサイズ
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- データベース全体のサイズ
SELECT 
    pg_database.datname as データベース名,
    pg_size_pretty(pg_database_size(pg_database.datname)) as サイズ
FROM pg_database
WHERE datname = current_database();