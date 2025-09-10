(function() {
    'use strict';

    const SchedulePage = {
        init: function() {
            if (!PageBase.init('schedule')) return;
            
            this.bindElements();
            this.setupEventListeners();
            CalendarController.init();
            this.loadUpcomingPosts();
        },
        
        bindElements: function() {
            this.upcomingList = document.getElementById('upcomingList');
            this.quickScheduleBtn = document.getElementById('quickScheduleBtn');
        },
        
        setupEventListeners: function() {
            if (this.quickScheduleBtn) {
                this.quickScheduleBtn.addEventListener('click', () => this.openScheduleModal());
            }
        },
        
        
        loadUpcomingPosts: function() {
            const upcoming = ScheduleData.getUpcomingSchedules(5);
            
            if (this.upcomingList) {
                if (upcoming.length === 0) {
                    this.upcomingList.innerHTML = '<div class="no-upcoming">予定がありません</div>';
                    return;
                }
                
                const upcomingHTML = upcoming.map(schedule => {
                    const timeText = DateUtils.isToday(schedule.scheduledAt) ? '今日 ' + DateUtils.formatDate(schedule.scheduledAt, 'HH:mm') :
                                   DateUtils.isTomorrow(schedule.scheduledAt) ? '明日 ' + DateUtils.formatDate(schedule.scheduledAt, 'HH:mm') :
                                   DateUtils.formatDate(schedule.scheduledAt, 'MM/DD HH:mm');
                    
                    const statusClass = schedule.status === 'scheduled' ? 'scheduled' : 'draft';
                    const statusText = schedule.status === 'scheduled' ? '予約済み' : '下書き';
                    
                    return `
                        <div class="upcoming-item">
                            <div class="upcoming-time">${timeText}</div>
                            <div class="upcoming-content">
                                <h4 class="upcoming-post-title">${SecurityUtils.escapeHtml(schedule.title)}</h4>
                                <span class="upcoming-status ${statusClass}">${statusText}</span>
                            </div>
                        </div>
                    `;
                }).join('');
                
                this.upcomingList.innerHTML = upcomingHTML;
            }
        },
        
        openScheduleModal: function() {
            window.location.href = AppConstants.ROUTES.POSTS;
        }
    };
    
    document.addEventListener('DOMContentLoaded', () => SchedulePage.init());
})();