(function() {
    'use strict';

    window.CalendarController = {
        currentDate: new Date(),
        currentView: 'month',
        
        init: function() {
            this.bindElements();
            this.setupEventListeners();
            this.render();
        },
        
        bindElements: function() {
            this.calendarTitle = document.getElementById('calendarTitle');
            this.calendarDays = document.getElementById('calendarDays');
            this.prevMonth = document.getElementById('prevMonth');
            this.nextMonth = document.getElementById('nextMonth');
            this.viewButtons = document.querySelectorAll('.view-btn');
        },
        
        setupEventListeners: function() {
            if (this.prevMonth) {
                this.prevMonth.addEventListener('click', () => this.navigateMonth(-1));
            }
            
            if (this.nextMonth) {
                this.nextMonth.addEventListener('click', () => this.navigateMonth(1));
            }
            
            this.viewButtons.forEach(btn => {
                btn.addEventListener('click', (e) => this.changeView(e.target.dataset.view));
            });
        },
        
        navigateMonth: function(direction) {
            this.currentDate = DateUtils.addMonths(this.currentDate, direction);
            this.render();
        },
        
        changeView: function(view) {
            this.currentView = view;
            
            this.viewButtons.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.view === view);
            });
            
            if (view === 'list') {
                document.getElementById('calendarGrid').style.display = 'none';
                document.getElementById('listView').style.display = 'block';
                this.renderListView();
            } else {
                document.getElementById('calendarGrid').style.display = 'block';
                document.getElementById('listView').style.display = 'none';
                this.render();
            }
        },
        
        render: function() {
            const year = this.currentDate.getFullYear();
            const month = this.currentDate.getMonth();
            
            if (this.calendarTitle) {
                this.calendarTitle.textContent = `${year}年${month + 1}月`;
            }
            
            if (this.currentView === 'month') {
                this.renderMonthView(year, month);
            } else if (this.currentView === 'week') {
                this.renderWeekView();
            }
            
            this.updateStats(year, month);
        },
        
        renderMonthView: function(year, month) {
            if (!this.calendarDays) return;
            
            const days = DateUtils.getCalendarDays(year, month);
            const schedules = ScheduleData.getSchedulesByMonth(year, month);
            
            const daysHTML = days.map(day => {
                let className = 'calendar-day';
                if (!day.isCurrentMonth) className += ' other-month';
                if (day.isToday) className += ' today';
                
                const daySchedules = schedules.filter(schedule => {
                    const scheduleDate = new Date(schedule.scheduledAt);
                    return scheduleDate.getDate() === day.day && 
                           scheduleDate.getMonth() === (day.isCurrentMonth ? month : 
                                                       day.isPrevMonth ? month - 1 : month + 1);
                });
                
                return `
                    <div class="${className}">
                        <div class="day-number">${day.day}</div>
                        ${daySchedules.length > 0 ? `
                            <div class="day-events">
                                ${daySchedules.slice(0, 3).map(s => `
                                    <div class="event-dot ${s.status}"></div>
                                `).join('')}
                                ${daySchedules.length > 3 ? `<span class="more-events">+${daySchedules.length - 3}</span>` : ''}
                            </div>
                        ` : ''}
                    </div>
                `;
            }).join('');
            
            this.calendarDays.innerHTML = daysHTML;
        },
        
        renderWeekView: function() {
            const startOfWeek = new Date(this.currentDate);
            startOfWeek.setDate(this.currentDate.getDate() - this.currentDate.getDay());
            
            const weekDays = [];
            for (let i = 0; i < 7; i++) {
                const day = new Date(startOfWeek);
                day.setDate(startOfWeek.getDate() + i);
                weekDays.push(day);
            }
            
            if (this.calendarDays) {
                this.calendarDays.innerHTML = weekDays.map(day => `
                    <div class="week-day">
                        <div class="week-day-header">
                            <span class="week-day-name">${DateUtils.weekDays[day.getDay()]}</span>
                            <span class="week-day-date">${day.getDate()}</span>
                        </div>
                        <div class="week-day-events"></div>
                    </div>
                `).join('');
            }
        },
        
        renderListView: function() {
            const tableBody = document.getElementById('scheduleTableBody');
            if (!tableBody) return;
            
            const schedules = ScheduleData.getUpcomingSchedules(20);
            
            const rowsHTML = schedules.map(schedule => `
                <tr>
                    <td>${DateUtils.formatDate(schedule.scheduledAt, 'MM/DD HH:mm')}</td>
                    <td>${SecurityUtils.escapeHtml(schedule.title)}</td>
                    <td><span class="status-badge ${schedule.status}">${schedule.status}</span></td>
                    <td>
                        <button class="btn-text">編集</button>
                        <button class="btn-text danger">削除</button>
                    </td>
                </tr>
            `).join('');
            
            tableBody.innerHTML = rowsHTML || '<tr><td colspan="4">予定がありません</td></tr>';
        },
        
        updateStats: function(year, month) {
            const stats = ScheduleData.getMonthlyStats(year, month);
            
            const scheduledCount = document.getElementById('scheduledCount');
            const draftCount = document.getElementById('draftCount');
            const publishedCount = document.getElementById('publishedCount');
            
            if (scheduledCount) scheduledCount.textContent = stats.scheduled;
            if (draftCount) draftCount.textContent = stats.draft;
            if (publishedCount) publishedCount.textContent = stats.published;
        }
    };
})();