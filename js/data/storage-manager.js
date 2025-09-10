(function() {
    'use strict';

    window.StorageManager = {
        isAvailable: function() {
            try {
                const test = '__storage_test__';
                localStorage.setItem(test, test);
                localStorage.removeItem(test);
                return true;
            } catch (e) {
                return false;
            }
        },
        
        set: function(key, value, usePrefix = true) {
            if (!this.isAvailable()) {
                console.error('LocalStorage is not available');
                return false;
            }
            
            try {
                const storageKey = usePrefix ? AppConfig.getStorageKey(key) : key;
                const data = typeof value === 'object' ? JSON.stringify(value) : value;
                localStorage.setItem(storageKey, data);
                return true;
            } catch (error) {
                console.error('Storage set error:', error);
                return false;
            }
        },
        
        get: function(key, usePrefix = true) {
            if (!this.isAvailable()) {
                return null;
            }
            
            try {
                const storageKey = usePrefix ? AppConfig.getStorageKey(key) : key;
                const data = localStorage.getItem(storageKey);
                
                if (data === null) {
                    return null;
                }
                
                try {
                    return JSON.parse(data);
                } catch {
                    return data;
                }
            } catch (error) {
                console.error('Storage get error:', error);
                return null;
            }
        },
        
        remove: function(key, usePrefix = true) {
            if (!this.isAvailable()) {
                return false;
            }
            
            try {
                const storageKey = usePrefix ? AppConfig.getStorageKey(key) : key;
                localStorage.removeItem(storageKey);
                return true;
            } catch (error) {
                console.error('Storage remove error:', error);
                return false;
            }
        },
        
        clear: function(preserveKeys = []) {
            if (!this.isAvailable()) {
                return false;
            }
            
            try {
                const preserved = {};
                preserveKeys.forEach(key => {
                    const value = this.get(key);
                    if (value !== null) {
                        preserved[key] = value;
                    }
                });
                
                const keysToRemove = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith(AppConfig.storage.prefix)) {
                        keysToRemove.push(key);
                    }
                }
                
                keysToRemove.forEach(key => {
                    localStorage.removeItem(key);
                });
                
                Object.keys(preserved).forEach(key => {
                    this.set(key, preserved[key]);
                });
                
                return true;
            } catch (error) {
                console.error('Storage clear error:', error);
                return false;
            }
        },
        
        has: function(key, usePrefix = true) {
            if (!this.isAvailable()) {
                return false;
            }
            
            const storageKey = usePrefix ? AppConfig.getStorageKey(key) : key;
            return localStorage.getItem(storageKey) !== null;
        },
        
        getSize: function() {
            if (!this.isAvailable()) {
                return 0;
            }
            
            let size = 0;
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    size += localStorage[key].length + key.length;
                }
            }
            return size;
        },
        
        getSizeInMB: function() {
            return (this.getSize() / (1024 * 1024)).toFixed(2);
        },
        
        getAll: function() {
            if (!this.isAvailable()) {
                return {};
            }
            
            const data = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(AppConfig.storage.prefix)) {
                    const cleanKey = key.replace(AppConfig.storage.prefix, '');
                    data[cleanKey] = this.get(cleanKey);
                }
            }
            return data;
        },
        
        exportData: function() {
            const data = this.getAll();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `threads_system_backup_${new Date().getTime()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        },
        
        importData: function(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                
                reader.onload = (e) => {
                    try {
                        const data = JSON.parse(e.target.result);
                        
                        Object.keys(data).forEach(key => {
                            this.set(key, data[key]);
                        });
                        
                        resolve(data);
                    } catch (error) {
                        reject(error);
                    }
                };
                
                reader.onerror = reject;
                reader.readAsText(file);
            });
        },
        
        encrypt: function(data, key = 'default_key') {
            try {
                const encrypted = btoa(encodeURIComponent(JSON.stringify(data)));
                return encrypted.split('').reverse().join('');
            } catch (error) {
                console.error('Encryption error:', error);
                return null;
            }
        },
        
        decrypt: function(encryptedData, key = 'default_key') {
            try {
                const reversed = encryptedData.split('').reverse().join('');
                return JSON.parse(decodeURIComponent(atob(reversed)));
            } catch (error) {
                console.error('Decryption error:', error);
                return null;
            }
        },
        
        setSecure: function(key, value) {
            const encrypted = this.encrypt(value);
            return encrypted ? this.set(key, encrypted) : false;
        },
        
        getSecure: function(key) {
            const encrypted = this.get(key);
            return encrypted ? this.decrypt(encrypted) : null;
        }
    };
})();