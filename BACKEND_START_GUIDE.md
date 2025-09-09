# バックエンド実装 スタートガイド

## 🎯 最初に実装すべきもの（優先度順）

### Step 1: 基本サーバーとデータベース接続（1日目）

#### 1. プロジェクト初期化
```bash
# backendフォルダ作成
mkdir backend
cd backend

# package.json作成
npm init -y

# 必要最小限のパッケージインストール
npm install express mongoose dotenv cors
npm install -D nodemon
```

#### 2. 最小構成のserver.js作成
```javascript
// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// ミドルウェア
app.use(cors());
app.use(express.json());

// MongoDB接続
mongoose.connect('mongodb://localhost:27017/threads_system')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

// テストルート
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

#### 3. package.jsonのscripts追加
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

#### 4. 動作確認
```bash
npm run dev
# ブラウザで http://localhost:3000/api/test にアクセス
```

---

### Step 2: ユーザー認証システム（2-3日目）

**なぜ最初に認証？**
- 他の全機能で認証が必要
- セキュリティの基盤
- フロントエンドの修正箇所が明確

#### 1. 必要なパッケージ追加
```bash
npm install jsonwebtoken bcryptjs
```

#### 2. Userモデル作成
```javascript
// backend/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  email: String,
  role: {
    type: String,
    default: 'user'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// パスワードを保存前にハッシュ化
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// パスワード検証メソッド
userSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
```

#### 3. 認証ルート作成
```javascript
// backend/routes/auth.js
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// ログイン
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // ユーザー検索
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // パスワード検証
    const isValid = await user.comparePassword(password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // JWT トークン生成
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      'your-secret-key', // 後で環境変数に移動
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 新規登録
router.post('/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    
    // ユーザー作成
    const user = new User({ username, password, email });
    await user.save();
    
    res.json({
      success: true,
      message: 'User created successfully'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
```

#### 4. server.jsに認証ルート追加
```javascript
// backend/server.js に追加
app.use('/api/auth', require('./routes/auth'));
```

#### 5. 初期ユーザー作成スクリプト
```javascript
// backend/scripts/createUsers.js
const mongoose = require('mongoose');
const User = require('../models/User');

mongoose.connect('mongodb://localhost:27017/threads_system');

async function createInitialUsers() {
  // デモユーザー作成
  const users = [
    { username: 'admin', password: 'admin123', email: 'admin@example.com', role: 'admin' },
    { username: 'user', password: 'user123', email: 'user@example.com', role: 'user' }
  ];
  
  for (const userData of users) {
    try {
      const user = new User(userData);
      await user.save();
      console.log(`Created user: ${userData.username}`);
    } catch (error) {
      console.log(`User ${userData.username} already exists`);
    }
  }
  
  mongoose.connection.close();
}

createInitialUsers();
```

実行：
```bash
node scripts/createUsers.js
```

---

### Step 3: フロントエンド連携（4日目）

#### 1. APIクライアント作成
```javascript
// js/api/client.js (新規作成)
class APIClient {
  constructor() {
    this.baseURL = 'http://localhost:3000/api';
    this.token = localStorage.getItem('authToken');
  }

  async request(endpoint, options = {}) {
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

    const response = await fetch(`${this.baseURL}${endpoint}`, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'API Error');
    }
    
    return data;
  }

  async login(username, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    
    if (data.token) {
      this.token = data.token;
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    
    return data;
  }

  logout() {
    this.token = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }
}

window.apiClient = new APIClient();
```

#### 2. login.jsの修正
```javascript
// js/pages/login.js の authenticate関数を修正
authenticate: async function(username, password) {
  try {
    const result = await apiClient.login(username, password);
    return {
      success: true,
      user: result.user
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
}
```

#### 3. HTMLにAPIクライアント追加
```html
<!-- login.html のscriptタグに追加 -->
<script src="js/api/client.js"></script>
```

---

### Step 4: 投稿管理API（5-6日目）

#### 1. Postモデル作成
```javascript
// backend/models/Post.js
const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  content: {
    type: String,
    required: true,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'scheduled'],
    default: 'draft'
  },
  hashtags: [String],
  metrics: {
    likes: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    views: { type: Number, default: 0 }
  },
  scheduledAt: Date,
  publishedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date
});

module.exports = mongoose.model('Post', postSchema);
```

#### 2. 認証ミドルウェア作成
```javascript
// backend/middleware/auth.js
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, 'your-secret-key');
    req.userId = decoded.userId;
    req.username = decoded.username;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
```

#### 3. 投稿ルート作成
```javascript
// backend/routes/posts.js
const express = require('express');
const Post = require('../models/Post');
const auth = require('../middleware/auth');
const router = express.Router();

// 認証必須
router.use(auth);

// 投稿一覧取得
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find({ userId: req.userId })
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 投稿作成
router.post('/', async (req, res) => {
  try {
    const post = new Post({
      ...req.body,
      userId: req.userId
    });
    await post.save();
    res.json(post);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 投稿更新
router.put('/:id', async (req, res) => {
  try {
    const post = await Post.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    res.json(post);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 投稿削除
router.delete('/:id', async (req, res) => {
  try {
    const post = await Post.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

#### 4. server.jsに投稿ルート追加
```javascript
// backend/server.js に追加
app.use('/api/posts', require('./routes/posts'));
```

---

## 📋 実装チェックリスト

### 今すぐ始める（Day 1-2）
- [ ] backend フォルダ作成
- [ ] npm init と基本パッケージインストール
- [ ] server.js 作成と起動確認
- [ ] MongoDB インストールと接続確認
- [ ] User モデルと認証API実装

### 次のステップ（Day 3-4）
- [ ] フロントエンドにAPIクライアント追加
- [ ] ログイン機能をAPI経由に変更
- [ ] 動作テスト

### その後（Day 5-7）
- [ ] Post モデルと投稿API実装
- [ ] フロントエンドの投稿機能をAPI対応
- [ ] スケジュール機能追加
- [ ] 分析データAPI

---

## 🚀 今すぐ実行するコマンド

```bash
# 1. バックエンドフォルダ作成
cd "C:\Users\RN-事務所\Downloads\Threads自動ツールVer003"
mkdir backend
cd backend

# 2. プロジェクト初期化
npm init -y

# 3. 必要なパッケージインストール（一括）
npm install express mongoose dotenv cors jsonwebtoken bcryptjs
npm install -D nodemon

# 4. フォルダ構造作成
mkdir models routes middleware scripts

# 5. server.js作成後、起動
npm run dev
```

## 💡 ポイント

1. **認証から始める理由**
   - 他のすべての機能の基盤
   - セキュリティが最重要
   - テストしやすい

2. **MongoDBを選ぶ理由**
   - JSONライクで扱いやすい
   - スキーマが柔軟
   - Node.jsとの相性が良い

3. **段階的に実装する理由**
   - 動作確認しながら進められる
   - エラーの原因を特定しやすい
   - 達成感を得ながら進められる

## ⚠️ 注意事項

1. **MongoDB のインストール**
   - Windows: MongoDB Community Server をダウンロード
   - インストール後、mongod コマンドで起動

2. **CORS エラー対策**
   - フロントエンドがfile://の場合は特別な設定が必要
   - Live Server使用推奨

3. **環境変数**
   - 本番環境では必ず.envファイルを使用
   - JWTシークレットキーは複雑なものに変更

## 📞 困ったら

各ステップで詰まったら、具体的なエラーメッセージと一緒に質問してください。
段階的に解決していきます。