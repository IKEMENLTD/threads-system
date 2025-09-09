# 投稿管理ページ（posts.html）要件定義書

## 1. ページ概要

### 1.1 目的
Threadsへの投稿の作成、編集、削除、スケジュール管理を一元的に行うための管理画面を提供する。

### 1.2 URL
- `/posts.html`
- ダッシュボードからの主要導線

### 1.3 アクセス権限
- ログイン済みユーザーのみアクセス可能
- ロール別権限:
  - administrator: すべての操作可能
  - editor: 作成・編集・削除可能
  - user: 自分の投稿のみ編集可能
  - viewer: 閲覧のみ

---

## 2. レイアウト構造

### 2.1 基本構造
```
┌─────────────────────────────────────────────────────┐
│ サイドバー(260px) │      メインコンテンツエリア        │
│                  │  ┌──────────────────────────────┐ │
│  ロゴ            │  │  ヘッダー（検索バー付き）      │ │
│  ナビゲーション   │  ├──────────────────────────────┤ │
│  - ダッシュボード │  │  ページタイトル & 新規投稿ボタン│ │
│  - 投稿管理 ✓    │  │  フィルター & ソート           │ │
│  - スケジュール   │  │  統計サマリー（4列）           │ │
│  - アナリティクス │  │  投稿リスト（カード形式）       │ │
│  - 設定          │  │  ページネーション              │ │
│  ログアウト      │  └──────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### 2.2 レスポンシブブレークポイント

#### モバイル (max-width: 480px)
- サイドバー: ハンバーガーメニュー
- 投稿カード: 1列表示
- フィルター: 縦並び
- 統計: 2×2グリッド

#### タブレット (max-width: 768px)
- サイドバー: 非表示（スライド式）
- 投稿カード: 1列表示
- フィルター: 2列
- 統計: 2列表示

#### 小型デスクトップ (769px - 1024px)
- サイドバー: 表示
- 投稿カード: 2列グリッド
- フィルター: 横並び
- 統計: 4列表示

#### 大型デスクトップ (min-width: 1200px)
- サイドバー: 260px固定
- 投稿カード: 3列グリッド
- メインコンテンツ: max-width 1400px

---

## 3. コンポーネント詳細

### 3.1 ヘッダー部

#### 3.1.1 検索バー
```html
<div class="search-container">
    <input type="text" 
           class="search-input" 
           id="searchInput"
           placeholder="投稿を検索..."
           aria-label="投稿を検索">
    <span class="search-icon">◎</span>
</div>
```

**機能:**
- リアルタイム検索（300msデバウンス）
- 検索対象: 投稿内容、ハッシュタグ
- ハイライト表示

#### 3.1.2 ユーザー情報
- 現在日時表示（1分ごと更新）
- ユーザー名とアバター

### 3.2 フィルター＆ソート

#### 3.2.1 フィルター項目
| フィルター | ID | オプション |
|-----------|-----|-----------|
| ステータス | statusFilter | すべて/公開済み/予約済み/下書き/失敗 |
| 期間 | dateFilter | すべて/今日/今週/今月/カスタム |
| 並び替え | sortBy | 新しい順/古い順/エンゲージメント順/アルファベット順 |

#### 3.2.2 リセットボタン
```html
<button class="btn-secondary" id="resetFilters">
    <span class="btn-icon">↺</span>
    <span class="btn-text">リセット</span>
</button>
```

### 3.3 統計サマリー

#### 3.3.1 表示項目
| 項目 | ID | 色クラス |
|------|-----|---------|
| 総投稿数 | totalCount | デフォルト |
| 公開済み | publishedCount | success（緑） |
| 予約済み | scheduledCount | pending（黄） |
| 下書き | draftCount | draft（グレー） |

### 3.4 投稿カード

#### 3.4.1 カード構造
```html
<div class="post-card" data-post-id="[ID]">
    <div class="post-card-header">
        <input type="checkbox" class="post-checkbox">
        <span class="post-status [status-class]">[ステータス]</span>
        <div class="post-actions">
            <button class="action-btn edit">編集</button>
            <button class="action-btn delete">削除</button>
        </div>
    </div>
    <div class="post-card-body">
        <p class="post-content">[投稿内容]</p>
        <div class="post-images">[画像サムネイル]</div>
        <div class="post-hashtags">[ハッシュタグ]</div>
    </div>
    <div class="post-card-footer">
        <span class="post-date">[投稿日時]</span>
        <div class="post-metrics">
            <span>♥ [いいね数]</span>
            <span>↻ [リツイート数]</span>
            <span>💬 [コメント数]</span>
        </div>
    </div>
</div>
```

#### 3.4.2 ステータス表示
| ステータス | 色 | アイコン |
|-----------|-----|---------|
| published | #10b981 | ✓ |
| scheduled | #f59e0b | ◷ |
| draft | #6b7280 | ✎ |
| failed | #ef4444 | ✕ |

### 3.5 新規投稿モーダル

#### 3.5.1 モーダル構造
```html
<div class="modal" id="postModal">
    <div class="modal-content">
        <div class="modal-header">
            <h3 class="modal-title">新規投稿作成</h3>
            <button class="modal-close">×</button>
        </div>
        <form class="modal-body" id="postForm">
            <!-- フォーム要素 -->
        </form>
        <div class="modal-footer">
            <button type="button" class="btn-secondary">キャンセル</button>
            <button type="submit" class="btn-primary">投稿する</button>
        </div>
    </div>
</div>
```

#### 3.5.2 フォーム要素

##### テキストエリア
- **ID**: postContent
- **最大文字数**: 500文字
- **リアルタイム文字数カウント**
- **プレースホルダー**: "投稿する内容を入力..."

##### 画像アップロード
- **ID**: postImages
- **形式**: JPEG, PNG, GIF, WebP
- **最大サイズ**: 10MB/ファイル
- **最大枚数**: 10枚
- **ドラッグ&ドロップ対応**
- **プレビュー表示**

##### ハッシュタグ
- **ID**: postHashtags
- **自動補完機能**
- **最大20個**
- **#自動付与**

##### スケジュール設定
- **ID**: scheduleDateTime
- **日時ピッカー**
- **最小: 現在時刻+5分**
- **最大: 30日後**

### 3.6 一括操作バー

#### 3.6.1 表示条件
- 1つ以上のチェックボックス選択時に表示

#### 3.6.2 操作ボタン
| ボタン | ID | 機能 |
|--------|-----|------|
| 全選択 | selectAll | すべての投稿を選択/解除 |
| 公開 | bulkPublish | 選択投稿を公開 |
| 予約 | bulkSchedule | 選択投稿を予約 |
| 下書き | bulkDraft | 選択投稿を下書きに |
| 削除 | bulkDelete | 選択投稿を削除 |

### 3.7 ページネーション

#### 3.7.1 構造
```html
<div class="pagination">
    <button class="pagination-btn" id="prevPage">←</button>
    <div class="pagination-numbers">
        <button class="page-num active">1</button>
        <button class="page-num">2</button>
        <span>...</span>
        <button class="page-num">10</button>
    </div>
    <button class="pagination-btn" id="nextPage">→</button>
</div>
```

**仕様:**
- 1ページあたり12投稿
- 最大5ページ番号表示
- 省略記号で中間ページを表現

---

## 4. 機能仕様

### 4.1 投稿作成フロー

1. 「新規投稿」ボタンクリック
2. モーダル表示
3. 内容入力（バリデーション）
4. 画像アップロード（オプション）
5. ハッシュタグ追加（オプション）
6. スケジュール設定（オプション）
7. 送信→LocalStorage保存
8. リスト更新

### 4.2 投稿編集

1. 編集ボタンクリック
2. モーダルに既存データ表示
3. 編集
4. 保存→LocalStorage更新

### 4.3 投稿削除

1. 削除ボタンクリック
2. 確認ダイアログ
3. 承認→LocalStorage削除
4. リスト更新

### 4.4 検索機能

```javascript
// 検索アルゴリズム
- 投稿内容の部分一致
- ハッシュタグの完全一致
- 大文字小文字区別なし
- 300msデバウンス
```

### 4.5 フィルタリング

```javascript
// フィルター組み合わせ
const filteredPosts = posts.filter(post => {
    const statusMatch = statusFilter === 'all' || post.status === statusFilter;
    const dateMatch = checkDateRange(post.date, dateFilter);
    const searchMatch = checkSearchMatch(post, searchQuery);
    return statusMatch && dateMatch && searchMatch;
});
```

### 4.6 ソート機能

| ソート種別 | ロジック |
|-----------|---------|
| 新しい順 | createdAt DESC |
| 古い順 | createdAt ASC |
| エンゲージメント順 | (likes + retweets + comments) DESC |
| アルファベット順 | content ASC |

---

## 5. データ管理

### 5.1 LocalStorage構造

#### posts_data
```javascript
[
    {
        id: "post_1234567890",
        content: "投稿内容",
        images: ["image1.jpg", "image2.jpg"],
        hashtags: ["#tag1", "#tag2"],
        status: "published", // published/scheduled/draft/failed
        scheduledDate: "2025-01-10T12:00:00",
        createdAt: "2025-01-08T10:00:00",
        updatedAt: "2025-01-08T11:00:00",
        metrics: {
            likes: 120,
            retweets: 45,
            comments: 23
        }
    }
]
```

### 5.2 ステート管理

```javascript
const state = {
    posts: [],           // 全投稿データ
    filteredPosts: [],   // フィルター後データ
    currentPage: 1,      // 現在のページ
    itemsPerPage: 12,    // ページあたりアイテム数
    selectedPosts: [],   // 選択中の投稿ID
    currentFilter: {
        status: 'all',
        date: 'all',
        search: ''
    },
    sortBy: 'newest'
};
```

---

## 6. バリデーション

### 6.1 入力検証

| フィールド | ルール |
|-----------|--------|
| 投稿内容 | 必須、1-500文字 |
| 画像 | 最大10MB、最大10枚、JPEG/PNG/GIF/WebP |
| ハッシュタグ | 最大20個、英数字と日本語 |
| スケジュール | 現在時刻+5分以降、30日以内 |

### 6.2 エラーメッセージ

```javascript
const errorMessages = {
    content_required: "投稿内容を入力してください",
    content_too_long: "投稿内容は500文字以内で入力してください",
    image_too_large: "画像サイズは10MB以下にしてください",
    image_too_many: "画像は最大10枚までです",
    invalid_schedule: "スケジュール日時が不正です",
    hashtag_too_many: "ハッシュタグは最大20個までです"
};
```

---

## 7. UI/UXデザイン

### 7.1 カラーパレット
```css
--color-primary: #000000;
--color-success: #10b981;
--color-warning: #f59e0b;
--color-error: #ef4444;
--color-draft: #6b7280;
--color-bg: #f9fafb;
--color-card: #ffffff;
--color-border: #e5e7eb;
```

### 7.2 アニメーション
```css
--transition-fast: 150ms ease;
--transition-base: 300ms ease;
--animation-slide: slideIn 300ms ease-out;
--animation-fade: fadeIn 200ms ease-in;
```

### 7.3 インタラクション
- **ホバー**: カードに影を追加、ボタンの色変更
- **クリック**: リップルエフェクト
- **ドラッグ**: 画像並び替え対応
- **スクロール**: 無限スクロール対応

---

## 8. キーボードショートカット

| キー | 動作 |
|------|------|
| Ctrl+N | 新規投稿 |
| Ctrl+F | 検索フォーカス |
| Ctrl+A | 全選択 |
| Delete | 選択投稿削除 |
| Escape | モーダル閉じる |
| ↑↓ | リスト内移動 |
| Enter | 選択投稿編集 |

---

## 9. パフォーマンス要件

### 9.1 表示速度
- 初期表示: 2秒以内
- ページ切り替え: 500ms以内
- 検索結果: 300ms以内

### 9.2 最適化
- 画像の遅延読み込み
- 仮想スクロール（100件以上）
- デバウンス/スロットル処理
- メモリリーク防止

---

## 10. アクセシビリティ

### 10.1 ARIA属性
```html
role="main"
aria-label="投稿管理"
aria-live="polite"
aria-expanded="true/false"
aria-selected="true/false"
```

### 10.2 フォーカス管理
- Tab順序の論理的設定
- フォーカストラップ（モーダル内）
- フォーカスの視覚的表示

---

## 11. エラーハンドリング

### 11.1 エラー種別
| エラー | 対処 |
|--------|------|
| 保存失敗 | リトライ＆エラートースト |
| 画像アップロード失敗 | エラーメッセージ＆再試行ボタン |
| ネットワークエラー | オフラインモード通知 |
| 容量超過 | 古いデータ削除提案 |

### 11.2 エラー通知
- トースト通知（3秒表示）
- インラインエラー（フォーム）
- モーダルダイアログ（重要エラー）

---

## 12. テスト要件

### 12.1 機能テスト
- [ ] CRUD操作（作成・読取・更新・削除）
- [ ] 検索機能
- [ ] フィルター機能
- [ ] ソート機能
- [ ] ページネーション
- [ ] 一括操作
- [ ] キーボードショートカット

### 12.2 UIテスト
- [ ] レスポンシブ表示
- [ ] モーダル開閉
- [ ] ドラッグ&ドロップ
- [ ] 文字数カウント
- [ ] プレビュー表示

---

## 13. 依存関係

### 13.1 必須スクリプト（読み込み順序）
1. common.js
2. constants.js
3. data-utils.js
4. ui-utils.js
5. security-utils.js
6. input-validator.js
7. storage-manager.js
8. shared-state.js
9. timer-cleanup.js
10. error-handler.js
11. api-client.js
12. posts-data.js（投稿データ管理）
13. posts.js（メイン機能）

### 13.2 CSS依存
- posts-styles.css（専用スタイル）
- common-styles.css（共通スタイル）

---

## 14. 拡張予定

### 14.1 フェーズ2
- AI投稿文生成
- 複数アカウント対応
- テンプレート機能
- 自動リポスト

### 14.2 フェーズ3
- 投稿分析
- A/Bテスト
- コラボレーション機能
- APIインテグレーション

---

最終更新: 2025-01-08
バージョン: 1.0.0