# Threads System Backend

## 🚀 自動デプロイ設定済み

このリポジトリは以下の自動化が設定されています：
- **GitHub Push → Render自動デプロイ**
- **GitHub Actions によるテスト**
- **Claude Code での開発**

## 📦 技術スタック

- **Node.js + Express** - バックエンドサーバー
- **MongoDB** - データベース
- **JWT** - 認証
- **Render** - ホスティング
- **GitHub Actions** - CI/CD

## 🔧 ローカル開発

```bash
# 依存関係インストール
npm install

# 開発サーバー起動
npm run dev

# 本番サーバー起動
npm start
```

## 🌐 環境変数

`.env`ファイルを作成：
```env
JWT_SECRET=your-secret-key
MONGODB_URI=mongodb://localhost:27017/threads_system
NODE_ENV=development
PORT=3000
```

## 📡 API エンドポイント

- `GET /` - ヘルスチェック
- `POST /api/auth/login` - ログイン
- `POST /api/auth/register` - ユーザー登録
- `GET /api/auth/verify` - トークン検証

## 🚀 デプロイ

mainブランチにプッシュすると自動でRenderにデプロイされます：

```bash
git add .
git commit -m "Update feature"
git push origin main
```

## 📝 ライセンス

MIT