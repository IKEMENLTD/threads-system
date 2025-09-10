(function() {
    'use strict';

    window.Router = {
        routes: AppConstants.ROUTES,
        
        init: function() {
            this.checkSession();
            this.setupEventListeners();
        },
        
        checkSession: function() {
            const sessionKey = AppConfig.getStorageKey('session');
            const isLoggedInKey = AppConfig.getStorageKey('isLoggedIn');
            
            try {
                const session = localStorage.getItem(sessionKey);
                const isLoggedIn = localStorage.getItem(isLoggedInKey) === 'true';
                
                if (session && isLoggedIn) {
                    const sessionData = JSON.parse(session);
                    
                    if (this.isSessionValid(sessionData)) {
                        this.navigateToDashboard();
                    } else {
                        this.clearSession();
                        this.navigateToLogin();
                    }
                } else {
                    this.navigateToLogin();
                }
            } catch (error) {
                console.error('Session check error:', error);
                this.navigateToLogin();
            }
        },
        
        isSessionValid: function(sessionData) {
            if (!sessionData || !sessionData.expiresAt) {
                return false;
            }
            
            const now = Date.now();
            const expiresAt = new Date(sessionData.expiresAt).getTime();
            
            return now < expiresAt;
        },
        
        clearSession: function() {
            const keysToRemove = [
                'session',
                'user',
                'isLoggedIn'
            ];
            
            keysToRemove.forEach(key => {
                localStorage.removeItem(AppConfig.getStorageKey(key));
            });
        },
        
        navigateToLogin: function() {
            if (!window.location.pathname.includes('login.html')) {
                setTimeout(() => {
                    window.location.href = this.routes.LOGIN;
                }, 1000);
            }
        },
        
        navigateToDashboard: function() {
            if (!window.location.pathname.includes('dashboard.html')) {
                setTimeout(() => {
                    window.location.replace(this.routes.DASHBOARD);
                }, 1000);
            }
        },
        
        navigate: function(route) {
            if (this.routes[route.toUpperCase()]) {
                window.location.href = this.routes[route.toUpperCase()];
            } else if (route.endsWith('.html')) {
                window.location.href = route;
            } else {
                console.error('Invalid route:', route);
            }
        },
        
        reload: function() {
            window.location.reload();
        },
        
        back: function() {
            window.history.back();
        },
        
        setupEventListeners: function() {
            window.addEventListener('storage', (e) => {
                if (e.key === AppConfig.getStorageKey('isLoggedIn') && e.newValue === null) {
                    this.navigateToLogin();
                }
            });
            
            document.addEventListener(AppConstants.EVENTS.AUTH.SESSION_EXPIRED, () => {
                this.clearSession();
                this.navigateToLogin();
            });
            
            document.addEventListener(AppConstants.EVENTS.AUTH.LOGOUT, () => {
                this.clearSession();
                this.navigateToLogin();
            });
        },
        
        updateProgressBar: function() {
            const progressBar = document.getElementById('progressBar');
            if (progressBar) {
                let width = 0;
                const interval = setInterval(() => {
                    if (width >= 100) {
                        clearInterval(interval);
                    } else {
                        width += 10;
                        progressBar.style.width = width + '%';
                    }
                }, 100);
            }
        }
    };
    
    document.addEventListener('DOMContentLoaded', () => {
        Router.init();
    });
})();