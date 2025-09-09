(function() {
    'use strict';

    window.AnalyticsData = {
        metrics: null,
        
        init: function() {
            this.loadMetrics();
        },
        
        loadMetrics: function() {
            const saved = StorageManager.get('analytics') || null;
            this.metrics = saved || this.generateMockMetrics();
            return this.metrics;
        },
        
        saveMetrics: function() {
            StorageManager.set('analytics', this.metrics);
        },
        
        generateMockMetrics: function() {
            return {
                overview: {
                    totalImpressions: 234567,
                    engagementRate: 4.7,
                    followersGained: 892,
                    clickRate: 2.3,
                    trends: {
                        impressions: 12.5,
                        engagement: 8.3,
                        followers: 156,
                        clicks: -2.1
                    }
                },
                performance: {
                    labels: ['月', '火', '水', '木', '金', '土', '日'],
                    impressions: [12000, 15000, 13000, 18000, 22000, 19000, 16000],
                    engagement: [450, 520, 480, 650, 780, 690, 580],
                    clicks: [120, 150, 130, 180, 220, 190, 160]
                },
                postTypes: {
                    labels: ['テキスト', '画像', '動画', 'リンク'],
                    data: [45, 30, 15, 10]
                },
                timeEngagement: {
                    labels: ['0-6時', '6-9時', '9-12時', '12-15時', '15-18時', '18-21時', '21-24時'],
                    data: [5, 15, 25, 30, 35, 40, 20]
                },
                topPosts: [
                    {
                        title: '新商品リリースのお知らせ',
                        date: '2025/1/7 15:00',
                        impressions: 12456,
                        engagement: 856,
                        clicks: 234
                    },
                    {
                        title: '週末限定セール開催中',
                        date: '2025/1/5 10:00',
                        impressions: 10234,
                        engagement: 745,
                        clicks: 198
                    },
                    {
                        title: 'お客様の声をご紹介',
                        date: '2025/1/4 18:30',
                        impressions: 8567,
                        engagement: 623,
                        clicks: 156
                    }
                ]
            };
        },
        
        getMetricsByPeriod: function(period) {
            const metrics = { ...this.metrics };
            
            if (period === '7days') {
                metrics.performance.labels = metrics.performance.labels.slice(-7);
                metrics.performance.impressions = metrics.performance.impressions.slice(-7);
                metrics.performance.engagement = metrics.performance.engagement.slice(-7);
                metrics.performance.clicks = metrics.performance.clicks.slice(-7);
            }
            
            return metrics;
        },
        
        updateMetrics: function(newData) {
            this.metrics = { ...this.metrics, ...newData };
            this.saveMetrics();
        }
    };
    
    AnalyticsData.init();
})();