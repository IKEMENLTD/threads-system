console.log('[POSTS] Loading posts routes module...');
const express = require('express');
console.log('[POSTS] Express loaded');
const jwt = require('jsonwebtoken');
console.log('[POSTS] JWT loaded');
const router = express.Router();
console.log('[POSTS] Router created');

// Supabase関数をインポート
let supabase;
try {
    console.log('[POSTS] Attempting to load supabase-setup...');
    const supabaseSetup = require('../supabase-setup');
    supabase = supabaseSetup.supabase;
} catch (error) {
    console.error('Supabase setup error:', error.message);
}

// JWT秘密鍵
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';

// JWT認証ミドルウェア
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'アクセストークンが必要です'
        });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({
                success: false,
                error: 'トークンが無効です'
            });
        }
        req.user = user;
        next();
    });
};

// 投稿一覧取得
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { status, limit = 50, offset = 0 } = req.query;
        
        let query = supabase
            .from('posts')
            .select(`
                id, title, content, hashtags, status, scheduled_at, 
                created_at, updated_at,
                post_metrics (likes, shares, comments)
            `)
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        const { data: posts, error } = await query;

        if (error) {
            console.error('投稿取得エラー:', error);
            return res.status(500).json({
                success: false,
                error: '投稿の取得に失敗しました'
            });
        }

        // データ形式をフロントエンドに合わせる
        const formattedPosts = posts.map(post => ({
            id: post.id,
            title: post.title,
            content: post.content,
            hashtags: post.hashtags || [],
            status: post.status,
            scheduledAt: post.scheduled_at,
            createdAt: new Date(post.created_at).getTime(),
            updatedAt: post.updated_at ? new Date(post.updated_at).getTime() : null,
            metrics: post.post_metrics[0] || { likes: 0, shares: 0, comments: 0 }
        }));

        res.json({
            success: true,
            posts: formattedPosts,
            total: formattedPosts.length
        });

    } catch (error) {
        console.error('投稿一覧取得エラー:', error);
        res.status(500).json({
            success: false,
            error: 'サーバーエラーが発生しました'
        });
    }
});

// 特定投稿取得
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const { data: post, error } = await supabase
            .from('posts')
            .select(`
                id, title, content, hashtags, status, scheduled_at, 
                created_at, updated_at,
                post_metrics (likes, shares, comments)
            `)
            .eq('id', id)
            .eq('user_id', req.user.id)
            .single();

        if (error || !post) {
            return res.status(404).json({
                success: false,
                error: '投稿が見つかりません'
            });
        }

        // データ形式をフロントエンドに合わせる
        const formattedPost = {
            id: post.id,
            title: post.title,
            content: post.content,
            hashtags: post.hashtags || [],
            status: post.status,
            scheduledAt: post.scheduled_at,
            createdAt: new Date(post.created_at).getTime(),
            updatedAt: post.updated_at ? new Date(post.updated_at).getTime() : null,
            metrics: post.post_metrics[0] || { likes: 0, shares: 0, comments: 0 }
        };

        res.json({
            success: true,
            post: formattedPost
        });

    } catch (error) {
        console.error('投稿取得エラー:', error);
        res.status(500).json({
            success: false,
            error: 'サーバーエラーが発生しました'
        });
    }
});

// 新規投稿作成
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { title, content, hashtags = [], status = 'draft', scheduledAt } = req.body;

        // 入力検証
        if (!title || !content) {
            return res.status(400).json({
                success: false,
                error: 'タイトルと内容は必須です'
            });
        }

        if (title.length > 200) {
            return res.status(400).json({
                success: false,
                error: 'タイトルは200文字以内で入力してください'
            });
        }

        if (content.length > 10000) {
            return res.status(400).json({
                success: false,
                error: '内容は10000文字以内で入力してください'
            });
        }

        const postData = {
            user_id: req.user.id,
            title: title.trim(),
            content: content.trim(),
            hashtags: Array.isArray(hashtags) ? hashtags : [],
            status: status,
            scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null
        };

        const { data: post, error } = await supabase
            .from('posts')
            .insert([postData])
            .select()
            .single();

        if (error) {
            console.error('投稿作成エラー:', error);
            return res.status(500).json({
                success: false,
                error: '投稿の作成に失敗しました'
            });
        }

        // メトリクス初期化
        await supabase
            .from('post_metrics')
            .insert([{
                post_id: post.id,
                likes: 0,
                shares: 0,
                comments: 0
            }]);

        // フォーマット済みレスポンス
        const formattedPost = {
            id: post.id,
            title: post.title,
            content: post.content,
            hashtags: post.hashtags || [],
            status: post.status,
            scheduledAt: post.scheduled_at,
            createdAt: new Date(post.created_at).getTime(),
            updatedAt: null,
            metrics: { likes: 0, shares: 0, comments: 0 }
        };

        res.status(201).json({
            success: true,
            post: formattedPost,
            message: '投稿を作成しました'
        });

    } catch (error) {
        console.error('投稿作成エラー:', error);
        res.status(500).json({
            success: false,
            error: 'サーバーエラーが発生しました'
        });
    }
});

// 投稿更新
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, hashtags, status, scheduledAt } = req.body;

        // 投稿の所有権確認
        const { data: existingPost, error: fetchError } = await supabase
            .from('posts')
            .select('id, user_id')
            .eq('id', id)
            .eq('user_id', req.user.id)
            .single();

        if (fetchError || !existingPost) {
            return res.status(404).json({
                success: false,
                error: '投稿が見つからないか、編集権限がありません'
            });
        }

        // 更新データ準備
        const updateData = {
            updated_at: new Date().toISOString()
        };

        if (title !== undefined) updateData.title = title.trim();
        if (content !== undefined) updateData.content = content.trim();
        if (hashtags !== undefined) updateData.hashtags = hashtags;
        if (status !== undefined) updateData.status = status;
        if (scheduledAt !== undefined) {
            updateData.scheduled_at = scheduledAt ? new Date(scheduledAt).toISOString() : null;
        }

        const { data: post, error } = await supabase
            .from('posts')
            .update(updateData)
            .eq('id', id)
            .select(`
                id, title, content, hashtags, status, scheduled_at, 
                created_at, updated_at,
                post_metrics (likes, shares, comments)
            `)
            .single();

        if (error) {
            console.error('投稿更新エラー:', error);
            return res.status(500).json({
                success: false,
                error: '投稿の更新に失敗しました'
            });
        }

        // フォーマット済みレスポンス
        const formattedPost = {
            id: post.id,
            title: post.title,
            content: post.content,
            hashtags: post.hashtags || [],
            status: post.status,
            scheduledAt: post.scheduled_at,
            createdAt: new Date(post.created_at).getTime(),
            updatedAt: new Date(post.updated_at).getTime(),
            metrics: post.post_metrics[0] || { likes: 0, shares: 0, comments: 0 }
        };

        res.json({
            success: true,
            post: formattedPost,
            message: '投稿を更新しました'
        });

    } catch (error) {
        console.error('投稿更新エラー:', error);
        res.status(500).json({
            success: false,
            error: 'サーバーエラーが発生しました'
        });
    }
});

// 投稿削除
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // 投稿の所有権確認
        const { data: existingPost, error: fetchError } = await supabase
            .from('posts')
            .select('id, user_id')
            .eq('id', id)
            .eq('user_id', req.user.id)
            .single();

        if (fetchError || !existingPost) {
            return res.status(404).json({
                success: false,
                error: '投稿が見つからないか、削除権限がありません'
            });
        }

        // 関連データも削除
        await supabase
            .from('post_metrics')
            .delete()
            .eq('post_id', id);

        const { error } = await supabase
            .from('posts')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('投稿削除エラー:', error);
            return res.status(500).json({
                success: false,
                error: '投稿の削除に失敗しました'
            });
        }

        res.json({
            success: true,
            message: '投稿を削除しました'
        });

    } catch (error) {
        console.error('投稿削除エラー:', error);
        res.status(500).json({
            success: false,
            error: 'サーバーエラーが発生しました'
        });
    }
});

// 投稿複製
router.post('/:id/duplicate', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // 元の投稿取得
        const { data: originalPost, error: fetchError } = await supabase
            .from('posts')
            .select('title, content, hashtags')
            .eq('id', id)
            .eq('user_id', req.user.id)
            .single();

        if (fetchError || !originalPost) {
            return res.status(404).json({
                success: false,
                error: '投稿が見つからないか、複製権限がありません'
            });
        }

        // 複製データ作成
        const duplicateData = {
            user_id: req.user.id,
            title: originalPost.title + ' (コピー)',
            content: originalPost.content,
            hashtags: originalPost.hashtags || [],
            status: 'draft'
        };

        const { data: post, error } = await supabase
            .from('posts')
            .insert([duplicateData])
            .select()
            .single();

        if (error) {
            console.error('投稿複製エラー:', error);
            return res.status(500).json({
                success: false,
                error: '投稿の複製に失敗しました'
            });
        }

        // メトリクス初期化
        await supabase
            .from('post_metrics')
            .insert([{
                post_id: post.id,
                likes: 0,
                shares: 0,
                comments: 0
            }]);

        const formattedPost = {
            id: post.id,
            title: post.title,
            content: post.content,
            hashtags: post.hashtags || [],
            status: post.status,
            scheduledAt: null,
            createdAt: new Date(post.created_at).getTime(),
            updatedAt: null,
            metrics: { likes: 0, shares: 0, comments: 0 }
        };

        res.status(201).json({
            success: true,
            post: formattedPost,
            message: '投稿を複製しました'
        });

    } catch (error) {
        console.error('投稿複製エラー:', error);
        res.status(500).json({
            success: false,
            error: 'サーバーエラーが発生しました'
        });
    }
});

// 投稿ステータス更新
router.put('/:id/status', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['draft', 'scheduled', 'published'].includes(status)) {
            return res.status(400).json({
                success: false,
                error: '無効なステータスです'
            });
        }

        const updateData = {
            status: status,
            updated_at: new Date().toISOString()
        };

        if (status === 'published') {
            updateData.published_at = new Date().toISOString();
        }

        const { data: post, error } = await supabase
            .from('posts')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', req.user.id)
            .select(`
                id, title, content, hashtags, status, scheduled_at, 
                created_at, updated_at,
                post_metrics (likes, shares, comments)
            `)
            .single();

        if (error) {
            return res.status(404).json({
                success: false,
                error: '投稿が見つからないか、更新権限がありません'
            });
        }

        const formattedPost = {
            id: post.id,
            title: post.title,
            content: post.content,
            hashtags: post.hashtags || [],
            status: post.status,
            scheduledAt: post.scheduled_at,
            createdAt: new Date(post.created_at).getTime(),
            updatedAt: new Date(post.updated_at).getTime(),
            metrics: post.post_metrics[0] || { likes: 0, shares: 0, comments: 0 }
        };

        res.json({
            success: true,
            post: formattedPost,
            message: 'ステータスを更新しました'
        });

    } catch (error) {
        console.error('ステータス更新エラー:', error);
        res.status(500).json({
            success: false,
            error: 'サーバーエラーが発生しました'
        });
    }
});

module.exports = router;