(function() {
    'use strict';

    window.InputValidator = {
        validateUsername: function(username) {
            const result = {
                isValid: true,
                errors: []
            };
            
            if (!username || username.trim() === '') {
                result.isValid = false;
                result.errors.push(AppConstants.MESSAGES.ERRORS.REQUIRED_FIELD);
                return result;
            }
            
            if (username.length < AppConfig.validation.username.minLength) {
                result.isValid = false;
                result.errors.push(AppConstants.MESSAGES.ERRORS.SHORT_USERNAME);
            }
            
            if (username.length > AppConfig.validation.username.maxLength) {
                result.isValid = false;
                result.errors.push(`ユーザー名は${AppConfig.validation.username.maxLength}文字以内で入力してください`);
            }
            
            if (!AppConfig.validation.username.pattern.test(username)) {
                result.isValid = false;
                result.errors.push(AppConstants.MESSAGES.ERRORS.INVALID_USERNAME);
            }
            
            return result;
        },
        
        validatePassword: function(password) {
            const result = {
                isValid: true,
                errors: []
            };
            
            if (!password) {
                result.isValid = false;
                result.errors.push(AppConstants.MESSAGES.ERRORS.REQUIRED_FIELD);
                return result;
            }
            
            if (password.length < AppConfig.validation.password.minLength) {
                result.isValid = false;
                result.errors.push(AppConstants.MESSAGES.ERRORS.SHORT_PASSWORD);
            }
            
            if (password.length > AppConfig.validation.password.maxLength) {
                result.isValid = false;
                result.errors.push(`パスワードは${AppConfig.validation.password.maxLength}文字以内で入力してください`);
            }
            
            return result;
        },
        
        validateEmail: function(email) {
            const result = {
                isValid: true,
                errors: []
            };
            
            if (!email || email.trim() === '') {
                result.isValid = false;
                result.errors.push(AppConstants.MESSAGES.ERRORS.REQUIRED_FIELD);
                return result;
            }
            
            if (!AppConstants.REGEX_PATTERNS.EMAIL.test(email)) {
                result.isValid = false;
                result.errors.push('有効なメールアドレスを入力してください');
            }
            
            return result;
        },
        
        validatePostTitle: function(title) {
            const result = {
                isValid: true,
                errors: []
            };
            
            if (!title || title.trim() === '') {
                result.isValid = false;
                result.errors.push('タイトルは必須です');
                return result;
            }
            
            if (title.length > AppConfig.validation.post.titleMaxLength) {
                result.isValid = false;
                result.errors.push(`タイトルは${AppConfig.validation.post.titleMaxLength}文字以内で入力してください`);
            }
            
            if (SecurityUtils.checkXSS(title)) {
                result.isValid = false;
                result.errors.push('不正な文字が含まれています');
            }
            
            return result;
        },
        
        validatePostContent: function(content) {
            const result = {
                isValid: true,
                errors: [],
                warnings: []
            };
            
            if (!content || content.trim() === '') {
                result.isValid = false;
                result.errors.push('内容は必須です');
                return result;
            }
            
            if (content.length > AppConfig.validation.post.contentMaxLength) {
                result.isValid = false;
                result.errors.push(`内容は${AppConfig.validation.post.contentMaxLength}文字以内で入力してください`);
            }
            
            if (SecurityUtils.checkXSS(content)) {
                result.isValid = false;
                result.errors.push('不正な文字が含まれています');
            }
            
            const hashtags = content.match(AppConstants.REGEX_PATTERNS.HASHTAG) || [];
            if (hashtags.length > AppConfig.validation.post.hashtagMaxCount) {
                result.warnings.push(`ハッシュタグは${AppConfig.validation.post.hashtagMaxCount}個までです`);
            }
            
            return result;
        },
        
        validateDate: function(date) {
            const result = {
                isValid: true,
                errors: []
            };
            
            if (!date) {
                result.isValid = false;
                result.errors.push('日付を選択してください');
                return result;
            }
            
            const dateObj = new Date(date);
            
            if (isNaN(dateObj.getTime())) {
                result.isValid = false;
                result.errors.push('有効な日付を入力してください');
            }
            
            const now = new Date();
            if (dateObj < now) {
                result.warnings = ['過去の日付が選択されています'];
            }
            
            return result;
        },
        
        validateURL: function(url) {
            const result = {
                isValid: true,
                errors: []
            };
            
            if (!url || url.trim() === '') {
                result.isValid = false;
                result.errors.push('URLを入力してください');
                return result;
            }
            
            if (!AppConstants.REGEX_PATTERNS.URL.test(url)) {
                result.isValid = false;
                result.errors.push('有効なURLを入力してください');
            }
            
            return result;
        },
        
        validateForm: function(formElement) {
            const results = {};
            const inputs = formElement.querySelectorAll('input, textarea, select');
            
            inputs.forEach(input => {
                const name = input.name || input.id;
                const value = input.value;
                const type = input.type;
                
                switch (type) {
                    case 'email':
                        results[name] = this.validateEmail(value);
                        break;
                    case 'url':
                        results[name] = this.validateURL(value);
                        break;
                    case 'date':
                    case 'datetime-local':
                        results[name] = this.validateDate(value);
                        break;
                    default:
                        if (input.required && !value) {
                            results[name] = {
                                isValid: false,
                                errors: [AppConstants.MESSAGES.ERRORS.REQUIRED_FIELD]
                            };
                        }
                }
            });
            
            const isFormValid = Object.values(results).every(result => result.isValid !== false);
            
            return {
                isValid: isFormValid,
                fields: results
            };
        },
        
        showValidationErrors: function(element, errors) {
            const errorContainer = element.parentElement.querySelector('.error-message') ||
                                 element.parentElement.parentElement.querySelector('.error-message');
            
            if (errorContainer) {
                errorContainer.textContent = errors.join(', ');
                element.classList.add('error');
            }
        },
        
        clearValidationErrors: function(element) {
            const errorContainer = element.parentElement.querySelector('.error-message') ||
                                 element.parentElement.parentElement.querySelector('.error-message');
            
            if (errorContainer) {
                errorContainer.textContent = '';
                element.classList.remove('error');
            }
        },
        
        setupRealtimeValidation: function(formElement) {
            const inputs = formElement.querySelectorAll('input, textarea');
            
            inputs.forEach(input => {
                input.addEventListener('blur', () => {
                    this.validateField(input);
                });
                
                input.addEventListener('input', () => {
                    if (input.classList.contains('error')) {
                        this.validateField(input);
                    }
                });
            });
        },
        
        validateField: function(field) {
            let result = { isValid: true, errors: [] };
            
            switch (field.type) {
                case 'email':
                    result = this.validateEmail(field.value);
                    break;
                case 'url':
                    result = this.validateURL(field.value);
                    break;
                case 'date':
                case 'datetime-local':
                    result = this.validateDate(field.value);
                    break;
                default:
                    if (field.name === 'username' || field.id === 'username') {
                        result = this.validateUsername(field.value);
                    } else if (field.name === 'password' || field.id === 'password') {
                        result = this.validatePassword(field.value);
                    } else if (field.required && !field.value) {
                        result = {
                            isValid: false,
                            errors: [AppConstants.MESSAGES.ERRORS.REQUIRED_FIELD]
                        };
                    }
            }
            
            if (!result.isValid) {
                this.showValidationErrors(field, result.errors);
            } else {
                this.clearValidationErrors(field);
            }
            
            return result;
        }
    };
})();