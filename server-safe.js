/**
 * Render用の最も安全なサーバー実装
 * 問題を特定するための段階的起動
 */

// 1. 即座に出力
console.log('[SAFE] Server process started');
console.log('[SAFE] Node:', process.version);
console.log('[SAFE] PID:', process.pid);

// 2. 基本的なHTTPサーバーを最初に起動
const http = require('http');
const PORT = process.env.PORT || 10000;

// 3. シンプルなリクエストハンドラー
const requestHandler = (req, res) => {
    console.log('[REQUEST]', req.method, req.url);
    
    // ヘルスチェック対応
    if (req.url === '/health' || req.url === '/api/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            status: 'healthy',
            timestamp: new Date().toISOString()
        }));
        return;
    }
    
    // デフォルトレスポンス
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Server is running');
};

// 4. サーバー作成と起動
const server = http.createServer(requestHandler);

// エラーハンドリング
server.on('error', (error) => {
    console.error('[SAFE] Server error:', error);
    if (error.code === 'EADDRINUSE') {
        console.error('[SAFE] Port', PORT, 'is already in use');
    }
    // エラーでもプロセスを終了しない
});

// リスニング成功
server.on('listening', () => {
    const addr = server.address();
    console.log('[SAFE] Server listening on port', addr.port);
});

// 5. 実際にリッスン開始
console.log('[SAFE] Starting HTTP server on port', PORT);
server.listen(PORT, '0.0.0.0');

// 6. Expressを後からロード（オプション）
setTimeout(() => {
    console.log('[SAFE] Attempting to load Express...');
    try {
        const express = require('express');
        const app = express();
        
        // テストエンドポイント
        app.get('/api/test', (req, res) => {
            res.json({ 
                message: 'Express is working',
                env: process.env.NODE_ENV
            });
        });
        
        // Expressアプリをサーバーにアタッチ
        server.on('request', app);
        console.log('[SAFE] Express loaded and attached');
        
    } catch (error) {
        console.error('[SAFE] Express load failed:', error.message);
        // Expressが失敗してもサーバーは動作継続
    }
}, 2000);

// 7. プロセスを維持
setInterval(() => {
    const mem = process.memoryUsage();
    console.log('[SAFE] Heartbeat:', {
        uptime: Math.floor(process.uptime()) + 's',
        memory: Math.floor(mem.heapUsed / 1024 / 1024) + 'MB',
        port: PORT
    });
}, 30000); // 30秒ごと

// 8. グレースフルシャットダウン
process.on('SIGTERM', () => {
    console.log('[SAFE] SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('[SAFE] Server closed');
        process.exit(0);
    });
});

// 9. 未処理エラーをキャッチ
process.on('uncaughtException', (error) => {
    console.error('[SAFE] Uncaught Exception:', error);
    // プロセスは継続
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('[SAFE] Unhandled Rejection:', reason);
    // プロセスは継続
});

console.log('[SAFE] Initialization complete');