const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// ミドルウェア
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB接続（Railway環境変数に対応）
const mongoUri = process.env.MONGODB_URI || 
                 process.env.MONGO_URL || 
                 process.env.DATABASE_URL ||
                 'mongodb://localhost:27017/threads_system';

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    console.log('📊 Database:', mongoUri.split('@')[1]?.split('/')[0] || 'localhost');
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('⚠️  Server will run without database functionality');
  });

// ルート設定
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// テストルート
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Backend is working!',
    timestamp: new Date().toISOString(),
    status: 'OK'
  });
});

// ルートパス
app.get('/', (req, res) => {
  res.json({
    name: 'Threads System Backend',
    version: '1.0.0',
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

// 404ハンドリング
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    path: req.path 
  });
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