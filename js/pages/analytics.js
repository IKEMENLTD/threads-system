(function() {
    'use strict';

    const AnalyticsPage = {
        currentPeriod: '7days',
        
        init: function() {
            if (!PageBase.init('analytics')) return;
            
            this.bindElements();
            this.setupEventListeners();
            ChartManager.init();
            this.loadAnalytics();
        },
        
        bindElements: function() {
            this.periodBtns = document.querySelectorAll('.period-btn');
            this.exportPDF = document.getElementById('exportPDF');
            this.exportCSV = document.getElementById('exportCSV');
            this.shareReport = document.getElementById('shareReport');
        },
        
        setupEventListeners: function() {
            this.periodBtns.forEach(btn => {
                btn.addEventListener('click', () => this.changePeriod(btn.dataset.period));
            });
            
            if (this.exportPDF) {
                this.exportPDF.addEventListener('click', () => this.exportToPDF());
            }
            
            if (this.exportCSV) {
                this.exportCSV.addEventListener('click', () => this.exportToCSV());
            }
            
            if (this.shareReport) {
                this.shareReport.addEventListener('click', () => this.shareAnalytics());
            }
        },
        
        
        loadAnalytics: function() {
            const metrics = AnalyticsData.getMetricsByPeriod(this.currentPeriod);
            
            this.updateOverviewMetrics(metrics.overview);
            this.renderCharts(metrics);
            this.updateTopPosts(metrics.topPosts);
        },
        
        updateOverviewMetrics: function(overview) {
            const impressions = document.querySelector('.metric-card:nth-child(1) .metric-value');
            const engagement = document.querySelector('.metric-card:nth-child(2) .metric-value');
            const followers = document.querySelector('.metric-card:nth-child(3) .metric-value');
            const clickRate = document.querySelector('.metric-card:nth-child(4) .metric-value');
            
            if (impressions) impressions.textContent = CommonUtils.formatNumber(overview.totalImpressions);
            if (engagement) engagement.textContent = overview.engagementRate + '%';
            if (followers) followers.textContent = '+' + overview.followersGained;
            if (clickRate) clickRate.textContent = overview.clickRate + '%';
            
            ChartManager.createMiniChart('impressionsChart', [100, 120, 115, 130, 140, 135, 150], '#3b82f6');
            ChartManager.createMiniChart('engagementChart', [3.5, 3.8, 4.1, 4.3, 4.5, 4.6, 4.7], '#10b981');
            ChartManager.createMiniChart('followersChart', [750, 780, 820, 850, 870, 880, 892], '#f59e0b');
            ChartManager.createMiniChart('clickRateChart', [2.8, 2.7, 2.6, 2.5, 2.4, 2.3, 2.3], '#ef4444');
        },
        
        renderCharts: function(metrics) {
            ChartManager.createLineChart('performanceChart', metrics.performance);
            ChartManager.createDoughnutChart('postTypeChart', metrics.postTypes);
            ChartManager.createBarChart('timeEngagementChart', metrics.timeEngagement);
        },
        
        updateTopPosts: function(topPosts) {
            const tableBody = document.getElementById('topPostsTable');
            if (!tableBody) return;
            
            const rowsHTML = topPosts.map(post => `
                <tr>
                    <td class="post-title">${SecurityUtils.escapeHtml(post.title)}</td>
                    <td>${post.date}</td>
                    <td>${CommonUtils.formatNumber(post.impressions)}</td>
                    <td>${CommonUtils.formatNumber(post.engagement)}</td>
                    <td>${CommonUtils.formatNumber(post.clicks)}</td>
                </tr>
            `).join('');
            
            tableBody.innerHTML = rowsHTML;
        },
        
        changePeriod: function(period) {
            this.currentPeriod = period;
            
            this.periodBtns.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.period === period);
            });
            
            this.loadAnalytics();
        },
        
        exportToPDF: function() {
            CommonUtils.showNotification('PDF レポートを生成中...', 'info');
            setTimeout(() => {
                CommonUtils.showNotification('PDFレポートをダウンロードしました', 'success');
            }, 2000);
        },
        
        exportToCSV: function() {
            const metrics = AnalyticsData.getMetricsByPeriod(this.currentPeriod);
            const csvContent = this.generateCSV(metrics);
            
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `analytics_${Date.now()}.csv`;
            link.click();
            
            CommonUtils.showNotification('CSVファイルをダウンロードしました', 'success');
        },
        
        generateCSV: function(metrics) {
            let csv = 'メトリクス,値,前期比\n';
            csv += `総インプレッション,${metrics.overview.totalImpressions},+${metrics.overview.trends.impressions}%\n`;
            csv += `エンゲージメント率,${metrics.overview.engagementRate}%,+${metrics.overview.trends.engagement}%\n`;
            csv += `フォロワー増加,${metrics.overview.followersGained},+${metrics.overview.trends.followers}\n`;
            csv += `クリック率,${metrics.overview.clickRate}%,${metrics.overview.trends.clicks}%\n`;
            return csv;
        },
        
        shareAnalytics: function() {
            const shareUrl = window.location.href + '?shared=' + Date.now();
            CommonUtils.copyToClipboard(shareUrl).then(() => {
                CommonUtils.showNotification('共有リンクをコピーしました', 'success');
            });
        }
    };
    
    document.addEventListener('DOMContentLoaded', () => AnalyticsPage.init());
})();