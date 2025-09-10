(function() {
    'use strict';

    window.PageBase = {
        init: function(pageName) {
            if (!SessionManager.isLoggedIn()) {
                window.location.href = AppConstants.ROUTES.LOGIN;
                return false;
            }
            
            this.pageName = pageName;
            this.bindCommonElements();
            this.setupCommonEventListeners();
            this.loadUserInfo();
            this.updateDateTime();
            
            return true;
        },
        
        bindCommonElements: function() {
            this.menuToggle = document.querySelector('.menu-toggle');
            this.sidebar = document.querySelector('.sidebar');
            this.mobileOverlay = document.querySelector('.mobile-overlay');
            this.logoutBtn = document.querySelector('.logout-btn');
            this.currentDate = document.querySelector('.current-date');
            this.userName = document.querySelector('.user-name');
            this.userAvatar = document.querySelector('.user-avatar');
        },
        
        setupCommonEventListeners: function() {
            if (this.menuToggle) {
                this.menuToggle.addEventListener('click', () => this.toggleSidebar());
            }
            
            if (this.mobileOverlay) {
                this.mobileOverlay.addEventListener('click', () => this.closeSidebar());
            }
            
            if (this.logoutBtn) {
                this.logoutBtn.addEventListener('click', () => this.handleLogout());
            }
            
            window.addEventListener('resize', () => {
                if (window.innerWidth > 768) {
                    this.closeSidebar();
                }
            });
        },
        
        loadUserInfo: function() {
            const user = SessionManager.getUser();
            
            if (user) {
                if (this.userName) {
                    this.userName.textContent = user.username;
                }
                
                if (this.userAvatar) {
                    this.userAvatar.textContent = user.username.charAt(0).toUpperCase();
                }
            }
        },
        
        updateDateTime: function() {
            const updateDate = () => {
                if (this.currentDate) {
                    this.currentDate.textContent = CommonUtils.getCurrentDate();
                }
            };
            
            updateDate();
            setInterval(updateDate, 60000);
        },
        
        toggleSidebar: function() {
            const isOpen = this.sidebar.classList.contains('open');
            
            if (isOpen) {
                this.closeSidebar();
            } else {
                this.openSidebar();
            }
        },
        
        openSidebar: function() {
            this.sidebar.classList.add('open');
            this.mobileOverlay.classList.add('active');
            this.menuToggle.classList.add('active');
            this.menuToggle.setAttribute('aria-expanded', 'true');
        },
        
        closeSidebar: function() {
            this.sidebar.classList.remove('open');
            this.mobileOverlay.classList.remove('active');
            if (this.menuToggle) {
                this.menuToggle.classList.remove('active');
                this.menuToggle.setAttribute('aria-expanded', 'false');
            }
        },
        
        handleLogout: function() {
            if (confirm(AppConstants.MESSAGES.INFO.CONFIRM_LOGOUT)) {
                SessionManager.destroySession();
                CommonUtils.showNotification(AppConstants.MESSAGES.SUCCESS.LOGOUT_SUCCESS, 'success');
                
                setTimeout(() => {
                    window.location.href = AppConstants.ROUTES.LOGIN;
                }, 1000);
            }
        }
    };
})();