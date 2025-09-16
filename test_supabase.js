/**
 * Supabase接続テストスクリプト
 */

require('dotenv').config();
const db = require('./backend/supabase-database');

async function testSupabaseConnection() {
    console.log('==========================================');
    console.log('  Supabase Connection Test');
    console.log('==========================================\n');

    // 環境変数確認
    console.log('📋 Environment Variables:');
    console.log(`  SUPABASE_URL: ${process.env.SUPABASE_URL ? '✓ Set' : '✗ Not set'}`);
    console.log(`  SUPABASE_ANON_KEY: ${process.env.SUPABASE_ANON_KEY ? '✓ Set' : '✗ Not set'}`);
    console.log(`  SUPABASE_SERVICE_KEY: ${process.env.SUPABASE_SERVICE_KEY ? '✓ Set' : '✗ Not set'}\n`);

    try {
        // 初期化
        console.log('🔧 Initializing database...');
        const initialized = await db.initializeDatabase();

        if (!initialized) {
            console.error('❌ Database initialization failed');
            return;
        }

        // ユーザー一覧取得テスト
        console.log('\n📊 Testing user operations...');
        const testEmail = 'test@example.com';
        let user = await db.users.findByEmail(testEmail);

        if (user) {
            console.log(`✓ Found existing user: ${user.username}`);
        } else {
            console.log('  No test user found');
        }

        // 投稿一覧取得テスト
        console.log('\n📝 Testing post operations...');
        const posts = await db.posts.findAll(null, { limit: 5 });
        console.log(`✓ Found ${posts.length} posts`);

        if (posts.length > 0) {
            posts.forEach(post => {
                console.log(`  - ${post.title || 'Untitled'}: ${post.status}`);
            });
        }

        // 予約投稿確認
        console.log('\n⏰ Checking scheduled posts...');
        const scheduledPosts = await db.posts.getScheduledPosts();
        console.log(`✓ Found ${scheduledPosts.length} scheduled posts ready to publish`);

        // テンプレート確認
        console.log('\n📋 Testing template operations...');
        if (user) {
            const templates = await db.templates.findAll(user.id);
            console.log(`✓ Found ${templates.length} templates for user`);
        }

        console.log('\n==========================================');
        console.log('✅ All tests completed successfully!');
        console.log('==========================================');

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// 実行
testSupabaseConnection();