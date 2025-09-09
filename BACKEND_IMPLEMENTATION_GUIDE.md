# Threads自動ツール Ver003 バックエンド実装ガイド

## 現状分析

### 現在のシステム構成
- **フロントエンド**: 静的HTML/CSS/JavaScript（完成済み）
- **データ保存**: ローカルストレージ（ブラウザ内のみ）
- **認証**: デモアカウントのみ（ハードコーディング）
- **API**: なし（すべてクライアントサイドで処理）

### 主要機能
1. **ユーザー認証**（ログイン/セッション管理）
2. **投稿管理**（作成/編集/削除/複製）
3. **スケジュール投稿**（予約投稿管理）
4. **分析データ**（エンゲージメント統計）
5. **設定管理**（プロフィール/通知/プライバシー）

## バックエンド実装方法（3つの選択肢）

### 選択肢1: Node.js + Express + MongoDB（推奨）

#### 必要な技術スタック
```
バックエンド:
- Node.js (v18以上)
- Express.js (Webフレームワーク)
- MongoDB (データベース)
- JWT (認証トークン)
- bcrypt (パスワードハッシュ化)
- cors (CORS対応)
- dotenv (環境変数管理)
```

#### ディレクトリ構造
```
backend/
├── src/
│   ├── config/
│   │   ├── database.js      # MongoDB接続設定
│   │   └── config.js        # アプリケーション設定
│   ├── models/
│   │   ├── User.js          # ユーザーモデル
│   │   ├── Post.js          # 投稿モデル
│   │   ├── Schedule.js      # スケジュールモデル
│   │   └── Analytics.js     # 分析データモデル
│   ├── controllers/
│   │   ├── authController.js      # 認証処理
│   │   ├── postController.js      # 投稿管理
│   │   ├── scheduleController.js  # スケジュール管理
│   │   ├── analyticsController.js # 分析データ
│   │   └── settingsController.js  # 設定管理
│   ├── routes/
│   │   ├── auth.js          # 認証ルート
│   │   ├── posts.js         # 投稿ルート
│   │   ├── schedules.js     # スケジュールルート
│   │   ├── analytics.js     # 分析ルート
│   │   └── settings.js      # 設定ルート
│   ├── middleware/
│   │   ├── auth.js          # 認証ミドルウェア
│   │   ├── validation.js    # バリデーション
│   │   └── errorHandler.js  # エラーハンドリング
│   ├── services/
│   │   ├── threadsAPI.js    # Threads API連携
│   │   └── scheduler.js     # スケジューラーサービス
│   └── app.js               # メインアプリケーション
├── .env                     # 環境変数
├── package.json            # 依存関係
└── server.js              # サーバー起動ファイル
```

#### 実装手順

##### Step 1: プロジェクト初期化
```bash
mkdir backend
cd backend
npm init -y
npm install express mongoose jsonwebtoken bcryptjs cors dotenv express-validator
npm install -D nodemon
```

##### Step 2: 基本サーバー設定（server.js）
```javascript
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// ミドルウェア
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB接続
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/threads_system', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// ルート設定
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/posts', require('./src/routes/posts'));
app.use('/api/schedules', require('./src/routes/schedules'));
app.use('/api/analytics', require('./src/routes/analytics'));
app.use('/api/settings', require('./src/routes/settings'));

// エラーハンドリング
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

##### Step 3: データモデル実装例（models/User.js）
```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  displayName: String,
  role: {
    type: String,
    enum: ['admin', 'user', 'guest'],
    default: 'user'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: Date,
  settings: {
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: false }
    },
    privacy: {
      profileVisibility: { type: String, default: 'public' },
      showAnalytics: { type: Boolean, default: true }
    }
  }
});

// パスワードハッシュ化
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// パスワード検証
userSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
```

##### Step 4: API エンドポイント実装

#### 必要なAPIエンドポイント一覧

##### 認証関連
- `POST /api/auth/login` - ログイン
- `POST /api/auth/logout` - ログアウト
- `POST /api/auth/register` - 新規登録
- `GET /api/auth/session` - セッション確認
- `POST /api/auth/refresh` - トークン更新

##### 投稿管理
- `GET /api/posts` - 投稿一覧取得
- `POST /api/posts` - 新規投稿作成
- `GET /api/posts/:id` - 特定投稿取得
- `PUT /api/posts/:id` - 投稿更新
- `DELETE /api/posts/:id` - 投稿削除
- `POST /api/posts/:id/duplicate` - 投稿複製
- `POST /api/posts/:id/publish` - 投稿公開

##### スケジュール管理
- `GET /api/schedules` - スケジュール一覧
- `POST /api/schedules` - スケジュール作成
- `PUT /api/schedules/:id` - スケジュール更新
- `DELETE /api/schedules/:id` - スケジュール削除
- `POST /api/schedules/bulk` - 一括スケジュール

##### 分析データ
- `GET /api/analytics/overview` - 概要統計
- `GET /api/analytics/posts` - 投稿別統計
- `GET /api/analytics/engagement` - エンゲージメント分析
- `GET /api/analytics/export` - データエクスポート

##### 設定管理
- `GET /api/settings/profile` - プロフィール取得
- `PUT /api/settings/profile` - プロフィール更新
- `PUT /api/settings/password` - パスワード変更
- `PUT /api/settings/notifications` - 通知設定
- `PUT /api/settings/privacy` - プライバシー設定

### 選択肢2: Google Apps Script（既存のGASを活用）

#### メリット
- 無料でホスティング可能
- Googleスプレッドシートとの連携が簡単
- 既存のGASコードを活用できる

#### 実装方法
1. 既存の`gas_webapp/Code.gs`を拡張
2. Google Apps Script Web Appとしてデプロイ
3. フロントエンドからWeb App URLにAPIリクエスト

#### 必要な修正
```javascript
// フロントエンドのconfig.jsを修正
window.AppConfig = {
  // ...
  api: {
    baseUrl: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec',
    // ...
  }
};

// APIリクエスト例
async function fetchPosts() {
  const response = await fetch(`${AppConfig.api.baseUrl}?action=getPosts`, {
    method: 'GET'
  });
  return response.json();
}
```

### 選択肢3: Firebase（サーバーレス）

#### メリット
- リアルタイム同期
- 認証機能が組み込み済み
- スケーラブル
- 無料枠あり

#### 必要なサービス
- Firebase Authentication（認証）
- Firestore（データベース）
- Cloud Functions（サーバーレス関数）
- Firebase Hosting（フロントエンドホスティング）

## フロントエンド修正箇所

### 1. APIクライアント作成（js/api/client.js）
```javascript
class APIClient {
  constructor(baseURL) {
    this.baseURL = baseURL || 'http://localhost:3000/api';
    this.token = localStorage.getItem('authToken');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      }
    };

    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  // 認証
  async login(username, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    
    if (data.token) {
      this.token = data.token;
      localStorage.setItem('authToken', data.token);
    }
    
    return data;
  }

  // 投稿取得
  async getPosts() {
    return this.request('/posts');
  }

  // 投稿作成
  async createPost(postData) {
    return this.request('/posts', {
      method: 'POST',
      body: JSON.stringify(postData)
    });
  }
}

window.apiClient = new APIClient();
```

### 2. ローカルストレージからAPIへの移行

現在のコード：
```javascript
// 現在（ローカルストレージ）
const posts = PostsData.getAllPosts();
```

修正後：
```javascript
// API使用
const posts = await apiClient.getPosts();
```

### 3. セッション管理の修正

現在のコード：
```javascript
// 現在（ローカルストレージ）
SessionManager.createSession(userData);
```

修正後：
```javascript
// JWT トークン使用
const { token, user } = await apiClient.login(username, password);
SessionManager.setToken(token);
SessionManager.setUser(user);
```

## スケジューラー実装（自動投稿機能）

### Node.js の場合（node-cron使用）
```javascript
const cron = require('node-cron');
const Schedule = require('./models/Schedule');
const Post = require('./models/Post');

// 5分ごとに予約投稿をチェック
cron.schedule('*/5 * * * *', async () => {
  try {
    const now = new Date();
    const pendingSchedules = await Schedule.find({
      status: 'pending',
      scheduledAt: { $lte: now }
    });

    for (const schedule of pendingSchedules) {
      // 投稿を公開
      await Post.findByIdAndUpdate(schedule.postId, {
        status: 'published',
        publishedAt: now
      });

      // スケジュールを完了に更新
      schedule.status = 'completed';
      await schedule.save();

      console.log(`Published post: ${schedule.postId}`);
    }
  } catch (error) {
    console.error('Scheduler error:', error);
  }
});
```

## セキュリティ対策

### 必須実装項目
1. **パスワードハッシュ化**（bcrypt使用）
2. **JWT トークン認証**
3. **CORS設定**
4. **入力値バリデーション**
5. **SQLインジェクション対策**（パラメータ化クエリ）
6. **XSS対策**（サニタイゼーション）
7. **レート制限**（express-rate-limit）
8. **HTTPS通信**

### 環境変数（.env）
```env
# サーバー設定
PORT=3000
NODE_ENV=production

# データベース
MONGODB_URI=mongodb://localhost:27017/threads_system

# JWT設定
JWT_SECRET=your-secret-key-here
JWT_EXPIRE=30d

# Threads API（将来的な連携用）
THREADS_API_KEY=your-api-key
THREADS_API_SECRET=your-api-secret

# CORS設定
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

## デプロイ方法

### 1. ローカル開発環境
```bash
# バックエンド起動
cd backend
npm run dev

# フロントエンド（別ターミナル）
# Live Serverなどで起動
```

### 2. 本番環境へのデプロイ

#### Heroku の場合
```bash
# Herokuアプリ作成
heroku create threads-system-backend

# MongoDB追加
heroku addons:create mongolab

# デプロイ
git push heroku main
```

#### VPS（Ubuntu）の場合
```bash
# Node.js インストール
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# MongoDB インストール
sudo apt-get install mongodb

# PM2 インストール（プロセス管理）
npm install -g pm2

# アプリ起動
pm2 start server.js
pm2 save
pm2 startup
```

## テスト実装

### APIテスト（Jest使用）
```javascript
// tests/auth.test.js
const request = require('supertest');
const app = require('../src/app');

describe('Authentication', () => {
  test('POST /api/auth/login', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'testuser',
        password: 'password123'
      });
    
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('token');
  });
});
```

## 段階的移行計画

### Phase 1: 基本APIサーバー構築（1週間）
- [ ] Node.js + Express セットアップ
- [ ] MongoDB接続
- [ ] 基本的なCRUD API実装
- [ ] JWT認証実装

### Phase 2: フロントエンド連携（3-4日）
- [ ] APIクライアント作成
- [ ] ローカルストレージからAPIへの移行
- [ ] エラーハンドリング追加
- [ ] ローディング状態の実装

### Phase 3: 高度な機能（1週間）
- [ ] スケジューラー実装
- [ ] リアルタイム通知
- [ ] データエクスポート機能
- [ ] 分析データの自動収集

### Phase 4: デプロイ・運用（3日）
- [ ] 本番環境セットアップ
- [ ] SSL証明書設定
- [ ] バックアップ設定
- [ ] 監視ツール導入

## トラブルシューティング

### よくある問題と解決方法

#### CORS エラー
```javascript
// backend/server.js に追加
app.use(cors({
  origin: ['http://localhost:3000', 'file://'],
  credentials: true
}));
```

#### MongoDB接続エラー
```bash
# MongoDB サービス確認
sudo systemctl status mongod

# 再起動
sudo systemctl restart mongod
```

#### JWTトークン期限切れ
```javascript
// 自動更新実装
if (tokenExpired) {
  const newToken = await apiClient.refreshToken();
  apiClient.setToken(newToken);
}
```

## まとめ

推奨構成：**Node.js + Express + MongoDB**

理由：
1. フルカスタマイズ可能
2. 将来的な拡張性が高い
3. Threads API連携が容易
4. コミュニティサポートが豊富
5. 既存のフロントエンドとの相性が良い

実装期間の目安：**2-3週間**（基本機能のみなら1週間）

必要なスキル：
- JavaScript（中級）
- Node.js基礎
- データベース基礎（MongoDB）
- REST API設計
- 非同期処理の理解