-- ========================================
-- 全テーブルのカラム詳細を表示するSQL
-- ========================================

-- PostgreSQL用: 全テーブルのカラム情報を表示
SELECT 
    t.table_name AS "テーブル名",
    c.ordinal_position AS "カラム番号",
    c.column_name AS "カラム名",
    c.data_type AS "データ型",
    CASE 
        WHEN c.character_maximum_length IS NOT NULL 
        THEN c.data_type || '(' || c.character_maximum_length || ')'
        WHEN c.numeric_precision IS NOT NULL 
        THEN c.data_type || '(' || c.numeric_precision || ',' || COALESCE(c.numeric_scale, 0) || ')'
        ELSE c.data_type
    END AS "型詳細",
    c.is_nullable AS "NULL許可",
    c.column_default AS "デフォルト値",
    CASE 
        WHEN pk.constraint_name IS NOT NULL THEN 'PK'
        WHEN fk.constraint_name IS NOT NULL THEN 'FK → ' || fk.foreign_table_name || '.' || fk.foreign_column_name
        WHEN u.constraint_name IS NOT NULL THEN 'UNIQUE'
        ELSE ''
    END AS "制約"
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
LEFT JOIN (
    SELECT 
        tc.table_name,
        kcu.column_name,
        tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'PRIMARY KEY'
) pk ON c.table_name = pk.table_name AND c.column_name = pk.column_name
LEFT JOIN (
    SELECT 
        tc.table_name,
        kcu.column_name,
        tc.constraint_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu
        ON tc.constraint_name = ccu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
) fk ON c.table_name = fk.table_name AND c.column_name = fk.column_name
LEFT JOIN (
    SELECT 
        tc.table_name,
        kcu.column_name,
        tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'UNIQUE'
) u ON c.table_name = u.table_name AND c.column_name = u.column_name
WHERE t.table_schema = 'public' 
    AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name, c.ordinal_position;

-- ========================================
-- テーブルごとの統計情報
-- ========================================
SELECT 
    '--- テーブル統計情報 ---' AS info;

SELECT 
    schemaname AS "スキーマ",
    tablename AS "テーブル名",
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS "サイズ",
    n_live_tup AS "行数（概算）",
    n_dead_tup AS "削除済み行数",
    last_vacuum AS "最終VACUUM",
    last_autovacuum AS "最終自動VACUUM"
FROM pg_stat_user_tables
ORDER BY tablename;

-- ========================================
-- 各テーブルの詳細情報を個別に表示
-- ========================================

-- 1. usersテーブルの詳細
SELECT '--- users テーブル詳細 ---' AS info;
SELECT 
    column_name AS "カラム名",
    data_type AS "型",
    character_maximum_length AS "最大長",
    is_nullable AS "NULL許可",
    column_default AS "デフォルト"
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- 2. postsテーブルの詳細
SELECT '--- posts テーブル詳細 ---' AS info;
SELECT 
    column_name AS "カラム名",
    data_type AS "型",
    character_maximum_length AS "最大長",
    is_nullable AS "NULL許可",
    column_default AS "デフォルト"
FROM information_schema.columns 
WHERE table_name = 'posts'
ORDER BY ordinal_position;

-- 3. hashtagsテーブルの詳細
SELECT '--- hashtags テーブル詳細 ---' AS info;
SELECT 
    column_name AS "カラム名",
    data_type AS "型",
    character_maximum_length AS "最大長",
    is_nullable AS "NULL許可",
    column_default AS "デフォルト"
FROM information_schema.columns 
WHERE table_name = 'hashtags'
ORDER BY ordinal_position;

-- 4. post_hashtagsテーブルの詳細
SELECT '--- post_hashtags テーブル詳細 ---' AS info;
SELECT 
    column_name AS "カラム名",
    data_type AS "型",
    character_maximum_length AS "最大長",
    is_nullable AS "NULL許可",
    column_default AS "デフォルト"
FROM information_schema.columns 
WHERE table_name = 'post_hashtags'
ORDER BY ordinal_position;

-- 5. mediaテーブルの詳細
SELECT '--- media テーブル詳細 ---' AS info;
SELECT 
    column_name AS "カラム名",
    data_type AS "型",
    character_maximum_length AS "最大長",
    is_nullable AS "NULL許可",
    column_default AS "デフォルト"
FROM information_schema.columns 
WHERE table_name = 'media'
ORDER BY ordinal_position;

-- 6. analyticsテーブルの詳細
SELECT '--- analytics テーブル詳細 ---' AS info;
SELECT 
    column_name AS "カラム名",
    data_type AS "型",
    character_maximum_length AS "最大長",
    is_nullable AS "NULL許可",
    column_default AS "デフォルト"
FROM information_schema.columns 
WHERE table_name = 'analytics'
ORDER BY ordinal_position;

-- ========================================
-- 外部キー制約の詳細
-- ========================================
SELECT '--- 外部キー制約 ---' AS info;
SELECT
    tc.table_name AS "テーブル",
    kcu.column_name AS "カラム",
    ccu.table_name AS "参照先テーブル",
    ccu.column_name AS "参照先カラム",
    rc.delete_rule AS "削除時動作",
    rc.update_rule AS "更新時動作"
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
    ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name, kcu.column_name;

-- ========================================
-- インデックス情報
-- ========================================
SELECT '--- インデックス一覧 ---' AS info;
SELECT
    schemaname AS "スキーマ",
    tablename AS "テーブル",
    indexname AS "インデックス名",
    indexdef AS "定義"
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ========================================
-- 現在のデータ件数
-- ========================================
SELECT '--- 各テーブルのレコード数 ---' AS info;
SELECT 'users' AS table_name, COUNT(*) AS record_count FROM users
UNION ALL
SELECT 'posts', COUNT(*) FROM posts
UNION ALL
SELECT 'hashtags', COUNT(*) FROM hashtags
UNION ALL
SELECT 'post_hashtags', COUNT(*) FROM post_hashtags
UNION ALL
SELECT 'media', COUNT(*) FROM media
UNION ALL
SELECT 'analytics', COUNT(*) FROM analytics
UNION ALL
SELECT 'user_tokens', COUNT(*) FROM user_tokens
UNION ALL
SELECT 'post_media', COUNT(*) FROM post_media
ORDER BY table_name;