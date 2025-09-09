/**
 * Supabase データベースデバッグツール
 * 全テーブル・全カラムの情報を取得して表示
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabaseクライアント初期化
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

/**
 * 全テーブルの構造を取得
 */
async function getAllTableStructure() {
  console.log('📊 データベース構造を取得中...\n');
  
  const { data, error } = await supabase.rpc('get_all_table_columns', {}, {
    // カスタム関数がない場合は直接SQLを実行
  });

  // 直接SQLクエリを実行（管理者権限が必要）
  const query = `
    SELECT 
      t.table_name,
      c.column_name,
      c.data_type,
      CASE 
        WHEN c.character_maximum_length IS NOT NULL 
        THEN c.data_type || '(' || c.character_maximum_length || ')'
        ELSE c.data_type 
      END as full_type,
      c.is_nullable,
      c.column_default,
      c.ordinal_position
    FROM information_schema.tables t
    JOIN information_schema.columns c 
      ON t.table_name = c.table_name 
      AND t.table_schema = c.table_schema
    WHERE t.table_schema = 'public' 
      AND t.table_type = 'BASE TABLE'
    ORDER BY t.table_name, c.ordinal_position
  `;

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql: query });
    
    if (error) {
      console.error('❌ エラー:', error);
      // 代替方法：各テーブルを個別に確認
      await getTableStructureAlternative();
      return;
    }

    // テーブルごとにグループ化して表示
    const tables = {};
    data.forEach(row => {
      if (!tables[row.table_name]) {
        tables[row.table_name] = [];
      }
      tables[row.table_name].push(row);
    });

    // 結果を表示
    Object.keys(tables).forEach(tableName => {
      console.log(`\n📋 テーブル: ${tableName}`);
      console.log('━'.repeat(60));
      console.table(tables[tableName].map(col => ({
        'カラム名': col.column_name,
        '型': col.full_type,
        'NULL可': col.is_nullable,
        'デフォルト': col.column_default ? col.column_default.substring(0, 30) : null
      })));
    });

  } catch (err) {
    console.error('❌ SQLエラー:', err.message);
    // 代替方法を実行
    await getTableStructureAlternative();
  }
}

/**
 * 代替方法：各テーブルから1行取得して構造を推測
 */
async function getTableStructureAlternative() {
  console.log('\n🔄 代替方法で構造を取得中...\n');

  const tables = [
    'users',
    'posts', 
    'hashtags',
    'post_hashtags',
    'templates',
    'post_stats'
  ];

  for (const table of tables) {
    try {
      // 1行だけ取得
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`⚠️  ${table}: アクセス不可 (${error.message})`);
        continue;
      }

      console.log(`\n📋 テーブル: ${table}`);
      console.log('━'.repeat(60));

      if (data && data.length > 0) {
        // カラム情報を表示
        const columns = Object.keys(data[0]).map(key => ({
          'カラム名': key,
          '型': typeof data[0][key],
          'サンプル値': data[0][key] !== null ? 
            String(data[0][key]).substring(0, 50) : 
            'NULL'
        }));
        console.table(columns);
      } else {
        // データがない場合は構造だけ取得を試みる
        console.log('   (データなし - カラム情報を取得できません)');
      }

    } catch (err) {
      console.log(`❌ ${table}: エラー (${err.message})`);
    }
  }
}

/**
 * 各テーブルのデータ件数を取得
 */
async function getTableCounts() {
  console.log('\n📈 テーブルごとのレコード数\n');
  console.log('━'.repeat(40));

  const tables = [
    'users',
    'posts', 
    'hashtags',
    'post_hashtags',
    'templates',
    'post_stats'
  ];

  const counts = [];

  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        counts.push({
          'テーブル': table,
          'レコード数': 'アクセス不可',
          'ステータス': '❌'
        });
      } else {
        counts.push({
          'テーブル': table,
          'レコード数': count || 0,
          'ステータス': '✅'
        });
      }
    } catch (err) {
      counts.push({
        'テーブル': table,
        'レコード数': 'エラー',
        'ステータス': '❌'
      });
    }
  }

  console.table(counts);
}

/**
 * サンプルデータを表示
 */
async function showSampleData() {
  console.log('\n📝 サンプルデータ\n');

  // ユーザー一覧
  console.log('【ユーザー】');
  const { data: users } = await supabase
    .from('users')
    .select('id, username, email, role, created_at')
    .limit(5);
  
  if (users && users.length > 0) {
    console.table(users);
  } else {
    console.log('  データなし');
  }

  // 投稿一覧
  console.log('\n【最新の投稿】');
  const { data: posts } = await supabase
    .from('posts')
    .select('id, content, status, scheduled_at, created_at')
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (posts && posts.length > 0) {
    console.table(posts.map(p => ({
      ...p,
      content: p.content ? p.content.substring(0, 30) + '...' : null
    })));
  } else {
    console.log('  データなし');
  }

  // ハッシュタグ
  console.log('\n【人気のハッシュタグ】');
  const { data: hashtags } = await supabase
    .from('hashtags')
    .select('name, usage_count')
    .order('usage_count', { ascending: false })
    .limit(10);
  
  if (hashtags && hashtags.length > 0) {
    console.table(hashtags);
  } else {
    console.log('  データなし');
  }
}

/**
 * データベース統計を表示
 */
async function showStatistics() {
  console.log('\n📊 データベース統計\n');
  console.log('━'.repeat(40));

  try {
    // 投稿ステータス別集計
    const { data: statusCount } = await supabase
      .from('posts')
      .select('status')
      .order('status');

    if (statusCount) {
      const stats = {};
      statusCount.forEach(row => {
        stats[row.status] = (stats[row.status] || 0) + 1;
      });
      
      console.log('【投稿ステータス】');
      console.table(Object.entries(stats).map(([status, count]) => ({
        'ステータス': status,
        '件数': count,
        '割合': `${((count / statusCount.length) * 100).toFixed(1)}%`
      })));
    }

    // 今月の投稿数
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const { count: monthlyPosts } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfMonth.toISOString());

    console.log(`\n📅 今月の投稿数: ${monthlyPosts || 0}件`);

  } catch (err) {
    console.error('統計取得エラー:', err.message);
  }
}

/**
 * 接続テスト
 */
async function testConnection() {
  console.log('🔌 Supabase接続テスト中...\n');
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });

    if (error) {
      console.error('❌ 接続エラー:', error.message);
      return false;
    }

    console.log('✅ 接続成功！\n');
    return true;
  } catch (err) {
    console.error('❌ 接続失敗:', err.message);
    return false;
  }
}

/**
 * メイン実行関数
 */
async function main() {
  console.log('='.repeat(60));
  console.log(' Supabase データベースデバッグツール');
  console.log('='.repeat(60));

  // 環境変数チェック
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.error('\n❌ 環境変数が設定されていません！');
    console.log('\n.envファイルに以下を設定してください:');
    console.log('SUPABASE_URL=https://xxxxx.supabase.co');
    console.log('SUPABASE_ANON_KEY=eyJhbGc...');
    console.log('SUPABASE_SERVICE_KEY=eyJhbGc... (オプション)');
    return;
  }

  // 接続テスト
  const connected = await testConnection();
  if (!connected) {
    console.log('\n⚠️  接続に失敗しました。環境変数を確認してください。');
    return;
  }

  // 各種情報を表示
  await getAllTableStructure();
  await getTableCounts();
  await showSampleData();
  await showStatistics();

  console.log('\n' + '='.repeat(60));
  console.log(' デバッグ完了');
  console.log('='.repeat(60));
}

// エクスポート（他のファイルから使用可能）
module.exports = {
  getAllTableStructure,
  getTableCounts,
  showSampleData,
  showStatistics,
  testConnection
};

// 直接実行された場合
if (require.main === module) {
  main().catch(console.error);
}