(function() {
    'use strict';

    window.DateUtils = {
        months: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
        weekDays: ['日', '月', '火', '水', '木', '金', '土'],
        
        getMonthDays: function(year, month) {
            return new Date(year, month + 1, 0).getDate();
        },
        
        getFirstDayOfMonth: function(year, month) {
            return new Date(year, month, 1).getDay();
        },
        
        formatDate: function(date, format = 'YYYY/MM/DD') {
            const d = new Date(date);
            
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const hours = String(d.getHours()).padStart(2, '0');
            const minutes = String(d.getMinutes()).padStart(2, '0');
            
            return format
                .replace('YYYY', year)
                .replace('MM', month)
                .replace('DD', day)
                .replace('HH', hours)
                .replace('mm', minutes);
        },
        
        getRelativeTime: function(timestamp) {
            const now = Date.now();
            const diff = now - timestamp;
            
            const seconds = Math.floor(diff / 1000);
            const minutes = Math.floor(seconds / 60);
            const hours = Math.floor(minutes / 60);
            const days = Math.floor(hours / 24);
            
            if (days > 7) {
                return this.formatDate(timestamp);
            } else if (days > 0) {
                return days === 1 ? '昨日' : `${days}日前`;
            } else if (hours > 0) {
                return `${hours}時間前`;
            } else if (minutes > 0) {
                return `${minutes}分前`;
            } else {
                return 'たった今';
            }
        },
        
        isToday: function(date) {
            const today = new Date();
            const d = new Date(date);
            return d.getDate() === today.getDate() &&
                   d.getMonth() === today.getMonth() &&
                   d.getFullYear() === today.getFullYear();
        },
        
        isTomorrow: function(date) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const d = new Date(date);
            return d.getDate() === tomorrow.getDate() &&
                   d.getMonth() === tomorrow.getMonth() &&
                   d.getFullYear() === tomorrow.getFullYear();
        },
        
        isThisWeek: function(date) {
            const now = new Date();
            const d = new Date(date);
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - now.getDay());
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            
            return d >= weekStart && d <= weekEnd;
        },
        
        isThisMonth: function(date) {
            const now = new Date();
            const d = new Date(date);
            return d.getMonth() === now.getMonth() &&
                   d.getFullYear() === now.getFullYear();
        },
        
        addDays: function(date, days) {
            const result = new Date(date);
            result.setDate(result.getDate() + days);
            return result;
        },
        
        addMonths: function(date, months) {
            const result = new Date(date);
            result.setMonth(result.getMonth() + months);
            return result;
        },
        
        getCalendarDays: function(year, month) {
            const firstDay = this.getFirstDayOfMonth(year, month);
            const daysInMonth = this.getMonthDays(year, month);
            const daysInPrevMonth = month === 0 ? this.getMonthDays(year - 1, 11) : this.getMonthDays(year, month - 1);
            
            const calendar = [];
            
            for (let i = firstDay - 1; i >= 0; i--) {
                calendar.push({
                    day: daysInPrevMonth - i,
                    isCurrentMonth: false,
                    isPrevMonth: true
                });
            }
            
            for (let i = 1; i <= daysInMonth; i++) {
                calendar.push({
                    day: i,
                    isCurrentMonth: true,
                    isToday: this.isToday(new Date(year, month, i))
                });
            }
            
            const remainingDays = 42 - calendar.length;
            for (let i = 1; i <= remainingDays; i++) {
                calendar.push({
                    day: i,
                    isCurrentMonth: false,
                    isNextMonth: true
                });
            }
            
            return calendar;
        }
    };
})();