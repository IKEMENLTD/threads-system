const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

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

// Mock authentication
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    
    // 簡単な認証（実際の本番環境では適切な認証を実装）
    if (email && password) {
        res.json({
            success: true,
            token: 'mock-jwt-token-' + Date.now(),
            user: {
                id: '1',
                email: email,
                username: email.split('@')[0],
                role: 'user',
                createdAt: new Date().toISOString()
            }
        });
    } else {
        res.status(401).json({
            success: false,
            error: 'メールアドレスまたはパスワードが正しくありません'
        });
    }
});

// Mock posts storage (in-memory for now)
let posts = [];
let nextId = 1;

// Get all posts
app.get('/api/posts', (req, res) => {
    res.json({
        success: true,
        posts: posts
    });
});

// Get single post
app.get('/api/posts/:id', (req, res) => {
    const post = posts.find(p => p.id === req.params.id);
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
});

// Create new post
app.post('/api/posts', (req, res) => {
    const { title, content, hashtags, status, scheduledAt } = req.body;
    
    if (!title || !content) {
        return res.status(400).json({
            success: false,
            error: 'タイトルと内容は必須です'
        });
    }
    
    const newPost = {
        id: String(nextId++),
        title,
        content,
        hashtags: hashtags || [],
        status: status || 'draft',
        scheduledAt: scheduledAt || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    posts.push(newPost);
    
    res.status(201).json({
        success: true,
        post: newPost,
        message: '投稿を作成しました'
    });
});

// Update post
app.put('/api/posts/:id', (req, res) => {
    const postIndex = posts.findIndex(p => p.id === req.params.id);
    
    if (postIndex === -1) {
        return res.status(404).json({
            success: false,
            error: '投稿が見つかりません'
        });
    }
    
    const { title, content, hashtags, status, scheduledAt } = req.body;
    
    posts[postIndex] = {
        ...posts[postIndex],
        title: title || posts[postIndex].title,
        content: content || posts[postIndex].content,
        hashtags: hashtags || posts[postIndex].hashtags,
        status: status || posts[postIndex].status,
        scheduledAt: scheduledAt || posts[postIndex].scheduledAt,
        updatedAt: new Date().toISOString()
    };
    
    res.json({
        success: true,
        post: posts[postIndex],
        message: '投稿を更新しました'
    });
});

// Delete post
app.delete('/api/posts/:id', (req, res) => {
    const postIndex = posts.findIndex(p => p.id === req.params.id);
    
    if (postIndex === -1) {
        return res.status(404).json({
            success: false,
            error: '投稿が見つかりません'
        });
    }
    
    posts.splice(postIndex, 1);
    
    res.json({
        success: true,
        message: '投稿を削除しました'
    });
});

// Duplicate post
app.post('/api/posts/:id/duplicate', (req, res) => {
    const post = posts.find(p => p.id === req.params.id);
    
    if (!post) {
        return res.status(404).json({
            success: false,
            error: '投稿が見つかりません'
        });
    }
    
    const duplicatedPost = {
        ...post,
        id: String(nextId++),
        title: post.title + ' (コピー)',
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    posts.push(duplicatedPost);
    
    res.json({
        success: true,
        post: duplicatedPost,
        message: '投稿を複製しました'
    });
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

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('=====================================');
    console.log('🚀 Threads System Backend Started!');
    console.log('=====================================');
    console.log(`📡 Server: http://localhost:${PORT}`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`✅ Health check: http://localhost:${PORT}/health`);
    console.log(`📝 API Test: http://localhost:${PORT}/api/test`);
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