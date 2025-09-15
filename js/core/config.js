(function() {
    'use strict';

    window.AppConfig = {
        appName: 'TRUE ULTIMATE THREADS SYSTEM',
        version: '2.0.0',
        
        environment: window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1' || 
                    window.location.protocol === 'file:' ? 'development' : 'production',
        
        api: {
            baseUrl: window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1' || 
                    window.location.protocol === 'file:' 
                    ? 'http://localhost:10000/api' 
                    : 'https://threads-system.onrender.com/api',
            timeout: 30000,
            retryAttempts: 3
        },
        
        auth: {
            sessionTimeout: 30 * 60 * 1000,
            maxLoginAttempts: 5,
            lockoutDuration: 5 * 60 * 1000,
            rememberMeDuration: 30 * 24 * 60 * 60 * 1000
        },
        
        storage: {
            prefix: 'threads_system_',
            keys: {
                session: 'session',
                user: 'user',
                settings: 'settings',
                posts: 'posts_data',
                schedule: 'schedule_data',
                analytics: 'analytics_data',
                isLoggedIn: 'is_logged_in',
                savedUsername: 'saved_username',
                savedPassword: 'saved_password'
            }
        },
        
        ui: {
            animationDuration: 300,
            toastDuration: 3000,
            dateFormat: 'YYYY/MM/DD',
            timeFormat: 'HH:mm',
            defaultTheme: 'light',
            defaultLanguage: 'ja'
        },
        
        validation: {
            username: {
                minLength: 3,
                maxLength: 20,
                pattern: /^[a-zA-Z0-9_]+$/
            },
            password: {
                minLength: 6,
                maxLength: 50
            },
            post: {
                titleMaxLength: 100,
                contentMaxLength: 500,
                hashtagMaxCount: 10
            }
        },
        
        defaults: {
            postsPerPage: 20,
            analyticsRange: 7,
            chartColors: {
                primary: '#000000',
                secondary: '#1a1a1a',
                success: '#10b981',
                warning: '#f59e0b',
                error: '#ef4444',
                info: '#3b82f6'
            }
        },
        
        features: {
            enableAnalytics: true,
            enableScheduling: true,
            enableNotifications: true,
            enableExport: true,
            enableDarkMode: true,
            enableMultiAccount: false
        },
        
        isDevelopment: function() {
            return this.environment === 'development';
        },
        
        isProduction: function() {
            return this.environment === 'production';
        },
        
        getStorageKey: function(key) {
            return this.storage.prefix + (this.storage.keys[key] || key);
        },
        
        init: function() {
            if (this.isDevelopment()) {
                console.info(`${this.appName} v${this.version} - Development Mode`);
            }
            
            Object.freeze(this.validation);
            Object.freeze(this.defaults);
            Object.freeze(this.features);
        }
    };
    
    AppConfig.init();
})();