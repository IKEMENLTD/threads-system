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
                    // ローディング完了後、実際のページを表示
                    this.showMainPage();
                } else {
                    width++;
                    progressBar.style.width = width + '%';
                }
            }, stepDuration);
        },
        
        showMainPage: function() {
            const loadingOverlay = document.getElementById('loadingOverlay');
            const appContainer = document.getElementById('app');
            
            // ローディングを隠す
            if (loadingOverlay) {
                loadingOverlay.style.display = 'none';
            }
            
            // メインページのHTMLを表示
            if (appContainer) {
                appContainer.innerHTML = `
                    <header class="header">
                        <h1 class="app-title">Threads System</h1>
                        <p class="app-subtitle">自動投稿管理システム</p>
                    </header>

                    <main class="main-content">
                        <div class="welcome-card">
                            <h2>ようこそ</h2>
                            <p>Threads自動投稿管理システムへようこそ。<br>
                            ログインして始めましょう。</p>
                            <div class="action-buttons">
                                <a href="login.html" class="btn btn-primary">ログイン</a>
                                <a href="dashboard.html" class="btn btn-secondary">ダッシュボード</a>
                            </div>
                        </div>

                        <div class="features">
                            <div class="feature-card">
                                <h3>📊 分析</h3>
                                <p>投稿のパフォーマンスを詳細に分析</p>
                            </div>
                            <div class="feature-card">
                                <h3>📅 スケジュール</h3>
                                <p>投稿を事前にスケジュール設定</p>
                            </div>
                            <div class="feature-card">
                                <h3>⚙️ 自動化</h3>
                                <p>効率的な自動投稿システム</p>
                            </div>
                        </div>
                    </main>

                    <footer class="footer">
                        <p>&copy; 2024 Threads System. All rights reserved.</p>
                        <p class="api-status">
                            API Status: <span id="api-status">Checking...</span>
                        </p>
                    </footer>
                `;
                
                // API接続確認
                this.checkApiStatus();
            }
        },
        
        checkApiStatus: function() {
            if (window.AppConfig && window.AppConfig.api) {
                const apiUrl = window.AppConfig.api.baseUrl.replace('/api', '') + '/api/health';
                fetch(apiUrl)
                    .then(res => res.json())
                    .then(data => {
                        const statusEl = document.getElementById('api-status');
                        if (statusEl) {
                            if (data.status === 'ok' && data.database === 'connected') {
                                statusEl.textContent = '✅ Connected';
                                statusEl.style.color = '#10b981';
                            } else {
                                statusEl.textContent = '⚠️ Database not connected';
                                statusEl.style.color = '#f59e0b';
                            }
                        }
                    })
                    .catch(err => {
                        const statusEl = document.getElementById('api-status');
                        if (statusEl) {
                            statusEl.textContent = '❌ Offline';
                            statusEl.style.color = '#ef4444';
                        }
                    });
            }
        }
    };
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => IndexPage.init());
    } else {
        IndexPage.init();
    }
})();