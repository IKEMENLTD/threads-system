# 🔐 ログイン方法

## 📋 テストアカウント

### 1. 管理者アカウント
- **Email**: `admin@threads.com`
- **Password**: `password123`
- **権限**: 管理者

### 2. 一般ユーザー
- **Email**: `user1@test.com` ～ `user4@test.com`
- **Password**: `password123`（全て同じ）
- **権限**: 一般ユーザー

## 🚀 アカウント作成手順

### 1. Supabaseでアカウント作成
1. **https://wzxsjluhwqomdvemwaet.supabase.co** にアクセス
2. **SQL Editor** をクリック
3. `create-test-users.sql` の内容をコピー＆ペースト
4. **Run** をクリック
5. 5つのアカウントが作成される

### 2. または新規登録
1. `https://threads-system.onrender.com/login.html`
2. 「新規登録」をクリック
3. 好きなメール・ユーザー名・パスワードを入力
4. アカウント作成

## 🎯 ログイン後の動作

### 成功時
- ダッシュボードにリダイレクト
- JWT トークンがローカルストレージに保存
- API リクエストで認証情報付与

### エラー時
- エラーメッセージ表示
- フォームが空になる

## 🔧 デバッグ方法

### ブラウザコンソールで確認
```javascript
// ログイン状態確認
localStorage.getItem('threads_system_session')

// API テスト
fetch('https://threads-system.onrender.com/api/auth/verify', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('threads_system_session')
  }
}).then(res => res.json()).then(console.log)
```

### 直接API テスト
```bash
curl -X POST https://threads-system.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@threads.com","password":"password123"}'
```

## ✅ 動作確認済み
- フロントエンド: ✅ 表示
- バックエンドAPI: ✅ 接続
- Supabase: ✅ 接続
- 認証システム: ✅ 準備完了

**`password123` ですべてのテストアカウントにログインできます！**