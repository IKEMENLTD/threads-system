(function() {
    'use strict';

    const DashboardPage = {
        statsUpdateInterval: null,
        
        init: function() {
            if (!PageBase.init('dashboard')) return;
            
            this.bindElements();
            this.setupEventListeners();
            this.loadDashboardData();
            this.startRealTimeUpdates();
        },
        
        bindElements: function() {
            this.totalPosts = document.getElementById('dashboard-totalPosts');
            this.scheduledPosts = document.getElementById('dashboard-scheduledPosts');
            this.engagement = document.getElementById('dashboard-engagement');
            this.successRate = document.getElementById('dashboard-successRate');
            
            this.recentPosts = document.getElementById('dashboard-recentPosts');
            
            this.newPostBtn = document.getElementById('dashboard-newPostBtn');
            this.scheduleBtn = document.getElementById('dashboard-scheduleBtn');
            this.analyticsBtn = document.getElementById('dashboard-analyticsBtn');
        },
        
        setupEventListeners: function() {
            if (this.newPostBtn) {
                this.newPostBtn.addEventListener('click', () => {
                    window.location.href = AppConstants.ROUTES.POSTS;
                });
            }
            
            if (this.scheduleBtn) {
                this.scheduleBtn.addEventListener('click', () => {
                    window.location.href = AppConstants.ROUTES.SCHEDULE;
                });
            }
            
            if (this.analyticsBtn) {
                this.analyticsBtn.addEventListener('click', () => {
                    window.location.href = AppConstants.ROUTES.ANALYTICS;
                });
            }
        },
        
        loadDashboardData: function() {
            const dashboardData = StorageManager.get('dashboard_stats') || this.generateMockData();
            
            this.updateStats(dashboardData.stats);
            this.updateRecentPosts(dashboardData.recentPosts);
            
            StorageManager.set('dashboard_stats', dashboardData);
        },
        
        generateMockData: function() {
            return {
                stats: {
                    totalPosts: 156,
                    scheduledPosts: 24,
                    engagement: 4.7,
                    successRate: 92.3
                },
                recentPosts: [
                    {
                        id: 'post_1',
                        title: '新商品のお知らせ',
                        time: '2時間前',
                        status: 'success',
                        likes: 42,
                        shares: 12
                    },
                    {
                        id: 'post_2',
                        title: '週末セールのご案内',
                        time: '5時間前',
                        status: 'success',
                        likes: 38,
                        shares: 8
                    },
                    {
                        id: 'post_3',
                        title: 'イベント開催のお知らせ',
                        time: '昨日',
                        status: 'pending',
                        likes: 0,
                        shares: 0
                    },
                    {
                        id: 'post_4',
                        title: 'お客様への感謝',
                        time: '2日前',
                        status: 'success',
                        likes: 156,
                        shares: 32
                    },
                    {
                        id: 'post_5',
                        title: '新サービス開始',
                        time: '3日前',
                        status: 'success',
                        likes: 89,
                        shares: 21
                    }
                ]
            };
        },
        
        updateStats: function(stats) {
            if (this.totalPosts) {
                this.animateNumber(this.totalPosts, stats.totalPosts);
            }
            
            if (this.scheduledPosts) {
                this.animateNumber(this.scheduledPosts, stats.scheduledPosts);
            }
            
            if (this.engagement) {
                this.animateNumber(this.engagement, stats.engagement, '%');
            }
            
            if (this.successRate) {
                this.animateNumber(this.successRate, stats.successRate, '%');
            }
        },
        
        animateNumber: function(element, target, suffix = '') {
            const start = 0;
            const duration = 1000;
            const startTime = performance.now();
            
            const animate = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const current = start + (target - start) * this.easeOutQuad(progress);
                
                if (suffix === '%') {
                    element.textContent = current.toFixed(1) + suffix;
                } else {
                    element.textContent = Math.round(current);
                }
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            };
            
            requestAnimationFrame(animate);
        },
        
        easeOutQuad: function(t) {
            return t * (2 - t);
        },
        
        updateRecentPosts: function(posts) {
            if (!this.recentPosts) return;
            
            const postsHTML = posts.map(post => `
                <div class="post-item">
                    <div class="post-status ${post.status}"></div>
                    <div class="post-content">
                        <h4 class="post-title">${post.title}</h4>
                        <p class="post-time">${post.time}</p>
                    </div>
                    <div class="post-stats">
                        <span class="post-metric">♥ ${post.likes}</span>
                        <span class="post-metric">↻ ${post.shares}</span>
                    </div>
                </div>
            `).join('');
            
            this.recentPosts.innerHTML = postsHTML;
        },
        
        startRealTimeUpdates: function() {
            this.statsUpdateInterval = setInterval(() => {
                const data = StorageManager.get('dashboard_stats');
                if (data) {
                    data.stats.totalPosts += Math.floor(Math.random() * 3);
                    data.stats.engagement = (Math.random() * 2 + 3).toFixed(1);
                    
                    this.updateStats(data.stats);
                    StorageManager.set('dashboard_stats', data);
                }
            }, 30000);
        },
        
        cleanup: function() {
            if (this.statsUpdateInterval) {
                clearInterval(this.statsUpdateInterval);
            }
        }
    };
    
    document.addEventListener('DOMContentLoaded', () => DashboardPage.init());
    
    window.addEventListener('beforeunload', () => DashboardPage.cleanup());
})();