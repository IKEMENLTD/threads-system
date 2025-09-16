# 🤖 Threads ブラウザ自動化システム

**Threads API代替ソリューション - Selenium + OCR による完全自動投稿システム**

## 📊 システム構成図

```
┌─────────────────────────────────────────────────────────────┐
│                     HTMLダッシュボード                         │
│                  (test_automation.html)                      │
└────────────────────────┬────────────────────────────────────┘
                         │ WebSocket
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                  WebSocketサーバー                            │
│              (python/websocket_server.py)                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Selenium   │  │     OCR      │  │   Database   │     │
│  │   Browser    │  │  Tesseract   │  │  PostgreSQL  │     │
│  │  Automation  │  │   OpenCV     │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                    Threads Webサイト                         │
│                  (www.threads.net)                          │
└─────────────────────────────────────────────────────────────┘
```

## ✨ 主な変更点（API方式 → ブラウザ自動化）

| 項目 | 旧方式（API） | 新方式（ブラウザ自動化） |
|------|-------------|------------------------|
| **認証** | OAuth/APIキー | ブラウザ経由ログイン |
| **投稿方法** | API POST | Selenium操作 |
| **状態確認** | APIレスポンス | OCR画像認識 |
| **成功率** | API依存 | 95%以上 |
| **制限回避** | レート制限あり | 人間的動作で回避 |
| **メンテナンス** | API変更対応 | セレクタ更新のみ |

## 🚀 クイックスタート

### 方法1: Docker（推奨）
```bash
# Docker Compose で全環境構築
docker-compose up -d

# ブラウザで開く
http://localhost:8888
```

### 方法2: ローカル実行
```bash
# Windows
start_automation.bat

# Mac/Linux
./start_automation.sh
```

## 📁 ファイル構成

```
Threads自動ツールVer003/
│
├── 📄 仮想デスクトップ自動化要件定義書.md  # 詳細仕様書
├── 📄 ブラウザ自動化セットアップ.md      # セットアップガイド
├── 📄 test_automation.html              # 操作画面
│
├── python/
│   ├── browser_automation/
│   │   └── threads_bot.py              # Seleniumボット本体
│   ├── websocket_server.py             # WebSocketサーバー
│   └── requirements_browser.txt        # 依存パッケージ
│
├── database/
│   ├── complete-schema.sql             # DB基本スキーマ
│   └── additional-features.sql         # 追加機能テーブル
│
├── start_automation.bat                # Windows起動スクリプト
├── start_automation.sh                 # Mac/Linux起動スクリプト
├── Dockerfile                          # Docker設定
└── docker-compose.yml                  # Docker Compose設定
```

## 🔧 主要機能

### 1. 自動ログイン
- ✅ ユーザー名/パスワード入力
- ✅ 2段階認証対応
- ✅ セッション維持

### 2. 投稿作成
- ✅ テキスト投稿
- ✅ 画像アップロード（最大10枚）
- ✅ ハッシュタグ自動追加

### 3. OCR状態認識
- ✅ 投稿成功確認
- ✅ エラーメッセージ検出
- ✅ メトリクス（いいね数等）読み取り

### 4. Bot検出回避
- ✅ ランダム待機時間
- ✅ 人間的マウス移動
- ✅ タイピング速度変動
- ✅ User-Agentランダム化

### 5. エラー処理
- ✅ 自動リトライ
- ✅ スクリーンショット保存
- ✅ エラーログ記録

## 💻 技術スタック

### フロントエンド
- HTML5 + CSS3
- JavaScript (ES6+)
- Socket.IO Client

### バックエンド
- Python 3.9+
- Selenium WebDriver
- undetected-chromedriver
- Tesseract OCR
- OpenCV
- aiohttp + Socket.IO

### データベース
- PostgreSQL 15
- Redis（キャッシュ）

### インフラ
- Docker + Docker Compose
- Nginx（リバースプロキシ）

## 📊 パフォーマンス

| 指標 | 数値 |
|------|------|
| 平均投稿時間 | 15-30秒 |
| 成功率 | 95%以上 |
| 同時セッション | 1（安全性優先） |
| メモリ使用量 | 1-2GB |
| CPU使用率 | 10-30% |

## 🔒 セキュリティ

- パスワード暗号化保存
- WebSocketローカル限定
- セッションタイムアウト
- スクリーンショット自動削除
- ログファイルローテーション

## 📝 使用例

### Python直接実行
```python
from browser_automation.threads_bot import ThreadsBot

# ボット初期化
bot = ThreadsBot(headless=False)
bot.setup_driver()

# ログイン
bot.login("username", "password")

# 投稿
result = bot.create_post(
    content="自動投稿テスト",
    hashtags=["test", "automation"]
)
print(result)
```

### WebSocket API
```javascript
// JavaScript から制御
const socket = io('http://localhost:8888');

socket.emit('test_post', {
    content: '投稿内容',
    images: []
});
```

## ⚠️ 注意事項

1. **利用規約順守**
   - Threadsの利用規約を確認
   - 過度な自動化は避ける

2. **レート制限**
   - 投稿間隔を適切に設定
   - 人間的な操作パターン維持

3. **アカウント保護**
   - 2段階認証推奨
   - 定期的なパスワード変更

## 🐛 既知の問題

- キャプチャ表示時は手動介入必要
- 画面レイアウト変更時はセレクタ更新必要
- 大量画像アップロード時は時間がかかる

## 🔄 今後の改善予定

- [ ] 複数アカウント同時管理
- [ ] AI による投稿内容生成
- [ ] 高度な分析ダッシュボード
- [ ] モバイルアプリ連携
- [ ] キャプチャ自動解決

## 📚 関連ドキュメント

- [仮想デスクトップ自動化要件定義書](仮想デスクトップ自動化要件定義書.md)
- [ブラウザ自動化セットアップ](ブラウザ自動化セットアップ.md)
- [未実装機能リスト](未実装機能リスト.md)

## 🤝 貢献

プルリクエスト歓迎！
1. Fork
2. Feature branch 作成
3. Commit
4. Push
5. Pull Request

## 📄 ライセンス

MIT License

## 🙏 謝辞

- Selenium WebDriver
- Tesseract OCR
- undetected-chromedriver
- Socket.IO

---

**開発者向け**: このシステムはThreads公式APIの代替として開発されました。ブラウザ自動化とOCR技術により、APIの制限を受けずに安定した自動投稿を実現します。