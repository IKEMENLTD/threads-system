(function() {
    'use strict';

    const IndexPage = {
        init: function() {
            this.updateLoadingMessage();
            this.animateProgress();
        },
        
        updateLoadingMessage: function() {
            const messages = [
                'システムを起動中...',
                'セッションを確認中...',
                'データを読み込み中...',
                'リダイレクト準備中...'
            ];
            
            const messageElement = document.querySelector('.loading-message');
            if (!messageElement) return;
            
            let currentIndex = 0;
            
            setInterval(() => {
                currentIndex = (currentIndex + 1) % messages.length;
                messageElement.textContent = messages[currentIndex];
            }, 1500);
        },
        
        animateProgress: function() {
            const progressBar = document.getElementById('progressBar');
            if (!progressBar) return;
            
            let width = 0;
            const duration = 3000;
            const steps = 100;
            const stepDuration = duration / steps;
            
            const animation = setInterval(() => {
                if (width >= 100) {
                    clearInterval(animation);
                } else {
                    width++;
                    progressBar.style.width = width + '%';
                }
            }, stepDuration);
        }
    };
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => IndexPage.init());
    } else {
        IndexPage.init();
    }
})();