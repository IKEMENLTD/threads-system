(function() {
    'use strict';

    window.PostsData = {
        posts: [],
        
        init: function() {
            this.loadPosts();
        },
        
        loadPosts: function() {
            const saved = StorageManager.get('posts') || [];
            this.posts = saved.length > 0 ? saved : this.generateMockPosts();
            return this.posts;
        },
        
        savePosts: function() {
            StorageManager.set('posts', this.posts);
        },
        
        generateMockPosts: function() {
            return [
                {
                    id: 'post_' + Date.now() + '_1',
                    title: '新サービスリリースのお知らせ',
                    content: '本日より新しいサービスを開始いたします。詳細はウェブサイトをご覧ください。',
                    hashtags: ['#新サービス', '#お知らせ'],
                    status: 'published',
                    createdAt: Date.now() - 86400000,
                    publishedAt: Date.now() - 86400000,
                    metrics: { likes: 124, shares: 32, comments: 18 }
                },
                {
                    id: 'post_' + Date.now() + '_2',
                    title: '週末限定キャンペーン',
                    content: '今週末限定で特別キャンペーンを実施中！',
                    hashtags: ['#キャンペーン', '#週末限定'],
                    status: 'scheduled',
                    createdAt: Date.now() - 43200000,
                    scheduledAt: Date.now() + 86400000,
                    metrics: { likes: 0, shares: 0, comments: 0 }
                }
            ];
        },
        
        getAllPosts: function() {
            return this.posts;
        },
        
        getPostById: function(id) {
            return this.posts.find(post => post.id === id);
        },
        
        getPostsByStatus: function(status) {
            return this.posts.filter(post => post.status === status);
        },
        
        createPost: function(postData) {
            const post = {
                id: 'post_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                ...postData,
                createdAt: Date.now(),
                metrics: { likes: 0, shares: 0, comments: 0 }
            };
            
            this.posts.unshift(post);
            this.savePosts();
            return post;
        },
        
        updatePost: function(id, updates) {
            const index = this.posts.findIndex(post => post.id === id);
            if (index !== -1) {
                this.posts[index] = { ...this.posts[index], ...updates, updatedAt: Date.now() };
                this.savePosts();
                return this.posts[index];
            }
            return null;
        },
        
        deletePost: function(id) {
            const index = this.posts.findIndex(post => post.id === id);
            if (index !== -1) {
                this.posts.splice(index, 1);
                this.savePosts();
                return true;
            }
            return false;
        }
    };
    
    PostsData.init();
})();