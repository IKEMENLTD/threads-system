(function() {
    'use strict';

    window.AppConstants = Object.freeze({
        STATUS: {
            DRAFT: 'draft',
            SCHEDULED: 'scheduled',
            PUBLISHED: 'published',
            FAILED: 'failed',
            DELETED: 'deleted'
        },
        
        USER_ROLES: {
            ADMIN: 'administrator',
            USER: 'user',
            DEMO: 'demo',
            GUEST: 'guest'
        },
        
        MESSAGES: {
            ERRORS: {
                REQUIRED_FIELD: 'この項目は必須です',
                INVALID_USERNAME: 'ユーザー名は英数字とアンダースコアのみ使用できます',
                SHORT_USERNAME: 'ユーザー名は3文字以上で入力してください',
                SHORT_PASSWORD: 'パスワードは6文字以上で入力してください',
                LOGIN_FAILED: 'ユーザー名またはパスワードが正しくありません',
                SESSION_EXPIRED: 'セッションの有効期限が切れました。再度ログインしてください',
                NETWORK_ERROR: 'ネットワークエラーが発生しました',
                PERMISSION_DENIED: 'この操作を実行する権限がありません',
                RATE_LIMIT: 'ログイン試行が多すぎます。しばらく待ってからお試しください',
                SAVE_FAILED: 'データの保存に失敗しました',
                DELETE_FAILED: '削除に失敗しました',
                VALIDATION_ERROR: '入力内容に誤りがあります'
            },
            SUCCESS: {
                LOGIN_SUCCESS: 'ログインに成功しました',
                LOGOUT_SUCCESS: 'ログアウトしました',
                SAVE_SUCCESS: '保存しました',
                DELETE_SUCCESS: '削除しました',
                UPDATE_SUCCESS: '更新しました',
                POST_PUBLISHED: '投稿が公開されました',
                POST_SCHEDULED: '投稿を予約しました',
                SETTINGS_SAVED: '設定を保存しました',
                DATA_EXPORTED: 'データをエクスポートしました',
                DATA_IMPORTED: 'データをインポートしました'
            },
            INFO: {
                LOADING: '読み込み中...',
                PROCESSING: '処理中...',
                NO_DATA: 'データがありません',
                NO_RESULTS: '結果が見つかりませんでした',
                CONFIRM_DELETE: '本当に削除しますか？この操作は取り消せません。',
                CONFIRM_LOGOUT: 'ログアウトしますか？',
                UNSAVED_CHANGES: '保存されていない変更があります。ページを離れますか？'
            }
        },
        
        EVENTS: {
            AUTH: {
                LOGIN: 'auth:login',
                LOGOUT: 'auth:logout',
                SESSION_EXPIRED: 'auth:session_expired',
                TOKEN_REFRESH: 'auth:token_refresh'
            },
            POST: {
                CREATED: 'post:created',
                UPDATED: 'post:updated',
                DELETED: 'post:deleted',
                PUBLISHED: 'post:published',
                SCHEDULED: 'post:scheduled'
            },
            UI: {
                MODAL_OPEN: 'ui:modal_open',
                MODAL_CLOSE: 'ui:modal_close',
                SIDEBAR_TOGGLE: 'ui:sidebar_toggle',
                THEME_CHANGE: 'ui:theme_change',
                NOTIFICATION_SHOW: 'ui:notification_show'
            },
            DATA: {
                LOADED: 'data:loaded',
                SAVED: 'data:saved',
                DELETED: 'data:deleted',
                SYNCED: 'data:synced',
                ERROR: 'data:error'
            }
        },
        
        ROUTES: {
            INDEX: 'index.html',
            LOGIN: 'login.html',
            DASHBOARD: 'dashboard.html',
            POSTS: 'posts.html',
            SCHEDULE: 'schedule.html',
            ANALYTICS: 'analytics.html',
            SETTINGS: 'settings.html'
        },
        
        DEMO_ACCOUNTS: Object.freeze([
            { username: 'demo', password: 'demo123', role: 'demo' },
            { username: 'admin', password: 'Admin@2025#Secure', role: 'administrator' },
            { username: 'testuser', password: 'Test@User2025!', role: 'user' }
        ]),
        
        CHART_OPTIONS: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom'
                },
                tooltip: {
                    enabled: true,
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        borderDash: [2, 2]
                    }
                }
            }
        },
        
        DATE_FORMATS: {
            FULL: 'YYYY年MM月DD日 HH:mm',
            DATE: 'YYYY/MM/DD',
            TIME: 'HH:mm',
            MONTH: 'YYYY年MM月',
            DAY_OF_WEEK: ['日', '月', '火', '水', '木', '金', '土']
        },
        
        KEYBOARD_CODES: {
            ENTER: 13,
            ESCAPE: 27,
            SPACE: 32,
            TAB: 9,
            ARROW_UP: 38,
            ARROW_DOWN: 40,
            ARROW_LEFT: 37,
            ARROW_RIGHT: 39
        },
        
        REGEX_PATTERNS: {
            EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&\/\/=]*)$/,
            HASHTAG: /#[a-zA-Z0-9_\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+/g,
            USERNAME: /^[a-zA-Z0-9_]+$/,
            ALPHANUMERIC: /^[a-zA-Z0-9]+$/
        }
    });
})();