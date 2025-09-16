# データベースセットアップガイド

## 📊 現在の実装状況

### ✅ 完了した実装
1. **完全なデータベーススキーマ** (`complete-schema.sql`)
   - users テーブル（ユーザー管理）
   - posts テーブル（投稿管理）
   - hashtags テーブル（ハッシュタグ）
   - media テーブル（メディアファイル）
   - analytics テーブル（分析データ）
   - 関連テーブル（post_hashtags, post_media）

2. **データベース接続モジュール** (`backend/database.js`)
   - PostgreSQL接続
   - CRUD操作の実装
   - トランザクション処理
   - エラーハンドリング

3. **バックエンドAPI統合** (`backend/server.js`)
   - データベースを使用したAPI実装
   - 認証システム（bcrypt使用）
   - 投稿管理機能

## 🚀 セットアップ手順

### 1. PostgreSQLのインストール
```bash
# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib

# macOS
brew install postgresql

# Windows
# PostgreSQLの公式サイトからインストーラーをダウンロード
```

### 2. データベース作成
```bash
# PostgreSQLにログイン
psql -U postgres

# データベース作成
CREATE DATABASE threads_system;

# ユーザー作成（オプション）
CREATE USER threads_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE threads_system TO threads_user;
```

### 3. テーブル作成
```bash
# スキーマファイルを実行
psql -U postgres -d threads_system -f database/complete-schema.sql
```

### 4. 環境変数設定
`.env`ファイルを作成：
```env
# ローカルPostgreSQL
DATABASE_URL=postgresql://postgres:password@localhost:5432/threads_system

# または Supabase使用時
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_DB_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
```

### 5. 依存パッケージインストール
```bash
npm install pg bcryptjs
```

### 6. サーバー起動
```bash
npm start
```

## 📋 カラム詳細を確認

データベースの全カラム情報を表示：
```bash
psql -U postgres -d threads_system -f database/show-all-columns.sql
```

## 🗂️ テーブル構造

### users テーブル
| カラム名 | 型 | 説明 |
|---------|-----|------|
| id | UUID | プライマリキー |
| email | VARCHAR(255) | メールアドレス（ユニーク） |
| username | VARCHAR(100) | ユーザー名（ユニーク） |
| password_hash | VARCHAR(255) | パスワードハッシュ |
| threads_access_token | TEXT | Threads APIトークン |
| created_at | TIMESTAMP | 作成日時 |

### posts テーブル
| カラム名 | 型 | 説明 |
|---------|-----|------|
| id | UUID | プライマリキー |
| user_id | UUID | ユーザーID（外部キー） |
| title | VARCHAR(200) | タイトル |
| content | TEXT | 投稿内容 |
| status | VARCHAR(20) | ステータス |
| scheduled_at | TIMESTAMP | 予約投稿日時 |
| threads_post_id | VARCHAR(100) | Threads投稿ID |

## 🔧 トラブルシューティング

### データベース接続エラー
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
→ PostgreSQLが起動していることを確認

### 認証エラー
```
error: password authentication failed for user
```
→ `.env`のデータベース認証情報を確認

### テーブルが存在しない
```
error: relation "posts" does not exist
```
→ `complete-schema.sql`を実行してテーブルを作成

## 📝 次のステップ

1. **Supabase接続**
   - Supabaseプロジェクトを作成
   - 接続URLを`.env`に設定

2. **本番環境デプロイ**
   - Renderの環境変数にDATABASE_URLを設定
   - マイグレーションスクリプトの実行

3. **Python連携**
   - Threads API接続用Pythonスクリプト作成
   - 自動投稿スケジューラー実装