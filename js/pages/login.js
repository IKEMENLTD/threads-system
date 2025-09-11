(function() {
    'use strict';

    const LoginPage = {
        loginAttempts: new Map(),
        
        init: function() {
            this.checkExistingSession();
            this.bindElements();
            this.setupEventListeners();
            this.checkDemoMode();
            this.loadSavedCredentials();
        },
        
        bindElements: function() {
            this.form = document.getElementById('loginForm');
            this.usernameInput = document.getElementById('username');
            this.passwordInput = document.getElementById('password');
            this.rememberCheckbox = document.getElementById('remember');
            this.submitButton = document.getElementById('submitButton');
            this.passwordToggle = document.getElementById('passwordToggle');
            this.formMessage = document.getElementById('formMessage');
            this.demoFillButton = document.getElementById('demoFillButton');
            this.loginFooter = document.getElementById('loginFooter');
        },
        
        setupEventListeners: function() {
            if (this.form) {
                this.form.addEventListener('submit', (e) => this.handleSubmit(e));
            }
            
            if (this.passwordToggle) {
                this.passwordToggle.addEventListener('click', () => this.togglePasswordVisibility());
            }
            
            if (this.demoFillButton) {
                this.demoFillButton.addEventListener('click', () => this.fillDemoCredentials());
            }
            
            if (this.usernameInput) {
                this.usernameInput.addEventListener('input', () => this.clearError('username'));
            }
            
            if (this.passwordInput) {
                this.passwordInput.addEventListener('input', () => this.clearError('password'));
            }
        },
        
        checkExistingSession: function() {
            if (SessionManager.isLoggedIn()) {
                window.location.replace(AppConstants.ROUTES.DASHBOARD);
            }
        },
        
        checkDemoMode: function() {
            if (AppConfig.isDevelopment() && this.loginFooter) {
                this.loginFooter.style.display = 'block';
            } else if (this.loginFooter) {
                this.loginFooter.style.display = 'none';
            }
        },
        
        loadSavedCredentials: function() {
            const savedUsername = StorageManager.getSecure('savedUsername');
            const savedPassword = StorageManager.getSecure('savedPassword');
            
            if (savedUsername && this.usernameInput) {
                this.usernameInput.value = savedUsername;
            }
            
            if (savedPassword && this.passwordInput) {
                this.passwordInput.value = savedPassword;
                this.rememberCheckbox.checked = true;
            }
        },
        
        handleSubmit: async function(e) {
            e.preventDefault();
            
            if (!this.validateForm()) {
                return;
            }
            
            const email = this.usernameInput.value.trim();
            const password = this.passwordInput.value;
            
            if (this.checkRateLimit(email)) {
                this.showError(AppConstants.MESSAGES.ERRORS.RATE_LIMIT);
                return;
            }
            
            this.setLoadingState(true);
            
            try {
                const result = await this.authenticate(email, password);
                
                if (result.success) {
                    this.handleSuccessfulLogin(result.user);
                } else {
                    this.handleFailedLogin(email, result.error);
                }
            } catch (error) {
                this.handleFailedLogin(email, 'サーバーエラーが発生しました');
                console.error('Login error:', error);
            }
            
            this.setLoadingState(false);
        },
        
        validateForm: function() {
            let isValid = true;
            
            const username = this.usernameInput.value.trim();
            if (!username) {
                this.showFieldError('username', AppConstants.MESSAGES.ERRORS.REQUIRED_FIELD);
                isValid = false;
            } else if (username.length < AppConfig.validation.username.minLength) {
                this.showFieldError('username', AppConstants.MESSAGES.ERRORS.SHORT_USERNAME);
                isValid = false;
            } else if (!AppConfig.validation.username.pattern.test(username)) {
                this.showFieldError('username', AppConstants.MESSAGES.ERRORS.INVALID_USERNAME);
                isValid = false;
            }
            
            const password = this.passwordInput.value;
            if (!password) {
                this.showFieldError('password', AppConstants.MESSAGES.ERRORS.REQUIRED_FIELD);
                isValid = false;
            } else if (password.length < AppConfig.validation.password.minLength) {
                this.showFieldError('password', AppConstants.MESSAGES.ERRORS.SHORT_PASSWORD);
                isValid = false;
            }
            
            return isValid;
        },
        
        authenticate: async function(email, password) {
            try {
                const response = await fetch(AppConfig.api.baseUrl + '/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });
                
                const data = await response.json();
                
                if (data.success && data.token) {
                    // JWTトークンを保存
                    localStorage.setItem('threads_system_session', data.token);
                    
                    return {
                        success: true,
                        user: {
                            id: data.user.id,
                            username: data.user.username,
                            email: data.user.email,
                            role: data.user.role,
                            createdAt: data.user.createdAt
                        }
                    };
                }
                
                return {
                    success: false,
                    error: data.error || 'ログインに失敗しました'
                };
                
            } catch (error) {
                console.error('Authentication error:', error);
                return {
                    success: false,
                    error: 'サーバーとの通信に失敗しました'
                };
            }
        },
        
        handleSuccessfulLogin: function(user) {
            if (this.rememberCheckbox.checked) {
                StorageManager.setSecure('savedUsername', user.username);
                StorageManager.setSecure('savedPassword', this.passwordInput.value);
            } else {
                StorageManager.remove('savedUsername');
                StorageManager.remove('savedPassword');
            }
            
            SessionManager.createSession(user);
            
            this.showSuccess(AppConstants.MESSAGES.SUCCESS.LOGIN_SUCCESS);
            
            setTimeout(() => {
                window.location.href = AppConstants.ROUTES.DASHBOARD;
            }, 1000);
        },
        
        handleFailedLogin: function(username, message) {
            this.recordLoginAttempt(username);
            this.showError(message);
            this.form.classList.add('shake');
            setTimeout(() => this.form.classList.remove('shake'), 500);
        },
        
        checkRateLimit: function(username) {
            const attempts = this.loginAttempts.get(username) || { count: 0, lastAttempt: 0 };
            const now = Date.now();
            
            if (attempts.count >= AppConfig.auth.maxLoginAttempts) {
                const timeSinceLastAttempt = now - attempts.lastAttempt;
                if (timeSinceLastAttempt < AppConfig.auth.lockoutDuration) {
                    return true;
                } else {
                    this.loginAttempts.delete(username);
                }
            }
            
            return false;
        },
        
        recordLoginAttempt: function(username) {
            const attempts = this.loginAttempts.get(username) || { count: 0, lastAttempt: 0 };
            attempts.count++;
            attempts.lastAttempt = Date.now();
            this.loginAttempts.set(username, attempts);
        },
        
        togglePasswordVisibility: function() {
            const type = this.passwordInput.type === 'password' ? 'text' : 'password';
            this.passwordInput.type = type;
            
            const icon = this.passwordToggle.querySelector('.toggle-icon');
            icon.textContent = type === 'password' ? '●' : '○';
        },
        
        fillDemoCredentials: function() {
            const demoAccount = AppConstants.DEMO_ACCOUNTS.find(acc => acc.username === 'demo');
            
            if (demoAccount) {
                this.usernameInput.value = demoAccount.username;
                this.passwordInput.value = demoAccount.password;
                this.clearAllErrors();
            }
        },
        
        setLoadingState: function(isLoading) {
            this.submitButton.disabled = isLoading;
            this.submitButton.classList.toggle('loading', isLoading);
            this.usernameInput.disabled = isLoading;
            this.passwordInput.disabled = isLoading;
        },
        
        showFieldError: function(field, message) {
            const errorElement = document.getElementById(`${field}-error`);
            const inputElement = field === 'username' ? this.usernameInput : this.passwordInput;
            
            if (errorElement) {
                errorElement.textContent = message;
            }
            
            if (inputElement) {
                inputElement.classList.add('error');
            }
        },
        
        clearError: function(field) {
            const errorElement = document.getElementById(`${field}-error`);
            const inputElement = field === 'username' ? this.usernameInput : this.passwordInput;
            
            if (errorElement) {
                errorElement.textContent = '';
            }
            
            if (inputElement) {
                inputElement.classList.remove('error');
            }
        },
        
        clearAllErrors: function() {
            this.clearError('username');
            this.clearError('password');
            this.formMessage.textContent = '';
            this.formMessage.className = 'form-message';
        },
        
        showError: function(message) {
            this.formMessage.textContent = message;
            this.formMessage.className = 'form-message error';
        },
        
        showSuccess: function(message) {
            this.formMessage.textContent = message;
            this.formMessage.className = 'form-message success';
        },
        
        generateUserId: function() {
            return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
    };
    
    document.addEventListener('DOMContentLoaded', () => LoginPage.init());
})();