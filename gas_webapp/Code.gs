// ====================================
// THREADS SYSTEM - Google Apps Script Web App
// メインサーバー処理
// ====================================

// ==================
// グローバル設定
// ==================
const APP_CONFIG = {
  APP_NAME: 'TRUE ULTIMATE THREADS SYSTEM',
  VERSION: '2.0',
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30分
  SHEET_ID: null // スプレッドシートIDを設定
};

// ==================
// ルーティング処理
// ==================
function doGet(e) {
  const page = e.parameter.page || 'login';
  const action = e.parameter.action;
  
  // APIルート処理
  if (action === 'api') {
    return handleApiRequest(e);
  }
  
  // ページルーティング
  switch(page) {
    case 'login':
      return renderPage('login');
    case 'dashboard':
      return renderPage('dashboard');
    case 'posts':
      return renderPage('posts');
    case 'schedule':
      return renderPage('schedule');
    case 'analytics':
      return renderPage('analytics');
    case 'settings':
      return renderPage('settings');
    default:
      return renderPage('login');
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    switch(action) {
      case 'login':
        return handleLogin(data);
      case 'createPost':
        return handleCreatePost(data);
      case 'schedulePost':
        return handleSchedulePost(data);
      case 'getAnalytics':
        return handleGetAnalytics(data);
      case 'updateSettings':
        return handleUpdateSettings(data);
      default:
        return createJsonResponse({ success: false, error: 'Unknown action' });
    }
  } catch (error) {
    return createJsonResponse({ success: false, error: error.toString() });
  }
}

// ==================
// ページレンダリング
// ==================
function renderPage(pageName) {
  const template = HtmlService.createTemplateFromFile(pageName);
  
  // 共通データを注入
  template.appConfig = APP_CONFIG;
  template.sheetData = getSheetData();
  
  return template.evaluate()
    .setTitle(APP_CONFIG.APP_NAME)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setFaviconUrl('https://www.threads.net/favicon.ico')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ==================
// HTML/CSS/JS インクルード
// ==================
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ==================
// 認証処理
// ==================
function handleLogin(data) {
  const ss = getSpreadsheet();
  const usersSheet = ss.getSheetByName('USERS');
  const users = usersSheet.getDataRange().getValues();
  
  for (let i = 1; i < users.length; i++) {
    if (users[i][1] === data.username) {
      // パスワード検証（実際はハッシュ化が必要）
      const passwordHash = Utilities.computeDigest(
        Utilities.DigestAlgorithm.SHA256,
        data.password + users[i][0] // Salt付き
      );
      const hashString = passwordHash.map(byte => 
        ('0' + (byte & 0xFF).toString(16)).slice(-2)
      ).join('');
      
      if (hashString === users[i][6]) {
        // セッショントークン生成
        const sessionToken = Utilities.getUuid();
        
        // セッションをPropertyServiceに保存
        const userProperties = PropertiesService.getUserProperties();
        userProperties.setProperty('session_' + sessionToken, JSON.stringify({
          userId: users[i][0],
          username: users[i][1],
          displayName: users[i][2],
          email: users[i][3],
          loginTime: new Date().toISOString()
        }));
        
        return createJsonResponse({
          success: true,
          token: sessionToken,
          user: {
            userId: users[i][0],
            username: users[i][1],
            displayName: users[i][2],
            email: users[i][3]
          }
        });
      }
    }
  }
  
  return createJsonResponse({
    success: false,
    error: 'Invalid credentials'
  });
}

// ==================
// 投稿処理
// ==================
function handleCreatePost(data) {
  if (!validateSession(data.token)) {
    return createJsonResponse({ success: false, error: 'Invalid session' });
  }
  
  const ss = getSpreadsheet();
  const postsSheet = ss.getSheetByName('POSTS');
  
  const newPost = [
    'p_' + new Date().getTime(),
    data.userId,
    data.title,
    data.content,
    data.hashtags,
    'draft',
    data.scheduledAt || '',
    '',
    '',
    '',
    0,
    0,
    0,
    new Date().toISOString(),
    ''
  ];
  
  postsSheet.appendRow(newPost);
  
  return createJsonResponse({
    success: true,
    postId: newPost[0]
  });
}

// ==================
// スケジュール処理
// ==================
function handleSchedulePost(data) {
  if (!validateSession(data.token)) {
    return createJsonResponse({ success: false, error: 'Invalid session' });
  }
  
  const ss = getSpreadsheet();
  const schedulesSheet = ss.getSheetByName('SCHEDULES');
  
  const newSchedule = [
    's_' + new Date().getTime(),
    data.postId,
    data.scheduledTime,
    data.scheduledDate,
    'pending',
    0,
    ''
  ];
  
  schedulesSheet.appendRow(newSchedule);
  
  // 投稿のステータスを更新
  updatePostStatus(data.postId, 'scheduled');
  
  return createJsonResponse({
    success: true,
    scheduleId: newSchedule[0]
  });
}

// ==================
// 分析データ取得
// ==================
function handleGetAnalytics(data) {
  if (!validateSession(data.token)) {
    return createJsonResponse({ success: false, error: 'Invalid session' });
  }
  
  const ss = getSpreadsheet();
  const analyticsSheet = ss.getSheetByName('ANALYTICS');
  const data = analyticsSheet.getDataRange().getValues();
  
  // 最新7日間のデータを取得
  const recentData = data.slice(-7);
  
  return createJsonResponse({
    success: true,
    analytics: recentData.map(row => ({
      date: row[0],
      postsCount: row[1],
      impressions: row[2],
      likes: row[3],
      comments: row[4],
      engagementRate: row[5],
      bestPostId: row[6],
      followers: row[7],
      following: row[8]
    }))
  });
}

// ==================
// 設定更新
// ==================
function handleUpdateSettings(data) {
  if (!validateSession(data.token)) {
    return createJsonResponse({ success: false, error: 'Invalid session' });
  }
  
  const ss = getSpreadsheet();
  const configSheet = ss.getSheetByName('CONFIG');
  const configs = configSheet.getDataRange().getValues();
  
  for (let i = 1; i < configs.length; i++) {
    if (configs[i][0] === data.key) {
      configSheet.getRange(i + 1, 2).setValue(data.value);
      return createJsonResponse({ success: true });
    }
  }
  
  // 新規設定項目
  configSheet.appendRow([data.key, data.value, '', new Date().toISOString()]);
  
  return createJsonResponse({ success: true });
}

// ==================
// ヘルパー関数
// ==================
function getSpreadsheet() {
  if (APP_CONFIG.SHEET_ID) {
    return SpreadsheetApp.openById(APP_CONFIG.SHEET_ID);
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

function getSheetData() {
  const ss = getSpreadsheet();
  const sheets = ['USERS', 'POSTS', 'ANALYTICS', 'SCHEDULES', 'CONFIG'];
  const data = {};
  
  sheets.forEach(sheetName => {
    try {
      const sheet = ss.getSheetByName(sheetName);
      if (sheet) {
        data[sheetName.toLowerCase()] = sheet.getDataRange().getValues();
      }
    } catch (e) {
      console.log('Sheet not found: ' + sheetName);
    }
  });
  
  return data;
}

function validateSession(token) {
  if (!token) return false;
  
  const userProperties = PropertiesService.getUserProperties();
  const sessionData = userProperties.getProperty('session_' + token);
  
  if (!sessionData) return false;
  
  const session = JSON.parse(sessionData);
  const loginTime = new Date(session.loginTime);
  const now = new Date();
  
  // セッションタイムアウトチェック
  if (now - loginTime > APP_CONFIG.SESSION_TIMEOUT) {
    userProperties.deleteProperty('session_' + token);
    return false;
  }
  
  return true;
}

function updatePostStatus(postId, status) {
  const ss = getSpreadsheet();
  const postsSheet = ss.getSheetByName('POSTS');
  const posts = postsSheet.getDataRange().getValues();
  
  for (let i = 1; i < posts.length; i++) {
    if (posts[i][0] === postId) {
      postsSheet.getRange(i + 1, 6).setValue(status);
      break;
    }
  }
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ==================
// APIエンドポイント
// ==================
function handleApiRequest(e) {
  const endpoint = e.parameter.endpoint;
  
  switch(endpoint) {
    case 'posts':
      return getPostsApi(e);
    case 'analytics':
      return getAnalyticsApi(e);
    case 'schedules':
      return getSchedulesApi(e);
    default:
      return createJsonResponse({ error: 'Unknown endpoint' });
  }
}

function getPostsApi(e) {
  const token = e.parameter.token;
  if (!validateSession(token)) {
    return createJsonResponse({ error: 'Unauthorized' });
  }
  
  const ss = getSpreadsheet();
  const postsSheet = ss.getSheetByName('POSTS');
  const posts = postsSheet.getDataRange().getValues();
  
  // ヘッダーを除いて最新10件を返す
  const recentPosts = posts.slice(1, 11);
  
  return createJsonResponse({
    posts: recentPosts.map(post => ({
      id: post[0],
      title: post[2],
      content: post[3],
      status: post[5],
      publishedAt: post[7],
      likes: post[11],
      comments: post[12]
    }))
  });
}

function getAnalyticsApi(e) {
  const token = e.parameter.token;
  if (!validateSession(token)) {
    return createJsonResponse({ error: 'Unauthorized' });
  }
  
  return handleGetAnalytics({ token });
}

function getSchedulesApi(e) {
  const token = e.parameter.token;
  if (!validateSession(token)) {
    return createJsonResponse({ error: 'Unauthorized' });
  }
  
  const ss = getSpreadsheet();
  const schedulesSheet = ss.getSheetByName('SCHEDULES');
  const schedules = schedulesSheet.getDataRange().getValues();
  
  // pendingのスケジュールのみ返す
  const pendingSchedules = schedules.slice(1).filter(s => s[4] === 'pending');
  
  return createJsonResponse({
    schedules: pendingSchedules.map(schedule => ({
      id: schedule[0],
      postId: schedule[1],
      scheduledTime: schedule[2],
      scheduledDate: schedule[3],
      status: schedule[4]
    }))
  });
}