(function() {
    'use strict';

    window.SecurityUtils = {
        escapeHtml: function(text) {
            const map = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            };
            
            return text ? text.replace(/[&<>"']/g, m => map[m]) : '';
        },
        
        sanitizeInput: function(input) {
            if (typeof input !== 'string') {
                return '';
            }
            
            return input
                .trim()
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/javascript:/gi, '')
                .replace(/on\w+\s*=/gi, '');
        },
        
        validateEmail: function(email) {
            return AppConstants.REGEX_PATTERNS.EMAIL.test(email);
        },
        
        validateURL: function(url) {
            return AppConstants.REGEX_PATTERNS.URL.test(url);
        },
        
        generateToken: function(length = 32) {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            let token = '';
            
            for (let i = 0; i < length; i++) {
                token += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            
            return token;
        },
        
        hashPassword: function(password) {
            let hash = 0;
            
            if (password.length === 0) {
                return hash.toString();
            }
            
            for (let i = 0; i < password.length; i++) {
                const char = password.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
            }
            
            return Math.abs(hash).toString(36);
        },
        
        verifyPassword: function(password, hash) {
            return this.hashPassword(password) === hash;
        },
        
        generateCSRFToken: function() {
            const token = this.generateToken(40);
            sessionStorage.setItem('csrf_token', token);
            return token;
        },
        
        verifyCSRFToken: function(token) {
            const storedToken = sessionStorage.getItem('csrf_token');
            return storedToken && storedToken === token;
        },
        
        isSecureContext: function() {
            return window.location.protocol === 'https:' || 
                   window.location.hostname === 'localhost' ||
                   window.location.hostname === '127.0.0.1';
        },
        
        checkXSS: function(input) {
            const xssPatterns = [
                /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
                /javascript:/gi,
                /on\w+\s*=/gi,
                /<iframe/gi,
                /<object/gi,
                /<embed/gi,
                /<applet/gi
            ];
            
            return xssPatterns.some(pattern => pattern.test(input));
        },
        
        preventClickjacking: function() {
            if (window.self !== window.top) {
                window.top.location = window.self.location;
            }
        },
        
        setSecurityHeaders: function() {
            if (document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
                return;
            }
            
            const csp = document.createElement('meta');
            csp.httpEquiv = 'Content-Security-Policy';
            csp.content = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com;";
            document.head.appendChild(csp);
        }
    };
    
    SecurityUtils.preventClickjacking();
    SecurityUtils.setSecurityHeaders();
})();