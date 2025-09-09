# 🌐 フロントエンドを今すぐ公開する方法

## 方法1: Vercel（推奨・最速3分）

### 1. Vercelにデプロイ
1. https://vercel.com にアクセス
2. GitHubでログイン
3. 「Add New → Project」をクリック
4. `threads-system`リポジトリを選択
5. **Framework Preset**: Other
6. **Root Directory**: `.` （変更しない）
7. 「Deploy」をクリック

### 2. 環境変数設定
デプロイ後、Settings → Environment Variables で追加：
```
BACKEND_URL=https://threads-system.onrender.com
```

### 3. 完了！
`https://your-project.vercel.app` でアクセス可能

---

## 方法2: Netlify（簡単・ドラッグ&ドロップ）

### 1. ファイル準備
Threads自動ツールVer003フォルダ内の以下のファイルを新しいフォルダにコピー：
- index.html
- login.html
- dashboard.html
- posts.html
- schedule.html
- analytics.html
- settings.html
- css/フォルダ全体
- js/フォルダ全体
- assets/フォルダ全体

### 2. Netlifyにアップロード
1. https://app.netlify.com にアクセス
2. ログイン（GitHub/Email）
3. 「Sites」タブ
4. フォルダをドラッグ&ドロップ
5. 自動的にURLが生成される

---

## 方法3: GitHub Pages（無料・簡単）

### 1. 新しいリポジトリ作成
1. GitHubで新規リポジトリ作成（threads-frontend等）
2. フロントエンドファイルのみをプッシュ

### 2. GitHub Pages有効化
1. Settings → Pages
2. Source: Deploy from a branch
3. Branch: main / root
4. Save

### 3. アクセス
`https://ikemenltd.github.io/threads-frontend/`

---

## 🔧 バックエンド接続設定

どの方法でも、`js/core/config.js`を編集：

```javascript
// 現在（ローカル用）
const API_BASE_URL = 'http://localhost:3000/api';

// 変更後（本番用）
const API_BASE_URL = 'https://threads-system.onrender.com/api';
```

---

## 📱 今すぐ試すなら

### ローカルで確認（最速）
```bash
cd /mnt/c/Users/RN-事務所/Downloads/Threads自動ツールVer003

# Python（推奨）
python -m http.server 8000

# または Node.js
npx http-server -p 8000
```

ブラウザで: http://localhost:8000

---

## 推奨: Vercelを使う理由

1. **自動デプロイ**: GitHubプッシュで自動更新
2. **高速**: CDN配信で世界中から高速アクセス
3. **無料**: 個人利用なら完全無料
4. **簡単**: 3分で完了
5. **HTTPS**: 自動でSSL証明書

どの方法を使いますか？