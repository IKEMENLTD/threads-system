const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'ユーザー名は必須です'],
    unique: true,
    trim: true,
    minlength: [3, 'ユーザー名は3文字以上必要です'],
    maxlength: [20, 'ユーザー名は20文字以内にしてください']
  },
  email: {
    type: String,
    required: [true, 'メールアドレスは必須です'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, '有効なメールアドレスを入力してください']
  },
  password: {
    type: String,
    required: [true, 'パスワードは必須です'],
    minlength: [6, 'パスワードは6文字以上必要です']
  },
  displayName: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['admin', 'user', 'guest'],
    default: 'user'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: Date,
  settings: {
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: false }
    },
    privacy: {
      profileVisibility: { type: String, default: 'public' },
      showAnalytics: { type: Boolean, default: true }
    }
  }
});

// パスワードを保存前にハッシュ化
userSchema.pre('save', async function(next) {
  // パスワードが変更されていない場合はスキップ
  if (!this.isModified('password')) return next();
  
  try {
    // パスワードをハッシュ化
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// パスワード検証メソッド
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// JSONレスポンス時にパスワードを除外
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);