/**
 * Render最小限テストサーバー
 * 絶対に失敗しないシンプルな実装
 */

// 標準モジュールのみ使用
const http = require('http');

const PORT = process.env.PORT || 10000;

// 即座にログ出力
console.log('RENDER TEST SERVER STARTING');
console.log('PORT=' + PORT);

// 最もシンプルなHTTPサーバー
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
});

// サーバー起動
server.listen(PORT, '0.0.0.0', () => {
    console.log('Server is running on port ' + PORT);
});

// プロセスを生かし続ける
setInterval(() => {
    console.log('Server still alive at', new Date().toISOString());
}, 30000); // 30秒ごとにログ