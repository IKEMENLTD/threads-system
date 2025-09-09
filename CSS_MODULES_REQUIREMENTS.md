# CSSモジュール要件定義書

## 1. 概要

### 目的
TRUE ULTIMATE THREADS SYSTEMの全スタイルシートモジュールの仕様定義

### CSSファイル構成（9ファイル）
```
├── styles.css（メインスタイル - index.html用）
├── common-styles.css（共通スタイル）
├── responsive-fixes.css（レスポンシブ修正）
├── z-index-fix.css（z-index階層修正）
├── dashboard-styles.css（ダッシュボード専用）
├── posts-styles.css（投稿管理専用）
├── schedule-styles.css（スケジュール専用）
├── analytics-styles.css（アナリティクス専用）
└── settings-styles.css（設定専用）
```

## 2. styles.css（メインスタイル）

### 2.1 用途
index.html（ログインページ）専用のメインスタイルシート

### 2.2 主要コンポーネント
```css
/* ログインページ構造 */
.login-container { }      /* メインコンテナ */
.login-card { }           /* ログインカード */
.login-header { }         /* ヘッダー部分 */
.login-form { }           /* フォーム部分 */
.login-footer { }         /* フッター部分 */

/* システムタイトル */
.system-title { }         /* メインタイトル */
.title-main { }           /* TRUE ULTIMATE */
.title-sub { }            /* THREADS SYSTEM */

/* フォーム要素 */
.form-group { }           /* フォームグループ */
.form-label { }           /* ラベル */
.form-input { }           /* 入力フィールド */
.input-wrapper { }        /* 入力フィールドラッパー */
.input-icon { }           /* アイコン */

/* ボタン */
.login-button { }         /* ログインボタン */
.password-toggle { }      /* パスワード表示切替 */

/* エラー表示 */
.error-message { }        /* エラーメッセージ */
.alert { }                /* アラート */

/* アニメーション */
@keyframes fadeIn { }
@keyframes slideIn { }
@keyframes pulse { }
```

### 2.3 カラーパレット
```css
:root {
  --login-primary: #000000;
  --login-secondary: #FFFFFF;
  --login-accent: #007BFF;
  --login-error: #DC3545;
  --login-success: #28A745;
}
```

## 3. common-styles.css（共通スタイル）

### 3.1 用途
全ページで使用される共通スタイル定義

### 3.2 内容
```css
/* リセットCSS */
* { margin: 0; padding: 0; box-sizing: border-box; }

/* 基本タイポグラフィ */
body { font-family: 'Inter', -apple-system, sans-serif; }
h1, h2, h3, h4, h5, h6 { }
p { }
a { }

/* グローバルCSS変数 */
:root {
  /* カラー */
  --primary-color: #000000;
  --secondary-color: #FFFFFF;
  --accent-color: #007BFF;
  --error-color: #DC3545;
  --success-color: #28A745;
  --warning-color: #FFC107;
  --info-color: #17A2B8;
  
  /* スペーシング */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-xxl: 48px;
  
  /* フォントサイズ */
  --font-xs: 12px;
  --font-sm: 14px;
  --font-md: 16px;
  --font-lg: 18px;
  --font-xl: 24px;
  --font-xxl: 32px;
  
  /* ボーダー */
  --border-radius: 4px;
  --border-radius-lg: 8px;
  --border-width: 1px;
  
  /* シャドウ */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.1);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
  --shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
  
  /* トランジション */
  --transition-fast: 150ms;
  --transition-normal: 300ms;
  --transition-slow: 500ms;
}

/* ユーティリティクラス */
.text-center { }
.text-left { }
.text-right { }
.mt-1, .mt-2, .mt-3 { }
.mb-1, .mb-2, .mb-3 { }
.p-1, .p-2, .p-3 { }

/* 共通コンポーネント */
.btn { }
.btn-primary { }
.btn-secondary { }
.btn-danger { }
.card { }
.modal { }
.toast { }
```

## 4. responsive-fixes.css（レスポンシブ修正）

### 4.1 用途
レスポンシブデザインの修正と最適化

### 4.2 ブレイクポイント
```css
/* モバイルファースト */
/* デフォルト: モバイル (0-480px) */

/* タブレット */
@media (min-width: 481px) and (max-width: 768px) { }

/* デスクトップ小 */
@media (min-width: 769px) and (max-width: 1024px) { }

/* デスクトップ大 */
@media (min-width: 1025px) { }

/* 特殊対応 */
@media (max-width: 480px) {
  /* サイドバー → ボトムナビ */
  .sidebar { display: none; }
  .bottom-nav { display: flex; }
  
  /* カード → フルスクリーン */
  .card { width: 100%; margin: 0; }
  
  /* テーブル → カード表示 */
  table { display: block; }
  
  /* フォントサイズ調整 */
  body { font-size: 14px; }
}

/* タッチデバイス対応 */
@media (hover: none) and (pointer: coarse) {
  /* タップ領域拡大 */
  button, a { min-height: 44px; }
}

/* 高解像度ディスプレイ */
@media (-webkit-min-device-pixel-ratio: 2) { }

/* 印刷用 */
@media print { }
```

## 5. z-index-fix.css（z-index階層修正）

### 5.1 用途
z-index値の統一管理と競合解決

### 5.2 階層定義
```css
:root {
  --z-base: 0;
  --z-dropdown: 100;
  --z-sticky: 200;
  --z-fixed: 300;
  --z-modal-backdrop: 400;
  --z-modal: 500;
  --z-popover: 600;
  --z-tooltip: 700;
  --z-notification: 800;
  --z-alert: 900;
  --z-maximum: 9999;
}

/* 適用 */
.sidebar { z-index: var(--z-fixed); }
.modal-backdrop { z-index: var(--z-modal-backdrop); }
.modal { z-index: var(--z-modal); }
.toast { z-index: var(--z-notification); }
.tooltip { z-index: var(--z-tooltip); }
.dropdown { z-index: var(--z-dropdown); }
.context-menu { z-index: var(--z-popover); }
```

## 6. dashboard-styles.css

### 6.1 用途
ダッシュボードページ専用スタイル

### 6.2 主要コンポーネント
```css
/* レイアウト */
.dashboard-layout { }
.dashboard-sidebar { }
.dashboard-main { }

/* ウィジェット */
.dashboard-widget { }
.widget-header { }
.widget-body { }
.widget-footer { }

/* 統計カード */
.stat-card { }
.stat-value { }
.stat-label { }
.stat-change { }

/* チャート */
.chart-container { }
.chart-legend { }

/* アクティビティ */
.activity-feed { }
.activity-item { }
```

## 7. posts-styles.css

### 7.1 用途
投稿管理ページ専用スタイル

### 7.2 主要コンポーネント
```css
/* 投稿リスト */
.posts-page-list { }
.post-card { }
.post-header { }
.post-content { }
.post-actions { }

/* フィルター */
.filter-container { }
.filter-group { }
.filter-select { }

/* 投稿エディタ */
.post-editor { }
.editor-toolbar { }
.editor-content { }

/* 画像アップロード */
.upload-area { }
.image-preview { }
.upload-progress { }
```

## 8. schedule-styles.css

### 8.1 用途
スケジュール管理ページ専用スタイル

### 8.2 主要コンポーネント
```css
/* カレンダー */
.schedule-calendar { }
.calendar-header { }
.calendar-grid { }
.calendar-day { }
.calendar-event { }

/* ビュー切替 */
.view-selector { }
.month-view { }
.week-view { }
.day-view { }
.list-view { }

/* イベント */
.event-card { }
.event-time { }
.event-title { }
.event-status { }

/* タイムライン */
.timeline { }
.time-slot { }
```

## 9. analytics-styles.css

### 9.1 用途
アナリティクスページ専用スタイル

### 9.2 主要コンポーネント
```css
/* メトリクスカード */
.analytics-summary-grid { }
.analytics-summary-card { }
.metric-value { }
.metric-change { }

/* チャート */
.analytics-chart-container { }
.chart-wrapper { }
.chart-controls { }

/* データテーブル */
.analytics-table { }
.table-header { }
.table-row { }
.table-cell { }

/* フィルター */
.period-selector { }
.date-range { }
```

## 10. settings-styles.css

### 10.1 用途
設定ページ専用スタイル

### 10.2 主要コンポーネント
```css
/* 設定レイアウト */
.settings-layout { }
.settings-menu { }
.settings-content { }

/* 設定セクション */
.settings-section { }
.section-title { }
.section-description { }

/* フォーム */
.settings-form { }
.settings-form-group { }
.settings-toggle { }
.settings-input { }

/* アクション */
.settings-actions { }
.save-button { }
.reset-button { }
```

## 11. テーマシステム

### 11.1 ライト/ダークモード
```css
/* ライトテーマ（デフォルト） */
[data-theme="light"] {
  --bg-primary: #FFFFFF;
  --bg-secondary: #F5F5F5;
  --text-primary: #000000;
  --text-secondary: #666666;
}

/* ダークテーマ */
[data-theme="dark"] {
  --bg-primary: #1A1A1A;
  --bg-secondary: #2A2A2A;
  --text-primary: #FFFFFF;
  --text-secondary: #AAAAAA;
}

/* 自動切替 */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { }
}
```

## 12. アニメーション定義

### 12.1 共通アニメーション
```css
/* フェード */
@keyframes fadeIn { }
@keyframes fadeOut { }

/* スライド */
@keyframes slideInLeft { }
@keyframes slideInRight { }
@keyframes slideInTop { }
@keyframes slideInBottom { }

/* 回転 */
@keyframes rotate { }
@keyframes spin { }

/* パルス */
@keyframes pulse { }

/* バウンス */
@keyframes bounce { }
```

## 13. アクセシビリティ

### 13.1 フォーカススタイル
```css
/* キーボードフォーカス */
*:focus-visible {
  outline: 2px solid var(--accent-color);
  outline-offset: 2px;
}

/* スクリーンリーダー専用 */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  clip: rect(0, 0, 0, 0);
}

/* 高コントラストモード */
@media (prefers-contrast: high) { }

/* モーション設定 */
@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; }
}
```

## 14. パフォーマンス最適化

### 14.1 CSS最適化
- 不要なセレクタの削除
- プロパティのショートハンド使用
- CSS変数による重複削減
- Critical CSSの分離

### 14.2 GPU最適化
```css
/* GPU加速 */
.will-animate {
  will-change: transform;
  transform: translateZ(0);
}
```

## 15. ブラウザ対応

### 15.1 ベンダープレフィックス
```css
/* Autoprefixer使用推奨 */
.element {
  -webkit-transform: ;
  -moz-transform: ;
  -ms-transform: ;
  transform: ;
}
```

### 15.2 フォールバック
```css
/* CSS Grid フォールバック */
.container {
  display: flex; /* フォールバック */
  display: grid; /* 対応ブラウザ */
}
```