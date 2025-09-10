(function() {
    'use strict';

    window.SessionManager = {
        currentSession: null,
        sessionTimer: null,
        
        init: function() {
            this.loadSession();
            this.startSessionMonitor();
            this.setupEventListeners();
        },
        
        createSession: function(userData) {
            const session = {
                id: this.generateSessionId(),
                user: userData,
                loginTime: Date.now(),
                lastActivity: Date.now(),
                expiresAt: Date.now() + AppConfig.auth.sessionTimeout
            };
            
            this.currentSession = session;
            StorageManager.set('session', session);
            StorageManager.set('user', userData);
            StorageManager.set('isLoggedIn', 'true');
            
            this.startSessionTimer();
            
            document.dispatchEvent(new CustomEvent(AppConstants.EVENTS.AUTH.LOGIN, { detail: userData }));
            
            return session;
        },
        
        loadSession: function() {
            const session = StorageManager.get('session');
            
            if (session && this.validateSession(session)) {
                this.currentSession = session;
                this.updateActivity();
                return true;
            }
            
            return false;
        },
        
        validateSession: function(session) {
            if (!session || !session.expiresAt) {
                return false;
            }
            
            const now = Date.now();
            const expiresAt = new Date(session.expiresAt).getTime();
            
            if (now >= expiresAt) {
                this.destroySession();
                return false;
            }
            
            return true;
        },
        
        updateActivity: function() {
            if (this.currentSession) {
                this.currentSession.lastActivity = Date.now();
                this.currentSession.expiresAt = Date.now() + AppConfig.auth.sessionTimeout;
                StorageManager.set('session', this.currentSession);
            }
        },
        
        extendSession: function() {
            if (this.currentSession) {
                this.updateActivity();
                this.resetSessionTimer();
            }
        },
        
        destroySession: function() {
            this.currentSession = null;
            
            if (this.sessionTimer) {
                clearTimeout(this.sessionTimer);
                this.sessionTimer = null;
            }
            
            StorageManager.remove('session');
            StorageManager.remove('user');
            StorageManager.remove('isLoggedIn');
            
            document.dispatchEvent(new Event(AppConstants.EVENTS.AUTH.LOGOUT));
        },
        
        startSessionTimer: function() {
            if (this.sessionTimer) {
                clearTimeout(this.sessionTimer);
            }
            
            const checkInterval = 60000;
            
            this.sessionTimer = setInterval(() => {
                if (!this.validateSession(this.currentSession)) {
                    this.handleSessionExpired();
                }
            }, checkInterval);
        },
        
        resetSessionTimer: function() {
            this.startSessionTimer();
        },
        
        handleSessionExpired: function() {
            this.destroySession();
            document.dispatchEvent(new Event(AppConstants.EVENTS.AUTH.SESSION_EXPIRED));
            
            if (window.location.pathname !== '/login.html') {
                alert(AppConstants.MESSAGES.ERRORS.SESSION_EXPIRED);
                window.location.href = AppConstants.ROUTES.LOGIN;
            }
        },
        
        startSessionMonitor: function() {
            document.addEventListener('click', () => this.updateActivity());
            document.addEventListener('keypress', () => this.updateActivity());
            document.addEventListener('mousemove', this.throttle(() => this.updateActivity(), 60000));
            
            window.addEventListener('beforeunload', () => {
                if (this.currentSession) {
                    StorageManager.set('session', this.currentSession);
                }
            });
        },
        
        setupEventListeners: function() {
            window.addEventListener('storage', (e) => {
                if (e.key === AppConfig.getStorageKey('isLoggedIn')) {
                    if (e.newValue === null || e.newValue === 'false') {
                        this.destroySession();
                        if (window.location.pathname !== '/login.html') {
                            window.location.href = AppConstants.ROUTES.LOGIN;
                        }
                    }
                }
            });
        },
        
        getUser: function() {
            return this.currentSession ? this.currentSession.user : null;
        },
        
        getUserRole: function() {
            const user = this.getUser();
            return user ? user.role : null;
        },
        
        isLoggedIn: function() {
            return this.currentSession !== null && this.validateSession(this.currentSession);
        },
        
        hasPermission: function(permission) {
            const user = this.getUser();
            if (!user) return false;
            
            const rolePermissions = {
                administrator: ['*'],
                user: ['read', 'write', 'delete_own'],
                demo: ['read'],
                guest: []
            };
            
            const userPermissions = rolePermissions[user.role] || [];
            return userPermissions.includes('*') || userPermissions.includes(permission);
        },
        
        generateSessionId: function() {
            const timestamp = Date.now().toString(36);
            const randomStr = Math.random().toString(36).substr(2, 9);
            return `${timestamp}-${randomStr}`;
        },
        
        throttle: function(func, limit) {
            let inThrottle;
            return function() {
                const args = arguments;
                const context = this;
                if (!inThrottle) {
                    func.apply(context, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        },
        
        getSessionInfo: function() {
            if (!this.currentSession) {
                return null;
            }
            
            const now = Date.now();
            const loginDuration = now - this.currentSession.loginTime;
            const timeRemaining = this.currentSession.expiresAt - now;
            
            return {
                id: this.currentSession.id,
                user: this.currentSession.user.username,
                loginTime: new Date(this.currentSession.loginTime).toLocaleString('ja-JP'),
                duration: Math.floor(loginDuration / 60000) + '分',
                remaining: Math.max(0, Math.floor(timeRemaining / 60000)) + '分',
                lastActivity: new Date(this.currentSession.lastActivity).toLocaleString('ja-JP')
            };
        }
    };
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => SessionManager.init());
    } else {
        SessionManager.init();
    }
})();