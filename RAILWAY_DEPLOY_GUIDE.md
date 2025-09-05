# 🚀 Railway デプロイガイド

## ✅ 準備完了項目

1. **Railway CLI** - インストール済み ✅
2. **Gitリポジトリ** - 初期化済み ✅
3. **環境変数対応** - コード修正済み ✅
4. **設定ファイル** - 作成済み ✅

## 📋 次のステップ（手動実行が必要）

### Step 1: Railwayにログイン
コマンドプロンプトで以下を実行：

```cmd
cd C:\Users\RN-事務所\Downloads\Threads自動ツールVer003\backend
railway login
```

ブラウザが開くので、GitHubアカウントでログインしてください。

### Step 2: プロジェクト作成
```cmd
railway init
```

以下の質問に答えてください：
- Project name: `threads-backend`（または好きな名前）

### Step 3: MongoDBを追加
```cmd
railway add
```

リストから「MongoDB」を選択（矢印キーで選択、Enterで決定）

### Step 4: デプロイ
```cmd
railway up
```

初回は2-3分かかります。

### Step 5: 環境変数の設定
```cmd
# JWT Secretを設定
railway variables set JWT_SECRET=your-super-secret-key-change-this-123456

# 確認
railway variables
```

### Step 6: URLを取得
```cmd
railway domain
```

もしドメインがない場合は生成：
```cmd
railway domain generate
```

生成されたURL例: `threads-backend-production-xxxx.up.railway.app`

---

## 🔍 動作確認

### 1. ブラウザでアクセス
生成されたURLをブラウザで開く：
```
https://threads-backend-production-xxxx.up.railway.app
```

以下のJSONが表示されれば成功：
```json
{
  "name": "Threads System Backend",
  "version": "1.0.0",
  "endpoints": {
    "test": "/api/test",
    "auth": {
      "login": "POST /api/auth/login",
      "register": "POST /api/auth/register",
      "verify": "GET /api/auth/verify"
    },
    "posts": "/api/posts (coming soon)"
  }
}
```

### 2. APIテスト
`test-api.html`を開いて、APIのURLを変更：

```javascript
// 変更前
const API_BASE = 'http://localhost:3000/api';

// 変更後（あなたのRailway URLに変更）
const API_BASE = 'https://threads-backend-production-xxxx.up.railway.app/api';
```

### 3. 初期ユーザー作成
Railwayコンソールから実行：
```cmd
railway run node scripts/createInitialUsers.js
```

または、Railway ダッシュボードから：
1. プロジェクトを開く
2. 「Settings」タブ
3. 「Run Command」で以下を実行：
   ```
   node scripts/createInitialUsers.js
   ```

---

## 📊 Railway ダッシュボード

### アクセス方法
```cmd
railway open
```

または https://railway.app/dashboard

### 確認項目
- **Deployments**: デプロイ状況
- **Logs**: サーバーログ
- **Variables**: 環境変数
- **Metrics**: CPU/メモリ使用量
- **Database**: MongoDB管理

---

## 🔧 トラブルシューティング

### エラー: MongoDB接続失敗
**解決方法:**
1. Railwayダッシュボードで環境変数を確認
2. `MONGO_URL`が自動設定されているか確認
3. なければ手動で追加

### エラー: Build failed
**解決方法:**
```cmd
# package-lock.jsonを更新
npm install
git add package-lock.json
git commit -m "Update package-lock.json"
railway up
```

### エラー: Application failed to respond
**解決方法:**
1. PORTが環境変数から取得されているか確認
2. server.jsで`0.0.0.0`にバインドしているか確認

---

## 🎉 デプロイ成功後

### フロントエンドとの連携

1. **フロントエンドにAPIクライアント追加**
```javascript
// js/api/client.js
const API_BASE = 'https://threads-backend-production-xxxx.up.railway.app/api';
```

2. **CORSの設定確認**
既に設定済みですが、特定のドメインのみ許可する場合：
```javascript
// server.js
app.use(cors({
  origin: ['https://your-frontend.vercel.app', 'http://localhost:3000'],
  credentials: true
}));
```

### 自動デプロイ設定

GitHubと連携すれば、pushするだけで自動デプロイ：
1. Railway ダッシュボード → Settings
2. GitHub repo を接続
3. Auto Deploy を有効化

---

## 📝 コマンドまとめ（コピペ用）

```cmd
# Railwayプロジェクト作成からデプロイまで
cd C:\Users\RN-事務所\Downloads\Threads自動ツールVer003\backend
railway login
railway init
railway add
railway up
railway variables set JWT_SECRET=your-secret-key-123456
railway domain generate
railway open
```

---

## ✅ チェックリスト

- [ ] Railway にログイン
- [ ] プロジェクト作成
- [ ] MongoDB追加
- [ ] デプロイ実行
- [ ] 環境変数設定
- [ ] ドメイン生成
- [ ] 動作確認
- [ ] 初期ユーザー作成
- [ ] フロントエンド連携

---

## 🚀 次のステップ

1. **投稿管理API** の実装
2. **フロントエンドのデプロイ**（Vercel推奨）
3. **自動デプロイ** の設定
4. **カスタムドメイン** の設定（任意）

準備は完了しています！上記のコマンドを実行してください。