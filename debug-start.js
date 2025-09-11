#!/usr/bin/env node

/**
 * Render デプロイデバッグ用起動スクリプト
 * 詳細なログで問題箇所を特定
 */

console.log('===== DEBUG START SCRIPT =====');
console.log('Time:', new Date().toISOString());
console.log('Node Version:', process.version);
console.log('Platform:', process.platform);
console.log('Architecture:', process.arch);
console.log('Current Directory:', process.cwd());
console.log('Script Directory:', __dirname);
console.log('Memory Usage:', process.memoryUsage());

// 環境変数チェック
console.log('\n===== ENVIRONMENT VARIABLES =====');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('SUPABASE_URL exists:', !!process.env.SUPABASE_URL);
console.log('SUPABASE_ANON_KEY exists:', !!process.env.SUPABASE_ANON_KEY);
console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);

// ファイルシステムチェック
console.log('\n===== FILE SYSTEM CHECK =====');
const fs = require('fs');
const path = require('path');

const filesToCheck = [
  'package.json',
  'server.js',
  'routes/auth.js',
  'routes/posts.js',
  'supabase-setup.js',
  '.env'
];

filesToCheck.forEach(file => {
  const fullPath = path.join(__dirname, file);
  const exists = fs.existsSync(fullPath);
  console.log(`${file}: ${exists ? 'EXISTS' : 'NOT FOUND'}`);
  if (exists) {
    const stats = fs.statSync(fullPath);
    console.log(`  Size: ${stats.size} bytes, Modified: ${stats.mtime}`);
  }
});

// node_modules チェック
console.log('\n===== NODE_MODULES CHECK =====');
const nodeModulesPath = path.join(__dirname, 'node_modules');
if (fs.existsSync(nodeModulesPath)) {
  console.log('node_modules directory exists');
  const requiredModules = ['express', 'cors', 'dotenv', 'jsonwebtoken', 'bcryptjs'];
  requiredModules.forEach(mod => {
    const modPath = path.join(nodeModulesPath, mod);
    console.log(`${mod}: ${fs.existsSync(modPath) ? 'INSTALLED' : 'MISSING'}`);
  });
} else {
  console.log('WARNING: node_modules directory not found!');
}

// メインサーバー起動
console.log('\n===== STARTING MAIN SERVER =====');
try {
  require('./server.js');
} catch (error) {
  console.error('\n===== CRITICAL ERROR IN SERVER.JS =====');
  console.error('Error Type:', error.constructor.name);
  console.error('Error Message:', error.message);
  console.error('Error Code:', error.code);
  console.error('Stack Trace:', error.stack);
  process.exit(1);
}