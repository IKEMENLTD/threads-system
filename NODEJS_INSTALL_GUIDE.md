# Node.js インストールガイド（Windows版）

## 📦 Node.jsのインストール手順

### Step 1: Node.jsをダウンロード

1. **Node.js公式サイトにアクセス**
   - URL: https://nodejs.org/
   - 「LTS版」（推奨版）をダウンロード
   - 現在の推奨: Node.js 20.x LTS

2. **インストーラーを実行**
   - ダウンロードした `.msi` ファイルをダブルクリック
   - 「Next」をクリック
   - ライセンス同意にチェック → 「Next」
   - インストール先はデフォルトでOK → 「Next」
   - **重要**: 「Add to PATH」にチェックが入っていることを確認
   - 「Install」をクリック
   - 管理者権限を求められたら「はい」

### Step 2: インストール確認

**新しいコマンドプロンプトを開いて**確認：
```cmd
# コマンドプロンプトを新規で開く（重要！）
# Windowsキー + R → cmd → Enter

# Node.jsのバージョン確認
node --version

# npmのバージョン確認  
npm --version
```

正常にインストールされていれば、バージョン番号が表示されます：
- node: v20.x.x
- npm: 10.x.x

---

## 🔧 インストール後の作業

### 1. フォルダ構造を修正

現在、backendフォルダが二重になっているので修正：

```cmd
# 現在の位置を確認
cd C:\Users\RN-事務所\Downloads\Threads自動ツールVer003

# 二重になったbackendフォルダを削除
rmdir /s backend

# 新しくbackendフォルダを作成
mkdir backend
cd backend
```

### 2. プロジェクトの初期化

```cmd
# package.jsonを作成
npm init -y

# 必要なパッケージをインストール（1行で実行）
npm install express mongoose dotenv cors jsonwebtoken bcryptjs

# 開発用パッケージをインストール
npm install -D nodemon
```

### 3. 基本的なserver.jsを作成

```cmd
# server.jsファイルを作成
echo. > server.js
```

メモ帳でserver.jsを開いて、以下のコードを貼り付け：

```javascript
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// ミドルウェア
app.use(cors());
app.use(express.json());

// テストルート
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Backend is working!',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Test API: http://localhost:${PORT}/api/test`);
});
```

### 4. package.jsonにスクリプトを追加

package.jsonを開いて、scriptsセクションを以下に変更：

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  }
}
```

### 5. サーバーを起動

```cmd
# 開発モードで起動
npm run dev
```

成功すると以下が表示されます：
```
[nodemon] starting `node server.js`
Server running on http://localhost:3000
Test API: http://localhost:3000/api/test
```

### 6. 動作確認

ブラウザで以下のURLにアクセス：
- http://localhost:3000/api/test

以下のようなJSONが表示されれば成功：
```json
{
  "message": "Backend is working!",
  "timestamp": "2024-01-20T10:00:00.000Z"
}
```

---

## ❌ トラブルシューティング

### 問題1: node/npmコマンドが認識されない

**解決方法:**
1. コマンドプロンプトを完全に閉じて、新しく開く
2. それでもダメな場合は、PCを再起動
3. 環境変数PATHにNode.jsが追加されているか確認

### 問題2: npm installでエラーが出る

**解決方法:**
```cmd
# npmキャッシュをクリア
npm cache clean --force

# 再度インストール
npm install
```

### 問題3: ポート3000が使用中

**解決方法:**
server.jsのPORTを変更：
```javascript
const PORT = process.env.PORT || 3001;  // 3001に変更
```

### 問題4: MongoDBエラー

MongoDBはまだインストールしていないので、今は無視してOK。
後で別途インストールガイドを用意します。

---

## ✅ 次のステップ

Node.jsのインストールが完了したら：

1. **MongoDB のインストール**
   - MongoDB Community Server をインストール
   - または MongoDB Atlas（クラウド版）を使用

2. **基本的なAPIの実装**
   - ユーザー認証
   - 投稿管理

3. **フロントエンドとの連携**
   - APIクライアントの作成
   - ローカルストレージからAPIへの移行

---

## 📝 コマンドまとめ（コピペ用）

```cmd
:: Node.jsインストール後、新しいコマンドプロンプトで実行

:: 1. フォルダ移動
cd C:\Users\RN-事務所\Downloads\Threads自動ツールVer003

:: 2. backendフォルダ作成
mkdir backend
cd backend

:: 3. プロジェクト初期化
npm init -y

:: 4. パッケージインストール（1行で）
npm install express mongoose dotenv cors jsonwebtoken bcryptjs

:: 5. nodemonインストール
npm install -D nodemon

:: 6. サーバー起動
npm run dev
```

---

## 🎯 今すぐやること

1. **Node.js公式サイト** (https://nodejs.org/) からLTS版をダウンロード
2. インストーラーを実行（デフォルト設定でOK）
3. **新しいコマンドプロンプトを開く**（重要！）
4. `node --version` で確認
5. 上記のコマンドを順番に実行

インストール完了後、約10分でバックエンドサーバーが起動します！