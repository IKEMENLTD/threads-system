/**
 * Renderデプロイ用ヘルスチェックサーバー
 * 最小限の実装でデプロイ問題を切り分け
 */

const http = require('http');

const PORT = process.env.PORT || 10000;
const HOST = '0.0.0.0';

console.log('=== HEALTH CHECK SERVER ===');
console.log('Environment Variables:');
console.log('PORT:', PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PWD:', process.cwd());
console.log('Node Version:', process.version);

// シンプルなHTTPサーバー
const server = http.createServer((req, res) => {
    console.log(`Request: ${req.method} ${req.url}`);
    
    if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            status: 'ok', 
            timestamp: new Date().toISOString(),
            port: PORT,
            env: process.env.NODE_ENV || 'development'
        }));
    } else {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Health Check Server Running');
    }
});

// エラーハンドリング
server.on('error', (error) => {
    console.error('Server Error:', error);
    process.exit(1);
});

// サーバー起動
server.listen(PORT, HOST, () => {
    console.log(`Health Check Server running at http://${HOST}:${PORT}`);
    console.log('Server started successfully!');
});

// グレースフルシャットダウン
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});