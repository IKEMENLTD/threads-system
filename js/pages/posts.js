(function() {
    'use strict';

    const PostsPage = {
        currentFilter: 'all',
        
        init: function() {
            if (!PageBase.init('posts')) return;
            
            this.bindElements();
            this.setupEventListeners();
            this.setupRealtimeValidation();
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
            
            // 保存ボタンのイベント追加
            const savePostBtn = document.getElementById('savePost');
            const cancelPostBtn = document.getElementById('cancelPost');
            
            if (savePostBtn) {
                savePostBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.savePost();
                });
            }
            
            if (cancelPostBtn) {
                cancelPostBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.closePostModal();
                });
            }
            
            // モーダル閉じるボタン
            const modalClose = document.getElementById('modalClose');
            if (modalClose) {
                modalClose.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.closePostModal();
                });
            }
            
            document.getElementById('modalClose')?.addEventListener('click', () => this.closePostModal());
            document.getElementById('cancelPost')?.addEventListener('click', () => this.closePostModal());
            document.getElementById('savePost')?.addEventListener('click', () => this.savePost());
        },
        
        
        loadPosts: async function() {
            try {
                this.setLoadingState(true);
                const posts = await this.fetchPostsFromAPI();
                this.renderPosts(posts);
            } catch (error) {
                console.error('投稿読み込みエラー:', error);
                CommonUtils.showNotification('投稿の読み込みに失敗しました', 'error');
                this.renderPosts([]);
            } finally {
                this.setLoadingState(false);
            }
        },

        fetchPostsFromAPI: async function() {
            const token = localStorage.getItem('threads_system_session');
            if (!token) {
                throw new Error('認証トークンが見つかりません');
            }

            const response = await fetch(`${AppConfig.api.baseUrl}/api/posts`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    SessionManager.destroySession();
                    window.location.href = AppConstants.ROUTES.LOGIN;
                    return;
                }
                throw new Error(`HTTP Error: ${response.status}`);
            }

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || '投稿の取得に失敗しました');
            }

            return data.posts || [];
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
        
        filterPosts: async function() {
            try {
                const status = this.statusFilter?.value || 'all';
                const dateRange = this.dateFilter?.value || 'all';
                const searchQuery = this.searchPosts?.value.toLowerCase() || '';
                
                let posts = await this.fetchPostsFromAPI();
                
                if (status !== 'all') {
                    posts = posts.filter(post => post.status === status);
                }
                
                if (searchQuery) {
                    posts = posts.filter(post => 
                        post.title.toLowerCase().includes(searchQuery) ||
                        post.content.toLowerCase().includes(searchQuery)
                    );
                }
                
                // 日付フィルタリング実装
                if (dateRange !== 'all') {
                    posts = this.filterByDateRange(posts, dateRange);
                }
                
                this.renderPosts(posts);
            } catch (error) {
                console.error('フィルタリングエラー:', error);
                CommonUtils.showNotification('フィルタリングに失敗しました', 'error');
            }
        },

        filterByDateRange: function(posts, range) {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            
            return posts.filter(post => {
                const postDate = new Date(post.createdAt);
                const postDateOnly = new Date(postDate.getFullYear(), postDate.getMonth(), postDate.getDate());
                
                switch(range) {
                    case 'today':
                        return postDateOnly.getTime() === today.getTime();
                    case 'week':
                        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                        return postDateOnly >= weekAgo;
                    case 'month':
                        const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
                        return postDateOnly >= monthAgo;
                    default:
                        return true;
                }
            });
        },
        
        openNewPostModal: function() {
            this.postForm?.reset();
            this.currentEditingPostId = null;
            document.getElementById('modalTitle').textContent = '新規投稿';
            document.getElementById('postSchedule').value = '';
            this.clearAllFormErrors();
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
        
        handlePostSubmit: function(e) {
            e.preventDefault();
            this.savePost();
        },
        
        savePost: async function() {
            try {
                const formData = new FormData(this.postForm);
                
                const postData = {
                    title: formData.get('postTitle') || '',
                    content: formData.get('postContent') || '',
                    hashtags: this.parseHashtags(formData.get('postHashtags') || ''),
                    status: formData.get('postStatus') || 'draft',
                    scheduledAt: formData.get('postSchedule') || null
                };

                // バリデーション
                this.clearAllFormErrors();
                let hasErrors = false;

                const validation = InputValidator.validatePostTitle(postData.title);
                if (!validation.isValid) {
                    this.showFieldError('postTitle', validation.errors[0]);
                    hasErrors = true;
                }

                const contentValidation = InputValidator.validatePostContent(postData.content);
                if (!contentValidation.isValid) {
                    this.showFieldError('postContent', contentValidation.errors[0]);
                    hasErrors = true;
                }

                if (hasErrors) {
                    this.showFormMessage('入力内容に誤りがあります', 'error');
                    return;
                }

                this.setButtonLoading('savePost', true);

                const token = localStorage.getItem('threads_system_session');
                const isEditing = this.currentEditingPostId;
                const url = isEditing 
                    ? `${AppConfig.api.baseUrl}/api/posts/${this.currentEditingPostId}`
                    : `${AppConfig.api.baseUrl}/api/posts`;
                const method = isEditing ? 'PUT' : 'POST';

                const response = await fetch(url, {
                    method: method,
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(postData)
                });

                const data = await response.json();

                if (!response.ok || !data.success) {
                    throw new Error(data.error || '投稿の保存に失敗しました');
                }

                CommonUtils.showNotification(isEditing ? '投稿を更新しました' : '投稿を作成しました', 'success');
                this.closePostModal();
                await this.loadPosts();

            } catch (error) {
                console.error('投稿保存エラー:', error);
                CommonUtils.showNotification(error.message || '投稿の保存に失敗しました', 'error');
            } finally {
                this.setButtonLoading('savePost', false);
            }
        },
        
        editPost: async function(postId) {
            try {
                const token = localStorage.getItem('threads_system_session');
                const response = await fetch(`${AppConfig.api.baseUrl}/api/posts/${postId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                const data = await response.json();
                if (!response.ok || !data.success) {
                    throw new Error(data.error || '投稿の取得に失敗しました');
                }

                const post = data.post;
                document.getElementById('postTitle').value = post.title;
                document.getElementById('postContent').value = post.content;
                document.getElementById('postHashtags').value = post.hashtags?.join(' ') || '';
                document.getElementById('postStatus').value = post.status;
                if (post.scheduledAt) {
                    const scheduleDate = new Date(post.scheduledAt);
                    const localDateTime = new Date(scheduleDate.getTime() - scheduleDate.getTimezoneOffset() * 60000)
                        .toISOString().slice(0, 16);
                    document.getElementById('postSchedule').value = localDateTime;
                } else {
                    document.getElementById('postSchedule').value = '';
                }
                this.currentEditingPostId = postId;
                document.getElementById('modalTitle').textContent = '投稿を編集';
                this.updateCharCount();
                ModalController.open('postModal');

            } catch (error) {
                console.error('投稿編集エラー:', error);
                CommonUtils.showNotification(error.message || '投稿の取得に失敗しました', 'error');
            }
        },
        
        deletePost: async function(postId) {
            if (!confirm('この投稿を削除しますか？')) {
                return;
            }

            try {
                const token = localStorage.getItem('threads_system_session');
                const response = await fetch(`${AppConfig.api.baseUrl}/api/posts/${postId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                const data = await response.json();
                if (!response.ok || !data.success) {
                    throw new Error(data.error || '投稿の削除に失敗しました');
                }

                CommonUtils.showNotification('投稿を削除しました', 'success');
                await this.loadPosts();

            } catch (error) {
                console.error('投稿削除エラー:', error);
                CommonUtils.showNotification(error.message || '投稿の削除に失敗しました', 'error');
            }
        },
        
        duplicatePost: async function(postId) {
            try {
                const token = localStorage.getItem('threads_system_session');
                const response = await fetch(`${AppConfig.api.baseUrl}/api/posts/${postId}/duplicate`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                const data = await response.json();
                if (!response.ok || !data.success) {
                    throw new Error(data.error || '投稿の複製に失敗しました');
                }

                CommonUtils.showNotification('投稿を複製しました', 'success');
                await this.loadPosts();

            } catch (error) {
                console.error('投稿複製エラー:', error);
                CommonUtils.showNotification(error.message || '投稿の複製に失敗しました', 'error');
            }
        },

        setLoadingState: function(isLoading) {
            if (this.postsGrid) {
                if (isLoading) {
                    this.postsGrid.innerHTML = '<div class="no-posts">読み込み中...</div>';
                }
            }
        },

        setButtonLoading: function(buttonId, isLoading) {
            const button = document.getElementById(buttonId);
            if (button) {
                if (isLoading) {
                    button.disabled = true;
                    button.classList.add('loading');
                } else {
                    button.disabled = false;
                    button.classList.remove('loading');
                }
            }
        },

        showFormMessage: function(message, type = 'error') {
            const formMessage = document.getElementById('formMessage');
            if (formMessage) {
                formMessage.textContent = message;
                formMessage.className = `form-message ${type}`;
            }
        },

        hideFormMessage: function() {
            const formMessage = document.getElementById('formMessage');
            if (formMessage) {
                formMessage.textContent = '';
                formMessage.className = 'form-message';
            }
        },

        showFieldError: function(fieldId, message) {
            const errorElement = document.getElementById(`${fieldId}-error`);
            const inputElement = document.getElementById(fieldId);
            
            if (errorElement) {
                errorElement.textContent = message;
            }
            
            if (inputElement) {
                inputElement.classList.add('error');
            }
        },

        clearFieldError: function(fieldId) {
            const errorElement = document.getElementById(`${fieldId}-error`);
            const inputElement = document.getElementById(fieldId);
            
            if (errorElement) {
                errorElement.textContent = '';
            }
            
            if (inputElement) {
                inputElement.classList.remove('error');
            }
        },

        clearAllFormErrors: function() {
            this.hideFormMessage();
            this.clearFieldError('postTitle');
            this.clearFieldError('postContent');
        },

        setupRealtimeValidation: function() {
            const titleInput = document.getElementById('postTitle');
            const contentInput = document.getElementById('postContent');

            if (titleInput) {
                titleInput.addEventListener('input', () => {
                    if (titleInput.classList.contains('error')) {
                        this.clearFieldError('postTitle');
                    }
                });
            }

            if (contentInput) {
                contentInput.addEventListener('input', () => {
                    if (contentInput.classList.contains('error')) {
                        this.clearFieldError('postContent');
                    }
                    this.updateCharCount();
                });
            }
        },
        
        parseHashtags: function(hashtagString) {
            if (!hashtagString) return [];
            
            // スペースまたはカンマで区切り、#で始まるもののみ抽出
            return hashtagString
                .split(/[\s,]+/)
                .map(tag => tag.trim())
                .filter(tag => tag.startsWith('#') && tag.length > 1)
                .map(tag => tag.substring(1)); // #を除去
        },
        
        setButtonLoading: function(buttonId, isLoading) {
            const button = document.getElementById(buttonId);
            if (!button) return;
            
            if (isLoading) {
                button.disabled = true;
                button.setAttribute('data-original-text', button.textContent);
                button.textContent = '保存中...';
            } else {
                button.disabled = false;
                const originalText = button.getAttribute('data-original-text');
                if (originalText) {
                    button.textContent = originalText;
                    button.removeAttribute('data-original-text');
                }
            }
        },
        
        showFormMessage: function(message, type = 'info') {
            const messageElement = document.getElementById('formMessage');
            if (!messageElement) return;
            
            messageElement.textContent = message;
            messageElement.className = `form-message ${type}`;
            messageElement.style.display = 'block';
        },
        
        hideFormMessage: function() {
            const messageElement = document.getElementById('formMessage');
            if (messageElement) {
                messageElement.style.display = 'none';
            }
        }
    };
    
    document.addEventListener('DOMContentLoaded', () => PostsPage.init());
})();