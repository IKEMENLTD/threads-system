# ログインページ（index.html）要件定義書

## 1. ページ概要

### 1.1 目的
TRUE ULTIMATE THREADS SYSTEMへの安全な認証エントリーポイントを提供し、ユーザー認証とセッション管理を行う。

### 1.2 URL
- `/index.html`
- システムのデフォルトランディングページ
- 非認証時の自動リダイレクト先

### 1.3 アクセス権限
- パブリックアクセス可能
- 既にログイン済みの場合は自動的にdashboard.htmlへリダイレクト

---

## 2. レイアウト構造

### 2.1 基本構造
```
┌──────────────────────────────────────────────────────┐
│                   背景装飾エリア                        │
│  ┌──────────────────────────────────────────────┐     │
│  │              ログインカード                    │     │
│  │  ┌────────────────────────────────────────┐  │     │
│  │  │            ヘッダー                     │  │     │
│  │  │     TRUE ULTIMATE THREADS SYSTEM      │  │     │
│  │  ├────────────────────────────────────────┤  │     │
│  │  │          ログインフォーム                │  │     │
│  │  │    [U] ユーザー名入力                   │  │     │
│  │  │    [P] パスワード入力 [●]               │  │     │
│  │  │    ☐ ログイン状態を保持する             │  │     │
│  │  │    [→ ログイン]                       │  │     │
│  │  ├────────────────────────────────────────┤  │     │
│  │  │            フッター                     │  │     │
│  │  │        デモ用アカウント情報              │  │     │
│  │  └────────────────────────────────────────┘  │     │
│  └──────────────────────────────────────────────┘     │
│                 装飾用アニメーション円                   │
└──────────────────────────────────────────────────────┘
```

### 2.2 レスポンシブブレークポイント

#### モバイル (max-width: 480px)
- ログインカード: 横幅90%、最大350px
- フォントサイズ: 14px基準
- パディング: 1.5rem
- 入力フィールド: 100%幅

#### タブレット (max-width: 768px)
- ログインカード: 横幅80%、最大400px
- パディング: 2rem
- 背景装飾: 縮小表示

#### デスクトップ (min-width: 769px)
- ログインカード: 固定幅450px
- パディング: 2.5rem
- 背景装飾: フル表示

---

## 3. コンポーネント詳細

### 3.1 ログインカード

#### 3.1.1 ヘッダー部
```html
<header class="login-header">
    <div class="logo-wrapper">
        <h1 class="system-title">
            <span class="title-main">TRUE ULTIMATE</span>
            <span class="title-sub">THREADS SYSTEM</span>
        </h1>
    </div>
    <p class="system-description">セキュアシステムアクセス</p>
</header>
```

**スタイル仕様:**
- 背景: グラデーション（#000000 → #2a2a2a）
- フォント: システムフォント
- title-main: 24px、bold、白色
- title-sub: 18px、normal、#9ca3af

#### 3.1.2 ログインフォーム

##### ユーザー名フィールド
```html
<div class="form-group">
    <label for="username" class="form-label">
        <span class="label-text">ユーザー名</span>
        <span class="required-indicator" aria-label="必須">*</span>
    </label>
    <div class="input-wrapper">
        <span class="input-icon">U</span>
        <input type="text" id="username" name="username" 
               class="form-input"
               placeholder="ユーザー名を入力"
               required
               autocomplete="username"
               aria-required="true"
               aria-describedby="username-error">
    </div>
    <span class="error-message" id="username-error" 
          role="alert" aria-live="polite"></span>
</div>
```

**検証ルール:**
- 必須フィールド
- 最小文字数: 3文字
- 使用可能文字: 英数字とアンダースコア（^[a-zA-Z0-9_]+$）
- リアルタイム検証（入力時）

##### パスワードフィールド
```html
<div class="form-group">
    <label for="password" class="form-label">
        <span class="label-text">パスワード</span>
        <span class="required-indicator">*</span>
    </label>
    <div class="input-wrapper">
        <span class="input-icon">P</span>
        <input type="password" id="password" name="password"
               class="form-input"
               placeholder="パスワードを入力"
               required
               autocomplete="current-password"
               aria-required="true"
               aria-describedby="password-error">
        <button type="button" class="password-toggle" 
                id="passwordToggle"
                aria-label="パスワードを表示">
            <span class="toggle-icon">●</span>
        </button>
    </div>
    <span class="error-message" id="password-error"
          role="alert" aria-live="polite"></span>
</div>
```

**検証ルール:**
- 必須フィールド
- 最小文字数: 6文字（デモモードでは例外あり）
- パスワード表示/非表示トグル機能

##### チェックボックス
```html
<div class="form-group checkbox-group">
    <label for="remember" class="checkbox-label">
        <input type="checkbox" id="remember" name="remember"
               class="checkbox-input">
        <span class="checkbox-custom"></span>
        <span class="checkbox-text">ログイン状態を保持する</span>
    </label>
</div>
```

**機能:**
- チェック時: 認証情報を30日間保存
- LocalStorageに暗号化して保存

##### 送信ボタン
```html
<button type="submit" class="submit-button" id="submitButton">
    <span class="button-icon">→</span>
    <span class="button-text">ログイン</span>
    <span class="button-loader" aria-hidden="true"></span>
</button>
```

**状態:**
- 通常: 黒背景、白文字
- ホバー: グラデーション背景
- 無効: opacity 0.5
- ローディング: スピナー表示

### 3.2 フッター部

#### 3.2.1 デモアカウント情報
```html
<footer class="login-footer">
    <div class="divider"></div>
    <div class="default-credentials">
        <p class="credentials-title">デモ用アカウント</p>
        <div class="credentials-info">
            <div class="credential-item">
                <span class="credential-label">ユーザー名:</span>
                <code class="credential-value">demo</code>
            </div>
            <div class="credential-item">
                <span class="credential-label">パスワード:</span>
                <code class="credential-value">demo123</code>
            </div>
        </div>
        <button type="button" class="demo-fill-button" 
                onclick="fillDemoCredentials()">
            デモアカウントで自動入力
        </button>
    </div>
</footer>
```

**表示条件:**
- 開発環境のみ表示（localhost、127.0.0.1、file://）
- 本番環境では非表示

### 3.3 背景装飾

```html
<div class="background-decoration" aria-hidden="true">
    <div class="decoration-circle decoration-1"></div>
    <div class="decoration-circle decoration-2"></div>
    <div class="decoration-circle decoration-3"></div>
</div>
```

**アニメーション:**
- 3つの円がゆっくり回転
- CSS animation: rotate 20s/30s/25s linear infinite
- opacity: 0.1-0.3

---

## 4. 機能仕様

### 4.1 認証フロー

#### 4.1.1 処理順序
1. フォーム送信イベント
2. クライアントサイド検証
3. レート制限チェック
4. 認証処理（1秒の遅延でUX向上）
5. セッション作成
6. LocalStorage/SessionStorageへの保存
7. dashboard.htmlへリダイレクト

#### 4.1.2 認証方式
```javascript
// 本番環境アカウント
const accounts = [
    { username: 'admin', password: 'Admin@2025#Secure', role: 'administrator' },
    { username: 'testuser', password: 'Test@User2025!', role: 'user' },
    { username: 'demo', password: 'demo123', role: 'demo' }
];
```

### 4.2 バリデーション

#### 4.2.1 フロントエンド検証
| フィールド | ルール |
|-----------|-------|
| ユーザー名 | 必須、3文字以上、英数字+アンダースコア |
| パスワード | 必須、6文字以上 |

#### 4.2.2 エラーメッセージ
| エラー種別 | メッセージ |
|-----------|----------|
| 空のユーザー名 | ユーザー名を入力してください |
| 短いユーザー名 | ユーザー名は3文字以上で入力してください |
| 不正な文字 | 英数字とアンダースコアのみ使用できます |
| 空のパスワード | パスワードを入力してください |
| 短いパスワード | パスワードは6文字以上で入力してください |
| 認証失敗 | ユーザー名またはパスワードが正しくありません |
| レート制限 | ログイン試行が多すぎます。しばらく待ってからお試しください。|

### 4.3 セキュリティ機能

#### 4.3.1 レート制限
```javascript
// 設定値
MAX_LOGIN_ATTEMPTS: 5  // 最大試行回数
LOCKOUT_DURATION: 300000  // ロックアウト時間（5分）

// 実装
- ユーザー名ごとに試行回数を記録
- 5分以内に5回失敗でロックアウト
- MapオブジェクトでメモリにのみCSSS保存
```

#### 4.3.2 パスワードセキュリティ
- 入力値のマスキング
- コンソールログでのパスワード非表示
- パスワード表示トグル（ユーザーの明示的操作のみ）
- 送信後即座にフィールドクリア

#### 4.3.3 XSS/CSRF対策
- innerHTML使用禁止
- ユーザー入力値のエスケープ
- CSRFトークンの検証（本番環境）

### 4.4 セッション管理

#### 4.4.1 LocalStorage使用キー
| キー | 内容 | 形式 | 有効期限 |
|------|------|------|---------|
| threads_system_session | セッション情報 | JSON | 24時間 |
| threads_system_user | ユーザー情報 | JSON | - |
| is_logged_in | ログイン状態 | string | - |
| user_data | ユーザーデータ | JSON | - |
| session_token | セッショントークン | string | - |
| saved_username | 保存ユーザー名 | string（暗号化） | 30日 |
| saved_password | 保存パスワード | string（暗号化） | 30日 |

#### 4.4.2 セッション作成
```javascript
const sessionData = {
    user: userData,
    loginTime: Date.now(),
    lastActivity: Date.now(),
    expiresAt: Date.now() + (30 * 60 * 1000)  // 30分
};
```

---

## 5. UI/UXデザイン

### 5.1 カラーパレット
```css
--color-bg-main: #f3f4f6;  /* 背景 */
--color-card-bg: #ffffff;  /* カード背景 */
--color-primary: #000000;  /* プライマリ（黒） */
--color-secondary: #1a1a1a;  /* セカンダリ */
--color-error: #ef4444;  /* エラー赤 */
--color-success: #10b981;  /* 成功緑 */
--color-gray-text: #6b7280;  /* グレーテキスト */
--gradient-button: linear-gradient(135deg, #000000 0%, #4a4a4a 100%);
```

### 5.2 タイポグラフィ
```css
--font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto;
--font-size-base: 16px;
--font-size-small: 14px;
--font-size-large: 24px;
--line-height-base: 1.5;
```

### 5.3 アニメーション
```css
--transition-fast: 150ms ease;
--transition-base: 300ms ease;
--animation-shake: shake 500ms ease-in-out;
--animation-rotate: rotate 20s linear infinite;
```

#### アニメーション種類
- **フォーカス**: 入力フィールドの青枠表示
- **エラー**: フォームの横揺れ（shake）
- **ローディング**: ボタン内スピナー回転
- **背景**: 装飾円の回転

---

## 6. アクセシビリティ要件

### 6.1 ARIA属性
```html
<!-- 必須項目の明示 -->
aria-required="true"
aria-label="必須"

<!-- エラーメッセージの関連付け -->
aria-describedby="username-error"
role="alert"
aria-live="polite"

<!-- ボタン状態 -->
aria-expanded="false/true"
aria-hidden="true"  <!-- 装飾要素 -->
```

### 6.2 キーボード操作
| キー | 動作 |
|------|------|
| Tab | 次のフィールドへ移動 |
| Shift+Tab | 前のフィールドへ移動 |
| Enter | フォーム送信 |
| Space | チェックボックスのトグル |

### 6.3 スクリーンリーダー対応
- ラベルとフィールドの適切な関連付け
- エラーメッセージの即座の読み上げ
- 装飾要素の読み上げスキップ

---

## 7. パフォーマンス要件

### 7.1 ページロード
- First Contentful Paint: 1秒以内
- Time to Interactive: 1.5秒以内
- フォントはシステムフォント使用（追加ダウンロード不要）

### 7.2 最適化
- Critical CSS のインライン化
- JavaScript の遅延読み込み
- 画像なし（SVGアイコンのみ）

---

## 8. エラーハンドリング

### 8.1 エラー表示パターン
| レベル | 表示方法 | 色 |
|--------|---------|-----|
| フィールドエラー | 入力欄下部にメッセージ | 赤 |
| フォームエラー | フォーム下部にメッセージ | 赤 |
| システムエラー | トースト通知 | 赤 |
| 成功 | トースト通知 | 緑 |

### 8.2 エラー回復
- 入力時にリアルタイムで検証
- エラー修正時に即座にエラー表示をクリア
- フォーカス時に前回のエラーをクリア

---

## 9. テスト要件

### 9.1 機能テスト
- [ ] 正常ログイン（3種類のアカウント）
- [ ] 不正なユーザー名でのログイン失敗
- [ ] 不正なパスワードでのログイン失敗
- [ ] レート制限の動作確認
- [ ] パスワード表示/非表示トグル
- [ ] 記憶するチェックボックスの動作
- [ ] デモアカウント自動入力

### 9.2 UIテスト
- [ ] レスポンシブデザイン（3つのブレークポイント）
- [ ] フォーカス状態の視覚的フィードバック
- [ ] エラー表示の確認
- [ ] ローディング状態の表示
- [ ] アニメーションの動作

### 9.3 セキュリティテスト
- [ ] SQLインジェクション対策
- [ ] XSS対策
- [ ] CSRF対策（本番環境）
- [ ] パスワードの非表示確認

---

## 10. 依存関係

### 10.1 必須スクリプト（読み込み順序厳守）
```html
1. config.js              <!-- 設定 -->
2. common.js             <!-- 共通機能 -->
3. constants.js          <!-- 定数定義 -->
4. security-utils.js     <!-- セキュリティ -->
5. data-utils.js        <!-- データ処理 -->
6. ui-utils.js          <!-- UI制御 -->
7. input-validator.js    <!-- 入力検証 -->
8. storage-manager.js    <!-- ストレージ管理 -->
9. shared-state.js      <!-- 状態管理 -->
10. error-handler.js    <!-- エラー処理 -->
11. api-client.js       <!-- API通信 -->
12. form-validator.js   <!-- フォーム検証 -->
13. production-accounts.js  <!-- アカウント管理 -->
14. timer-cleanup.js    <!-- タイマー管理 -->
15. app-core.js        <!-- アプリコア -->
16. login.js           <!-- ログイン機能 -->
```

### 10.2 CSS依存
- styles.css（メインスタイル）
- responsive-fixes.css（レスポンシブ修正）
- z-index-fix.css（z-index修正）

---

## 11. 環境別設定

### 11.1 開発環境（localhost、127.0.0.1、file://）
- デモアカウント情報表示
- デバッグログ有効
- セッションチェック緩和
- DEMO_MODE_ENABLED: true

### 11.2 ステージング環境
- デモアカウント情報非表示
- デバッグログ有効
- 標準セッションチェック

### 11.3 本番環境
- デモアカウント情報非表示
- デバッグログ無効
- 厳格なセッションチェック
- HTTPS必須
- CSRFトークン検証

---

## 12. 今後の拡張予定

### 12.1 フェーズ2
- OAuth認証（Google、Twitter）
- 2要素認証
- パスワードリセット機能
- キャプチャ導入

### 12.2 フェーズ3
- 生体認証（指紋、顔認証）
- シングルサインオン（SSO）
- 多言語対応
- ダークモード対応

---

## 13. 特記事項

### 13.1 ブラウザサポート
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### 13.2 既知の制限
- IE11非対応
- JavaScript無効時は動作不可
- Cookieブロック時は「記憶する」機能が動作不可

### 13.3 ライセンス
- MITライセンス
- 商用利用可

---

最終更新: 2025-01-08
バージョン: 1.0.0