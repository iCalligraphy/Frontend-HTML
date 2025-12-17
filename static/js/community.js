// API 请求封装
async function apiRequest(endpoint, method = 'GET', data = null, token = null) {
    const url = `/api${endpoint}`;
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
    };

    // 添加认证令牌
    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    } else {
        // 尝试从 localStorage 获取令牌
        const storedToken = localStorage.getItem('access_token');
        if (storedToken) {
            options.headers['Authorization'] = `Bearer ${storedToken}`;
        }
    }

    if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(url, options);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'API 请求失败');
        }

        return result;
    } catch (error) {
        console.error('API 请求错误:', error);
        throw error;
    }
}

/**
 * 社区页面管理器
 */
class CommunityManager {
    constructor() {
        this.apiBase = '/api';
        this.currentUser = null;
        this.notifications = [];
        this.posts = [];
        this.currentPage = 1;
        this.hasMorePosts = true;
        this.init();
    }

    /**
     * 初始化方法
     */
    async init() {
        await this.loadUserData();
        this.initCheckin();
        this.initPostComposer();
        this.initPostFilters();
        this.initPostActions();
        this.initComments();
        this.initCategorySystem();
        this.initFollowSystem();
        this.initNotifications();
        this.initTopicSelector();
        this.initLoadMore();
        this.updateNavNotificationBadge();
        await this.loadPosts();  // 加载动态帖子
    }

    /**
     * 加载用户数据
     */
    loadUserData() {
        // 从本地存储或API加载用户数据
        console.log('开始加载用户数据...');
        const userData = localStorage.getItem('user');
        console.log('localStorage中的用户数据:', userData);
        
        if (userData) {
            try {
                this.currentUser = JSON.parse(userData);
                console.log('用户数据解析成功:', this.currentUser);
                console.log('用户名:', this.currentUser.username);
            } catch (error) {
                console.error('解析用户数据失败:', error);
                console.error('失败的数据:', userData);
                this.currentUser = null;
                localStorage.removeItem('user'); // 清除损坏的用户数据
                console.log('已清除损坏的用户数据');
            }
        } else {
            this.currentUser = null;
            console.log('未找到用户数据');
        }

        // 加载通知数据
        const notifications = localStorage.getItem('userNotifications');
        console.log('localStorage中的通知数据:', notifications);
        
        if (notifications) {
            try {
                this.notifications = JSON.parse(notifications);
            } catch (error) {
                console.error('解析通知数据失败:', error);
                this.notifications = [];
            }
        } else {
            this.notifications = [];
        }
    }

    /**
     * 发送API请求的方法
     */
    async apiRequest(url, options = {}) {
        const token = localStorage.getItem('access_token');
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        // 使用完整URL，将相对URL与API基础URL组合
        const fullUrl = url.startsWith('http') ? url : `${this.apiBase}${url}`;

        try {
            const response = await fetch(fullUrl, {
                ...options,
                headers
            });

            if (!response.ok) {
                // 对于404和405状态码，返回默认值而不是抛出错误
                if (response.status === 404 || response.status === 405) {
                    console.warn(`API请求失败 (${response.status}): ${fullUrl}`, response.statusText);
                    return { data: null };
                }
                // 其他状态码仍然抛出错误
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return response.json();
        } catch (error) {
            console.error(`API请求失败: ${fullUrl}`, error);
            throw error;
        }
    }

    /**
     * 加载帖子列表
     */
    async loadPosts(filter = 'all') {
        try {
            // 获取当前选中的话题
            const topicSelect = document.getElementById('topicSelect');
            const selectedTopic = topicSelect ? topicSelect.value : '';
            
            // 构建请求URL，将参数编码到URL中
            let url = '/posts?';
            const params = {
                page: this.currentPage || 1,
                filter: filter,
                topic_id: selectedTopic
            };
            
            // 将参数编码为查询字符串
            const queryParams = new URLSearchParams(params).toString();
            url += queryParams;
            
            // 调用API加载帖子
            const response = await this.apiRequest(url, {
                method: 'GET'
            });
            const posts = response.posts || [];
            const totalPages = response.total_pages || 1;
            
            // 更新是否还有更多帖子
            this.hasMorePosts = this.currentPage < totalPages;
            
            // 渲染帖子
            await this.renderPosts(posts, filter === 'all' && this.currentPage === 1);
        } catch (error) {
            console.error('加载帖子失败:', error);
            this.showToast('加载帖子失败，请稍后重试', 'error');
            
            // 恢复加载状态
            const postsList = document.getElementById('postsList');
            if (postsList) {
                postsList.innerHTML = '<div class="loading-error"><p>加载帖子失败，请稍后重试</p></div>';
            }
        }
    }

    /**
     * 渲染帖子列表
     */
    async renderPosts(posts, isInitialLoad = false) {
        const postsList = document.getElementById('postsList');
        if (!postsList) return;

        // 如果是初始加载，清空现有帖子；否则，保留现有帖子，添加新帖子
        if (isInitialLoad) {
            postsList.innerHTML = '';
        } else if (posts.length === 0) {
            // 没有更多帖子了
            return;
        }

        for (const post of posts) {
            // 获取关注状态
            const isFollowing = await this.isFollowing(post.author.id);
            
            const postCard = document.createElement('article');
            postCard.className = 'post-card';
            postCard.innerHTML = `
                <div class="post-header">
                    <div class="post-author">
                        <div class="author-avatar">${post.author.username.charAt(0)}</div>
                        <div class="author-info">
                            <h4 class="author-name">${post.author.username}</h4>
                            <p class="post-time">${this.formatTime(post.created_at)}</p>
                        </div>
                    </div>
                    <div class="post-actions-header">
                        <button class="btn-follow ${isFollowing ? 'btn-following' : ''}" 
                                data-user-id="${post.author.id}" 
                                data-author-name="${post.author.username}">
                            ${isFollowing ? '已关注' : '关注'}
                        </button>
                        <button class="post-menu-btn" aria-label="更多操作">⋯</button>
                    </div>
                </div>
                <div class="post-body">
                    ${post.title ? `<h3 class="post-title">${post.title}</h3>` : ''}
                    <p class="post-content">${post.content}</p>
                </div>
                <div class="post-footer">
                    <button class="post-action" data-action="like">
                        <span class="action-icon">👍</span>
                        <span class="action-count">${post.likes_count}</span>
                    </button>
                    <button class="post-action" data-action="comment">
                        <span class="action-icon">💬</span>
                        <span class="action-count">${post.comments_count}</span>
                    </button>
                    <button class="post-action" data-action="share">
                        <span class="action-icon">↗</span>
                        <span class="action-text">分享</span>
                    </button>
                </div>
                <div class="comments-section hidden">
                    <div class="comment-composer">
                        <input type="text" class="comment-input" placeholder="写下你的评论..." />
                        <button class="btn btn-small">发送</button>
                    </div>
                    <div class="comments-list"></div>
                </div>
            `;
            postsList.appendChild(postCard);
        }
        
        // 移除加载状态
        const loadingDiv = postsList.querySelector('.loading-posts');
        if (loadingDiv) {
            loadingDiv.remove();
        }
        
        // 更新加载更多按钮状态
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) {
            if (this.hasMorePosts) {
                loadMoreBtn.textContent = '加载更多';
                loadMoreBtn.disabled = false;
            } else {
                loadMoreBtn.textContent = '没有更多帖子了';
                loadMoreBtn.disabled = true;
            }
        }
        
        // 添加关注按钮事件监听
        document.querySelectorAll('.btn-follow').forEach(btn => {
            // 先移除可能存在的事件监听器，避免重复绑定
            btn.removeEventListener('click', this.togglePostFollow);
            // 绑定新的事件监听器
            btn.addEventListener('click', (e) => {
                this.togglePostFollow(e.target.closest('.btn-follow'));
            });
        });
    }

    /**
     * 时间格式化辅助函数
     */
    formatTime(timeString) {
        const now = new Date();
        const postTime = new Date(timeString);
        const diffMs = now - postTime;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return '刚刚';
        if (diffMins < 60) return `${diffMins}分钟前`;
        if (diffHours < 24) return `${diffHours}小时前`;
        if (diffDays < 30) return `${diffDays}天前`;
        return `${postTime.getMonth() + 1}月${postTime.getDate()}日`;
    }

    /**
     * 更新导航栏通知徽章
     */
    updateNavNotificationBadge() {
        const badge = document.getElementById('navNotificationBadge');
        if (!badge) return;

        const unreadCount = this.notifications.filter(n => !n.read).length;
        if (unreadCount > 0) {
            badge.textContent = unreadCount;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }

    /**
     * 初始化打卡功能
     */
    async initCheckin() {
        const checkinBtn = document.getElementById('checkinBtn');
        const streakDaysEl = document.getElementById('streakDays');
        const checkinStatusEl = document.getElementById('checkinStatus');
        const calendarDaysEl = document.getElementById('calendarDays');

        if (!checkinBtn || !streakDaysEl || !calendarDaysEl) return;

        // 初始化默认状态
        streakDaysEl.textContent = '0';
        checkinBtn.addEventListener('click', async () => {
            await this.handleCheckin(checkinBtn, checkinStatusEl, streakDaysEl);
        });
        
        // 渲染默认日历
        this.renderCalendar(calendarDaysEl, []);
        
        // 加载打卡数据 - 添加错误处理
        try {
            // 尝试使用GET方法获取打卡数据，如果失败则降级处理
            // 正确使用apiRequest函数，第二个参数是options对象，包含method属性
            const response = await this.apiRequest('/checkin/status', {
                method: 'GET'
            });
            const checkinData = response;
            
            // 检查checkinData是否存在，避免出现null或undefined错误
            if (checkinData) {
                streakDaysEl.textContent = checkinData.consecutive_days || '0';
                
                // 更新打卡按钮状态
                if (checkinData.checked_today) {
                    checkinBtn.disabled = true;
                    checkinBtn.innerHTML = '<span class="btn-icon">✓</span><span class="btn-text">今日已打卡</span>';
                    checkinStatusEl.textContent = '今日已打卡';
                }
                
                // 渲染日历
                this.renderCalendar(calendarDaysEl, checkinData.month_checkins || []);
            }
        } catch (error) {
            console.warn('加载打卡数据失败，使用默认状态:', error);
            // 不显示错误提示，避免影响用户体验
        }
    }

    /**
     * 处理打卡操作
     */
    async handleCheckin(checkinBtn, checkinStatusEl, streakDaysEl) {
        try {
            // 正确使用apiRequest函数，第二个参数是options对象，包含method属性
            const response = await this.apiRequest('/checkin', {
                method: 'POST'
            });
            
            // 更新按钮状态
            checkinBtn.disabled = true;
            checkinBtn.innerHTML = '<span class="btn-icon">✓</span><span class="btn-text">今日已打卡</span>';
            checkinStatusEl.textContent = '打卡成功！';
            
            // 更新连续天数
            streakDaysEl.textContent = response.consecutive_days;
            
            // 显示成功提示
            this.showToast('打卡成功！连续打卡 ' + response.consecutive_days + ' 天', 'success');
        } catch (error) {
            console.error('打卡失败:', error);
            checkinStatusEl.textContent = '打卡失败，请稍后重试';
            this.showToast('打卡失败，请稍后重试', 'error');
        }
    }

    /**
     * 渲染打卡日历
     */
    renderCalendar(calendarDaysEl, history) {
        const now = new Date();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        
        calendarDaysEl.innerHTML = '';
        
        for (let i = 1; i <= daysInMonth; i++) {
            // 检查是否已打卡 - 支持两种数据格式：
            // 1. 数字数组（后端返回的month_checkins）
            // 2. 日期字符串数组（旧格式，用于兼容）
            let isChecked = false;
            
            if (Array.isArray(history)) {
                // 检查是否为数字数组（例如 [15, 16]）
                if (history.length > 0 && typeof history[0] === 'number') {
                    isChecked = history.includes(i);
                } else {
                    // 否则作为日期字符串数组处理（例如 ['2025-12-15', '2025-12-16']）
                    const day = new Date(now.getFullYear(), now.getMonth(), i);
                    const dayStr = day.toISOString().split('T')[0];
                    isChecked = history.includes(dayStr);
                }
            }
            
            const isToday = i === now.getDate();
            
            const dayEl = document.createElement('div');
            dayEl.className = `calendar-day ${isChecked ? 'checked' : ''} ${isToday ? 'today' : ''}`;
            dayEl.textContent = i;
            calendarDaysEl.appendChild(dayEl);
        }
    }

    /**
     * 初始化发帖功能
     */
    initPostComposer() {
        console.log('开始初始化发帖功能...');
        console.log('当前用户数据:', this.currentUser);
        
        const postContent = document.getElementById('postContent');
        const charCount = document.getElementById('charCount');
        const publishBtn = document.getElementById('publishBtn');
        const postComposer = document.querySelector('.post-composer');

        console.log('发帖元素:', { postContent, publishBtn, postComposer });
        
        if (!postContent || !publishBtn) return;

        // 检查用户是否登录
        console.log('用户登录状态检查:', !!this.currentUser);
        
        if (!this.currentUser) {
            // 隐藏发帖功能或显示登录提示
            console.log('用户未登录，显示登录提示');
            
            if (postComposer) {
                postComposer.innerHTML = `
                    <div style="text-align: center; padding: 20px; background: #f5f5f5; border-radius: 8px;">
                        <h4>发帖功能</h4>
                        <p>请先登录后再发布帖子</p>
                        <a href="/auth" class="btn btn-primary">去登录</a>
                    </div>
                `;
            }
            return;
        }

        // 字数统计
        postContent.addEventListener('input', function() {
            const length = this.value.length;
            if (charCount) {
                charCount.textContent = length;
                if (length > 1900) {
                    charCount.style.color = '#d32f2f';
                } else {
                    charCount.style.color = 'inherit';
                }
            }
        });

        // 发布按钮
        publishBtn.addEventListener('click', async () => {
            console.log('发布按钮被点击...');
            console.log('当前用户数据:', this.currentUser);
            console.log('用户名:', this.currentUser?.username);
            console.log('头像:', this.currentUser?.avatar);
            
            const title = document.getElementById('postTitle')?.value.trim() || '';
            const content = postContent.value.trim();

            if (!content) {
                this.showToast('请输入帖子内容', 'error');
                return;
            }

            // 禁用发布按钮，防止重复提交
            publishBtn.disabled = true;
            publishBtn.innerHTML = '<span class="loading-spinner-small"></span> 发布中...';

            try {
                // 获取选中的话题
                const topicSelect = document.getElementById('composerTopicSelect');
                const topicId = topicSelect ? topicSelect.value : '';
                
                // 发送API请求保存帖子到服务器
                const newPostData = await this.apiRequest('/posts', {
                    method: 'POST',
                    body: JSON.stringify({
                        title: title,
                        content: content,
                        topic_id: topicId
                    })
                });

                // 创建新帖子
                console.log('创建新帖子，使用的作者名:', this.currentUser.username || '匿名用户');
                
                const newPost = this.createPostElement({
                    author: this.currentUser.username || '匿名用户',
                    avatar: this.currentUser.avatar || '👤',
                    time: '刚刚',
                    title: newPostData.post.title,
                    content: newPostData.post.content,
                    likes: 0,
                    comments: 0,
                    shares: 0,
                    authorId: newPostData.post.author_id,
                    isFollowing: false
                });

                // 插入到帖子列表顶部
                const postsList = document.getElementById('postsList');
                if (postsList) {
                    postsList.insertBefore(newPost, postsList.firstChild);
                }
                
                // 清空输入框
                const titleInput = document.getElementById('postTitle');
                if (titleInput) titleInput.value = '';
                postContent.value = '';
                if (charCount) charCount.textContent = '0';

                // 显示成功提示
                this.showToast('发布成功！', 'success');

                // 记录活动
                this.recordUserActivity('post_created');
            } catch (error) {
                console.error('发布帖子失败:', error);
                this.showToast('发布失败，请稍后重试', 'error');
            } finally {
                // 恢复发布按钮状态
                publishBtn.disabled = false;
                publishBtn.innerHTML = '<span class="btn-text">发布</span>';
            }
        });
    }

    /**
     * 创建帖子元素
     */
    createPostElement(data) {
        const article = document.createElement('article');
        article.className = 'post-card';
        
        // 检查是否已关注作者（默认false，实际会通过API获取）
        const isFollowing = data.isFollowing || false;
        
        // 作者ID，用于关注功能
        const authorId = data.authorId || 0;

        article.innerHTML = `
            <div class="post-header">
                <div class="post-author">
                    <div class="author-avatar">${data.avatar}</div>
                    <div class="author-info">
                        <h4 class="author-name">${data.author}</h4>
                        <p class="post-time">${data.time}</p>
                    </div>
                    ${authorId > 0 ? `
                        <div class="author-actions">
                            <button class="btn-follow ${isFollowing ? 'btn-following' : ''}" 
                                    data-user-id="${authorId}" 
                                    data-author-name="${data.author}">
                                ${isFollowing ? '已关注' : '关注'}
                            </button>
                        </div>
                    ` : ''}
                </div>
                <button class="post-menu-btn" aria-label="更多操作">⋯</button>
            </div>
            <div class="post-body">
                ${data.title ? `<h3 class="post-title">${data.title}</h3>` : ''}
                <p class="post-content">${data.content}</p>
            </div>
            <div class="post-footer">
                <button class="post-action" data-action="like">
                    <span class="action-icon">👍</span>
                    <span class="action-count">${data.likes}</span>
                </button>
                <button class="post-action" data-action="comment">
                    <span class="action-icon">💬</span>
                    <span class="action-count">${data.comments}</span>
                </button>
                <button class="post-action" data-action="share">
                    <span class="action-icon">↗</span>
                    <span class="action-text">分享</span>
                </button>
            </div>
            <div class="comments-section hidden">
                <div class="comment-composer">
                    <input type="text" class="comment-input" placeholder="写下你的评论..." />
                    <button class="btn btn-small">发送</button>
                </div>
                <div class="comments-list"></div>
            </div>
        `;
        return article;
    }

    /**
     * 初始化帖子筛选
     */
    initPostFilters() {
        const filterTabs = document.querySelectorAll('.filter-tab');
        const searchInput = document.getElementById('postSearch');
        
        // 添加更多筛选选项到DOM
        const filterTabsContainer = document.querySelector('.filter-tabs');
        if (filterTabsContainer) {
            // 检查是否已经添加了扩展筛选选项
            if (!document.querySelector('.filter-tab[data-filter="followed-topics"]')) {
                // 添加关注话题筛选
                const followedTopicsTab = document.createElement('button');
                followedTopicsTab.className = 'filter-tab';
                followedTopicsTab.dataset.filter = 'followed-topics';
                followedTopicsTab.textContent = '关注话题';
                filterTabsContainer.appendChild(followedTopicsTab);
            }
        }

        // 筛选标签切换
        const allFilterTabs = document.querySelectorAll('.filter-tab');
        allFilterTabs.forEach(tab => {
            tab.addEventListener('click', async () => {
                allFilterTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const filter = tab.dataset.filter;
                
                // 重置分页
                this.resetPagination();
                
                // 清空现有帖子并重新加载
                const postsList = document.getElementById('postsList');
                if (postsList) {
                    postsList.innerHTML = '<div class="loading-posts"><div class="loading-spinner"></div><p>正在加载帖子...</p></div>';
                }
                
                // 重新加载帖子
                await this.loadPosts(filter);
            });
        });

        // 搜索功能
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                const keyword = searchInput.value.toLowerCase().trim();
                this.searchPosts(keyword);
            });
        }

        // 话题选择框筛选
        this.bindTopicSelectionFilter();
    }

    /**
     * 初始化加载更多功能
     */
    initLoadMore() {
        this.currentPage = 1;
        this.hasMorePosts = true;
        
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', async () => {
                await this.loadMorePosts();
            });
        }
    }

    /**
     * 加载更多帖子
     */
    async loadMorePosts() {
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (!loadMoreBtn || !this.hasMorePosts) return;

        // 显示加载状态
        loadMoreBtn.textContent = '加载中...';
        loadMoreBtn.disabled = true;

        try {
            this.currentPage++;
            
            // 获取当前活动的筛选条件
            const activeFilter = document.querySelector('.filter-tab.active')?.dataset.filter || 'all';
            
            // 获取当前选中的话题
            const topicSelect = document.getElementById('topicSelect');
            const selectedTopic = topicSelect ? topicSelect.value : '';
            
            // 构建请求URL，将参数编码到URL中
            let url = '/posts?';
            const params = {
                page: this.currentPage,
                filter: activeFilter,
                topic_id: selectedTopic
            };
            
            // 将参数编码为查询字符串
            const queryParams = new URLSearchParams(params).toString();
            url += queryParams;
            
            // 调用API加载更多帖子
            const response = await this.apiRequest(url, {
                method: 'GET'
            });

            const newPosts = response.posts || [];
            
            if (newPosts.length > 0) {
                // 添加新帖子到DOM
                const postsList = document.getElementById('postsList');
                if (postsList) {
                    newPosts.forEach(postData => {
                        const postElement = this.createPostElement(postData);
                        postsList.appendChild(postElement);
                    });
                }
                
                // 检查是否还有更多帖子
                this.hasMorePosts = this.currentPage < response.total_pages;
            } else {
                // 没有更多帖子了
                this.hasMorePosts = false;
                loadMoreBtn.textContent = '没有更多帖子了';
                loadMoreBtn.disabled = true;
            }
        } catch (error) {
            console.error('加载更多帖子失败:', error);
            this.showToast('加载更多帖子失败，请稍后重试', 'error');
            this.currentPage--;
        } finally {
            // 恢复按钮状态
            if (this.hasMorePosts) {
                loadMoreBtn.textContent = '加载更多';
                loadMoreBtn.disabled = false;
            }
        }
    }

    /**
     * 重置分页状态
     */
    resetPagination() {
        this.currentPage = 1;
        this.hasMorePosts = true;
        
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) {
            loadMoreBtn.textContent = '加载更多';
            loadMoreBtn.disabled = false;
        }
    }

    /**
     * 绑定话题选择筛选事件 - 已迁移到下拉框change事件
     */
    bindTopicSelectionFilter() {
        // 已不再需要，因为话题选择事件现在通过下拉框的change事件直接处理
    }

    /**
     * 按话题筛选帖子
     */
    filterPostsByTopic(topicId) {
        const posts = document.querySelectorAll('.post-card');
        
        // 这里应该根据帖子的话题标签或分类进行筛选
        // 由于当前帖子结构中可能没有话题信息，我们先模拟实现
        posts.forEach(post => {
            // 实际应用中，应该根据帖子的话题ID进行筛选
            const shouldShow = Math.random() > 0.3; // 模拟70%的帖子匹配该话题
            post.style.display = shouldShow ? '' : 'none';
        });
    }

    /**
     * 搜索帖子
     */
    searchPosts(keyword) {
        if (!keyword) {
            document.querySelectorAll('.post-card').forEach(post => {
                post.style.display = '';
            });
            return;
        }

        document.querySelectorAll('.post-card').forEach(post => {
            const title = post.querySelector('.post-title')?.textContent.toLowerCase() || '';
            const content = post.querySelector('.post-content').textContent.toLowerCase();
            const author = post.querySelector('.author-name').textContent.toLowerCase();

            if (title.includes(keyword) || content.includes(keyword) || author.includes(keyword)) {
                post.style.display = '';
            } else {
                post.style.display = 'none';
            }
        });
    }

    /**
     * 初始化帖子操作
     */
    initPostActions() {
        // 监听帖子操作按钮点击事件
        document.addEventListener('click', (e) => {
            const actionBtn = e.target.closest('.post-action');
            if (!actionBtn) return;

            const action = actionBtn.dataset.action;
            const post = actionBtn.closest('.post-card');
            
            if (action === 'like') {
                this.handleLike(actionBtn, post);
            } else if (action === 'comment') {
                this.toggleComments(post);
            } else if (action === 'share') {
                this.handleShare(post);
            }
        });
    }

    /**
     * 处理点赞操作
     */
    async handleLike(likeBtn, post) {
        const countEl = likeBtn.querySelector('.action-count');
        let count = parseInt(countEl.textContent);
        
        // 切换点赞状态
        likeBtn.classList.toggle('liked');
        count = likeBtn.classList.contains('liked') ? count + 1 : count - 1;
        countEl.textContent = count;
        
        // 调用API处理点赞
        const postId = post.dataset.postId;
        if (postId) {
            try {
                await this.apiRequest(`/posts/${postId}/like`, 'POST');
            } catch (error) {
                console.error('点赞失败:', error);
                // 恢复点赞状态
                likeBtn.classList.toggle('liked');
                count = likeBtn.classList.contains('liked') ? count + 1 : count - 1;
                countEl.textContent = count;
                this.showToast('点赞失败，请稍后重试', 'error');
            }
        }
    }

    /**
     * 切换评论显示
     */
    toggleComments(post) {
        const commentsSection = post.querySelector('.comments-section');
        if (commentsSection) {
            commentsSection.classList.toggle('hidden');
        }
    }

    /**
     * 处理分享操作
     */
    handleShare(post) {
        const title = post.querySelector('.post-title')?.textContent || '分享帖子';
        const content = post.querySelector('.post-content').textContent;
        
        // 复制分享链接到剪贴板
        navigator.clipboard.writeText(window.location.href)
            .then(() => {
                this.showToast('分享链接已复制到剪贴板', 'success');
            })
            .catch(err => {
                console.error('复制失败:', err);
                this.showToast('分享失败，请稍后重试', 'error');
            });
    }

    /**
     * 初始化评论功能
     */
    initComments() {
        // 监听评论提交
        document.addEventListener('click', (e) => {
            const submitBtn = e.target.closest('.comment-composer button');
            if (!submitBtn) return;
            
            const commentInput = submitBtn.parentElement.querySelector('.comment-input');
            const commentText = commentInput.value.trim();
            
            if (commentText) {
                this.handleCommentSubmit(submitBtn, commentInput, commentText);
            }
        });
        
        // 监听评论输入框回车提交
        document.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && e.target.classList.contains('comment-input')) {
                const commentText = e.target.value.trim();
                if (commentText) {
                    const submitBtn = e.target.parentElement.querySelector('button');
                    this.handleCommentSubmit(submitBtn, e.target, commentText);
                }
            }
        });
    }

    /**
     * 处理评论提交
     */
    async handleCommentSubmit(submitBtn, commentInput, commentText) {
        const post = submitBtn.closest('.post-card');
        if (!post) return;
        
        // 禁用提交按钮
        submitBtn.disabled = true;
        submitBtn.textContent = '发送中...';
        
        try {
            const postId = post.dataset.postId;
            if (postId) {
                // 调用API提交评论
                await this.apiRequest(`/posts/${postId}/comments`, {
                    method: 'POST',
                    body: JSON.stringify({ content: commentText })
                });
            }
            
            // 添加评论到DOM
            this.addCommentToDOM(post, commentText);
            
            // 清空输入框
            commentInput.value = '';
            
            // 更新评论数
            const commentBtn = post.querySelector('.post-action[data-action="comment"] .action-count');
            if (commentBtn) {
                const count = parseInt(commentBtn.textContent);
                commentBtn.textContent = count + 1;
            }
        } catch (error) {
            console.error('提交评论失败:', error);
            this.showToast('提交评论失败，请稍后重试', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = '发送';
        }
    }

    /**
     * 添加评论到DOM
     */
    addCommentToDOM(post, commentText) {
        const commentsList = post.querySelector('.comments-list');
        if (!commentsList) return;
        
        const commentEl = document.createElement('div');
        commentEl.className = 'comment-item';
        commentEl.innerHTML = `
            <div class="comment-avatar">${this.currentUser?.username.charAt(0) || '匿'}</div>
            <div class="comment-body">
                <div class="comment-header">
                    <span class="comment-author">${this.currentUser?.username || '匿名用户'}</span>
                    <span class="comment-time">刚刚</span>
                </div>
                <p class="comment-text">${commentText}</p>
                <button class="comment-like">
                    <span class="action-icon">👍</span>
                    <span class="action-count">0</span>
                </button>
            </div>
        `;
        commentsList.appendChild(commentEl);
    }

    /**
     * 初始化分类系统
     */
    initCategorySystem() {
        // 统一的话题数据结构
        this.topics = [
            {
                id: '1',
                name: '楷书入门',
                category: '技法交流',
                icon: '🖌️'
            },
            {
                id: '2',
                name: '行书技巧',
                category: '技法交流',
                icon: '🖌️'
            },
            {
                id: '3',
                name: '草书练习',
                category: '技法交流',
                icon: '🖌️'
            },
            {
                id: '4',
                name: '隶书赏析',
                category: '作品欣赏',
                icon: '👁️'
            },
            {
                id: '5',
                name: '篆书研究',
                category: '作品欣赏',
                icon: '👁️'
            },
            {
                id: '6',
                name: '王羲之作品',
                category: '作品欣赏',
                icon: '👁️'
            },
            {
                id: '7',
                name: '颜真卿书法',
                category: '作品欣赏',
                icon: '👁️'
            },
            {
                id: '8',
                name: '毛笔选择',
                category: '文房四宝',
                icon: '📦'
            },
            {
                id: '9',
                name: '宣纸推荐',
                category: '文房四宝',
                icon: '📦'
            },
            {
                id: '10',
                name: '墨汁对比',
                category: '文房四宝',
                icon: '📦'
            },
            {
                id: '11',
                name: '书法比赛',
                category: '活动赛事',
                icon: '🎯'
            },
            {
                id: '12',
                name: '线上课程',
                category: '活动赛事',
                icon: '🎯'
            },
            {
                id: '13',
                name: '如何临帖',
                category: '技法交流',
                icon: '🖌️'
            },
            {
                id: '14',
                name: '笔法请教',
                category: '技法交流',
                icon: '🖌️'
            }
        ];
        
        // 按分类分组的话题数据
        this.topicsByCategory = {
            '技法交流': this.topics.filter(topic => topic.category === '技法交流'),
            '作品欣赏': this.topics.filter(topic => topic.category === '作品欣赏'),
            '文房四宝': this.topics.filter(topic => topic.category === '文房四宝'),
            '活动赛事': this.topics.filter(topic => topic.category === '活动赛事')
        };
    }

    /**
     * 初始化关注系统
     */
    initFollowSystem() {
        // 关注功能已经在initPostActions中处理
    }

    /**
     * 初始化通知系统
     */
    initNotifications() {
        // 通知功能可以根据需要扩展
    }

    /**
     * 初始化话题选择功能
     */
    initTopicSelector() {
        // 获取话题选择下拉框
        const topicSelect = document.getElementById('topicSelect');
        
        if (topicSelect) {
            // 添加话题选择事件监听器
            topicSelect.addEventListener('change', (e) => {
                const topicId = e.target.value;
                console.log(`选择了话题 ID: ${topicId}`);
                
                // 重置分页
                this.resetPagination();
                
                // 清空现有帖子并重新加载
                const postsList = document.getElementById('postsList');
                if (postsList) {
                    postsList.innerHTML = '<div class="loading-posts"><div class="loading-spinner"></div><p>正在加载帖子...</p></div>';
                }
                
                // 重新加载帖子，传递选中的话题ID
                this.loadPosts(document.querySelector('.filter-tab.active')?.dataset.filter || 'all');
            });
        }
        
        // 绑定侧边栏话题关注按钮事件
        this.bindTopicFollowEvents();
    }

    /**
     * 绑定话题关注按钮事件
     */
    bindTopicFollowEvents() {
        const topicFollowBtns = document.querySelectorAll('.btn-follow.topic-follow-btn');
        
        topicFollowBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const topicId = btn.dataset.topicId;
                const isFollowing = btn.classList.contains('btn-following');
                
                if (isFollowing) {
                    // 取消关注
                    this.unfollowTopic(topicId);
                    btn.textContent = '关注';
                    btn.classList.remove('btn-following');
                    btn.classList.add('btn-follow');
                } else {
                    // 关注话题
                    this.followTopic(topicId);
                    btn.textContent = '已关注';
                    btn.classList.remove('btn-follow');
                    btn.classList.add('btn-following');
                }
            });
        });
    }

    /**
     * 关注话题
     */
    async followTopic(topicId) {
        const btn = document.querySelector(`.btn-follow.topic-follow-btn[data-topic-id="${topicId}"]`);
        if (!btn) return;

        // 显示加载状态
        const originalText = btn.textContent;
        btn.textContent = '关注中...';
        btn.disabled = true;

        try {
            // 调用API关注话题
            await this.apiRequest('/topics/follow', 'POST', { topic_id: topicId });
            console.log(`成功关注话题 ${topicId}`);
            // 更新关注数
            this.updateTopicFollowers(topicId, 1);
        } catch (error) {
            console.error(`关注话题 ${topicId} 失败:`, error);
            this.showToast('关注话题失败，请稍后重试', 'error');
            // 恢复按钮状态
            btn.textContent = originalText;
            btn.disabled = false;
            btn.classList.remove('btn-following');
            btn.classList.add('btn-follow');
        }
    }

    /**
     * 取消关注话题
     */
    async unfollowTopic(topicId) {
        const btn = document.querySelector(`.btn-follow.topic-follow-btn[data-topic-id="${topicId}"]`);
        if (!btn) return;

        // 显示加载状态
        const originalText = btn.textContent;
        btn.textContent = '取消中...';
        btn.disabled = true;

        try {
            // 调用API取消关注话题
            await this.apiRequest('/topics/unfollow', 'POST', { topic_id: topicId });
            console.log(`成功取消关注话题 ${topicId}`);
            // 更新关注数
            this.updateTopicFollowers(topicId, -1);
        } catch (error) {
            console.error(`取消关注话题 ${topicId} 失败:`, error);
            this.showToast('取消关注话题失败，请稍后重试', 'error');
            // 恢复按钮状态
            btn.textContent = originalText;
            btn.disabled = false;
            btn.classList.remove('btn-follow');
            btn.classList.add('btn-following');
        }
    }

    /**
     * 更新话题关注数
     */
    updateTopicFollowers(topicId, change) {
        const topicItem = document.querySelector(`.topic-item[data-topic-id="${topicId}"]`);
        if (topicItem) {
            const followersElement = topicItem.querySelector('.topic-followers');
            if (followersElement) {
                const currentFollowers = parseInt(followersElement.textContent);
                followersElement.textContent = `${currentFollowers + change} 关注`;
            }
        }
    }

    /**
     * 切换关注状态（帖子卡片上的关注按钮）
     */
    async togglePostFollow(button) {
        const userId = button.dataset.userId;
        const authorName = button.dataset.authorName;
        const isFollowing = button.textContent.trim() === '已关注';

        // 禁用按钮，防止重复点击
        button.disabled = true;
        button.innerHTML = '<span class="loading-spinner-small"></span>';

        try {
            if (isFollowing) {
                // 取消关注
                await this.apiRequest(`/users/${userId}/follow`, {
                    method: 'DELETE'
                });
                
                button.textContent = '关注';
                button.classList.remove('btn-following');
                button.classList.add('btn-follow');
                this.showToast(`已取消关注 ${authorName}`, 'info');
            } else {
                // 关注
                await this.apiRequest(`/users/${userId}/follow`, {
                    method: 'POST'
                });
                
                button.textContent = '已关注';
                button.classList.remove('btn-follow');
                button.classList.add('btn-following');
                this.showToast(`已成功关注 ${authorName}`, 'success');
            }
        } catch (error) {
            // 处理409 CONFLICT响应（重复关注）- 这是正常情况，不是错误
            if (error.message.includes('409 CONFLICT')) {
                console.info('用户已关注该作者，无需重复关注');
                this.showToast('已关注该用户', 'info');
                button.textContent = '已关注';
                button.classList.remove('btn-follow');
                button.classList.add('btn-following');
            } else {
                // 其他错误才需要显示错误信息
                console.error('切换关注状态失败:', error);
                this.showToast(`操作失败: ${error.message}`, 'error');
                button.textContent = isFollowing ? '已关注' : '关注';
                button.classList.remove('btn-follow', 'btn-following');
                button.classList.add(isFollowing ? 'btn-following' : 'btn-follow');
            }
        } finally {
            button.disabled = false;
        }
    }

    /**
     * 检查是否关注了某个用户
     */
    async isFollowing(userId) {
        try {
            // 尝试调用API检查关注状态，如果失败则返回默认值
            // 使用正确的API端点和参数格式
            const response = await this.apiRequest(`/users/${userId}/follow/status`, {
                method: 'GET'
            });
            return response.is_following;
        } catch (error) {
            console.warn('检查关注状态失败，返回默认值false:', error);
            // 返回false作为默认值，避免影响用户体验
            return false;
        }
    }

    /**
     * 获取当前用户关注的所有用户
     */
    async getFollowedUsers() {
        try {
            const currentUserId = this.getCurrentUserId();
            if (!currentUserId) {
                return [];
            }
            const response = await this.apiRequest(`/users/${currentUserId}/following`);
            return response.following || [];
        } catch (error) {
            console.error('获取关注用户列表失败:', error);
            return [];
        }
    }

    /**
     * 获取当前用户ID
     */
    getCurrentUserId() {
        // 优先使用已加载的用户数据
        if (this.currentUser) {
            return this.currentUser.id;
        }
        // 从localStorage获取用户信息作为后备
        const userData = localStorage.getItem('user');
        if (userData) {
            try {
                const user = JSON.parse(userData);
                return user.id;
            } catch (error) {
                console.error('解析用户数据失败:', error);
                return null;
            }
        }
        return null;
    }

    /**
     * 筛选帖子
     */
    async filterPosts(filter) {
        const posts = document.querySelectorAll('.post-card');
        
        // 重置所有帖子显示
        posts.forEach(post => {
            post.style.display = '';
        });

        // 处理关注筛选
        if (filter === 'following') {
            try {
                // 获取关注的用户列表
                console.log('开始处理关注筛选');
                const followedUsers = await this.getFollowedUsers();
                console.log('关注的用户列表:', followedUsers);
                const followedUserIds = new Set(followedUsers.map(user => user.id.toString()));
                console.log('关注的用户ID集合:', followedUserIds);
                
                // 统计显示的帖子数量
                let visiblePosts = 0;
                
                posts.forEach(post => {
                    // 获取帖子作者ID
                    let authorId = null;
                    
                    // 尝试从关注按钮获取作者ID - 同时查找大按钮和小按钮
                    let followBtn = post.querySelector('.btn-follow');
                    if (!followBtn) {
                        followBtn = post.querySelector('.btn-follow-small');
                    }
                    if (followBtn) {
                        authorId = followBtn.dataset.userId;
                        console.log('从关注按钮获取到作者ID:', authorId, '按钮类名:', followBtn.className);
                    } 
                    
                    // 如果没有找到，尝试从作者信息中提取（作为备选方案）
                    if (!authorId) {
                        const authorName = post.querySelector('.author-name');
                        if (authorName) {
                            console.log('未找到关注按钮，作者名:', authorName.textContent);
                            // 尝试从关注列表中根据用户名查找ID
                            const matchedUser = followedUsers.find(user => user.username === authorName.textContent);
                            if (matchedUser) {
                                authorId = matchedUser.id.toString();
                                console.log('通过用户名匹配到作者ID:', authorId);
                            }
                        }
                    }
                    
                    if (authorId) {
                        const isFollowed = followedUserIds.has(authorId);
                        post.style.display = isFollowed ? '' : 'none';
                        if (isFollowed) {
                            visiblePosts++;
                        }
                        console.log('帖子作者ID:', authorId, '是否在关注列表中:', isFollowed);
                    } else {
                        console.log('未找到作者ID，隐藏帖子');
                        post.style.display = 'none';
                    }
                });
                
                console.log('关注筛选完成，显示', visiblePosts, '个帖子');
            } catch (error) {
                console.error('关注筛选失败:', error);
                this.showToast('获取关注用户列表失败: ' + error.message, 'error');
            }
        } 
        // 处理关注话题筛选
        else if (filter === 'followed-topics') {
            try {
                // 获取关注的话题列表
                console.log('开始处理关注话题筛选');
                const followedTopics = await this.getFollowedTopics();
                console.log('关注的话题列表:', followedTopics);
                const followedTopicIds = new Set(followedTopics.map(topic => topic.id.toString()));
                console.log('关注的话题ID集合:', followedTopicIds);
                
                // 统计显示的帖子数量
                let visiblePosts = 0;
                
                posts.forEach(post => {
                    // 获取帖子关联的话题
                    // 注意：这里需要根据实际帖子结构调整，当前是模拟实现
                    const postTopicIds = this.getPostTopicIds(post);
                    console.log('帖子关联的话题ID:', postTopicIds);
                    
                    // 检查帖子是否关联了任何关注的话题
                    const hasFollowedTopic = [...postTopicIds].some(topicId => followedTopicIds.has(topicId));
                    post.style.display = hasFollowedTopic ? '' : 'none';
                    
                    if (hasFollowedTopic) {
                        visiblePosts++;
                    }
                });
                
                console.log('关注话题筛选完成，显示', visiblePosts, '个帖子');
            } catch (error) {
                console.error('关注话题筛选失败:', error);
                this.showToast('获取关注话题列表失败: ' + error.message, 'error');
            }
        } 
        // 处理热门筛选
        else if (filter === 'hot') {
            // 热门筛选已在sortPosts方法中处理
            this.sortPosts(filter);
        }
        // 处理最新筛选
        else if (filter === 'latest') {
            // 最新筛选已在sortPosts方法中处理
            this.sortPosts(filter);
        }

        // 显示筛选状态
        this.showFilterStatus(filter);
    }

    /**
     * 获取当前用户关注的所有话题
     */
    async getFollowedTopics() {
        try {
            const currentUserId = this.getCurrentUserId();
            if (!currentUserId) {
                return [];
            }
            const response = await this.apiRequest('/topics/followed');
            return response.followed_topics || [];
        } catch (error) {
            console.error('获取关注话题列表失败:', error);
            return [];
        }
    }

    /**
     * 获取帖子关联的话题ID
     * 注意：这是模拟实现，实际应根据帖子结构调整
     */
    getPostTopicIds(post) {
        // 模拟帖子关联的话题ID
        // 实际应用中，帖子应该有标签或数据属性来存储关联的话题ID
        const topicIds = [
            ['1', '2', '3'],
            ['4', '5', '6'],
            ['7', '8', '9'],
            ['10', '11', '12'],
            ['13', '14']
        ];
        
        // 随机返回一些话题ID作为模拟
        return new Set(topicIds[Math.floor(Math.random() * topicIds.length)]);
    }

    /**
     * 显示筛选状态
     */
    showFilterStatus(filter) {
        let statusText = '';
        switch (filter) {
            case 'following':
                statusText = '正在查看关注用户的帖子';
                break;
            case 'followed-topics':
                statusText = '正在查看关注话题的帖子';
                break;
            case 'hot':
                statusText = '正在查看热门帖子';
                break;
            case 'latest':
                statusText = '正在查看最新帖子';
                break;
            case 'all':
                statusText = '正在查看全部帖子';
                break;
        }
        
        // 显示筛选状态提示
        this.showToast(statusText, 'info', 2000);
    }

    /**
     * 排序帖子
     */
    sortPosts(sortType) {
        const container = document.getElementById('postsList');
        if (!container) return;

        const posts = Array.from(container.querySelectorAll('.post-card'));

        posts.sort((a, b) => {
            switch (sortType) {
                case 'hot':
                    const likesA = parseInt(a.querySelector('[data-action="like"] .action-count').textContent);
                    const commentsA = parseInt(a.querySelector('[data-action="comment"] .action-count').textContent);
                    const likesB = parseInt(b.querySelector('[data-action="like"] .action-count').textContent);
                    const commentsB = parseInt(b.querySelector('[data-action="comment"] .action-count').textContent);
                    return (likesB + commentsB) - (likesA + commentsA);
                case 'latest':
                default:
                    return 0; // 保持原顺序
            }
        });

        // 重新排列DOM
        posts.forEach(post => container.appendChild(post));
    }

    /**
     * 高亮当前导航标签
     */
    highlightCurrentNavTab() {
        const currentPath = window.location.pathname;
        const navTabs = document.querySelectorAll('.nav-tab');
        
        navTabs.forEach(tab => {
            const tabPath = tab.getAttribute('href');
            if (currentPath === tabPath) {
                tab.classList.add('active');
            }
        });
    }

    /**
     * 记录用户活动
     */
    recordUserActivity(activityType, metadata = {}) {
        const activity = {
            type: activityType,
            timestamp: new Date().toISOString(),
            metadata: metadata
        };
        
        // 发送到服务器
        this.apiRequest('/user-activity', {
            method: 'POST',
            body: JSON.stringify(activity)
        }).catch(err => {
            console.error('记录用户活动失败:', err);
        });
    }

    /**
     * 显示提示消息
     */
    showToast(message, type = 'info', duration = 3000) {
        // 创建toast元素
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        // 添加到页面
        document.body.appendChild(toast);
        
        // 显示toast
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        // 自动隐藏
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, duration);
    }
}

// 初始化社区管理器
document.addEventListener('DOMContentLoaded', () => {
    window.communityManager = new CommunityManager();
});

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
    }

    .toast {
        position: fixed;
        top: 100px;
        right: 20px;
        background: var(--ink-black);
        color: #fff;
        padding: 12px 20px;
        border-radius: 8px;
        font-size: 14px;
        z-index: 10000;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
    }

    .toast.show {
        opacity: 1;
        transform: translateX(0);
    }

    .toast.success {
        background: #4a7c59;
    }

    .toast.error {
        background: #d32f2f;
    }

    .toast.info {
        background: #1976d2;
    }

    .loading-spinner {
        border: 3px solid rgba(0, 0, 0, 0.1);
        border-radius: 50%;
        border-top: 3px solid var(--theme-brown);
        width: 24px;
        height: 24px;
        animation: spin 1s linear infinite;
    }

    .loading-spinner-small {
        border: 2px solid rgba(0, 0, 0, 0.1);
        border-radius: 50%;
        border-top: 2px solid var(--theme-brown);
        width: 16px;
        height: 16px;
        animation: spin 1s linear infinite;
        display: inline-block;
        vertical-align: middle;
        margin-right: 8px;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    .loading-posts {
        text-align: center;
        padding: 20px;
        color: var(--gray);
    }

    .loading-posts .loading-spinner {
        margin: 0 auto 10px;
    }

    .loading-error {
        text-align: center;
        padding: 20px;
        color: var(--gray);
    }
`;
document.head.appendChild(style);