const mongoose = require('mongoose');
const User = require('../models/User');

// MongoDB接続
mongoose.connect('mongodb://localhost:27017/threads_system', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function createInitialUsers() {
  try {
    console.log('初期ユーザーデータを作成中...\n');
    
    // デモユーザーデータ
    const users = [
      {
        username: 'admin',
        email: 'admin@example.com',
        password: 'admin123',
        displayName: '管理者',
        role: 'admin'
      },
      {
        username: 'user',
        email: 'user@example.com',
        password: 'user123',
        displayName: '一般ユーザー',
        role: 'user'
      },
      {
        username: 'testuser',
        email: 'test@example.com',
        password: 'test123',
        displayName: 'テストユーザー',
        role: 'user'
      }
    ];
    
    for (const userData of users) {
      try {
        // 既存ユーザーをチェック
        const existingUser = await User.findOne({ 
          $or: [
            { username: userData.username },
            { email: userData.email }
          ]
        });
        
        if (existingUser) {
          console.log(`⏭️  ユーザー '${userData.username}' は既に存在します`);
          continue;
        }
        
        // 新規ユーザー作成
        const user = new User(userData);
        await user.save();
        
        console.log(`✅ ユーザー作成完了: ${userData.username}`);
        console.log(`   - Email: ${userData.email}`);
        console.log(`   - Password: ${userData.password}`);
        console.log(`   - Role: ${userData.role}\n`);
        
      } catch (error) {
        console.error(`❌ ユーザー '${userData.username}' の作成に失敗:`, error.message);
      }
    }
    
    console.log('\n=====================================');
    console.log('初期ユーザーの作成が完了しました！');
    console.log('=====================================\n');
    console.log('ログインテスト用アカウント:');
    console.log('1. 管理者: username: admin, password: admin123');
    console.log('2. 一般: username: user, password: user123');
    console.log('3. テスト: username: testuser, password: test123');
    
  } catch (error) {
    console.error('エラーが発生しました:', error);
  } finally {
    // 接続を閉じる
    await mongoose.connection.close();
    console.log('\n✅ データベース接続を終了しました');
    process.exit(0);
  }
}

// 実行
createInitialUsers();