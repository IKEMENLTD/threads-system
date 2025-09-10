(function() {
    'use strict';

    window.ModalController = {
        activeModals: [],
        
        open: function(modalId) {
            const modal = document.getElementById(modalId);
            if (!modal) return;
            
            modal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
            
            this.activeModals.push(modal);
            
            const backdrop = modal.querySelector('.modal-backdrop');
            const closeBtn = modal.querySelector('.modal-close');
            
            if (backdrop) {
                backdrop.addEventListener('click', () => this.close(modalId));
            }
            
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.close(modalId));
            }
            
            document.addEventListener('keydown', this.handleEscKey);
            
            this.trapFocus(modal);
        },
        
        close: function(modalId) {
            const modal = document.getElementById(modalId);
            if (!modal) return;
            
            modal.setAttribute('aria-hidden', 'true');
            
            const index = this.activeModals.indexOf(modal);
            if (index > -1) {
                this.activeModals.splice(index, 1);
            }
            
            if (this.activeModals.length === 0) {
                document.body.style.overflow = '';
                document.removeEventListener('keydown', this.handleEscKey);
            }
        },
        
        handleEscKey: function(e) {
            if (e.key === 'Escape' && ModalController.activeModals.length > 0) {
                const lastModal = ModalController.activeModals[ModalController.activeModals.length - 1];
                ModalController.close(lastModal.id);
            }
        },
        
        trapFocus: function(modal) {
            const focusableElements = modal.querySelectorAll(
                'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select'
            );
            
            const firstFocusableElement = focusableElements[0];
            const lastFocusableElement = focusableElements[focusableElements.length - 1];
            
            modal.addEventListener('keydown', function(e) {
                if (e.key === 'Tab') {
                    if (e.shiftKey) {
                        if (document.activeElement === firstFocusableElement) {
                            lastFocusableElement.focus();
                            e.preventDefault();
                        }
                    } else {
                        if (document.activeElement === lastFocusableElement) {
                            firstFocusableElement.focus();
                            e.preventDefault();
                        }
                    }
                }
            });
            
            firstFocusableElement.focus();
        }
    };
})();