console.log('=== SERVER STARTUP BEGIN ===');
console.log('Node version:', process.version);
console.log('Current directory:', process.cwd());
console.log('__dirname:', __dirname);
console.log('Environment:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);

// モジュール読み込み開始
console.log('[1/7] Loading express...');
const express = require('express');
console.log('[2/7] Loading cors...');
const cors = require('cors');
console.log('[3/7] Loading path...');
const path = require('path');
console.log('[4/7] Loading fs...');
const fs = require('fs');
console.log('[5/7] Loading dotenv...');
require('dotenv').config();
console.log('[6/7] Creating Express app...');
const app = express();
console.log('[7/7] Express app created successfully');

// ミドルウェア設定
console.log('Setting up middleware...');
try {
  app.use(cors());
  console.log('✓ CORS middleware added');
  app.use(express.json());
  console.log('✓ JSON parser added');
  app.use(express.urlencoded({ extended: true }));
  console.log('✓ URL encoder added');
  
  // フロントエンドの静的ファイルを配信
  app.use(express.static(__dirname));
  console.log('✓ Static files middleware added for:', __dirname);
} catch (error) {
  console.error('ERROR in middleware setup:', error);
  process.exit(1);
}

// データベース接続はサーバー起動後に非同期で行う
function checkDatabaseConnection() {
  // Renderではrequireを使わずに遅延読み込み
  setTimeout(() => {
    try {
      if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
        const { testConnection } = require('./supabase-setup');
        testConnection().then(connected => {
          if (connected) {
            console.log('📊 Database: Supabase PostgreSQL connected');
          } else {
            console.log('⚠️  Database connection failed but server is running');
          }
        }).catch(error => {
          console.error('Database test error:', error.message);
        });
      } else {
        console.log('⚠️  Supabase環境変数が設定されていません');
      }
    } catch (error) {
      console.error('Database setup error:', error.message);
    }
  }, 1000); // サーバー起動後1秒後に実行
}

// ルート設定
console.log('Loading route modules...');
try {
  console.log('Loading auth routes from:', path.join(__dirname, 'routes/auth.js'));
  const authRoutes = require('./routes/auth');
  console.log('✓ Auth routes loaded');
  
  console.log('Loading posts routes from:', path.join(__dirname, 'routes/posts.js'));
  const postsRoutes = require('./routes/posts');
  console.log('✓ Posts routes loaded');
  
  app.use('/api/auth', authRoutes);
  console.log('✓ Auth routes mounted at /api/auth');
  app.use('/api/posts', postsRoutes);
  console.log('✓ Posts routes mounted at /api/posts');
} catch (error) {
  console.error('ERROR loading routes:', error);
  console.error('Stack trace:', error.stack);
  // Continue without routes for now
}

// ヘルスチェック
app.get('/api/health', async (req, res) => {
  let dbConnected = false;
  
  try {
    const { testConnection } = require('./supabase-setup');
    dbConnected = await testConnection();
  } catch (error) {
    console.error('Health check DB error:', error.message);
  }
  
  res.json({ 
    status: 'ok',
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// テストルート
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Backend is working!',
    timestamp: new Date().toISOString(),
    status: 'OK'
  });
});

// ルートパス - フロントエンドのindex.htmlを配信
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// API情報エンドポイント
app.get('/api', (req, res) => {
  res.json({
    name: 'Threads System Backend',
    version: '1.0.1',
    deployed: new Date().toISOString(),
    endpoints: {
      test: '/api/test',
      auth: {
        login: 'POST /api/auth/login',
        register: 'POST /api/auth/register',
        verify: 'GET /api/auth/verify'
      },
      posts: {
        list: 'GET /api/posts',
        create: 'POST /api/posts',
        get: 'GET /api/posts/:id',
        update: 'PUT /api/posts/:id',
        delete: 'DELETE /api/posts/:id',
        duplicate: 'POST /api/posts/:id/duplicate',
        updateStatus: 'PUT /api/posts/:id/status'
      }
    }
  });
});

// エラーハンドリング
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message 
  });
});

// SPAルーティング対応 - HTMLファイルまたは404
app.use((req, res) => {
  // APIリクエストの場合はJSONエラーを返す
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ 
      error: 'API Not Found',
      path: req.path 
    });
  }
  
  // HTMLファイルの場合は対応するファイルを返す、なければindex.htmlにフォールバック
  const htmlFiles = ['login.html', 'dashboard.html', 'posts.html', 'schedule.html', 'analytics.html', 'settings.html'];
  const requestedFile = req.path.slice(1); // Remove leading slash
  
  if (htmlFiles.includes(requestedFile)) {
    const filePath = path.join(__dirname, requestedFile);
    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath);
    }
  }
  
  // その他はindex.htmlにフォールバック（SPAルーティング）
  const indexPath = path.join(__dirname, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Application files not found');
  }
});

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// プロセス終了ハンドリング
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('uncaughtException', (error) => {
  console.error('UNCAUGHT EXCEPTION:', error);
  console.error('Stack:', error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION at:', promise, 'reason:', reason);
  process.exit(1);
});

console.log('=== SERVER INITIALIZATION COMPLETE ===');

// サーバー起動
console.log(`Attempting to start server on ${HOST}:${PORT}...`);
const server = app.listen(PORT, HOST, (error) => {
  if (error) {
    console.error('ERROR: Failed to start server:', error);
    process.exit(1);
  }
  console.log('=====================================');
  console.log('🚀 Threads System Backend Started!');
  console.log('=====================================');
  console.log(`📡 Server: http://${HOST}:${PORT}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔧 Test API: http://${HOST}:${PORT}/api/test`);
  console.log('=====================================');
  console.log('Server is now accepting connections');
  
  // サーバー起動後にデータベース接続チェック
  checkDatabaseConnection();
});

server.on('error', (error) => {
  console.error('Server error event:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
  }
  process.exit(1);
});