# ダッシュボードページ要件定義書

## 1. ページ概要

### 1.1 目的
TRUE ULTIMATE THREADS SYSTEMのメインダッシュボード画面として、システム全体の状況を一覧表示し、主要機能への迅速なアクセスを提供する。

### 1.2 URL
- `/dashboard.html`
- ログイン後のデフォルトランディングページ

### 1.3 アクセス権限
- ログイン済みユーザーのみアクセス可能
- セッションタイムアウト: 30分（config.jsで設定可能）

---

## 2. レイアウト構造

### 2.1 基本構造
```
┌─────────────────────────────────────────────────────┐
│ サイドバー(260px) │      メインコンテンツエリア        │
│                  │  ┌──────────────────────────────┐ │
│  ロゴ            │  │  ヘッダー                    │ │
│  ナビゲーション   │  ├──────────────────────────────┤ │
│  ログアウト      │  │  統計カード (4列グリッド)      │ │
│                  │  │  最近の投稿                   │ │
│                  │  │  クイックアクション            │ │
│                  │  └──────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### 2.2 レスポンシブブレークポイント

#### モバイル (max-width: 480px)
- サイドバー: 非表示（ハンバーガーメニューで開閉）
- 統計カード: 1列
- フォントサイズ: 14px基準
- パディング: 1rem

#### タブレット (max-width: 768px)  
- サイドバー: 非表示（transform: translateX(-100%)）
- 統計カード: 1列
- アクションボタン: 1列
- メインコンテンツ: 全幅

#### 小型デスクトップ (769px - 1024px)
- サイドバー: 表示
- 統計カード: 2列
- アクションボタン: 2列

#### 大型デスクトップ (min-width: 1200px)
- サイドバー: 260px固定
- 統計カード: 4列
- メインコンテンツ: max-width 1400px（中央寄せ）

---

## 3. コンポーネント詳細

### 3.1 サイドバー

#### 3.1.1 構造
```html
<aside class="sidebar" id="dashboard-sidebar">
    <!-- ヘッダー -->
    <div class="sidebar-header">
        <h1 class="logo">
            <span class="logo-main">TRUE ULTIMATE</span>
            <span class="logo-sub">THREADS SYSTEM</span>
        </h1>
    </div>
    
    <!-- ナビゲーション -->
    <nav class="sidebar-nav">
        <a href="#" class="nav-item active">
            <span class="nav-icon">▣</span>
            <span class="nav-text">ダッシュボード</span>
        </a>
        <!-- 他のメニュー項目 -->
    </nav>
    
    <!-- フッター -->
    <div class="sidebar-footer">
        <button class="logout-btn" id="dashboard-logoutBtn">
            <span class="logout-icon">↗</span>
            <span class="logout-text">ログアウト</span>
        </button>
    </div>
</aside>
```

#### 3.1.2 スタイル定義
- 幅: 260px（CSS変数: --sidebar-width）
- 背景: #000000
- ボーダー: 右側に1px solid rgba(255,255,255,0.1)
- z-index: 1001
- position: fixed
- height: 100vh

#### 3.1.3 ナビゲーション項目
| 項目 | アイコン | リンク先 | アクティブ状態 |
|------|---------|---------|--------------|
| ダッシュボード | ▣ | dashboard.html | ✓ |
| 投稿管理 | ▤ | posts.html | |
| スケジュール | ◷ | schedule.html | |
| アナリティクス | ◈ | analytics.html | |
| 設定 | ◉ | settings.html | |

### 3.2 メインヘッダー

#### 3.2.1 構成要素
- **ハンバーガーメニュー** (id: dashboard-menuToggle)
  - 768px以下で表示
  - 3本線アニメーション
  - aria-label, aria-expanded属性必須

- **日付表示** (id: dashboard-currentDate)
  - フォーマット: "1月8日 水曜日"
  - 1分ごとに自動更新

- **ユーザー情報**
  - ユーザー名 (id: dashboard-userName)
  - アバター (id: dashboard-userAvatar) - 名前の頭文字

### 3.3 統計カードセクション

#### 3.3.1 カード構成（4枚）

| カード | ID | アイコン | 初期値 | 変化表示 |
|--------|-----|---------|--------|---------|
| 総投稿数 | dashboard-totalPosts | ▤ | 156 | +12% |
| 予約投稿 | dashboard-scheduledPosts | ◷ | 24 | 待機中 |
| エンゲージメント | dashboard-engagement | ◈ | 4.7% | +8.5% |
| 成功率 | dashboard-successRate | ⬆ | 92.3% | 安定 |

#### 3.3.2 カードアニメーション
- hover時: transform: translateY(-4px)
- box-shadow変化
- transition: 300ms ease

### 3.4 最近の投稿セクション

#### 3.4.1 表示仕様
- 最新5件を表示
- LocalStorageから取得（キー: posts_data）
- データがない場合はサンプルデータ生成

#### 3.4.2 投稿アイテム構造
```html
<div class="post-item">
    <div class="post-status [success|pending|error]"></div>
    <div class="post-content">
        <h4 class="post-title">[タイトル]</h4>
        <p class="post-time">[投稿時刻]</p>
    </div>
    <div class="post-stats">
        <span class="post-metric">♥ [いいね数]</span>
        <span class="post-metric">↻ [リツイート数]</span>
    </div>
</div>
```

### 3.5 クイックアクション

#### 3.5.1 ボタン構成
| ボタン | ID | クラス | アイコン | 動作 |
|--------|-----|--------|---------|------|
| 新規投稿 | dashboard-newPostBtn | action-btn primary | + | posts.html へ遷移 |
| 予約設定 | dashboard-scheduleBtn | action-btn secondary | ◷ | schedule.html へ遷移 |
| 詳細分析 | dashboard-analyticsBtn | action-btn tertiary | ◈ | analytics.html へ遷移 |

---

## 4. 機能仕様

### 4.1 初期化処理

#### 4.1.1 実行順序
1. DOMContentLoaded イベント待機
2. DashboardManager.init() 実行
3. ThreadsSystem.initializePage() によるセッションチェック
4. DOM要素のキャッシュ
5. イベントリスナー設定
6. データ読み込み
7. リアルタイム更新開始

### 4.2 データ管理

#### 4.2.1 LocalStorage使用キー
| キー | 内容 | 形式 |
|------|------|------|
| threads_system_session | セッション情報 | JSON |
| threads_system_user | ユーザー情報 | JSON |
| dashboard_stats | 統計データ | JSON |
| posts_data | 投稿データ配列 | JSON |
| is_logged_in | ログイン状態 | boolean |

#### 4.2.2 SharedState同期
```javascript
window.SharedState.posts.set('total', totalPosts);
window.SharedState.posts.set('scheduled', scheduledPosts);
window.SharedState.metrics.set('engagement', engagement);
window.SharedState.metrics.set('successRate', successRate);
```

### 4.3 リアルタイム更新

#### 4.3.1 更新間隔
- 統計データ: 30秒
- 最近の投稿: 30秒
- 日付表示: 60秒

### 4.4 イベントハンドリング

#### 4.4.1 サイドバー制御
```javascript
// トグル処理
menuToggle.click → sidebar.classList.toggle('active')
overlay.click → sidebar.classList.remove('active')
window.resize → 768px以上でoverlay非表示
```

#### 4.4.2 キーボードショートカット
| キー | 動作 |
|------|------|
| Ctrl+N | 新規投稿 |
| Ctrl+S | スケジュール |
| Ctrl+A | アナリティクス |
| Escape | サイドバーを閉じる |

---

## 5. スタイル仕様

### 5.1 カラーパレット
```css
--color-primary: #000000;
--color-secondary: #1a1a1a;
--color-success: #10b981;
--color-warning: #f59e0b;
--color-error: #ef4444;
--color-white: #ffffff;
--color-gray-300: #d1d5db;
--color-gray-400: #9ca3af;
--gradient-main: linear-gradient(135deg, #000000 0%, #2a2a2a 50%, #e0e0e0 100%);
```

### 5.2 アニメーション
```css
--transition-fast: 150ms ease;
--transition-base: 300ms ease;
```

### 5.3 z-index階層
```
オーバーレイ: 1000
サイドバー: 1001
モーダル: 1100
トースト: 1200
```

---

## 6. セキュリティ要件

### 6.1 XSS対策
- innerHTML使用禁止（DOM操作のみ）
- ユーザー入力値は必ずエスケープ
- Content Security Policy設定

### 6.2 セッション管理
- 30分でタイムアウト
- 最終アクティビティ時刻を記録
- 不正なセッションは即座に破棄

### 6.3 データ検証
- LocalStorageデータは読み込み時に検証
- 不正なデータは初期値にリセット

---

## 7. パフォーマンス要件

### 7.1 初期表示
- First Contentful Paint: 1.5秒以内
- Time to Interactive: 2.5秒以内

### 7.2 最適化
- 遅延読み込み（画像、非必須スクリプト）
- DocumentFragmentによるDOM操作の最適化
- requestAnimationFrameでアニメーション制御

### 7.3 メモリ管理
- setInterval/setTimeoutの適切なクリア
- イベントリスナーの解放（beforeunload時）
- 不要なオブジェクト参照の削除

---

## 8. アクセシビリティ要件

### 8.1 ARIA属性
- role属性の適切な使用
- aria-label, aria-expanded
- aria-live領域での更新通知

### 8.2 キーボード操作
- Tab順序の論理的な設定
- フォーカスの視覚的表示
- Escapeキーでモーダル/メニューを閉じる

### 8.3 スクリーンリーダー対応
- 適切な見出し階層（h1→h2→h3）
- altテキスト、titleの設定
- 装飾的要素にはaria-hidden="true"

---

## 9. エラーハンドリング

### 9.1 エラー種別と対処
| エラー | 対処 |
|--------|------|
| セッション切れ | ログインページへリダイレクト |
| データ読み込み失敗 | デフォルト値で継続 |
| ネットワークエラー | オフラインモード表示 |
| JavaScript無効 | noscriptタグで通知 |

### 9.2 エラーログ
- console.errorは本番環境で無効化
- エラーはSharedStateに記録
- 重要なエラーはトースト通知

---

## 10. テスト要件

### 10.1 ユニットテスト
- 各関数の個別テスト
- エッジケースの検証
- カバレッジ80%以上

### 10.2 統合テスト
- ページ遷移フロー
- データ永続化
- セッション管理

### 10.3 E2Eテスト
- ログイン→ダッシュボード表示
- 各ボタンクリック動作
- レスポンシブ表示確認

---

## 11. 依存関係

### 11.1 必須スクリプト（読み込み順序厳守）
1. common.js
2. constants.js
3. data-utils.js
4. ui-utils.js
5. security-utils.js
6. input-validator.js
7. storage-manager.js
8. shared-state.js
9. timer-cleanup.js
10. chart-manager.js
11. dashboard-data.js
12. dashboard.js

### 11.2 CSS依存
- dashboard-styles.css（専用スタイル）
- common-styles.css（共通スタイル）

---

## 12. 今後の拡張予定

### 12.1 フェーズ2
- リアルタイムグラフ表示
- 通知センター
- ダークモード対応

### 12.2 フェーズ3
- AI投稿提案
- 競合分析ダッシュボード
- カスタムウィジェット

---

最終更新: 2025-01-08
バージョン: 1.0.0