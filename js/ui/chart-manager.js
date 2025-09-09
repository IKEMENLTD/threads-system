(function() {
    'use strict';

    window.ChartManager = {
        charts: {},
        
        init: function() {
            if (typeof Chart === 'undefined') {
                console.warn('Chart.js is not loaded');
                return;
            }
            
            Chart.defaults.color = '#6b7280';
            Chart.defaults.font.family = 'Inter, sans-serif';
        },
        
        createLineChart: function(canvasId, data) {
            const canvas = document.getElementById(canvasId);
            if (!canvas) return;
            
            if (this.charts[canvasId]) {
                this.charts[canvasId].destroy();
            }
            
            this.charts[canvasId] = new Chart(canvas, {
                type: 'line',
                data: {
                    labels: data.labels,
                    datasets: [
                        {
                            label: 'インプレッション',
                            data: data.impressions,
                            borderColor: '#3b82f6',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            tension: 0.4
                        },
                        {
                            label: 'エンゲージメント',
                            data: data.engagement,
                            borderColor: '#10b981',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            tension: 0.4
                        },
                        {
                            label: 'クリック',
                            data: data.clicks,
                            borderColor: '#f59e0b',
                            backgroundColor: 'rgba(245, 158, 11, 0.1)',
                            tension: 0.4
                        }
                    ]
                },
                options: AppConstants.CHART_OPTIONS
            });
        },
        
        createDoughnutChart: function(canvasId, data) {
            const canvas = document.getElementById(canvasId);
            if (!canvas) return;
            
            if (this.charts[canvasId]) {
                this.charts[canvasId].destroy();
            }
            
            this.charts[canvasId] = new Chart(canvas, {
                type: 'doughnut',
                data: {
                    labels: data.labels,
                    datasets: [{
                        data: data.data,
                        backgroundColor: [
                            '#3b82f6',
                            '#10b981',
                            '#f59e0b',
                            '#ef4444'
                        ]
                    }]
                },
                options: {
                    ...AppConstants.CHART_OPTIONS,
                    maintainAspectRatio: true
                }
            });
        },
        
        createBarChart: function(canvasId, data) {
            const canvas = document.getElementById(canvasId);
            if (!canvas) return;
            
            if (this.charts[canvasId]) {
                this.charts[canvasId].destroy();
            }
            
            this.charts[canvasId] = new Chart(canvas, {
                type: 'bar',
                data: {
                    labels: data.labels,
                    datasets: [{
                        label: 'エンゲージメント',
                        data: data.data,
                        backgroundColor: '#3b82f6'
                    }]
                },
                options: AppConstants.CHART_OPTIONS
            });
        },
        
        createMiniChart: function(canvasId, data, color = '#3b82f6') {
            const canvas = document.getElementById(canvasId);
            if (!canvas) return;
            
            if (this.charts[canvasId]) {
                this.charts[canvasId].destroy();
            }
            
            this.charts[canvasId] = new Chart(canvas, {
                type: 'line',
                data: {
                    labels: ['', '', '', '', '', '', ''],
                    datasets: [{
                        data: data,
                        borderColor: color,
                        borderWidth: 2,
                        fill: false,
                        tension: 0.4,
                        pointRadius: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: { enabled: false }
                    },
                    scales: {
                        x: { display: false },
                        y: { display: false }
                    }
                }
            });
        },
        
        updateChart: function(canvasId, newData) {
            if (this.charts[canvasId]) {
                this.charts[canvasId].data = newData;
                this.charts[canvasId].update();
            }
        },
        
        destroyChart: function(canvasId) {
            if (this.charts[canvasId]) {
                this.charts[canvasId].destroy();
                delete this.charts[canvasId];
            }
        },
        
        destroyAllCharts: function() {
            Object.keys(this.charts).forEach(canvasId => {
                this.destroyChart(canvasId);
            });
        }
    };
})();