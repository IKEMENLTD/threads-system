/**
 * Render用エントリーポイント
 * 最小限の起動時間でヘルスチェックに応答
 */

// 即座にポート番号を取得してサーバー起動
const PORT = process.env.PORT || 10000;
require('http').createServer((req, res) => {
    res.writeHead(200);
    res.end('OK');
}).listen(PORT);

console.log('Server running on port', PORT);

// メインアプリケーションを非同期でロード
setTimeout(() => require('./server.js'), 100);