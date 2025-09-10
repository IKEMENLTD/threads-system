# 🚀 フォルダ全体統合デプロイガイド

## 📁 現在の構成

```
C:\Users\RN-事務所\Downloads\Threads自動ツールVer003\
├── index.html              # ← フロントエンド
├── login.html
├── dashboard.html
├── posts.html
├── schedule.html
├── analytics.html
├── settings.html
├── css/                    # ← フロントエンド
├── js/                     # ← フロントエンド
├── assets/                 # ← フロントエンド
├── backend/                # ← バックエンド
│   ├── server.js
│   ├── package.json
│   └── ...
├── package.json            # ← 新規作成（ルート用）
└── render.yaml             # ← 新規作成（統合設定）
```

## ✅ 完了した修正

### 1. ルートレベルのpackage.json作成
- フォルダ全体をプロジェクトとして認識
- バックエンドのserver.jsを起動

### 2. server.js修正
- 静的ファイル配信を親ディレクトリ（`../`）に変更
- HTMLファイルパスを親ディレクトリに変更
- buildプロセスを削除（不要）

### 3. 新しいrender.yaml作成
- ルートディレクトリからデプロイ
- バックエンドのnpm installと起動

## 📋 デプロイ手順

### 1. GitHubにプッシュ
```bash
git add .
git commit -m "Integrate frontend and backend in single deployment"
git push origin main
```

### 2. Renderで新サービス作成
1. **https://dashboard.render.com**
2. 「**New +**」→「**Web Service**」
3. GitHubから「**threads-system**」を選択
4. 設定確認：
   ```
   Name: threads-system-integrated
   Runtime: Node
   Build Command: cd backend && npm install
   Start Command: cd backend && npm start
   ```

## 🎯 期待される結果

**1つのURL**で全て利用可能：
- **ホーム**: `https://threads-system-integrated.onrender.com/`
- **ログイン**: `https://threads-system-integrated.onrender.com/login.html`
- **ダッシュボード**: `https://threads-system-integrated.onrender.com/dashboard.html`
- **CSS/JS**: 自動で読み込み
- **API**: `https://threads-system-integrated.onrender.com/api/`

## 🔧 環境変数設定

デプロイ後、Environment Variables で設定：
```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...
JWT_SECRET=your-secret-key
```

完了！