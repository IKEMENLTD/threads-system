(function() {
    'use strict';

    window.ScheduleData = {
        schedules: [],
        
        init: function() {
            this.loadSchedules();
        },
        
        loadSchedules: function() {
            const saved = StorageManager.get('schedule') || [];
            this.schedules = saved.length > 0 ? saved : this.generateMockSchedules();
            return this.schedules;
        },
        
        saveSchedules: function() {
            StorageManager.set('schedule', this.schedules);
        },
        
        generateMockSchedules: function() {
            const now = Date.now();
            return [
                {
                    id: 'sch_1',
                    postId: 'post_1',
                    title: '新商品のお知らせ',
                    content: '新商品の詳細情報をお届けします',
                    scheduledAt: now + 3600000,
                    status: 'scheduled',
                    createdAt: now - 86400000
                },
                {
                    id: 'sch_2',
                    postId: 'post_2',
                    title: '週末セール情報',
                    content: '週末限定のお得なセール情報',
                    scheduledAt: now + 172800000,
                    status: 'scheduled',
                    createdAt: now - 43200000
                },
                {
                    id: 'sch_3',
                    postId: 'post_3',
                    title: 'イベントのお知らせ',
                    content: '来月開催予定のイベント情報',
                    scheduledAt: now + 604800000,
                    status: 'draft',
                    createdAt: now
                }
            ];
        },
        
        getAllSchedules: function() {
            return this.schedules;
        },
        
        getSchedulesByDate: function(date) {
            const targetDate = new Date(date);
            targetDate.setHours(0, 0, 0, 0);
            const nextDate = new Date(targetDate);
            nextDate.setDate(targetDate.getDate() + 1);
            
            return this.schedules.filter(schedule => {
                const scheduleDate = new Date(schedule.scheduledAt);
                return scheduleDate >= targetDate && scheduleDate < nextDate;
            });
        },
        
        getSchedulesByMonth: function(year, month) {
            const startDate = new Date(year, month, 1);
            const endDate = new Date(year, month + 1, 0);
            
            return this.schedules.filter(schedule => {
                const scheduleDate = new Date(schedule.scheduledAt);
                return scheduleDate >= startDate && scheduleDate <= endDate;
            });
        },
        
        getUpcomingSchedules: function(limit = 10) {
            const now = Date.now();
            return this.schedules
                .filter(schedule => schedule.scheduledAt > now)
                .sort((a, b) => a.scheduledAt - b.scheduledAt)
                .slice(0, limit);
        },
        
        createSchedule: function(scheduleData) {
            const schedule = {
                id: 'sch_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                ...scheduleData,
                createdAt: Date.now()
            };
            
            this.schedules.push(schedule);
            this.saveSchedules();
            return schedule;
        },
        
        updateSchedule: function(id, updates) {
            const index = this.schedules.findIndex(schedule => schedule.id === id);
            if (index !== -1) {
                this.schedules[index] = { ...this.schedules[index], ...updates };
                this.saveSchedules();
                return this.schedules[index];
            }
            return null;
        },
        
        deleteSchedule: function(id) {
            const index = this.schedules.findIndex(schedule => schedule.id === id);
            if (index !== -1) {
                this.schedules.splice(index, 1);
                this.saveSchedules();
                return true;
            }
            return false;
        },
        
        getMonthlyStats: function(year, month) {
            const schedules = this.getSchedulesByMonth(year, month);
            return {
                total: schedules.length,
                scheduled: schedules.filter(s => s.status === 'scheduled').length,
                draft: schedules.filter(s => s.status === 'draft').length,
                published: schedules.filter(s => s.status === 'published').length
            };
        }
    };
    
    ScheduleData.init();
})();