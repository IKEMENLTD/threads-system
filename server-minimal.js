/**
 * 最小限のExpressサーバー
 * Renderデプロイ問題の切り分け用
 */

const express = require('express');
const app = express();

const PORT = process.env.PORT || 10000;
const HOST = '0.0.0.0';

console.log('=== MINIMAL EXPRESS SERVER ===');
console.log('PORT:', PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Current Directory:', process.cwd());

// 基本的なミドルウェアのみ
app.use(express.json());

// ヘルスチェック
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok',
        server: 'minimal',
        timestamp: new Date().toISOString()
    });
});

// ルート
app.get('/', (req, res) => {
    res.send('Minimal Server Running');
});

// 404ハンドリング
app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
});

// エラーハンドリング
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
});

// サーバー起動
const server = app.listen(PORT, HOST, () => {
    console.log(`Minimal Express Server running at http://${HOST}:${PORT}`);
    console.log('Server started successfully!');
});

// グレースフルシャットダウン
process.on('SIGTERM', () => {
    console.log('SIGTERM received');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});