#!/bin/bash

# Render用起動スクリプト
echo "Starting Threads System Backend..."
echo "Node version: $(node -v)"
echo "Environment: $NODE_ENV"
echo "Port: $PORT"

# ファイル確認
if [ ! -f "server.js" ]; then
    echo "ERROR: server.js not found!"
    exit 1
fi

if [ ! -f "package.json" ]; then
    echo "ERROR: package.json not found!"
    exit 1
fi

# HTMLファイル確認
echo "Checking HTML files..."
for file in index.html login.html dashboard.html posts.html; do
    if [ -f "$file" ]; then
        echo "✓ $file found"
    else
        echo "⚠ $file not found"
    fi
done

# 環境変数確認
echo "Checking environment variables..."
if [ -z "$SUPABASE_URL" ]; then
    echo "⚠ SUPABASE_URL not set"
else
    echo "✓ SUPABASE_URL set"
fi

if [ -z "$SUPABASE_ANON_KEY" ]; then
    echo "⚠ SUPABASE_ANON_KEY not set"
else
    echo "✓ SUPABASE_ANON_KEY set"
fi

if [ -z "$JWT_SECRET" ]; then
    echo "⚠ JWT_SECRET not set"
else
    echo "✓ JWT_SECRET set"
fi

# サーバー起動
echo "Starting server..."
exec node server.js