# MongoDB インストールガイド（Windows版）

## 📦 方法1: MongoDB Community Server（推奨・ローカル版）

### Step 1: ダウンロード
1. **MongoDB公式サイトにアクセス**
   - URL: https://www.mongodb.com/try/download/community
   - 「Download」ボタンをクリック
   - Version: 最新版（7.0以上）
   - Platform: Windows
   - Package: MSI

### Step 2: インストール
1. ダウンロードした `.msi` ファイルを実行
2. 「Next」をクリック
3. ライセンス同意 → 「Next」
4. Setup Type: **「Complete」を選択**
5. Service Configuration:
   - ☑ Install MongoDB as a Service（チェックを入れる）
   - Service Name: MongoDB（デフォルト）
   - Data Directory: デフォルトでOK
   - Log Directory: デフォルトでOK
6. MongoDB Compass（GUI管理ツール）:
   - ☑ Install MongoDB Compass（推奨）
7. 「Install」をクリック
8. インストール完了後「Finish」

### Step 3: 動作確認
新しいコマンドプロンプトで：
```cmd
# MongoDBのバージョン確認
mongod --version

# MongoDBシェルを起動（別の方法）
mongosh
```

もし`mongod`が認識されない場合は、環境変数PATHに追加が必要です：
```
C:\Program Files\MongoDB\Server\7.0\bin
```

---

## 🌐 方法2: MongoDB Atlas（クラウド版・無料）

MongoDBのインストールが難しい場合は、クラウド版を使うこともできます。

### Step 1: アカウント作成
1. https://www.mongodb.com/cloud/atlas/register にアクセス
2. 無料アカウントを作成
3. メール認証を完了

### Step 2: クラスター作成
1. 「Build a Database」をクリック
2. **「M0 FREE」プラン**を選択（無料）
3. Provider: AWS
4. Region: ap-northeast-1 (Tokyo)
5. Cluster Name: threads-cluster
6. 「Create」をクリック

### Step 3: 接続設定
1. Database Access → Add New Database User
   - Username: `threadsuser`
   - Password: `自動生成` or 任意のパスワード
   - 「Add User」をクリック

2. Network Access → Add IP Address
   - 「Allow Access from Anywhere」をクリック（開発用）
   - または現在のIPアドレスを追加

3. Database → Connect → Drivers
   - 接続文字列をコピー：
   ```
   mongodb+srv://threadsuser:<password>@threads-cluster.xxxxx.mongodb.net/threads_system?retryWrites=true&w=majority
   ```

### Step 4: バックエンドの設定変更
`.env`ファイルを作成：
```env
MONGODB_URI=mongodb+srv://threadsuser:パスワード@threads-cluster.xxxxx.mongodb.net/threads_system?retryWrites=true&w=majority
```

`server.js`を修正：
```javascript
// MongoDB接続
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/threads_system';
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
```

---

## 🚀 すぐに始める方法（最速）

### オプション1: ローカルMongoDBの簡易インストール

1. **MongoDB Compassをダウンロード**（GUI付き）
   - https://www.mongodb.com/try/download/compass
   - インストール後、自動的にローカルMongoDBも設定される場合があります

2. **MongoDB Compassを起動**
   - 「New Connection」
   - 接続文字列: `mongodb://localhost:27017`
   - 「Connect」をクリック

### オプション2: Docker使用（Dockerインストール済みの場合）
```cmd
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

---

## ✅ インストール後の確認

### 1. サーバー再起動
```cmd
cd backend
npm run dev
```

成功すると：
```
✅ MongoDB connected successfully
```

### 2. 初期ユーザー作成
新しいコマンドプロンプトで：
```cmd
cd backend
node scripts/createInitialUsers.js
```

出力例：
```
初期ユーザーデータを作成中...

✅ ユーザー作成完了: admin
   - Email: admin@example.com
   - Password: admin123
   - Role: admin
```

### 3. APIテスト
ブラウザで `backend/test-api.html` を開く
- 接続テストボタンをクリック
- ログインテスト（admin/admin123）

---

## ❌ トラブルシューティング

### エラー: connect ECONNREFUSED ::1:27017

**原因**: MongoDBサービスが起動していない

**解決方法**:
```cmd
# Windowsサービスを確認
services.msc

# MongoDBサービスを探して「開始」

# またはコマンドで起動
net start MongoDB
```

### エラー: 'mongod' is not recognized

**原因**: 環境変数PATHに追加されていない

**解決方法**:
1. システムのプロパティ → 環境変数
2. システム環境変数のPathを編集
3. 新規追加: `C:\Program Files\MongoDB\Server\7.0\bin`
4. コマンドプロンプトを再起動

### エラー: Authentication failed

**原因**: ユーザー名/パスワードが間違っている

**解決方法**:
```cmd
# 初期ユーザーを再作成
node scripts/createInitialUsers.js
```

---

## 📝 まとめ

### 推奨: MongoDB Community Server
- **メリット**: 完全無料、高速、ローカル開発に最適
- **デメリット**: インストールが必要
- **所要時間**: 10分

### 代替: MongoDB Atlas
- **メリット**: インストール不要、どこからでもアクセス可能
- **デメリット**: インターネット接続必須、初期設定がやや複雑
- **所要時間**: 15分

どちらを選んでも、バックエンドは正常に動作します！

---

## 🎯 今すぐやること

1. **MongoDB Community Serverをダウンロード**
   - https://www.mongodb.com/try/download/community
   - MSIファイルを実行してインストール

2. **インストール完了後、サーバー再起動**
   ```cmd
   cd backend
   npm run dev
   ```

3. **「✅ MongoDB connected successfully」が表示されたら成功！**