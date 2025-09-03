const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

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
    
    // ユーザーが既に存在するかチェック
    const existingUser = await User.findOne({ 
      $or: [{ username }, { email }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        error: 'ユーザー名またはメールアドレスは既に使用されています' 
      });
    }
    
    // 新規ユーザー作成
    const user = new User({
      username,
      email,
      password,
      displayName: username
    });
    
    await user.save();
    
    // JWT トークン生成
    const token = jwt.sign(
      { 
        userId: user._id, 
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
        id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
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
    const { username, password } = req.body;
    
    // 入力検証
    if (!username || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'ユーザー名とパスワードを入力してください' 
      });
    }
    
    // ユーザー検索（usernameまたはemailで検索）
    const user = await User.findOne({
      $or: [
        { username: username },
        { email: username }
      ]
    });
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: 'ユーザー名またはパスワードが正しくありません' 
      });
    }
    
    // パスワード検証
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false,
        error: 'ユーザー名またはパスワードが正しくありません' 
      });
    }
    
    // 最終ログイン時刻を更新
    user.lastLogin = new Date();
    await user.save();
    
    // JWT トークン生成
    const token = jwt.sign(
      { 
        userId: user._id, 
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
        id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        createdAt: user.createdAt
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
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'ユーザーが見つかりません' 
      });
    }
    
    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        role: user.role
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