# 🚀 Google Apps Script Web App デプロイガイド

## 📋 事前準備
- Googleアカウント
- Google Drive アクセス
- 作成済みのCSVファイル

---

## 📝 STEP 1: Google スプレッドシート作成（3分）

### 1.1 スプレッドシート作成
1. [Google Drive](https://drive.google.com) を開く
2. **新規** → **Google スプレッドシート** をクリック
3. シート名を **「THREADS_SYSTEM_MAIN」** に変更

### 1.2 CSVデータのインポート
各CSVファイルを以下の手順でインポート：

1. **ファイル** → **インポート** をクリック
2. **アップロード** タブを選択
3. CSVファイルをドラッグ＆ドロップ
4. インポート設定：
   - インポート場所: **現在のシートを置換する**
   - 区切り文字: **自動検出**
5. **データをインポート** をクリック
6. シート名を以下のように変更：

| CSVファイル | シート名 |
|------------|---------|
| 01_USERS.csv | USERS |
| 02_POSTS.csv | POSTS |
| 03_ANALYTICS.csv | ANALYTICS |
| 04_SCHEDULES.csv | SCHEDULES |
| 05_CONFIG.csv | CONFIG |

---

## 🔧 STEP 2: Apps Script プロジェクト設定（5分）

### 2.1 Apps Scriptを開く
1. スプレッドシートで **拡張機能** → **Apps Script** をクリック
2. 新しいタブでスクリプトエディタが開く

### 2.2 ファイル構成
以下のファイルを作成：

```
Apps Script プロジェクト/
├── Code.gs          (メイン処理)
├── login.html       (ログイン画面)
├── dashboard.html   (ダッシュボード)
├── sidebar.html     (共通サイドバー)
├── styles.html      (共通スタイル)
└── scripts.html     (共通スクリプト)
```

### 2.3 ファイル作成方法
1. **＋** ボタン → **HTML** を選択
2. ファイル名を入力（拡張子なし）
3. `/gas_webapp/` フォルダの内容をコピー＆ペースト

### 2.4 スプレッドシートID設定
`Code.gs` の以下の部分を編集：

```javascript
const APP_CONFIG = {
  APP_NAME: 'TRUE ULTIMATE THREADS SYSTEM',
  VERSION: '2.0',
  SESSION_TIMEOUT: 30 * 60 * 1000,
  SHEET_ID: 'YOUR_SPREADSHEET_ID_HERE' // ← ここにスプレッドシートIDを入力
};
```

スプレッドシートIDの取得方法：
- スプレッドシートのURLから取得
- 例: `https://docs.google.com/spreadsheets/d/[ここがID]/edit`

---

## 🌐 STEP 3: Webアプリとして公開（2分）

### 3.1 デプロイ設定
1. Apps Scriptエディタで **デプロイ** → **新しいデプロイ** をクリック
2. 歯車アイコン → **ウェブアプリ** を選択

### 3.2 設定項目
- **説明**: THREADS SYSTEM Ver2.0
- **実行ユーザー**: **自分**
- **アクセスできるユーザー**: **自分のみ** または **全員**（用途に応じて）

### 3.3 デプロイ実行
1. **デプロイ** ボタンをクリック
2. 権限の承認画面が表示されたら承認
3. **ウェブアプリのURL** をコピー

---

## ✅ STEP 4: 動作確認

### 4.1 アクセステスト
1. コピーしたURLをブラウザで開く
2. ログイン画面が表示されることを確認

### 4.2 ログインテスト
デフォルトのテストアカウント：
- ユーザー名: `johndoe`
- パスワード: `password123`

### 4.3 自動化トリガー設定
Apps Scriptで追加のトリガー設定：

1. 時計アイコン（トリガー）をクリック
2. **トリガーを追加** をクリック
3. 以下を設定：
   - 実行する関数: `autoPublishPosts`
   - イベントのソース: **時間主導型**
   - 時間ベースのトリガー: **分ベースのタイマー** → **5分ごと**

---

## 🔐 セキュリティ設定（オプション）

### パスワードのハッシュ化
USERSシートのpassword_hash列を更新：

```javascript
function hashPassword(password, salt) {
  const hash = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA256,
    password + salt
  );
  return hash.map(byte => 
    ('0' + (byte & 0xFF).toString(16)).slice(-2)
  ).join('');
}
```

### カスタムドメイン設定
1. Google Workspace管理コンソールにアクセス
2. **アプリ** → **Google Workspace** → **Sites**
3. カスタムURLを設定

---

## 🚨 トラブルシューティング

### エラー: "承認が必要です"
1. **詳細** をクリック
2. **安全でないページに移動** をクリック
3. 権限を承認

### エラー: "スクリプトが見つかりません"
- ファイル名が正確か確認
- include()関数の引数を確認

### データが表示されない
1. スプレッドシートのシート名を確認
2. Apps ScriptでSHEET_NAMESを確認
3. 実行ログを確認（表示 → ログ）

---

## 📊 パフォーマンス最適化

### キャッシュ設定
```javascript
const cache = CacheService.getScriptCache();
cache.put('key', 'value', 600); // 10分キャッシュ
```

### バッチ処理
```javascript
// 複数行を一度に更新
sheet.getRange(1, 1, data.length, data[0].length).setValues(data);
```

---

## 🎉 完成！

これでThreads System Web Appのデプロイが完了です。

アクセスURL: `https://script.google.com/macros/s/[YOUR_SCRIPT_ID]/exec`

### 次のステップ
1. ✅ 実データでテスト
2. ✅ ユーザーアカウント追加
3. ✅ 投稿スケジュール設定
4. ✅ 分析データ確認

---

## 📝 メンテナンス

### コード更新時
1. Apps Scriptで編集
2. **デプロイ** → **デプロイを管理**
3. **編集** → **新バージョン**

### データバックアップ
- スプレッドシートを定期的にダウンロード
- Google Driveで自動バックアップ設定

---

## 💡 Tips

- デバッグ: `console.log()` の代わりに `Logger.log()` を使用
- テスト: Apps Scriptエディタで関数を直接実行可能
- 監視: Google Cloud ConsoleでAPIクォータを確認

---

**作成日**: 2024年1月
**バージョン**: 2.0
**サポート**: GitHub Issues