(function() {
    'use strict';

    const SettingsPage = {
        activeTab: 'general',
        hasUnsavedChanges: false,
        
        init: function() {
            if (!PageBase.init('settings')) return;
            
            this.bindElements();
            this.setupEventListeners();
            this.loadSettings();
        },
        
        bindElements: function() {
            this.tabButtons = document.querySelectorAll('.tab-btn');
            this.tabPanels = document.querySelectorAll('.tab-panel');
            
            this.saveSettingsBtn = document.getElementById('saveSettingsBtn');
            this.cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
            
            this.exportDataBtn = document.getElementById('exportDataBtn');
            this.importDataBtn = document.getElementById('importDataBtn');
            this.clearCacheBtn = document.getElementById('clearCacheBtn');
            this.resetSettingsBtn = document.getElementById('resetSettingsBtn');
            this.deleteAllDataBtn = document.getElementById('deleteAllDataBtn');
        },
        
        setupEventListeners: function() {
            this.tabButtons.forEach(btn => {
                btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
            });
            
            if (this.saveSettingsBtn) {
                this.saveSettingsBtn.addEventListener('click', () => this.saveSettings());
            }
            
            if (this.cancelSettingsBtn) {
                this.cancelSettingsBtn.addEventListener('click', () => this.cancelChanges());
            }
            
            if (this.exportDataBtn) {
                this.exportDataBtn.addEventListener('click', () => this.exportData());
            }
            
            if (this.importDataBtn) {
                this.importDataBtn.addEventListener('click', () => this.importData());
            }
            
            if (this.clearCacheBtn) {
                this.clearCacheBtn.addEventListener('click', () => this.clearCache());
            }
            
            if (this.resetSettingsBtn) {
                this.resetSettingsBtn.addEventListener('click', () => this.resetSettings());
            }
            
            if (this.deleteAllDataBtn) {
                this.deleteAllDataBtn.addEventListener('click', () => this.deleteAllData());
            }
            
            document.querySelectorAll('.setting-input, .setting-select, .switch-input, input[type="radio"]').forEach(input => {
                input.addEventListener('change', () => {
                    this.hasUnsavedChanges = true;
                });
            });
            
            window.addEventListener('beforeunload', (e) => {
                if (this.hasUnsavedChanges) {
                    e.preventDefault();
                    e.returnValue = AppConstants.MESSAGES.INFO.UNSAVED_CHANGES;
                }
            });
        },
        
        
        loadSettings: function() {
            const settings = SettingsData.loadSettings();
            const user = SessionManager.getUser();
            
            if (user) {
                document.getElementById('usernameInput').value = user.username;
                document.getElementById('emailInput').value = user.email || '';
                document.getElementById('avatarPreview').textContent = user.username.charAt(0).toUpperCase();
            }
            
            document.getElementById('languageSelect').value = settings.general.language;
            document.getElementById('timezoneSelect').value = settings.general.timezone;
            document.querySelector(`input[name="theme"][value="${settings.general.theme}"]`).checked = true;
            document.getElementById('defaultStatusSelect').value = settings.general.defaultPostStatus;
            
            document.getElementById('displayNameInput').value = settings.account.displayName || '';
            
            document.querySelectorAll('.switch-input').forEach((input, index) => {
                const settingKeys = ['postSuccess', 'postFailure', 'engagement', 'scheduleReminder'];
                if (settingKeys[index]) {
                    input.checked = settings.notifications[settingKeys[index]];
                }
            });
            
            this.updateStorageInfo();
            this.loadLoginHistory();
        },
        
        updateStorageInfo: function() {
            const usedMB = StorageManager.getSizeInMB();
            const totalMB = 10;
            const percentage = (usedMB / totalMB) * 100;
            
            const storageBar = document.querySelector('.storage-used');
            const storageText = document.querySelector('.storage-text');
            
            if (storageBar) {
                storageBar.style.width = percentage + '%';
            }
            
            if (storageText) {
                storageText.textContent = `${usedMB} MB / ${totalMB} MB 使用中`;
            }
        },
        
        loadLoginHistory: function() {
            const settings = SettingsData.settings;
            const history = settings.security.loginHistory || [];
            
            const historyContainer = document.querySelector('.login-history');
            if (!historyContainer) return;
            
            if (history.length === 0) {
                historyContainer.innerHTML = '<div class="history-item">ログイン履歴がありません</div>';
                return;
            }
            
            const historyHTML = history.slice(0, 5).map(item => `
                <div class="history-item">
                    <span class="history-date">${CommonUtils.formatDate(item.date)}</span>
                    <span class="history-location">${item.location}</span>
                    <span class="history-device">${item.device.substring(0, 30)}...</span>
                </div>
            `).join('');
            
            historyContainer.innerHTML = historyHTML;
        },
        
        switchTab: function(tabName) {
            this.activeTab = tabName;
            
            this.tabButtons.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.tab === tabName);
            });
            
            this.tabPanels.forEach(panel => {
                panel.classList.toggle('active', panel.id === `${tabName}-panel`);
            });
        },
        
        saveSettings: function() {
            const generalSettings = {
                language: document.getElementById('languageSelect').value,
                timezone: document.getElementById('timezoneSelect').value,
                theme: document.querySelector('input[name="theme"]:checked').value,
                defaultPostStatus: document.getElementById('defaultStatusSelect').value
            };
            
            const accountSettings = {
                displayName: document.getElementById('displayNameInput').value,
                email: document.getElementById('emailInput').value
            };
            
            SettingsData.updateCategory('general', generalSettings);
            SettingsData.updateCategory('account', accountSettings);
            
            this.hasUnsavedChanges = false;
            CommonUtils.showNotification(AppConstants.MESSAGES.SUCCESS.SETTINGS_SAVED, 'success');
        },
        
        cancelChanges: function() {
            if (this.hasUnsavedChanges && !confirm('変更を破棄しますか？')) {
                return;
            }
            
            this.hasUnsavedChanges = false;
            this.loadSettings();
        },
        
        exportData: function() {
            StorageManager.exportData();
            CommonUtils.showNotification(AppConstants.MESSAGES.SUCCESS.DATA_EXPORTED, 'success');
        },
        
        importData: function() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    StorageManager.importData(file).then(() => {
                        CommonUtils.showNotification(AppConstants.MESSAGES.SUCCESS.DATA_IMPORTED, 'success');
                        this.loadSettings();
                    }).catch(error => {
                        CommonUtils.showNotification('インポートに失敗しました', 'error');
                    });
                }
            };
            
            input.click();
        },
        
        clearCache: function() {
            if (confirm('キャッシュをクリアしますか？')) {
                sessionStorage.clear();
                CommonUtils.showNotification('キャッシュをクリアしました', 'success');
            }
        },
        
        resetSettings: function() {
            if (confirm('すべての設定をリセットしますか？')) {
                SettingsData.resetSettings();
                this.loadSettings();
                CommonUtils.showNotification('設定をリセットしました', 'success');
            }
        },
        
        deleteAllData: function() {
            if (confirm('すべてのデータを削除しますか？この操作は取り消せません。')) {
                if (confirm('本当によろしいですか？すべてのデータが失われます。')) {
                    StorageManager.clear();
                    SessionManager.destroySession();
                    CommonUtils.showNotification('すべてのデータを削除しました', 'success');
                    
                    setTimeout(() => {
                        window.location.href = AppConstants.ROUTES.LOGIN;
                    }, 2000);
                }
            }
        }
    };
    
    document.addEventListener('DOMContentLoaded', () => SettingsPage.init());
})();