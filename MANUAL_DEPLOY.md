# 🚀 手動デプロイ手順

## 現在の状況
- 最新コミット（ランタイムビルド修正）がプッシュされていません
- Renderは古いコードでデプロイを継続

## 📋 今すぐやること

### 1. GitHubにプッシュ
```bash
git push origin main
```
**または** GitHub Desktop を使用

### 2. Renderで手動デプロイ
もしプッシュができない場合：

1. **https://dashboard.render.com** にログイン
2. threads-system サービスを選択
3. 右上の「Manual Deploy」をクリック
4. 「Deploy latest commit」を選択

## 🎯 修正内容（コミット 0c9408c）

```json
"scripts": {
  "start": "npm run build && node server.js"
}
```

### 期待される動作
1. サーバー起動時に `npm run build` が実行される
2. フロントエンドファイルがpublic/にコピーされる  
3. ENOENTエラーが解消される

## ✅ 確認方法

プッシュ後、Renderログで以下を確認：
```
> npm run build && node server.js
```

この行が表示されればビルドが実行されます。

## 🔧 代替案（緊急時）

プッシュできない場合の最終手段：
1. Render Dashboard → Settings
2. Build Command を変更：
   ```
   npm install && mkdir -p public && cp -r ../*.html ../css ../js ../assets public/
   ```
3. Manual Deploy実行