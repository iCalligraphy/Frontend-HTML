/**
 * 社区页面交互脚本 - 增强版
 * 包含每日打卡、发帖、评论点赞、分类筛选、关注系统、消息通知等功能
 */

// 社区管理器类
class CommunityManager {
    constructor() {
        this.currentUser = null;
        this.notifications = [];
        this.apiBase = 'http://localhost:5000'; // 后端API基础URL
        this.init();
    }

    /**
     * 初始化社区导航
     */
    initCommunityNav() {
        // 更新通知徽章
        this.updateNavNotificationBadge();

        // 为当前页面高亮对应的导航标签
        this.highlightCurrentNavTab();
    }

    /**
     * 加载帖子列表
     */
    async loadPosts() {
        try {
            const response = await this.apiRequest('/api/posts');
            const posts = response.posts;
            
            // 渲染帖子
            await this.renderPosts(posts);
        } catch (error) {
            console.error('加载帖子失败:', error);
            this.showToast('加载帖子失败，请稍后重试', 'error');
        }
    }

    /**
     * 渲染帖子列表
     */
    async renderPosts(posts) {
        const postsList = document.getElementById('postsList');
        if (!postsList) return;

        // 清空现有帖子
        postsList.innerHTML = '';

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
        
        // 添加关注按钮事件监听
        document.querySelectorAll('.btn-follow').forEach(btn => {
            btn.addEventListener('click', function() {
                this.togglePostFollow(btn);
            }.bind(this));
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
     * 高亮当前导航标签
     */
    highlightCurrentNavTab() {
    const currentPath = window.location.pathname;
    const navTabs = document.querySelectorAll('.nav-tab');

    navTabs.forEach(tab => {
        const href = tab.getAttribute('href');

        // 精确匹配路径
        if (currentPath === href) {
            tab.classList.add('active');
        }
        // 首页特殊处理：当在社区主页面时，只高亮首页
        else if (currentPath === '/community' && href === '/community') {
            tab.classList.add('active');
        }
        // 其他页面：只有当路径完全匹配时才高亮
        else {
            tab.classList.remove('active');
        }
    });
}

    async init() {
        this.loadUserData();  // 先加载用户数据
        this.initCommunityNav();
        await this.initCheckin();
        this.initPostComposer();
        this.initPostFilters();
        this.initPostActions();
        this.initComments();
        this.initCategorySystem();
        this.initFollowSystem();
        this.initNotifications();
        this.initFeedback();
        this.initShareFeatures();
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

        const response = await fetch(fullUrl, {
            ...options,
            headers
        });

        if (!response.ok) {
            throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * 初始化每日打卡功能
     */
    async initCheckin() {
        const checkinBtn = document.getElementById('checkinBtn');
        const checkinStatus = document.getElementById('checkinStatus');
        const streakDays = document.getElementById('streakDays');
        const calendarDays = document.getElementById('calendarDays');

        // 确保所有元素存在
        if (!checkinBtn || !checkinStatus || !streakDays || !calendarDays) {
            console.warn('打卡功能所需DOM元素不存在');
            return;
        }

        // 检查用户是否登录
        if (!this.currentUser) {
            checkinBtn.disabled = true;
            checkinBtn.innerHTML = '<span class="btn-text">请先登录</span>';
            checkinStatus.textContent = '登录后即可使用打卡功能';
            streakDays.textContent = '0';
            calendarDays.innerHTML = '<div style="text-align: center; padding: 20px; color: #999;">请登录查看打卡记录</div>';
            return;
        }

        try {
            // 从后端API获取打卡状态
            const checkinStatusData = await this.apiRequest('/api/checkin/status');
            console.log('获取到打卡状态:', checkinStatusData);

            // 更新连续天数显示
            streakDays.textContent = checkinStatusData.consecutive_days;

            // 生成日历
            // 转换后端返回的日期格式为前端需要的格式
            const checkedDates = checkinStatusData.month_checkins.map(day => {
                const date = new Date();
                date.setDate(day);
                return date.toDateString();
            });
            this.generateCalendar(calendarDays, checkedDates);

            // 检查今天是否已打卡
            const today = new Date().toDateString();
            const hasCheckedToday = checkinStatusData.checked_today;

            if (hasCheckedToday) {
                checkinBtn.disabled = true;
                checkinBtn.innerHTML = '<span class="btn-text">今日已打卡</span>';
                checkinBtn.classList.add('checked');
                checkinStatus.textContent = '✓ 今日已完成打卡';
            } else {
                checkinBtn.disabled = false;
                checkinBtn.innerHTML = '<span class="btn-text">立即打卡</span>';
                checkinStatus.textContent = '点击按钮完成今日打卡';
            }

            // 打卡按钮点击事件
            checkinBtn.addEventListener('click', async () => {
                if (hasCheckedToday) return;

                try {
                    // 调用后端API创建打卡记录
                    const response = await this.apiRequest('/api/checkin', {
                        method: 'POST'
                    });

                    // 更新UI
                    streakDays.textContent = response.consecutive_days;
                    checkinBtn.disabled = true;
                    checkinBtn.innerHTML = '<span class="btn-text">今日已打卡</span>';
                    checkinBtn.classList.add('checked');
                    checkinStatus.textContent = '✓ 打卡成功！继续保持！';

                    // 重新生成日历
                    // 重新获取最新的打卡状态
                    const updatedStatus = await this.apiRequest('/api/checkin/status');
                    const updatedDates = updatedStatus.month_checkins.map(day => {
                        const date = new Date();
                        date.setDate(day);
                        return date.toDateString();
                    });
                    this.generateCalendar(calendarDays, updatedDates);

                    // 显示祝贺动画
                    this.showCheckinAnimation();

                    // 发送打卡通知
                    this.createNotification({
                        type: 'checkin',
                        message: '打卡成功！连续打卡' + response.consecutive_days + '天',
                        timestamp: new Date()
                    });

                } catch (error) {
                    console.error('打卡失败:', error);
                    checkinStatus.textContent = '打卡失败，请稍后重试';
                }
            });

        } catch (error) {
            console.error('获取打卡状态失败:', error);
            checkinStatus.textContent = '加载打卡数据失败，请稍后重试';
            streakDays.textContent = '0';
        }
    }

    /**
     * 生成打卡日历
     */
    generateCalendar(container, checkedDates) {
        if (!container) {
            console.warn('日历容器不存在');
            return;
        }

        container.innerHTML = '';
        const today = new Date();

        // 生成最近14天的日历
        for (let i = 13; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dayNum = date.getDate();
            const dateString = date.toDateString();

            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day';
            
            // 检查是否已打卡
            if (checkedDates.includes(dateString)) {
                dayDiv.classList.add('checked');
                dayDiv.innerHTML = `<span class="date-number">${dayNum}</span><span class="check-mark">✓</span>`;
            } else {
                dayDiv.innerHTML = `<span class="date-number">${dayNum}</span>`;
            }

            // 标记今天
            if (i === 0) {
                dayDiv.classList.add('today');
            }

            container.appendChild(dayDiv);
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
        const postTopic = document.getElementById('postTopic'); // 新增
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
            const topicValue = postTopic ? postTopic.value : ''; // 新增
            const topicName = postTopic && topicValue ? postTopic.options[postTopic.selectedIndex].text : ''; // 修改：只有当有值时才获取名称

            if (!content) {
                this.showToast('请输入帖子内容', 'error');
                return;
            }

            // 禁用发布按钮，防止重复提交
            publishBtn.disabled = true;
            publishBtn.innerHTML = '<span class="loading-spinner-small"></span> 发布中...';

            try {
                // 发送API请求保存帖子到服务器
                const newPostData = await this.apiRequest('/api/posts', {
                    method: 'POST',
                    body: JSON.stringify({
                        title: title,
                        content: content
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
                    topic: topicValue, // 新增
                    topicName: topicName, // 新增
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

                // 保存帖子到对应话题的本地存储（新增）
                if (topicValue) {
                    this.savePostToTopic(topicValue, {
                        author: this.currentUser?.username || '我',
                        avatar: this.currentUser?.avatar || '我',
                        time: '刚刚',
                        content: content,
                        title: title,
                        likes: 0,
                        comments: 0,
                        isQuickPost: false
                    });
                }

                // 重置话题选择器（新增）
                if (postTopic) {
                    postTopic.selectedIndex = 0;
                }

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

        // 如果有话题，添加data属性
        if (data.topic) {
            article.dataset.topic = data.topic;
        }

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
                            <button class="btn-follow-small ${isFollowing ? 'btn-following' : 'btn-follow'}" 
                                    data-user-id="${authorId}" 
                                    data-author-name="${data.author}">
                                ${isFollowing ? '已关注' : '关注'}
                            </button>
                        </div>
                    ` : ''}
                </div>
                <button type="button" class="post-menu-btn" aria-label="更多操作">⋯</button>
            </div>
            <div class="post-body">
                ${data.title ? `<h3 class="post-title">${data.title}</h3>` : ''}
                ${data.topicName ? `<div style="margin-bottom: 8px;"><span class="topic-badge">${data.topicName}</span></div>` : ''}
                <p class="post-content">${data.content}</p>
            </div>
            <div class="post-footer">
                <button type="button" class="post-action" data-action="like">
                    <span class="action-icon">👍</span>
                    <span class="action-count">${data.likes}</span>
                </button>
                <button type="button" class="post-action" data-action="comment">
                    <span class="action-icon">💬</span>
                    <span class="action-count">${data.comments}</span>
                </button>
                <button type="button" class="post-action" data-action="share">
                    <span class="action-icon">↗</span>
                    <span class="action-text">分享</span>
                    <span class="action-count">${data.shares}</span>
                </button>
            </div>
            <div class="comments-section hidden">
                <div class="comment-composer">
                    <input type="text" class="comment-input" placeholder="写下你的评论..." />
                    <button type="button" class="btn btn-small">发送</button>
                </div>
                <div class="comments-list"></div>
            </div>
        `;

        // 绑定事件
        this.bindPostActions(article);
        
        // 绑定关注按钮事件
        const followBtn = article.querySelector('.btn-follow-small');
        if (followBtn) {
            followBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.togglePostFollow(followBtn);
            });
        }

        return article;
    }

    /**
     * 初始化帖子筛选
     */
    initPostFilters() {
        const filterTabs = document.querySelectorAll('.filter-tab');
        const searchInput = document.getElementById('postSearch');

        // 筛选标签切换
        filterTabs.forEach(tab => {
            tab.addEventListener('click', async () => {
                filterTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const filter = tab.dataset.filter;
                await this.filterPosts(filter);
            });
        });

        // 搜索功能
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                const keyword = searchInput.value.toLowerCase().trim();
                this.searchPosts(keyword);
            });
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
     * 获取当前用户关注的所有用户
     */
    async getFollowedUsers() {
        try {
            const currentUserId = this.getCurrentUserId();
            if (!currentUserId) {
                return [];
            }
            const response = await this.apiRequest(`/api/users/${currentUserId}/following`);
            return response.following || [];
        } catch (error) {
            console.error('获取关注用户列表失败:', error);
            return [];
        }
    }

    /**
     * 筛选帖子
     */
    async filterPosts(filter) {
        const posts = document.querySelectorAll('.post-card');

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
                    // 先显示所有帖子，避免之前的筛选影响
                    post.style.display = '';
                    
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
        } else {
            // 其他筛选类型
            posts.forEach(post => {
                post.style.display = '';
            });
        }

        // 重新排序
        this.sortPosts(filter);
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
     * 初始化帖子操作
     */
    initPostActions() {
        // 绑定现有帖子的事件
        const posts = document.querySelectorAll('.post-card');
        posts.forEach(post => this.bindPostActions(post));
    }

    /**
     * 绑定帖子操作事件
     */
    bindPostActions(post) {
        const actions = post.querySelectorAll('.post-action');

        actions.forEach(action => {
            action.addEventListener('click', (e) => {
                e.stopPropagation();
                const actionType = action.dataset.action;

                if (actionType === 'like') {
                    this.handleLike(action);
                } else if (actionType === 'comment') {
                    this.handleCommentToggle(action);
                } else if (actionType === 'share') {
                    this.handleShare(action);
                }
            });
        });

        // 绑定菜单按钮
        const menuBtn = post.querySelector('.post-menu-btn');
        if (menuBtn) {
            menuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showPostMenu(e.target);
            });
        }
    }

    /**
     * 处理点赞
     */
    handleLike(button) {
        const countSpan = button.querySelector('.action-count');
        let count = parseInt(countSpan.textContent);

        // 切换点赞状态
        if (button.classList.contains('liked')) {
            button.classList.remove('liked');
            count--;
        } else {
            button.classList.add('liked');
            count++;

            // 发送点赞通知
            const post = button.closest('.post-card');
            const author = post.querySelector('.author-name').textContent;
            this.createNotification({
                type: 'like',
                from: this.currentUser?.username || '用户',
                target: author,
                message: '点赞了你的帖子',
                timestamp: new Date()
            });
        }

        countSpan.textContent = count;
    }

    /**
     * 处理评论区显示/隐藏
     */
    handleCommentToggle(button) {
        const post = button.closest('.post-card');
        const commentsSection = post.querySelector('.comments-section');

        commentsSection.classList.toggle('hidden');

        // 如果显示评论区，自动聚焦到输入框
        if (!commentsSection.classList.contains('hidden')) {
            const input = commentsSection.querySelector('.comment-input');
            if (input) input.focus();
        }
    }

    /**
     * 处理分享
     */
    handleShare(button) {
        const post = button.closest('.post-card');
        const title = post.querySelector('.post-title')?.textContent || '书法社区帖子';
        const countSpan = button.querySelector('.action-count');
        let count = parseInt(countSpan.textContent || '0');

        // 增加分享计数
        count++;
        countSpan.textContent = count;

        // 简单的分享功能
        if (navigator.share) {
            navigator.share({
                title: title,
                text: '来自 墨智帖 书法社区',
                url: window.location.href
            }).catch(err => console.log('分享失败:', err));
        } else {
            // 复制链接到剪贴板
            navigator.clipboard.writeText(window.location.href).then(() => {
                this.showToast('链接已复制到剪贴板', 'success');
            });
        }
    }

    /**
     * 显示帖子菜单
     */
    showPostMenu(button) {
        // 简单的菜单实现
        this.showToast('更多功能开发中', 'info');
    }

    /**
     * 初始化评论功能
     */
    initComments() {
        document.addEventListener('click', (e) => {
            // 评论提交
            if (e.target.classList.contains('btn-small') &&
                e.target.closest('.comment-composer')) {
                this.handleCommentSubmit(e.target);
            }

            // 评论点赞
            if (e.target.closest('.comment-like')) {
                this.handleCommentLike(e.target.closest('.comment-like'));
            }
        });
    }

    /**
     * 处理评论提交
     */
    handleCommentSubmit(button) {
        const composer = button.closest('.comment-composer');
        const input = composer.querySelector('.comment-input');
        const content = input.value.trim();

        if (!content) {
            this.showToast('请输入评论内容', 'error');
            return;
        }

        // 创建评论元素
        const commentsList = composer.nextElementSibling;
        const comment = this.createCommentElement({
            author: this.currentUser?.username || '我',
            avatar: this.currentUser?.avatar || '我',
            time: '刚刚',
            content: content,
            likes: 0
        });

        commentsList.appendChild(comment);

        // 清空输入框
        input.value = '';

        // 更新评论数
        const post = button.closest('.post-card');
        const commentBtn = post.querySelector('[data-action="comment"]');
        const countSpan = commentBtn.querySelector('.action-count');
        countSpan.textContent = parseInt(countSpan.textContent) + 1;

        // 发送评论通知
        const postAuthor = post.querySelector('.author-name').textContent;
        this.createNotification({
            type: 'comment',
            from: this.currentUser?.username || '用户',
            target: postAuthor,
            message: '评论了你的帖子',
            content: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
            timestamp: new Date()
        });
    }

    /**
     * 创建评论元素
     */
    createCommentElement(data) {
        const div = document.createElement('div');
        div.className = 'comment-item';

        div.innerHTML = `
            <div class="comment-avatar">${data.avatar}</div>
            <div class="comment-body">
                <div class="comment-header">
                    <span class="comment-author">${data.author}</span>
                    <span class="comment-time">${data.time}</span>
                </div>
                <p class="comment-text">${data.content}</p>
                <button type="button" class="comment-like">
                    <span class="action-icon">👍</span>
                    <span class="action-count">${data.likes}</span>
                </button>
            </div>
        `;

        return div;
    }

    /**
     * 处理评论点赞
     */
    handleCommentLike(button) {
        const countSpan = button.querySelector('.action-count');
        let count = parseInt(countSpan.textContent);

        if (button.classList.contains('liked')) {
            button.classList.remove('liked');
            count--;
        } else {
            button.classList.add('liked');
            count++;
        }

        countSpan.textContent = count;
    }

    /**
     * 初始化分类系统
     */
    initCategorySystem() {
        // 分类标签点击事件
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('topic-item') ||
                e.target.closest('.topic-item') ||
                e.target.classList.contains('hot-topic-item') ||
                e.target.closest('.hot-topic-item')) {
                const item = e.target.classList.contains('topic-item') || e.target.classList.contains('hot-topic-item')
                    ? e.target
                    : e.target.closest('.topic-item') || e.target.closest('.hot-topic-item');
                const topicName = item.querySelector('.topic-name, .topic-tag').textContent;
                this.showToast(`跳转到话题: ${topicName}`, 'info');
                // 实际应用中这里应该跳转到对应话题页面
            }
        });
    }

    /**
     * 初始化关注系统
     */
    initFollowSystem() {
        document.addEventListener('click', (e) => {
            // 只处理推荐用户和用户卡片上的关注按钮，不处理帖子卡片上的
            if ((e.target.classList.contains('btn-follow') ||
                e.target.closest('.btn-follow')) &&
                (e.target.closest('.recommended-user') ||
                e.target.closest('.user-card'))) {
                const button = e.target.classList.contains('btn-follow') ?
                    e.target : e.target.closest('.btn-follow');
                this.toggleFollow(button);
            }
        });
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
                await this.apiRequest(`/api/users/${userId}/follow`, {
                    method: 'DELETE'
                });
                
                button.textContent = '关注';
                button.classList.remove('btn-following');
                button.classList.add('btn-follow');
                this.showToast(`已取消关注 ${authorName}`, 'info');
            } else {
                // 关注
                await this.apiRequest(`/api/users/${userId}/follow`, {
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
     * 切换关注状态
     */
    async toggleFollow(button) {
        const userElement = button.closest('.recommended-user, .user-card');
        const userId = button.dataset.userId;
        
        // 检查userElement是否存在
        if (!userElement) {
            console.error('无法找到用户元素');
            return;
        }
        
        const userName = userElement.querySelector('.user-name').textContent;
        const isFollowing = button.textContent.trim() === '已关注';

        // 禁用按钮，防止重复点击
        button.disabled = true;
        button.innerHTML = '<span class="loading-spinner-small"></span>';

        try {
            if (isFollowing) {
                // 取消关注
                await this.apiRequest(`/api/users/${userId}/follow`, {
                    method: 'DELETE'
                });
                
                button.textContent = '关注';
                button.classList.remove('btn-following');
                button.classList.add('btn-follow');
                this.showToast(`已取消关注 ${userName}`, 'info');
            } else {
                // 关注
                await this.apiRequest(`/api/users/${userId}/follow`, {
                    method: 'POST'
                });
                
                button.textContent = '已关注';
                button.classList.remove('btn-follow');
                button.classList.add('btn-following');
                this.showToast(`已成功关注 ${userName}`, 'success');
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
            // 从API获取关注状态
            const response = await this.apiRequest(`/api/users/${userId}/follow/status`);
            return response.is_following;
        } catch (error) {
            console.error('获取关注状态失败:', error);
            return false;
        }
    }

    /**
     * 初始化消息通知
     */
    initNotifications() {
        const markReadBtn = document.querySelector('.mark-all-read');
        if (markReadBtn) {
            markReadBtn.addEventListener('click', () => {
                this.markAllAsRead();
            });
        }

        // 加载通知列表
        this.loadNotifications();
    }

    /**
     * 加载通知
     */
    loadNotifications() {
        const notificationsList = document.querySelector('.notifications-list');
        if (!notificationsList) return;

        this.notifications.forEach(notification => {
            const notificationElement = this.createNotificationElement(notification);
            notificationsList.appendChild(notificationElement);
        });
    }

    /**
     * 创建通知元素
     */
    createNotificationElement(notification) {
        const div = document.createElement('div');
        div.className = `notification-item ${notification.read ? '' : 'unread'}`;

        div.innerHTML = `
            <div class="notification-avatar">${notification.from?.charAt(0) || '系'}</div>
            <div class="notification-content">
                <p class="notification-text">
                    <strong>${notification.from}</strong> ${notification.message}
                    ${notification.content ? `<br><small>${notification.content}</small>` : ''}
                </p>
                <p class="notification-time">${this.formatTime(notification.timestamp)}</p>
            </div>
        `;

        // 点击标记为已读
        div.addEventListener('click', () => {
            this.markAsRead(notification.id);
            div.classList.remove('unread');
        });

        return div;
    }

    /**
     * 创建新通知
     */
    createNotification(notification) {
        const newNotification = {
            id: Date.now(),
            ...notification,
            read: false
        };

        this.notifications.unshift(newNotification);
        localStorage.setItem('userNotifications', JSON.stringify(this.notifications));

        // 更新通知徽章
        this.updateNotificationBadge();
    }

    /**
     * 标记所有为已读
     */
    markAllAsRead() {
        this.notifications.forEach(notification => {
            notification.read = true;
        });
        localStorage.setItem('userNotifications', JSON.stringify(this.notifications));

        document.querySelectorAll('.notification-item').forEach(item => {
            item.classList.remove('unread');
        });

        this.updateNotificationBadge();
        this.showToast('所有通知已标记为已读', 'success');
    }

    /**
     * 标记单个为已读
     */
    markAsRead(notificationId) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification) {
            notification.read = true;
            localStorage.setItem('userNotifications', JSON.stringify(this.notifications));
            this.updateNotificationBadge();
        }
    }

    /**
     * 更新通知徽章
     */
    updateNotificationBadge() {
        const unreadCount = this.notifications.filter(n => !n.read).length;
        const badge = document.getElementById('navNotificationBadge');

        if (badge) {
            badge.textContent = unreadCount;
            badge.style.display = unreadCount > 0 ? 'flex' : 'none';
        }
    }

    /**
     * 初始化意见反馈
     */
    initFeedback() {
        // 如果当前页面是反馈页面
        if (window.location.pathname.includes('/community/feedback')) {
            const typeBtns = document.querySelectorAll('.feedback-type-btn');
            const feedbackForm = document.querySelector('.feedback-form');

            typeBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    typeBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                });
            });

            if (feedbackForm) {
                feedbackForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.submitFeedback(new FormData(feedbackForm));
                });
            }
        }
    }

    /**
     * 提交反馈
     */
    submitFeedback(formData) {
        // 模拟提交反馈
        setTimeout(() => {
            this.showToast('感谢您的反馈！我们会认真考虑您的建议。', 'success');
            if (document.querySelector('.feedback-form')) {
                document.querySelector('.feedback-form').reset();
            }
        }, 1000);
    }

    /**
     * 初始化分享功能
     */
    initShareFeatures() {
        // 分享作品到社区
        window.shareWorkToCommunity = (workData) => {
            const shareModal = this.createShareModal(workData);
            document.body.appendChild(shareModal);
        };
    }

    /**
     * 记录用户活动
     */
    recordUserActivity(activityType, metadata = {}) {
        const activity = {
            type: activityType,
            timestamp: new Date(),
            metadata: metadata
        };

        // 保存到本地存储或发送到服务器
        console.log('用户活动:', activity);
    }

    /**
     * 格式化时间
     */
    formatTime(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diff = now - time;

        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return '刚刚';
        if (minutes < 60) return `${minutes}分钟前`;
        if (hours < 24) return `${hours}小时前`;
        if (days < 7) return `${days}天前`;

        return time.toLocaleDateString();
    }

    /**
     * 显示提示消息
     */
    showToast(message, type = 'info') {
        // 创建或获取toast元素
        let toast = document.getElementById('communityToast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'communityToast';
            toast.className = 'toast';
            document.body.appendChild(toast);
        }

        toast.textContent = message;
        toast.className = `toast ${type} show`;

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    /**
     * 打卡成功动画
     */
    showCheckinAnimation() {
        const status = document.getElementById('checkinStatus');
        if (status) {
            status.style.animation = 'fadeIn 0.5s ease';
        }
    }
}

// 加载更多帖子功能
const loadMoreBtn = document.getElementById('loadMoreBtn');
if (loadMoreBtn) {
  loadMoreBtn.addEventListener('click', function() {
    // 实际应用中应该从服务器加载更多数据
    console.log('加载更多帖子...');
    this.textContent = '加载中...';

    setTimeout(() => {
      this.textContent = '加载更多';
      alert('没有更多帖子了');
    }, 1000);
  });
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
        background: #c84b31;
    }

    .toast.info {
        background: var(--theme-brown);
    }

    .btn-follow.following {
        background: var(--theme-brown);
        color: #fff;
    }

    .notification-badge {
        position: absolute;
        top: -5px;
        right: -5px;
        background: #c84b31;
        color: white;
        border-radius: 50%;
        width: 18px;
        height: 18px;
        font-size: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .post-action.liked .action-icon {
        color: #c84b31;
        transform: scale(1.1);
    }

    .comment-like.liked {
        background: rgba(184, 136, 90, 0.2);
    }

    .checked {
        opacity: 0.7;
    }
`;
document.head.appendChild(style);