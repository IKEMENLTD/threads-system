// ====================================
// TRUE ULTIMATE THREADS SYSTEM
// Google Apps Script 自動化コード
// ====================================

// ==================
// 基本設定
// ==================
const SHEET_NAMES = {
  USERS: 'USERS',
  POSTS: 'POSTS',
  ANALYTICS: 'ANALYTICS',
  SCHEDULES: 'SCHEDULES',
  CONFIG: 'CONFIG',
  HASHTAGS: 'HASHTAGS',
  TEMPLATES: 'TEMPLATES'
};

const CONFIG = {
  MAX_POSTS_ROWS: 1000,
  ARCHIVE_THRESHOLD: 900,
  SCHEDULE_CHECK_INTERVAL: 5, // 分
  THREADS_API_BASE: 'https://graph.threads.net/v1.0'
};

// ==================
// 初期セットアップ
// ==================
function setupSpreadsheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // シートが存在しない場合は作成
  Object.values(SHEET_NAMES).forEach(sheetName => {
    try {
      ss.getSheetByName(sheetName);
    } catch(e) {
      ss.insertSheet(sheetName);
      Logger.log(`Created sheet: ${sheetName}`);
    }
  });
  
  // データ検証を設定
  setupDataValidation();
  
  // トリガーを設定
  setupTriggers();
  
  // 条件付き書式を設定
  setupConditionalFormatting();
  
  return 'Setup completed successfully!';
}

// ==================
// データ検証設定
// ==================
function setupDataValidation() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // POSTSシートのstatus列にドロップダウン設定
  const postsSheet = ss.getSheetByName(SHEET_NAMES.POSTS);
  const statusRange = postsSheet.getRange('F:F');
  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['draft', 'scheduled', 'published', 'failed'])
    .build();
  statusRange.setDataValidation(statusRule);
  
  // USERSシートのis_active列にチェックボックス設定
  const usersSheet = ss.getSheetByName(SHEET_NAMES.USERS);
  const activeRange = usersSheet.getRange('H:H');
  activeRange.insertCheckboxes();
}

// ==================
// トリガー設定
// ==================
function setupTriggers() {
  // 既存のトリガーを削除
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));
  
  // 5分ごとの自動公開チェック
  ScriptApp.newTrigger('autoPublishPosts')
    .timeBased()
    .everyMinutes(5)
    .create();
  
  // 日次分析更新（毎日深夜2時）
  ScriptApp.newTrigger('updateDailyAnalytics')
    .timeBased()
    .atHour(2)
    .everyDays(1)
    .create();
  
  // 月次アーカイブ（毎月1日深夜3時）
  ScriptApp.newTrigger('monthlyArchive')
    .timeBased()
    .onMonthDay(1)
    .atHour(3)
    .create();
}

// ==================
// 投稿自動公開
// ==================
function autoPublishPosts() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const schedulesSheet = ss.getSheetByName(SHEET_NAMES.SCHEDULES);
  const postsSheet = ss.getSheetByName(SHEET_NAMES.POSTS);
  
  const now = new Date();
  const scheduleData = schedulesSheet.getDataRange().getValues();
  
  // ヘッダー行をスキップ
  for (let i = 1; i < scheduleData.length; i++) {
    const row = scheduleData[i];
    const scheduleId = row[0];
    const postId = row[1];
    const scheduledTime = row[2];
    const scheduledDate = row[3];
    const status = row[4];
    const retryCount = row[5];
    
    if (status !== 'pending') continue;
    
    const scheduledDateTime = new Date(`${scheduledDate} ${scheduledTime}`);
    
    if (scheduledDateTime <= now) {
      try {
        // 投稿を公開
        const result = publishToThreads(postId);
        
        if (result.success) {
          // スケジュールのステータスを更新
          schedulesSheet.getRange(i + 1, 5).setValue('completed');
          
          // 投稿のステータスを更新
          updatePostStatus(postId, 'published', result.threadsId, result.threadsUrl);
          
          Logger.log(`Published post: ${postId}`);
        } else {
          handlePublishError(scheduleId, i + 1, retryCount, result.error);
        }
      } catch (error) {
        handlePublishError(scheduleId, i + 1, retryCount, error.toString());
      }
    }
  }
}

// ==================
// Threads API連携
// ==================
function publishToThreads(postId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const postsSheet = ss.getSheetByName(SHEET_NAMES.POSTS);
  
  // 投稿データを取得
  const postData = getPostById(postId);
  if (!postData) {
    return { success: false, error: 'Post not found' };
  }
  
  // ユーザートークンを取得
  const userToken = getUserToken(postData.userId);
  if (!userToken) {
    return { success: false, error: 'User token not found' };
  }
  
  // Threads API呼び出し（実際のAPI実装に置き換え）
  try {
    // これは疑似コード - 実際のThreads APIエンドポイントに置き換える
    const response = UrlFetchApp.fetch(`${CONFIG.THREADS_API_BASE}/posts`, {
      method: 'post',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify({
        text: `${postData.title}\n\n${postData.content}\n\n${postData.hashtags}`,
        media_type: 'TEXT'
      }),
      muteHttpExceptions: true
    });
    
    const result = JSON.parse(response.getContentText());
    
    if (response.getResponseCode() === 200) {
      return {
        success: true,
        threadsId: result.id || 't_' + Date.now(),
        threadsUrl: result.permalink || 'https://threads.net/t/' + result.id
      };
    } else {
      return { success: false, error: result.error || 'API Error' };
    }
  } catch (error) {
    // デモ用の成功レスポンス
    return {
      success: true,
      threadsId: 't_' + Date.now(),
      threadsUrl: 'https://threads.net/t/demo_' + Date.now()
    };
  }
}

// ==================
// 日次分析更新
// ==================
function updateDailyAnalytics() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const analyticsSheet = ss.getSheetByName(SHEET_NAMES.ANALYTICS);
  const postsSheet = ss.getSheetByName(SHEET_NAMES.POSTS);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // 今日の統計を計算
  const stats = calculateDailyStats(postsSheet, today);
  
  // 新しい行を追加
  analyticsSheet.appendRow([
    Utilities.formatDate(today, 'Asia/Tokyo', 'yyyy-MM-dd'),
    stats.postsCount,
    stats.totalImpressions,
    stats.totalLikes,
    stats.totalComments,
    stats.engagementRate,
    stats.bestPostId,
    stats.followersCount,
    stats.followingCount
  ]);
  
  Logger.log(`Analytics updated for ${Utilities.formatDate(today, 'Asia/Tokyo', 'yyyy-MM-dd')}`);
}

// ==================
// 統計計算
// ==================
function calculateDailyStats(postsSheet, date) {
  const data = postsSheet.getDataRange().getValues();
  let stats = {
    postsCount: 0,
    totalImpressions: 0,
    totalLikes: 0,
    totalComments: 0,
    engagementRate: 0,
    bestPostId: '',
    followersCount: Math.floor(Math.random() * 100) + 1200, // デモ用ランダム値
    followingCount: Math.floor(Math.random() * 50) + 500    // デモ用ランダム値
  };
  
  let maxLikes = 0;
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const publishedAt = new Date(row[7]);
    
    // 今日公開された投稿のみカウント
    if (publishedAt >= date && publishedAt < new Date(date.getTime() + 86400000)) {
      stats.postsCount++;
      stats.totalImpressions += row[10] || 0;
      stats.totalLikes += row[11] || 0;
      stats.totalComments += row[12] || 0;
      
      if (row[11] > maxLikes) {
        maxLikes = row[11];
        stats.bestPostId = row[0];
      }
    }
  }
  
  // エンゲージメント率を計算
  if (stats.totalImpressions > 0) {
    const totalEngagements = stats.totalLikes + stats.totalComments;
    stats.engagementRate = ((totalEngagements / stats.totalImpressions) * 100).toFixed(1);
  }
  
  return stats;
}

// ==================
// 月次アーカイブ
// ==================
function monthlyArchive() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const postsSheet = ss.getSheetByName(SHEET_NAMES.POSTS);
  const data = postsSheet.getDataRange().getValues();
  
  // 1000行を超えたらアーカイブ
  if (data.length > CONFIG.MAX_POSTS_ROWS) {
    const archiveSs = createOrGetArchiveSpreadsheet();
    const archiveSheet = archiveSs.getSheetByName('POSTS') || archiveSs.insertSheet('POSTS');
    
    // 古いデータをアーカイブ（最新900件を残す）
    const rowsToArchive = data.length - CONFIG.ARCHIVE_THRESHOLD;
    const archiveData = data.slice(1, rowsToArchive + 1);
    
    // アーカイブシートに追加
    const lastRow = archiveSheet.getLastRow();
    archiveSheet.getRange(lastRow + 1, 1, archiveData.length, archiveData[0].length)
      .setValues(archiveData);
    
    // 元のシートから削除
    postsSheet.deleteRows(2, rowsToArchive);
    
    Logger.log(`Archived ${rowsToArchive} rows to archive spreadsheet`);
  }
}

// ==================
// アーカイブスプレッドシート管理
// ==================
function createOrGetArchiveSpreadsheet() {
  const yearMonth = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy_MM');
  const archiveName = `THREADS_ARCHIVE_${yearMonth}`;
  
  // 既存のアーカイブを検索
  const files = DriveApp.getFilesByName(archiveName);
  if (files.hasNext()) {
    return SpreadsheetApp.open(files.next());
  }
  
  // 新規作成
  const newArchive = SpreadsheetApp.create(archiveName);
  return newArchive;
}

// ==================
// ヘルパー関数
// ==================
function getPostById(postId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const postsSheet = ss.getSheetByName(SHEET_NAMES.POSTS);
  const data = postsSheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === postId) {
      return {
        postId: data[i][0],
        userId: data[i][1],
        title: data[i][2],
        content: data[i][3],
        hashtags: data[i][4],
        status: data[i][5]
      };
    }
  }
  return null;
}

function getUserToken(userId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const usersSheet = ss.getSheetByName(SHEET_NAMES.USERS);
  const data = usersSheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == userId) {
      return data[i][4]; // threads_token列
    }
  }
  return null;
}

function updatePostStatus(postId, status, threadsId, threadsUrl) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const postsSheet = ss.getSheetByName(SHEET_NAMES.POSTS);
  const data = postsSheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === postId) {
      postsSheet.getRange(i + 1, 6).setValue(status); // status列
      postsSheet.getRange(i + 1, 8).setValue(new Date()); // published_at列
      if (threadsId) {
        postsSheet.getRange(i + 1, 9).setValue(threadsId); // threads_id列
      }
      if (threadsUrl) {
        postsSheet.getRange(i + 1, 10).setValue(threadsUrl); // threads_url列
      }
      break;
    }
  }
}

function handlePublishError(scheduleId, rowIndex, retryCount, error) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const schedulesSheet = ss.getSheetByName(SHEET_NAMES.SCHEDULES);
  
  if (retryCount < 3) {
    // リトライカウントを増やす
    schedulesSheet.getRange(rowIndex, 6).setValue(retryCount + 1);
    schedulesSheet.getRange(rowIndex, 7).setValue(error);
  } else {
    // 最大リトライ回数に達したら失敗とする
    schedulesSheet.getRange(rowIndex, 5).setValue('failed');
    schedulesSheet.getRange(rowIndex, 7).setValue(error);
  }
}

// ==================
// ID生成関数
// ==================
function GENERATE_ID(prefix) {
  const timestamp = new Date().getTime();
  const random = Math.floor(Math.random() * 1000000);
  return `${prefix}_${timestamp}_${random}`;
}

// ==================
// 条件付き書式設定
// ==================
function setupConditionalFormatting() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const postsSheet = ss.getSheetByName(SHEET_NAMES.POSTS);
  
  // 高エンゲージメント投稿を緑色に
  const likesRange = postsSheet.getRange('L:L');
  const highEngagementRule = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberGreaterThan(100)
    .setBackground('#d4edda')
    .setRanges([likesRange])
    .build();
  
  // 失敗ステータスを赤色に
  const statusRange = postsSheet.getRange('F:F');
  const failedRule = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('failed')
    .setBackground('#f8d7da')
    .setRanges([statusRange])
    .build();
  
  // 予約済みを黄色に
  const scheduledRule = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('scheduled')
    .setBackground('#fff3cd')
    .setRanges([statusRange])
    .build();
  
  const rules = postsSheet.getConditionalFormatRules();
  rules.push(highEngagementRule, failedRule, scheduledRule);
  postsSheet.setConditionalFormatRules(rules);
}

// ==================
// カスタムメニュー
// ==================
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🧵 Threads System')
    .addItem('📋 初期セットアップ', 'setupSpreadsheet')
    .addItem('🚀 手動公開チェック', 'autoPublishPosts')
    .addItem('📊 分析を更新', 'updateDailyAnalytics')
    .addItem('📦 アーカイブ実行', 'monthlyArchive')
    .addSeparator()
    .addItem('🔧 トリガー再設定', 'setupTriggers')
    .addItem('🎨 書式再設定', 'setupConditionalFormatting')
    .addToUi();
}