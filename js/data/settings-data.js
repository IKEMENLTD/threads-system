(function() {
    'use strict';

    window.SettingsData = {
        settings: null,
        
        init: function() {
            this.loadSettings();
        },
        
        loadSettings: function() {
            const saved = StorageManager.get('settings') || null;
            this.settings = saved || this.getDefaultSettings();
            return this.settings;
        },
        
        saveSettings: function() {
            StorageManager.set('settings', this.settings);
        },
        
        getDefaultSettings: function() {
            return {
                general: {
                    language: 'ja',
                    timezone: 'Asia/Tokyo',
                    theme: 'light',
                    defaultPostStatus: 'draft'
                },
                account: {
                    username: SessionManager.getUser()?.username || 'demo',
                    email: SessionManager.getUser()?.email || '',
                    displayName: '',
                    avatar: null
                },
                notifications: {
                    postSuccess: true,
                    postFailure: true,
                    engagement: false,
                    scheduleReminder: true,
                    frequency: 'daily'
                },
                security: {
                    twoFactor: false,
                    sessionTimeout: 30,
                    loginHistory: []
                },
                data: {
                    storageUsed: StorageManager.getSizeInMB(),
                    storageLimit: 10
                }
            };
        },
        
        updateSetting: function(category, key, value) {
            if (this.settings[category]) {
                this.settings[category][key] = value;
                this.saveSettings();
                return true;
            }
            return false;
        },
        
        updateCategory: function(category, data) {
            if (this.settings[category]) {
                this.settings[category] = { ...this.settings[category], ...data };
                this.saveSettings();
                return true;
            }
            return false;
        },
        
        resetSettings: function() {
            this.settings = this.getDefaultSettings();
            this.saveSettings();
            return this.settings;
        },
        
        exportSettings: function() {
            const blob = new Blob([JSON.stringify(this.settings, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `settings_${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        },
        
        importSettings: function(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                
                reader.onload = (e) => {
                    try {
                        const imported = JSON.parse(e.target.result);
                        this.settings = { ...this.getDefaultSettings(), ...imported };
                        this.saveSettings();
                        resolve(this.settings);
                    } catch (error) {
                        reject(error);
                    }
                };
                
                reader.onerror = reject;
                reader.readAsText(file);
            });
        },
        
        addLoginHistory: function(info) {
            if (!this.settings.security.loginHistory) {
                this.settings.security.loginHistory = [];
            }
            
            this.settings.security.loginHistory.unshift({
                date: Date.now(),
                location: info.location || '不明',
                device: info.device || navigator.userAgent
            });
            
            if (this.settings.security.loginHistory.length > 10) {
                this.settings.security.loginHistory = this.settings.security.loginHistory.slice(0, 10);
            }
            
            this.saveSettings();
        }
    };
    
    SettingsData.init();
})();