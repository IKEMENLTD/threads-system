const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// ミドルウェア
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// フロントエンドの静的ファイルを配信
app.use(express.static(path.join(__dirname, '..')));

// Supabase接続確認（遅延読み込み）
const { testConnection } = require('./supabase-setup');

// 起動時に接続テスト
(async () => {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    const connected = await testConnection();
    if (connected) {
      console.log('📊 Database: Supabase PostgreSQL');
    }
  } else {
    console.log('⚠️  Supabase環境変数が設定されていません');
    console.log('必要な環境変数: SUPABASE_URL, SUPABASE_ANON_KEY');
  }
})();

// ルート設定
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// ヘルスチェック
app.get('/api/health', async (req, res) => {
  const { testConnection } = require('./supabase-setup');
  const dbConnected = await testConnection();
  
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
  res.sendFile(path.join(__dirname, '..', 'index.html'));
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
      posts: '/api/posts (coming soon)'
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
    return res.sendFile(path.join(__dirname, '..', requestedFile));
  }
  
  // その他はindex.htmlにフォールバック（SPAルーティング）
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // Railwayで必要
app.listen(PORT, HOST, () => {
  console.log('=====================================');
  console.log('🚀 Threads System Backend Started!');
  console.log('=====================================');
  console.log(`📡 Server: http://localhost:${PORT}`);
  console.log(`🔧 Test API: http://localhost:${PORT}/api/test`);
  console.log('=====================================');
});