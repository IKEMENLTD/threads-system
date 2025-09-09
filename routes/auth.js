const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const router = express.Router();

// Supabase関数をインポート
const { createUser, getUserByEmail } = require('../supabase-setup');

// JWT秘密鍵
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';

// ユーザー登録
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // 入力検証
    if (!username || !email || !password) {
      return res.status(400).json({ 
        success: false,
        error: '必須項目が入力されていません' 
      });
    }
    
    // パスワード長チェック
    if (password.length < 6) {
      return res.status(400).json({ 
        success: false,
        error: 'パスワードは6文字以上必要です' 
      });
    }
    
    // ユーザーが既に存在するかチェック
    const existingUser = await getUserByEmail(email);
    
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        error: 'このメールアドレスは既に使用されています' 
      });
    }
    
    // パスワードをハッシュ化
    const passwordHash = await bcrypt.hash(password, 10);
    
    // 新規ユーザー作成
    const user = await createUser(email, username, passwordHash);
    
    // JWT トークン生成
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username,
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      success: true,
      message: 'ユーザー登録が完了しました',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'サーバーエラーが発生しました' 
    });
  }
});

// ログイン
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // 入力検証
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'メールアドレスとパスワードを入力してください' 
      });
    }
    
    // ユーザー検索
    const user = await getUserByEmail(email);
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: 'メールアドレスまたはパスワードが正しくありません' 
      });
    }
    
    // パスワード検証
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false,
        error: 'メールアドレスまたはパスワードが正しくありません' 
      });
    }
    
    // JWT トークン生成
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username,
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      message: 'ログインに成功しました',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.created_at
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      error: 'サーバーエラーが発生しました' 
    });
  }
});

// トークン検証
router.get('/verify', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        error: 'トークンが提供されていません' 
      });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    
    res.json({
      success: true,
      user: {
        id: decoded.userId,
        username: decoded.username,
        role: decoded.role
      }
    });
    
  } catch (error) {
    res.status(401).json({ 
      success: false,
      error: '無効なトークンです' 
    });
  }
});

module.exports = router;