# 🚀 RenderでフロントエンドをデプロイDる手順

## 📋 今すぐやること（5分で完了）

### 1. GitHubにプッシュ
```bash
# コミット済みなので、プッシュのみ
git push -u origin main
```
※GitHub Desktopでも可

### 2. RenderでStatic Siteを作成

1. **https://dashboard.render.com** にログイン
2. 「New +」→「**Static Site**」をクリック
3. GitHubリポジトリ「**threads-system**」を選択
4. 以下を設定：

```
Name: threads-system-frontend
Branch: main
Root Directory: （空欄のまま）
Build Command: （空欄のまま）
Publish Directory: .
```

5. 「Create Static Site」をクリック

### 3. 環境変数（不要）
Static Siteなので環境変数は不要。
APIのURLは`config.js`で自動判定されます。

### 4. デプロイ完了を待つ（2-3分）

---

## ✅ 確認

### フロントエンド URL
```
https://threads-system-frontend.onrender.com
```

### バックエンド URL（稼働中）
```
https://threads-system.onrender.com
```

### API接続テスト
フロントエンドを開いてブラウザのコンソールで：
```javascript
fetch('https://threads-system.onrender.com/api/health')
  .then(res => res.json())
  .then(console.log)
```

---

## 🎉 完成！

1. **アクセス**: https://threads-system-frontend.onrender.com
2. **ログインページ**: `/login.html`
3. **テストユーザー作成**:
   - 登録ページでアカウント作成
   - またはAPIで直接作成

---

## 📝 メモ

- Renderの無料プランは15分アクセスがないとスリープ
- 初回アクセス時は起動に30秒程度かかる場合がある
- Static Siteは常に高速でレスポンス