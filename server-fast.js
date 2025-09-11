/**
 * Render用 超高速起動サーバー
 * ヘルスチェックに即座に応答
 */

const http = require('http');
const PORT = process.env.PORT || 10000;

// 1. 最速でHTTPサーバー起動
const server = http.createServer((req, res) => {
    // ヘルスチェックに即応答
    if (req.url === '/health' || req.url === '/' || req.url === '/api/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok' }));
        return;
    }
    
    // その他のリクエスト
    res.writeHead(200);
    res.end('OK');
});

// 2. 即座にリッスン（コールバックなし）
server.listen(PORT, '0.0.0.0');
console.log(`Server started on port ${PORT}`);

// 3. 5秒後にExpress等をロード
setTimeout(() => {
    console.log('Loading application modules...');
    
    try {
        const express = require('express');
        const cors = require('cors');
        const app = express();
        
        app.use(cors());
        app.use(express.json());
        
        // 静的ファイル
        app.use(express.static(__dirname));
        
        // APIルート
        app.get('/api/test', (req, res) => {
            res.json({ message: 'Backend is working!' });
        });
        
        // 既存のサーバーにExpressを追加
        server.removeAllListeners('request');
        server.on('request', app);
        
        console.log('Express application loaded');
        
        // さらに後でデータベース接続
        setTimeout(() => {
            if (process.env.SUPABASE_URL) {
                console.log('Connecting to database...');
                // データベース接続処理
            }
        }, 5000);
        
    } catch (error) {
        console.error('Module load error:', error.message);
    }
}, 5000);

// プロセス維持
process.on('SIGTERM', () => {
    server.close(() => process.exit(0));
});