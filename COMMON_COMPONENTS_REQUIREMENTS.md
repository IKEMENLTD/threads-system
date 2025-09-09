# 共通コンポーネント要件定義書

## 1. 概要

### 目的
システム全体で使用される共通コンポーネント、ユーティリティ、モジュールの仕様定義

### 対象ファイル
- common.js
- common-styles.css
- data-utils.js
- ui-utils.js
- security-utils.js
- storage-manager.js
- constants.js
- その他共通モジュール

## 2. 共通JavaScriptモジュール

### 2.1 common.js
**責務**: 全ページ共通の初期化処理、セッション管理、ナビゲーション制御

**主要機能**:
- `initializePage()`: ページ初期化
- `checkSession()`: セッション確認
- `setupNavigation()`: ナビゲーション設定
- `handleLogout()`: ログアウト処理
- `updateUserInfo()`: ユーザー情報更新

**グローバル変数**:
```javascript
window.CommonModule = {
  session: SessionManager,
  navigation: NavigationController,
  utils: UtilityFunctions
}
```

### 2.2 data-utils.js
**責務**: データ処理、変換、バリデーション

**主要機能**:
- `DataProcessor`: データ処理クラス
- `DataValidator`: バリデーションクラス
- `DataFormatter`: フォーマット処理
- `Session`: セッション管理オブジェクト
- `Cache`: キャッシュ管理

**データ形式**:
```javascript
{
  formatDate: (date, format) => string,
  parseJSON: (json) => object,
  sanitizeInput: (input) => string,
  validateEmail: (email) => boolean,
  validatePassword: (password) => object
}
```

### 2.3 ui-utils.js
**責務**: UI操作、DOM操作、アニメーション制御

**主要機能**:
- `showToast()`: トースト通知表示
- `showModal()`: モーダル表示
- `showLoading()`: ローディング表示
- `hideLoading()`: ローディング非表示
- `animateElement()`: 要素アニメーション

**UI状態管理**:
```javascript
{
  modals: Map<string, ModalInstance>,
  toasts: Queue<ToastInstance>,
  loadingStates: Set<string>
}
```

### 2.4 security-utils.js
**責務**: セキュリティ関連処理、暗号化、サニタイズ

**主要機能**:
- `escapeHtml()`: HTMLエスケープ
- `sanitizeInput()`: 入力サニタイズ
- `validateToken()`: トークン検証
- `encryptData()`: データ暗号化
- `decryptData()`: データ復号化
- `hashPassword()`: パスワードハッシュ化

**セキュリティポリシー**:
```javascript
{
  xssProtection: true,
  csrfProtection: true,
  contentSecurityPolicy: string,
  trustedDomains: string[]
}
```

### 2.5 storage-manager.js
**責務**: LocalStorage/SessionStorage/IndexedDB管理

**主要機能**:
- `StorageManager`: 統合ストレージ管理
- `save()`: データ保存
- `load()`: データ読み込み
- `remove()`: データ削除
- `clear()`: 全データクリア
- `sync()`: クラウド同期

**ストレージ構造**:
```javascript
{
  local: {
    prefix: 'threads_system_',
    encryption: true,
    compression: true
  },
  session: {
    prefix: 'threads_session_',
    ttl: 3600000
  },
  indexed: {
    dbName: 'ThreadsSystemDB',
    version: 1
  }
}
```

### 2.6 constants.js
**責務**: システム全体の定数定義

**定数カテゴリ**:
```javascript
const CONSTANTS = {
  API: {
    BASE_URL: '',
    TIMEOUT: 30000,
    RETRY_COUNT: 3
  },
  UI: {
    ANIMATION_DURATION: 300,
    TOAST_DURATION: 3000,
    DEBOUNCE_DELAY: 250
  },
  VALIDATION: {
    MIN_PASSWORD_LENGTH: 8,
    MAX_USERNAME_LENGTH: 50,
    MAX_POST_LENGTH: 500
  },
  STORAGE: {
    SESSION_KEY: 'threads_system_session',
    USER_KEY: 'threads_system_user',
    SETTINGS_KEY: 'threads_system_settings'
  }
}
```

## 3. 共通スタイルシート

### 3.1 common-styles.css
**責務**: 全ページ共通のベーススタイル

**スタイル構成**:
- リセットスタイル
- タイポグラフィ
- カラーパレット（CSS変数）
- レイアウトユーティリティ
- アニメーション定義

**CSS変数定義**:
```css
:root {
  /* カラー */
  --primary-color: #000000;
  --secondary-color: #FFFFFF;
  --accent-color: #007BFF;
  --error-color: #DC3545;
  --success-color: #28A745;
  --warning-color: #FFC107;
  
  /* スペーシング */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  
  /* フォント */
  --font-family-primary: 'Inter', sans-serif;
  --font-family-mono: 'Consolas', monospace;
  
  /* ブレイクポイント */
  --breakpoint-mobile: 480px;
  --breakpoint-tablet: 768px;
  --breakpoint-desktop: 1024px;
}
```

### 3.2 レスポンシブユーティリティ
```css
/* モバイルファースト */
.container { }
.row { }
.col { }

/* ブレイクポイント */
@media (min-width: 481px) { }
@media (min-width: 769px) { }
@media (min-width: 1025px) { }
```

## 4. 共通コンポーネント

### 4.1 サイドバー
**クラス**: `.sidebar`

**構成要素**:
- ヘッダー（ロゴ）
- ナビゲーションメニュー
- フッター（ログアウト）

**状態**:
- 展開/折りたたみ
- アクティブメニュー
- ホバーエフェクト

### 4.2 モーダル
**クラス**: `.modal`

**タイプ**:
- 確認ダイアログ
- フォームモーダル
- 情報表示モーダル
- フルスクリーンモーダル

**機能**:
- ESCキーで閉じる
- 背景クリックで閉じる
- フォーカストラップ

### 4.3 トースト通知
**クラス**: `.toast`

**タイプ**:
- success（成功）
- error（エラー）
- warning（警告）
- info（情報）

**表示位置**:
- top-right（デフォルト）
- top-center
- bottom-right
- bottom-center

### 4.4 ローディング
**クラス**: `.loading`

**タイプ**:
- スピナー
- プログレスバー
- スケルトンスクリーン
- シマーエフェクト

### 4.5 フォーム要素
**共通クラス**:
- `.form-group`
- `.form-label`
- `.form-input`
- `.form-select`
- `.form-textarea`
- `.form-checkbox`
- `.form-radio`

**状態クラス**:
- `.is-valid`
- `.is-invalid`
- `.is-disabled`
- `.is-loading`

## 5. エラーハンドリング

### 5.1 error-handler.js
**責務**: 統一的なエラー処理

**機能**:
```javascript
{
  handleError: (error, context) => void,
  logError: (error, level) => void,
  reportError: (error) => Promise<void>,
  showErrorMessage: (message) => void,
  recoverFromError: (error) => boolean
}
```

### 5.2 エラータイプ
- ValidationError
- NetworkError
- AuthenticationError
- AuthorizationError
- SystemError

## 6. 認証・認可

### 6.1 AuthManager
**責務**: 認証状態管理

**機能**:
```javascript
{
  login: (credentials) => Promise<User>,
  logout: () => Promise<void>,
  refresh: () => Promise<Token>,
  isAuthenticated: () => boolean,
  hasPermission: (permission) => boolean
}
```

### 6.2 セッション管理
- トークン自動更新
- セッションタイムアウト
- 同時ログイン制御
- Remember Me機能

## 7. API通信

### 7.1 api-client.js
**責務**: API通信の抽象化

**機能**:
```javascript
{
  get: (endpoint, params) => Promise<Response>,
  post: (endpoint, data) => Promise<Response>,
  put: (endpoint, data) => Promise<Response>,
  delete: (endpoint) => Promise<Response>,
  upload: (endpoint, files) => Promise<Response>
}
```

### 7.2 インターセプター
- リクエストインターセプター（認証ヘッダー追加）
- レスポンスインターセプター（エラー処理）
- リトライロジック
- レート制限対応

## 8. 状態管理

### 8.1 shared-state.js
**責務**: アプリケーション全体の状態管理

**State構造**:
```javascript
{
  user: UserState,
  posts: PostsState,
  settings: SettingsState,
  ui: UIState,
  cache: CacheState
}
```

### 8.2 StateManager
- `getState()`: 状態取得
- `setState()`: 状態更新
- `subscribe()`: 変更監視
- `dispatch()`: アクション実行

## 9. バリデーション

### 9.1 input-validator.js
**責務**: 入力値検証

**バリデーションルール**:
```javascript
{
  required: (value) => boolean,
  minLength: (value, min) => boolean,
  maxLength: (value, max) => boolean,
  pattern: (value, regex) => boolean,
  email: (value) => boolean,
  url: (value) => boolean,
  custom: (value, validator) => boolean
}
```

## 10. 国際化（i18n）

### 10.1 言語管理
```javascript
{
  currentLanguage: 'ja',
  translations: {
    ja: { },
    en: { }
  },
  translate: (key) => string,
  setLanguage: (lang) => void
}
```

## 11. パフォーマンス最適化

### 11.1 遅延読み込み
- 画像の遅延読み込み
- コンポーネントの動的インポート
- ルートレベルコード分割

### 11.2 キャッシュ戦略
- ブラウザキャッシュ
- Service Worker
- メモリキャッシュ
- IndexedDB

## 12. アクセシビリティ

### 12.1 ARIA属性
- ランドマーク
- ライブリージョン
- フォーカス管理
- キーボードナビゲーション

### 12.2 支援技術対応
- スクリーンリーダー
- キーボードのみの操作
- 高コントラストモード
- 文字サイズ変更

## 13. テスト戦略

### 13.1 単体テスト
- 各ユーティリティ関数
- バリデーションロジック
- データ処理

### 13.2 統合テスト
- API通信
- 状態管理
- セッション管理

## 14. ビルド・デプロイ

### 14.1 ビルド設定
```javascript
{
  entry: './src/index.js',
  output: './dist/bundle.js',
  optimization: {
    minify: true,
    treeshaking: true,
    splitChunks: true
  }
}
```

### 14.2 環境変数
- NODE_ENV
- API_ENDPOINT
- DEBUG_MODE
- FEATURE_FLAGS