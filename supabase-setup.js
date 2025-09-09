/**
 * Supabase接続設定
 * 最小限の実装
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase クライアント作成
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || ''
);

// 接続テスト関数
async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('Supabase接続エラー:', error.message);
      return false;
    }
    
    console.log('✅ Supabase接続成功');
    return true;
  } catch (err) {
    console.error('接続失敗:', err.message);
    return false;
  }
}

// ユーザー作成
async function createUser(email, username, passwordHash) {
  const { data, error } = await supabase
    .from('users')
    .insert([
      {
        email,
        username,
        password_hash: passwordHash,
        role: 'user'
      }
    ])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// ユーザー取得（ログイン用）
async function getUserByEmail(email) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error; // not found以外はエラー
  return data;
}

// 投稿作成
async function createPost(userId, content, scheduledAt = null) {
  const { data, error } = await supabase
    .from('posts')
    .insert([
      {
        user_id: userId,
        content,
        status: scheduledAt ? 'scheduled' : 'draft',
        scheduled_at: scheduledAt
      }
    ])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// 投稿一覧取得
async function getUserPosts(userId, limit = 20) {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return data;
}

// スケジュール済み投稿取得
async function getScheduledPosts() {
  const now = new Date().toISOString();
  
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('status', 'scheduled')
    .lte('scheduled_at', now)
    .order('scheduled_at', { ascending: true });
  
  if (error) throw error;
  return data;
}

// 投稿ステータス更新
async function updatePostStatus(postId, status, errorMessage = null) {
  const updateData = { status };
  
  if (status === 'published') {
    updateData.published_at = new Date().toISOString();
  }
  
  if (errorMessage) {
    updateData.error_message = errorMessage;
  }
  
  const { data, error } = await supabase
    .from('posts')
    .update(updateData)
    .eq('id', postId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// テンプレート作成
async function createTemplate(userId, name, content, hashtags = '') {
  const { data, error } = await supabase
    .from('templates')
    .insert([
      {
        user_id: userId,
        name,
        content,
        hashtags
      }
    ])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// テンプレート取得
async function getUserTemplates(userId) {
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

module.exports = {
  supabase,
  testConnection,
  createUser,
  getUserByEmail,
  createPost,
  getUserPosts,
  getScheduledPosts,
  updatePostStatus,
  createTemplate,
  getUserTemplates
};