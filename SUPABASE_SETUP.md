# Supabase セットアップ完全ガイド

## 📋 今すぐやること（5分で完了）

### 1. Supabaseプロジェクト作成（2分）

1. **https://supabase.com** にアクセス
2. 「Start your project」をクリック
3. GitHubでログイン（推奨）またはメールで登録
4. 「New project」をクリック
5. 以下を入力：
   - **Name**: threads-auto-tool
   - **Database Password**: 強力なパスワードを生成（保存しておく）
   - **Region**: Northeast Asia (Tokyo) を選択
6. 「Create new project」をクリック

### 2. SQLスキーマ実行（1分）

プロジェクトが作成されたら：

1. 左メニューから「**SQL Editor**」をクリック
2. 「+ New query」をクリック
3. `supabase-minimal-schema.sql`の内容を全てコピー
4. エディタにペースト
5. 「**Run**」をクリック（右下の緑ボタン）

### 3. API Keys取得（1分）

1. 左メニューの「**Settings**」をクリック
2. 「**API**」セクションを選択
3. 以下をコピー：
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public**: `eyJhbGc...`（公開キー）
   - **service_role**: `eyJhbGc...`（サービスキー - secretタブ内）

### 4. Render環境変数設定（1分）

Renderダッシュボードで：

1. あなたのサービスを選択
2. 「**Environment**」タブをクリック
3. 以下を追加：

```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...（anonキー）
SUPABASE_SERVICE_KEY=eyJhbGc...（service_roleキー）
JWT_SECRET=your-super-secret-jwt-key-change-this
NODE_ENV=production
PORT=10000
```

4. 「**Save Changes**」をクリック
5. サービスが自動的に再デプロイされる

---

## 🧪 接続テスト

### ローカルでテスト（オプション）

```bash
# .envファイル作成
cd backend
echo "SUPABASE_URL=https://xxxxx.supabase.co" >> .env
echo "SUPABASE_ANON_KEY=eyJhbGc..." >> .env
echo "SUPABASE_SERVICE_KEY=eyJhbGc..." >> .env

# デバッグツール実行
node database-debug.js
```

### Renderでテスト

デプロイ完了後：
```
https://your-app.onrender.com/api/health
```

成功時のレスポンス：
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2024-01-09T..."
}
```

---

## ✅ チェックリスト

- [ ] Supabaseアカウント作成済み
- [ ] プロジェクト作成済み（threads-auto-tool）
- [ ] SQLスキーマ実行済み（6テーブル作成）
- [ ] API Keys取得済み（3つ全て）
- [ ] Render環境変数設定済み（5つ全て）
- [ ] 自動デプロイ完了
- [ ] ヘルスチェック成功

---

## 🚨 トラブルシューティング

### Q: SQLエラーが出る
A: `supabase-minimal-schema.sql`を使用。複雑な方は使わない。

### Q: 接続エラー
A: 環境変数のキーが正しくコピーされているか確認。特に改行や空白に注意。

### Q: Renderが起動しない
A: ログを確認：Dashboard → Logs。環境変数が全て設定されているか確認。

### Q: データベースが空
A: SQL Editorで確認：
```sql
SELECT * FROM users LIMIT 1;
```

---

## 📝 確認用コマンド

Supabase SQL Editorで実行：

```sql
-- テーブル一覧
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- カラム確認
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users';
```

完了したら教えてください！