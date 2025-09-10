(function() {
    'use strict';

    const PostsPage = {
        currentFilter: 'all',
        
        init: function() {
            if (!PageBase.init('posts')) return;
            
            this.bindElements();
            this.setupEventListeners();
            this.loadPosts();
        },
        
        bindElements: function() {
            this.postsGrid = document.getElementById('postsGrid');
            this.newPostBtn = document.getElementById('newPostBtn');
            this.postModal = document.getElementById('postModal');
            this.postForm = document.getElementById('postForm');
            this.statusFilter = document.getElementById('statusFilter');
            this.dateFilter = document.getElementById('dateFilter');
            this.searchPosts = document.getElementById('searchPosts');
            this.charCount = document.getElementById('charCount');
            this.postContent = document.getElementById('postContent');
        },
        
        setupEventListeners: function() {
            if (this.newPostBtn) {
                this.newPostBtn.addEventListener('click', () => this.openNewPostModal());
            }
            
            if (this.postForm) {
                this.postForm.addEventListener('submit', (e) => this.handlePostSubmit(e));
            }
            
            if (this.statusFilter) {
                this.statusFilter.addEventListener('change', () => this.filterPosts());
            }
            
            if (this.dateFilter) {
                this.dateFilter.addEventListener('change', () => this.filterPosts());
            }
            
            if (this.searchPosts) {
                this.searchPosts.addEventListener('input', CommonUtils.debounce(() => this.filterPosts(), 300));
            }
            
            if (this.postContent) {
                this.postContent.addEventListener('input', () => this.updateCharCount());
            }
            
            document.getElementById('modalClose')?.addEventListener('click', () => this.closePostModal());
            document.getElementById('cancelPost')?.addEventListener('click', () => this.closePostModal());
            document.getElementById('savePost')?.addEventListener('click', () => this.savePost());
        },
        
        
        loadPosts: function() {
            const posts = PostsData.getAllPosts();
            this.renderPosts(posts);
        },
        
        renderPosts: function(posts) {
            if (!this.postsGrid) return;
            
            if (posts.length === 0) {
                this.postsGrid.innerHTML = '<div class="no-posts">投稿がありません</div>';
                return;
            }
            
            const postsHTML = posts.map(post => this.createPostCard(post)).join('');
            this.postsGrid.innerHTML = postsHTML;
            
            this.attachPostActions();
        },
        
        createPostCard: function(post) {
            const statusClass = post.status === 'published' ? 'published' : 
                              post.status === 'scheduled' ? 'scheduled' : 'draft';
            
            const statusText = post.status === 'published' ? '公開済み' : 
                             post.status === 'scheduled' ? '予約済み' : '下書き';
            
            return `
                <div class="post-card" data-post-id="${post.id}">
                    <div class="post-card-header">
                        <span class="post-status-badge ${statusClass}">${statusText}</span>
                        <button class="post-menu-btn" aria-label="メニュー">⋮</button>
                    </div>
                    <div class="post-card-body">
                        <h3 class="post-card-title">${SecurityUtils.escapeHtml(post.title)}</h3>
                        <p class="post-card-excerpt">${SecurityUtils.escapeHtml(post.content)}</p>
                        <div class="post-card-meta">
                            <span class="post-date">${CommonUtils.formatDate(post.createdAt)}</span>
                            <div class="post-stats">
                                <span>♥ ${post.metrics.likes}</span>
                                <span>↻ ${post.metrics.shares}</span>
                                <span>💬 ${post.metrics.comments}</span>
                            </div>
                        </div>
                    </div>
                    <div class="post-card-footer">
                        <button class="btn-text edit-post" data-post-id="${post.id}">編集</button>
                        <button class="btn-text duplicate-post" data-post-id="${post.id}">複製</button>
                        <button class="btn-text danger delete-post" data-post-id="${post.id}">削除</button>
                    </div>
                </div>
            `;
        },
        
        attachPostActions: function() {
            document.querySelectorAll('.edit-post').forEach(btn => {
                btn.addEventListener('click', (e) => this.editPost(e.target.dataset.postId));
            });
            
            document.querySelectorAll('.delete-post').forEach(btn => {
                btn.addEventListener('click', (e) => this.deletePost(e.target.dataset.postId));
            });
            
            document.querySelectorAll('.duplicate-post').forEach(btn => {
                btn.addEventListener('click', (e) => this.duplicatePost(e.target.dataset.postId));
            });
        },
        
        filterPosts: function() {
            const status = this.statusFilter?.value || 'all';
            const dateRange = this.dateFilter?.value || 'all';
            const searchQuery = this.searchPosts?.value.toLowerCase() || '';
            
            let posts = PostsData.getAllPosts();
            
            if (status !== 'all') {
                posts = posts.filter(post => post.status === status);
            }
            
            if (searchQuery) {
                posts = posts.filter(post => 
                    post.title.toLowerCase().includes(searchQuery) ||
                    post.content.toLowerCase().includes(searchQuery)
                );
            }
            
            this.renderPosts(posts);
        },
        
        openNewPostModal: function() {
            this.postForm?.reset();
            this.updateCharCount();
            ModalController.open('postModal');
        },
        
        closePostModal: function() {
            ModalController.close('postModal');
        },
        
        updateCharCount: function() {
            const length = this.postContent?.value.length || 0;
            if (this.charCount) {
                this.charCount.textContent = `${length}/500`;
            }
        },
        
        savePost: function() {
            const formData = new FormData(this.postForm);
            
            const postData = {
                title: formData.get('postTitle'),
                content: formData.get('postContent'),
                hashtags: formData.get('postHashtags')?.split(' ').filter(tag => tag.startsWith('#')),
                status: formData.get('postStatus'),
                scheduledAt: formData.get('postSchedule') ? new Date(formData.get('postSchedule')).getTime() : null
            };
            
            PostsData.createPost(postData);
            CommonUtils.showNotification('投稿を保存しました', 'success');
            this.closePostModal();
            this.loadPosts();
        },
        
        editPost: function(postId) {
            const post = PostsData.getPostById(postId);
            if (post) {
                document.getElementById('postTitle').value = post.title;
                document.getElementById('postContent').value = post.content;
                document.getElementById('postHashtags').value = post.hashtags?.join(' ') || '';
                document.getElementById('postStatus').value = post.status;
                this.updateCharCount();
                ModalController.open('postModal');
            }
        },
        
        deletePost: function(postId) {
            if (confirm('この投稿を削除しますか？')) {
                PostsData.deletePost(postId);
                CommonUtils.showNotification('投稿を削除しました', 'success');
                this.loadPosts();
            }
        },
        
        duplicatePost: function(postId) {
            const post = PostsData.getPostById(postId);
            if (post) {
                const duplicatedPost = {
                    ...post,
                    title: post.title + ' (コピー)',
                    status: 'draft'
                };
                delete duplicatedPost.id;
                PostsData.createPost(duplicatedPost);
                CommonUtils.showNotification('投稿を複製しました', 'success');
                this.loadPosts();
            }
        }
    };
    
    document.addEventListener('DOMContentLoaded', () => PostsPage.init());
})();