(function() {
    'use strict';

    // すべてのモジュールを単一の名前空間に統合
    window.ThreadsApp = {
        Config: window.AppConfig || {},
        Constants: window.AppConstants || {},
        
        Core: {
            Router: window.Router || {},
            Session: window.SessionManager || {},
            Storage: window.StorageManager || {}
        },
        
        Utils: {
            Common: window.CommonUtils || {},
            Security: window.SecurityUtils || {},
            Validator: window.InputValidator || {},
            Date: window.DateUtils || {}
        },
        
        Data: {
            Posts: window.PostsData || {},
            Schedule: window.ScheduleData || {},
            Analytics: window.AnalyticsData || {},
            Settings: window.SettingsData || {}
        },
        
        UI: {
            Modal: window.ModalController || {},
            Calendar: window.CalendarController || {},
            Chart: window.ChartManager || {},
            PageBase: window.PageBase || {}
        },
        
        Pages: {},
        
        init: function() {
            // グローバル汚染を最小化
            const globalVars = [
                'AppConfig', 'AppConstants', 'Router', 'SessionManager',
                'StorageManager', 'SecurityUtils', 'InputValidator', 'CommonUtils',
                'PostsData', 'ScheduleData', 'AnalyticsData', 'SettingsData',
                'ModalController', 'SidebarController', 'CalendarController',
                'ChartManager', 'DateUtils', 'PageBase'
            ];
            
            // オプション: グローバル変数をクリーンアップ
            if (this.Config.environment === 'production') {
                globalVars.forEach(varName => {
                    if (window[varName]) {
                        delete window[varName];
                    }
                });
            }
        }
    };
    
    // 互換性のためのエイリアス（段階的に削除予定）
    window.SessionManager = window.ThreadsApp.Core.Session;
    window.StorageManager = window.ThreadsApp.Core.Storage;
    window.CommonUtils = window.ThreadsApp.Utils.Common;
    window.AppConstants = window.ThreadsApp.Constants;
    window.AppConfig = window.ThreadsApp.Config;
})();