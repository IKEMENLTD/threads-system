const { Pool } = require('pg');
require('dotenv').config();

// データベース接続設定
const dbConfig = {
    // Supabase接続用
    connectionString: process.env.DATABASE_URL || process.env.SUPABASE_DB_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    
    // 接続プール設定
    max: 20,                    // 最大接続数
    idleTimeoutMillis: 30000,   // アイドルタイムアウト
    connectionTimeoutMillis: 2000, // 接続タイムアウト
};

// 開発環境用の設定
if (process.env.NODE_ENV !== 'production' && !dbConfig.connectionString) {
    dbConfig.host = process.env.DB_HOST || 'localhost';
    dbConfig.port = process.env.DB_PORT || 5432;
    dbConfig.database = process.env.DB_NAME || 'threads_system';
    dbConfig.user = process.env.DB_USER || 'postgres';
    dbConfig.password = process.env.DB_PASSWORD || 'postgres';
}

// 接続プール作成
const pool = new Pool(dbConfig);

// エラーハンドリング
pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
});

// データベース接続テスト
const testConnection = async () => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW()');
        console.log('✅ Database connected successfully at:', result.rows[0].now);
        client.release();
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    }
};

// ========================================
// ユーザー関連の操作
// ========================================

const users = {
    // ユーザー作成
    create: async (userData) => {
        const { email, username, passwordHash, fullName } = userData;
        const query = `
            INSERT INTO users (email, username, password_hash, full_name)
            VALUES ($1, $2, $3, $4)
            RETURNING id, email, username, full_name, role, created_at
        `;
        const values = [email, username, passwordHash, fullName];
        const result = await pool.query(query, values);
        return result.rows[0];
    },

    // メールでユーザー検索
    findByEmail: async (email) => {
        const query = 'SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL';
        const result = await pool.query(query, [email]);
        return result.rows[0];
    },

    // IDでユーザー検索
    findById: async (id) => {
        const query = 'SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL';
        const result = await pool.query(query, [id]);
        return result.rows[0];
    },

    // 最終ログイン更新
    updateLastLogin: async (userId) => {
        const query = 'UPDATE users SET last_login_at = NOW() WHERE id = $1';
        await pool.query(query, [userId]);
    },

    // Threadsトークン更新
    updateThreadsToken: async (userId, threadsUserId, accessToken) => {
        const query = `
            UPDATE users 
            SET threads_user_id = $2, threads_access_token = $3, updated_at = NOW()
            WHERE id = $1
        `;
        await pool.query(query, [userId, threadsUserId, accessToken]);
    }
};

// ========================================
// 投稿関連の操作
// ========================================

const posts = {
    // 全投稿取得
    findAll: async (userId = null, filters = {}) => {
        let query = `
            SELECT 
                p.*,
                u.username,
                u.email as user_email,
                array_agg(DISTINCT h.name) FILTER (WHERE h.name IS NOT NULL) as hashtags,
                COUNT(DISTINCT a.id) as analytics_count
            FROM posts p
            LEFT JOIN users u ON p.user_id = u.id
            LEFT JOIN post_hashtags ph ON p.id = ph.post_id
            LEFT JOIN hashtags h ON ph.hashtag_id = h.id
            LEFT JOIN analytics a ON p.id = a.post_id
            WHERE p.deleted_at IS NULL
        `;
        
        const values = [];
        let paramCount = 1;

        if (userId) {
            query += ` AND p.user_id = $${paramCount}`;
            values.push(userId);
            paramCount++;
        }

        if (filters.status) {
            query += ` AND p.status = $${paramCount}`;
            values.push(filters.status);
            paramCount++;
        }

        query += `
            GROUP BY p.id, u.username, u.email
            ORDER BY p.created_at DESC
        `;

        if (filters.limit) {
            query += ` LIMIT $${paramCount}`;
            values.push(filters.limit);
            paramCount++;
        }

        const result = await pool.query(query, values);
        return result.rows;
    },

    // 投稿作成
    create: async (postData) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 投稿作成
            const { userId, title, content, status, scheduledAt } = postData;
            const postQuery = `
                INSERT INTO posts (user_id, title, content, status, scheduled_at)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *
            `;
            const postValues = [userId, title, content, status || 'draft', scheduledAt];
            const postResult = await client.query(postQuery, postValues);
            const post = postResult.rows[0];

            // ハッシュタグ処理
            if (postData.hashtags && postData.hashtags.length > 0) {
                for (const tag of postData.hashtags) {
                    // ハッシュタグを作成または取得
                    const hashtagQuery = `
                        INSERT INTO hashtags (name)
                        VALUES ($1)
                        ON CONFLICT (name) 
                        DO UPDATE SET usage_count = hashtags.usage_count + 1
                        RETURNING id
                    `;
                    const hashtagResult = await client.query(hashtagQuery, [tag]);
                    const hashtagId = hashtagResult.rows[0].id;

                    // 関連付け
                    const relationQuery = `
                        INSERT INTO post_hashtags (post_id, hashtag_id)
                        VALUES ($1, $2)
                    `;
                    await client.query(relationQuery, [post.id, hashtagId]);
                }
            }

            await client.query('COMMIT');
            return post;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },

    // 投稿更新
    update: async (postId, updateData) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 投稿更新
            const { title, content, status, scheduledAt } = updateData;
            const updateQuery = `
                UPDATE posts 
                SET title = COALESCE($2, title),
                    content = COALESCE($3, content),
                    status = COALESCE($4, status),
                    scheduled_at = COALESCE($5, scheduled_at),
                    updated_at = NOW()
                WHERE id = $1 AND deleted_at IS NULL
                RETURNING *
            `;
            const updateValues = [postId, title, content, status, scheduledAt];
            const updateResult = await client.query(updateQuery, updateValues);
            
            if (updateResult.rows.length === 0) {
                throw new Error('Post not found');
            }

            const post = updateResult.rows[0];

            // ハッシュタグ更新
            if (updateData.hashtags !== undefined) {
                // 既存の関連を削除
                await client.query('DELETE FROM post_hashtags WHERE post_id = $1', [postId]);

                // 新しいハッシュタグを追加
                if (updateData.hashtags && updateData.hashtags.length > 0) {
                    for (const tag of updateData.hashtags) {
                        const hashtagQuery = `
                            INSERT INTO hashtags (name)
                            VALUES ($1)
                            ON CONFLICT (name) 
                            DO UPDATE SET usage_count = hashtags.usage_count + 1
                            RETURNING id
                        `;
                        const hashtagResult = await client.query(hashtagQuery, [tag]);
                        const hashtagId = hashtagResult.rows[0].id;

                        const relationQuery = `
                            INSERT INTO post_hashtags (post_id, hashtag_id)
                            VALUES ($1, $2)
                        `;
                        await client.query(relationQuery, [postId, hashtagId]);
                    }
                }
            }

            await client.query('COMMIT');
            return post;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },

    // 投稿削除（ソフトデリート）
    delete: async (postId) => {
        const query = `
            UPDATE posts 
            SET deleted_at = NOW()
            WHERE id = $1 AND deleted_at IS NULL
            RETURNING id
        `;
        const result = await pool.query(query, [postId]);
        return result.rows[0];
    },

    // 投稿複製
    duplicate: async (postId, userId) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 元の投稿を取得
            const originalQuery = `
                SELECT p.*, array_agg(h.name) as hashtags
                FROM posts p
                LEFT JOIN post_hashtags ph ON p.id = ph.post_id
                LEFT JOIN hashtags h ON ph.hashtag_id = h.id
                WHERE p.id = $1 AND p.deleted_at IS NULL
                GROUP BY p.id
            `;
            const originalResult = await client.query(originalQuery, [postId]);
            
            if (originalResult.rows.length === 0) {
                throw new Error('Post not found');
            }

            const original = originalResult.rows[0];

            // 複製を作成
            const duplicateQuery = `
                INSERT INTO posts (user_id, title, content, status)
                VALUES ($1, $2, $3, 'draft')
                RETURNING *
            `;
            const duplicateValues = [
                userId,
                original.title + ' (コピー)',
                original.content
            ];
            const duplicateResult = await client.query(duplicateQuery, duplicateValues);
            const duplicate = duplicateResult.rows[0];

            // ハッシュタグも複製
            if (original.hashtags && original.hashtags[0]) {
                for (const tag of original.hashtags) {
                    if (tag) {
                        const hashtagQuery = `
                            INSERT INTO hashtags (name)
                            VALUES ($1)
                            ON CONFLICT (name) DO UPDATE SET name = excluded.name
                            RETURNING id
                        `;
                        const hashtagResult = await client.query(hashtagQuery, [tag]);
                        const hashtagId = hashtagResult.rows[0].id;

                        const relationQuery = `
                            INSERT INTO post_hashtags (post_id, hashtag_id)
                            VALUES ($1, $2)
                        `;
                        await client.query(relationQuery, [duplicate.id, hashtagId]);
                    }
                }
            }

            await client.query('COMMIT');
            return duplicate;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },

    // IDで投稿取得
    findById: async (postId) => {
        const query = `
            SELECT 
                p.*,
                u.username,
                u.email as user_email,
                array_agg(DISTINCT h.name) FILTER (WHERE h.name IS NOT NULL) as hashtags
            FROM posts p
            LEFT JOIN users u ON p.user_id = u.id
            LEFT JOIN post_hashtags ph ON p.id = ph.post_id
            LEFT JOIN hashtags h ON ph.hashtag_id = h.id
            WHERE p.id = $1 AND p.deleted_at IS NULL
            GROUP BY p.id, u.username, u.email
        `;
        const result = await pool.query(query, [postId]);
        return result.rows[0];
    },

    // 予約投稿取得
    getScheduledPosts: async () => {
        const query = `
            SELECT * FROM posts 
            WHERE status = 'scheduled' 
                AND scheduled_at <= NOW() 
                AND deleted_at IS NULL
            ORDER BY scheduled_at ASC
        `;
        const result = await pool.query(query);
        return result.rows;
    },

    // 投稿ステータス更新
    updateStatus: async (postId, status, errorMessage = null) => {
        const query = `
            UPDATE posts 
            SET status = $2, 
                error_message = $3,
                published_at = CASE WHEN $2 = 'published' THEN NOW() ELSE published_at END,
                updated_at = NOW()
            WHERE id = $1
            RETURNING *
        `;
        const result = await pool.query(query, [postId, status, errorMessage]);
        return result.rows[0];
    }
};

// ========================================
// 分析データ関連の操作
// ========================================

const analytics = {
    // 分析データ記録
    record: async (postId, analyticsData) => {
        const {
            viewsCount, likesCount, commentsCount, sharesCount, savesCount,
            reachCount, impressionsCount, profileVisits,
            followersGained, followersLost
        } = analyticsData;

        // エンゲージメント率計算
        const totalEngagements = likesCount + commentsCount + sharesCount + savesCount;
        const engagementRate = reachCount > 0 ? (totalEngagements / reachCount * 100).toFixed(2) : 0;

        const query = `
            INSERT INTO analytics (
                post_id, views_count, likes_count, comments_count, shares_count, saves_count,
                reach_count, impressions_count, profile_visits,
                followers_gained, followers_lost, engagement_rate, recorded_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
            ON CONFLICT (post_id, recorded_at) 
            DO UPDATE SET 
                views_count = EXCLUDED.views_count,
                likes_count = EXCLUDED.likes_count,
                comments_count = EXCLUDED.comments_count,
                shares_count = EXCLUDED.shares_count,
                saves_count = EXCLUDED.saves_count,
                reach_count = EXCLUDED.reach_count,
                impressions_count = EXCLUDED.impressions_count,
                profile_visits = EXCLUDED.profile_visits,
                followers_gained = EXCLUDED.followers_gained,
                followers_lost = EXCLUDED.followers_lost,
                engagement_rate = EXCLUDED.engagement_rate
            RETURNING *
        `;
        
        const values = [
            postId, viewsCount || 0, likesCount || 0, commentsCount || 0, 
            sharesCount || 0, savesCount || 0, reachCount || 0, impressionsCount || 0,
            profileVisits || 0, followersGained || 0, followersLost || 0, engagementRate
        ];
        
        const result = await pool.query(query, values);
        return result.rows[0];
    },

    // 投稿の最新分析データ取得
    getLatest: async (postId) => {
        const query = `
            SELECT * FROM analytics 
            WHERE post_id = $1 
            ORDER BY recorded_at DESC 
            LIMIT 1
        `;
        const result = await pool.query(query, [postId]);
        return result.rows[0];
    },

    // 投稿の分析履歴取得
    getHistory: async (postId, limit = 30) => {
        const query = `
            SELECT * FROM analytics 
            WHERE post_id = $1 
            ORDER BY recorded_at DESC 
            LIMIT $2
        `;
        const result = await pool.query(query, [postId, limit]);
        return result.rows;
    }
};

// データベース初期化
const initializeDatabase = async () => {
    try {
        console.log('🔧 Initializing database...');
        
        // 接続テスト
        const connected = await testConnection();
        if (!connected) {
            console.error('❌ Failed to initialize database');
            return false;
        }

        // テーブル存在確認
        const tableCheckQuery = `
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
                AND table_type = 'BASE TABLE'
        `;
        const tablesResult = await pool.query(tableCheckQuery);
        const tables = tablesResult.rows.map(row => row.table_name);

        console.log('📊 Existing tables:', tables.join(', ') || 'None');

        // 必要なテーブルが存在しない場合は警告
        const requiredTables = ['users', 'posts', 'hashtags', 'post_hashtags'];
        const missingTables = requiredTables.filter(table => !tables.includes(table));
        
        if (missingTables.length > 0) {
            console.warn('⚠️  Missing tables:', missingTables.join(', '));
            console.warn('⚠️  Please run database/complete-schema.sql to create tables');
        }

        return true;
    } catch (error) {
        console.error('❌ Database initialization error:', error);
        return false;
    }
};

module.exports = {
    pool,
    testConnection,
    initializeDatabase,
    users,
    posts,
    analytics
};