# 🗄️ Supabase セットアップガイド

Threads自動化システムをSupabaseと連携する手順です。

## 📋 前提条件

- Supabaseアカウント (https://supabase.com)
- プロジェクトの環境変数が設定済み

## 🔧 Supabaseプロジェクト設定

### 1. 新しいプロジェクト作成

1. **Supabase Dashboard**にログイン
2. **「New project」**をクリック
3. プロジェクト情報を入力:
   - **Name**: `threads-automation`
   - **Database Password**: 強力なパスワードを設定
   - **Region**: `Southeast Asia (Singapore)`

### 2. データベーススキーマ作成

#### SQL Editorで実行

1. **「SQL Editor」**を開く
2. **「database/complete-schema.sql」**の内容をコピー
3. 実行して基本テーブルを作成
4. **「database/supabase-init.sql」**の内容をコピー
5. 実行してSupabase特有の設定を適用

#### ⚠️ 重要な注意点

- **JavaScript式コメント (`//`) は使用禁止**
- **SQL式コメント (`--`) のみ使用**
- エラー: `syntax error at or near "//"`が出る場合は、`//`を`--`に変更

### 3. 環境変数の確認

以下の値を確認・コピー:

```
SUPABASE_URL=https://qjjnkclpqpybnnjswlhq.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🔐 認証設定

### Row Level Security (RLS)

すべてのテーブルでRLSが有効化されています:

```sql
-- ユーザーは自分のデータのみアクセス可能
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

-- 投稿は作成者のみアクセス可能
CREATE POLICY "Users can view own posts" ON posts
    FOR SELECT USING (auth.uid()::text = user_id::text);
```

### 認証プロバイダー設定

1. **Authentication** → **Providers**
2. **Email** を有効化
3. 必要に応じて **Google**, **GitHub** も有効化

## 📊 データベース接続

### Node.js Backend

```javascript
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);
```

### Python WebSocket Server

```python
# requirements_browser.txt に追加
supabase==1.0.3

# Python コード
from supabase import create_client
supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_KEY")
)
```

## 🚀 Render デプロイ設定

### render.yaml 設定完了

既に以下の環境変数が設定済み:

```yaml
envVars:
  - key: SUPABASE_URL
    value: https://qjjnkclpqpybnnjswlhq.supabase.co
  - key: SUPABASE_ANON_KEY
    value: eyJhbGciOiJIUzI1NiIs...
  - key: SUPABASE_SERVICE_KEY
    value: eyJhbGciOiJIUzI1NiIs...
```

### デプロイ手順

1. GitHubにプッシュ
2. Renderで自動デプロイ開始
3. 環境変数が自動的に適用

## 🔍 トラブルシューティング

### SQL構文エラー

**問題**: `ERROR: 42601: syntax error at or near "//"`

**解決策**:
```sql
-- ❌ JavaScript式コメント (使用禁止)
// Supabase クライアントの初期化

-- ✅ SQL式コメント (正しい)
-- Supabase クライアントの初期化
```

### 接続エラー

**問題**: `Database connection failed`

**確認事項**:
1. `SUPABASE_URL` が正しい
2. `SUPABASE_SERVICE_KEY` が正しい
3. プロジェクトが一時停止していないか

### RLS エラー

**問題**: `Row Level Security policy violation`

**解決策**:
```sql
-- 一時的にRLSを無効化 (開発時のみ)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 本番環境では適切なポリシーを設定
```

## 📈 監視・メンテナンス

### ダッシュボード確認

1. **Database** → **Tables**: テーブル状態確認
2. **Database** → **Logs**: クエリログ確認
3. **Settings** → **API**: 接続情報確認

### パフォーマンス最適化

```sql
-- インデックス作成
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_status ON posts(status);

-- 統計情報更新
ANALYZE;
```

## 🔄 バックアップ

### 自動バックアップ

- Supabaseが自動的にバックアップを作成
- **Settings** → **Database** → **Backups**で確認

### 手動バックアップ

```bash
# pg_dump を使用
pg_dump "postgresql://postgres:password@db.host.supabase.co:5432/postgres" > backup.sql
```

---

**注意**: 本番環境では必ずRLSを有効化し、適切なセキュリティポリシーを設定してください。