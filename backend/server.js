const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const db = require('./database');

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files - serve frontend
app.use(express.static(path.join(__dirname, '../')));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// =========================
// API Routes
// =========================

// Test route
app.get('/api/test', (req, res) => {
    res.json({ 
        message: 'Backend is working!',
        environment: process.env.NODE_ENV || 'development'
    });
});

// Authentication with database
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'メールアドレスとパスワードを入力してください'
            });
        }

        // データベースからユーザーを取得
        const user = await db.users.findByEmail(email);
        
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'メールアドレスまたはパスワードが正しくありません'
            });
        }

        // パスワード検証
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                error: 'メールアドレスまたはパスワードが正しくありません'
            });
        }

        // 最終ログイン時刻を更新
        await db.users.updateLastLogin(user.id);

        // JWTトークン生成（簡易版）
        const token = 'jwt-' + user.id + '-' + Date.now();

        res.json({
            success: true,
            token: token,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                role: user.role,
                createdAt: user.created_at
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: 'ログイン処理中にエラーが発生しました'
        });
    }
});

// User registration
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, username, password, fullName } = req.body;
        
        if (!email || !username || !password) {
            return res.status(400).json({
                success: false,
                error: '必須項目を入力してください'
            });
        }

        // パスワードハッシュ化
        const passwordHash = await bcrypt.hash(password, 10);

        // ユーザー作成
        const newUser = await db.users.create({
            email,
            username,
            passwordHash,
            fullName
        });

        res.status(201).json({
            success: true,
            message: 'ユーザー登録が完了しました',
            user: {
                id: newUser.id,
                email: newUser.email,
                username: newUser.username
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        if (error.code === '23505') { // PostgreSQL unique violation
            res.status(409).json({
                success: false,
                error: 'このメールアドレスまたはユーザー名は既に使用されています'
            });
        } else {
            res.status(500).json({
                success: false,
                error: '登録処理中にエラーが発生しました'
            });
        }
    }
});

// Get all posts from database
app.get('/api/posts', async (req, res) => {
    try {
        const { status, limit } = req.query;
        const filters = {};
        
        if (status && status !== 'all') {
            filters.status = status;
        }
        if (limit) {
            filters.limit = parseInt(limit);
        }

        const posts = await db.posts.findAll(null, filters);
        
        res.json({
            success: true,
            posts: posts
        });
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({
            success: false,
            error: '投稿の取得中にエラーが発生しました'
        });
    }
});

// Get single post from database
app.get('/api/posts/:id', async (req, res) => {
    try {
        const post = await db.posts.findById(req.params.id);
        
        if (post) {
            res.json({
                success: true,
                post: post
            });
        } else {
            res.status(404).json({
                success: false,
                error: '投稿が見つかりません'
            });
        }
    } catch (error) {
        console.error('Error fetching post:', error);
        res.status(500).json({
            success: false,
            error: '投稿の取得中にエラーが発生しました'
        });
    }
});

// Create new post in database
app.post('/api/posts', async (req, res) => {
    try {
        const { title, content, hashtags, status, scheduledAt } = req.body;
        
        if (!title || !content) {
            return res.status(400).json({
                success: false,
                error: 'タイトルと内容は必須です'
            });
        }
        
        // TODO: Get actual user ID from JWT token
        // For now, use a default user ID or get from request
        const userId = req.body.userId || '00000000-0000-0000-0000-000000000001';
        
        const newPost = await db.posts.create({
            userId,
            title,
            content,
            hashtags: hashtags || [],
            status: status || 'draft',
            scheduledAt: scheduledAt || null
        });
        
        res.status(201).json({
            success: true,
            post: newPost,
            message: '投稿を作成しました'
        });
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({
            success: false,
            error: '投稿の作成中にエラーが発生しました'
        });
    }
});

// Update post in database
app.put('/api/posts/:id', async (req, res) => {
    try {
        const { title, content, hashtags, status, scheduledAt } = req.body;
        
        const updatedPost = await db.posts.update(req.params.id, {
            title,
            content,
            hashtags,
            status,
            scheduledAt
        });
        
        res.json({
            success: true,
            post: updatedPost,
            message: '投稿を更新しました'
        });
    } catch (error) {
        console.error('Error updating post:', error);
        if (error.message === 'Post not found') {
            res.status(404).json({
                success: false,
                error: '投稿が見つかりません'
            });
        } else {
            res.status(500).json({
                success: false,
                error: '投稿の更新中にエラーが発生しました'
            });
        }
    }
});

// Delete post (soft delete) in database
app.delete('/api/posts/:id', async (req, res) => {
    try {
        const result = await db.posts.delete(req.params.id);
        
        if (result) {
            res.json({
                success: true,
                message: '投稿を削除しました'
            });
        } else {
            res.status(404).json({
                success: false,
                error: '投稿が見つかりません'
            });
        }
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({
            success: false,
            error: '投稿の削除中にエラーが発生しました'
        });
    }
});

// Duplicate post in database
app.post('/api/posts/:id/duplicate', async (req, res) => {
    try {
        // TODO: Get actual user ID from JWT token
        const userId = req.body.userId || '00000000-0000-0000-0000-000000000001';
        
        const duplicatedPost = await db.posts.duplicate(req.params.id, userId);
        
        res.json({
            success: true,
            post: duplicatedPost,
            message: '投稿を複製しました'
        });
    } catch (error) {
        console.error('Error duplicating post:', error);
        if (error.message === 'Post not found') {
            res.status(404).json({
                success: false,
                error: '投稿が見つかりません'
            });
        } else {
            res.status(500).json({
                success: false,
                error: '投稿の複製中にエラーが発生しました'
            });
        }
    }
});

// =========================
// Frontend Routes
// =========================

// Serve frontend pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../login.html'));
});

app.get('/dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../dashboard.html'));
});

app.get('/posts.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../posts.html'));
});

// 404 handler - return JSON for API routes, HTML for others
app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
        res.status(404).json({ 
            success: false,
            error: 'API endpoint not found' 
        });
    } else {
        res.status(404).sendFile(path.join(__dirname, '../index.html'));
    }
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ 
        success: false,
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server with database initialization
const server = app.listen(PORT, '0.0.0.0', async () => {
    console.log('=====================================');
    console.log('🚀 Threads System Backend Started!');
    console.log('=====================================');
    console.log(`📡 Server: http://localhost:${PORT}`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`✅ Health check: http://localhost:${PORT}/health`);
    console.log(`📝 API Test: http://localhost:${PORT}/api/test`);
    console.log('=====================================');
    
    // データベース初期化
    console.log('🔄 Initializing database connection...');
    const dbInitialized = await db.initializeDatabase();
    if (dbInitialized) {
        console.log('✅ Database connection established');
    } else {
        console.log('⚠️  Database connection failed - using fallback mode');
    }
    console.log('=====================================');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});