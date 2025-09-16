# Threads Browser Automation System - Render Compatible
FROM python:3.9-slim

# 環境変数（Render対応）
ENV PYTHONUNBUFFERED=1
ENV DEBIAN_FRONTEND=noninteractive
ENV DISPLAY=:99
ENV PORT=10000
ENV HOST=0.0.0.0

# 作業ディレクトリ
WORKDIR /app

# システムパッケージインストール（Render最適化）
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    unzip \
    curl \
    xvfb \
    x11-apps \
    imagemagick \
    tesseract-ocr \
    tesseract-ocr-jpn \
    libnss3 \
    libxss1 \
    libasound2 \
    fonts-liberation \
    libappindicator3-1 \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libx11-xcb1 \
    libxtst6 \
    fonts-noto-cjk \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Google Chrome インストール（最新版）
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /usr/share/keyrings/google-chrome.gpg \
    && echo "deb [arch=amd64 signed-by=/usr/share/keyrings/google-chrome.gpg] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list \
    && apt-get update \
    && apt-get install -y google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*

# Pythonパッケージコピー
COPY python/requirements_browser.txt .

# Pythonパッケージインストール
RUN pip install --no-cache-dir -r requirements_browser.txt

# アプリケーションコピー
COPY . .

# 非rootユーザー作成（セキュリティ）
RUN useradd -m -u 1001 appuser && \
    chown -R appuser:appuser /app
USER appuser

# ポート公開（Renderが動的に決定）
EXPOSE $PORT

# 起動スクリプト作成
COPY --chown=appuser:appuser start_render.sh .
RUN chmod +x start_render.sh

# Render用起動コマンド
CMD ["./start_render.sh"]