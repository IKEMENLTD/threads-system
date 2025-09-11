/**
 * 即座に応答するサーバー
 * Renderのヘルスチェックタイムアウト対策
 */

console.log('=== IMMEDIATE SERVER START ===');

// 即座にHTTPサーバーを起動
const http = require('http');
const PORT = process.env.PORT || 10000;

// まず最初にサーバーを起動
const server = http.createServer((req, res) => {
    if (req.url === '/health' || req.url === '/') {
        res.writeHead(200);
        res.end('OK');
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

// 即座にリッスン開始
server.listen(PORT, '0.0.0.0');
console.log('Server listening on ' + PORT);

// その後でExpressをロード
setTimeout(() => {
    console.log('Loading Express application...');
    try {
        // ここで本来のアプリケーションをロード
        const express = require('express');
        const app = express();
        
        // 簡単なルート
        app.get('/api/test', (req, res) => {
            res.json({ status: 'Express loaded' });
        });
        
        console.log('Express loaded successfully');
    } catch (error) {
        console.error('Failed to load Express:', error);
    }
}, 1000);