const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';

// 認証ミドルウェア
const authenticateToken = (req, res, next) => {
  try {
    // Authorizationヘッダーからトークンを取得
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.replace('Bearer ', '') 
      : null;
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        error: '認証が必要です' 
      });
    }
    
    // トークンを検証
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // リクエストオブジェクトにユーザー情報を追加
    req.userId = decoded.userId;
    req.username = decoded.username;
    req.userRole = decoded.role;
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        error: 'トークンの有効期限が切れています' 
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        error: '無効なトークンです' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'サーバーエラーが発生しました' 
    });
  }
};

// 管理者権限チェックミドルウェア
const requireAdmin = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ 
      success: false,
      error: '管理者権限が必要です' 
    });
  }
  next();
};

// オプショナル認証（ログインしていなくてもOK）
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.replace('Bearer ', '') 
      : null;
    
    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.userId = decoded.userId;
      req.username = decoded.username;
      req.userRole = decoded.role;
    }
    
    next();
  } catch (error) {
    // トークンが無効でも続行
    next();
  }
};

module.exports = {
  authenticateToken,
  requireAdmin,
  optionalAuth
};