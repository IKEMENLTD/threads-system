# 🚀 Render デプロイガイド

Threads自動化システムをRenderクラウドにデプロイする手順です。

## 📋 前提条件

- Renderアカウント (https://render.com)
- GitHubアカウント
- プロジェクトをGitHubリポジトリにpush済み

## 🔧 デプロイ手順

### 1. GitHubリポジトリ準備

```bash
# プロジェクトをGitHubにpush
git init
git add .
git commit -m "Initial commit for Render deployment"
git remote add origin https://github.com/yourusername/threads-automation.git
git push -u origin main
```

### 2. Renderでサービス作成

1. **Render Dashboard**にログイン
2. **「New +」** → **「Web Service」**を選択
3. **「Build and deploy from a Git repository」**を選択
4. GitHubリポジトリを接続・選択

### 3. サービス設定

#### 基本設定
- **Name**: `threads-automation`
- **Runtime**: `Docker`
- **Region**: `Singapore` (推奨)
- **Branch**: `main`
- **Dockerfile Path**: `./Dockerfile`

#### プラン選択
- **Starter Plan** ($7/月) - 推奨
  - 1GB RAM
  - 1 vCPU
  - 10GB Disk
- **Free Plan**では仮想デスクトップが動作しない可能性があります

#### 環境変数設定
```
PYTHON_VERSION=3.9
NODE_ENV=production
DISPLAY=:99
DEBIAN_FRONTEND=noninteractive
RENDER=true
```

### 4. 高度な設定

#### Health Check
- **Path**: `/status`
- **Grace Period**: 300秒

#### Auto-Deploy
- **Auto-Deploy**: `Yes`
- **Build Command**: (空白)
- **Start Command**: (空白) ※Dockerfileで指定

## 🌐 アクセス方法

デプロイ完了後、以下のURLでアクセス可能：
```
https://threads-automation.onrender.com
```

## ⚙️ 設定ファイル

### render.yaml (自動デプロイ用)
```yaml
services:
  - type: web
    name: threads-automation
    env: docker
    dockerfilePath: ./Dockerfile
    plan: starter
    region: singapore
    envVars:
      - key: DISPLAY
        value: ":99"
      - key: RENDER
        value: "true"
```

### Dockerfile
- 仮想ディスプレイ (Xvfb) 自動起動
- Chrome/ChromeDriver自動インストール
- 非rootユーザーでセキュア実行

## 📊 監視・メンテナンス

### ログ確認
1. Render Dashboard → サービス選択
2. **「Logs」**タブでリアルタイムログ確認

### メトリクス
- CPU使用率
- メモリ使用率
- 応答時間

### トラブルシューティング

#### 起動失敗
```bash
# ローカルでDockerテスト
docker build -t threads-automation .
docker run -p 10000:10000 threads-automation
```

#### メモリ不足
- Starter Plan以上にアップグレード
- 不要なパッケージ削除

#### タイムアウト
- Health Check期間を延長
- 起動スクリプト最適化

## 🔒 セキュリティ

### 環境変数
- 機密情報はRenderの環境変数で管理
- `.env`ファイルはリポジトリにコミットしない

### アクセス制御
- Basic認証追加可能
- IP制限設定

## 💰 コスト

### Starter Plan ($7/月)
- 1サービス
- 1GB RAM
- 1 vCPU
- 10GB Disk
- 750時間/月

### 追加料金
- ディスク容量追加: $0.25/GB/月
- 追加CPU/RAM: プラン変更必要

## 🔄 CI/CD

### 自動デプロイ
- GitHubへのpushで自動デプロイ
- `render.yaml`で設定管理

### 手動デプロイ
- Render Dashboard → **「Manual Deploy」**

## 📞 サポート

### Renderサポート
- ドキュメント: https://render.com/docs
- コミュニティ: https://community.render.com

### プロジェクトサポート
- Issues: GitHubリポジトリのIssues
- デバッグ: ローカル環境でのDockerテスト

---

**注意**: ブラウザ自動化は大量のリソースを使用するため、Starter Plan以上を推奨します。