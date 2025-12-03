/**
 * 社区页面交互脚本 - 增强版
 * 包含每日打卡、发帖、评论点赞、分类筛选、关注系统、消息通知等功能
 */

// 社区管理器类
class CommunityManager {
    constructor() {
        this.currentUser = null;
        this.notifications = [];
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

    init() {
        this.initCheckin();
        this.initPostComposer();
        this.initPostFilters();
        this.initPostActions();
        this.initComments();
        this.initCategorySystem();
        this.initFollowSystem();
        this.initNotifications();
        this.initFeedback();
        this.initShareFeatures();
        this.initCommunityNav();
        this.loadUserData();
    }

    /**
     * 加载用户数据
     */
    loadUserData() {
        // 从本地存储或API加载用户数据
        const userData = localStorage.getItem('currentUser');
        if (userData) {
            this.currentUser = JSON.parse(userData);
        }

        // 加载通知数据
        const notifications = localStorage.getItem('userNotifications');
        if (notifications) {
            this.notifications = JSON.parse(notifications);
        }
    }

    /**
     * 初始化每日打卡功能
     */
    initCheckin() {
        const checkinBtn = document.getElementById('checkinBtn');
        const checkinStatus = document.getElementById('checkinStatus');
        const streakDays = document.getElementById('streakDays');
        const calendarDays = document.getElementById('calendarDays');

        if (!checkinBtn) return;

        // 从本地存储读取打卡数据
        let checkinData = JSON.parse(localStorage.getItem('checkinData') || '{"streak": 0, "dates": []}');

        // 更新连续天数显示
        if (streakDays) {
            streakDays.textContent = checkinData.streak;
        }

        // 生成日历（显示最近14天）
        if (calendarDays) {
            this.generateCalendar(calendarDays, checkinData.dates);
        }

        // 检查今天是否已打卡
        const today = new Date().toDateString();
        const hasCheckedToday = checkinData.dates.includes(today);

        if (hasCheckedToday && checkinBtn) {
            checkinBtn.disabled = true;
            checkinBtn.innerHTML = '<span class="btn-text">今日已打卡</span>';
            checkinBtn.classList.add('checked');
            if (checkinStatus) {
                checkinStatus.textContent = '✓ 今日已完成打卡';
            }
        }

        // 打卡按钮点击事件
        checkinBtn.addEventListener('click', () => {
            if (hasCheckedToday) return;

            // 更新打卡数据
            checkinData.dates.push(today);
            checkinData.streak++;

            // 保存到本地存储
            localStorage.setItem('checkinData', JSON.stringify(checkinData));

            // 更新UI
            if (streakDays) streakDays.textContent = checkinData.streak;
            checkinBtn.disabled = true;
            checkinBtn.innerHTML = '<span class="btn-text">今日已打卡</span>';
            checkinBtn.classList.add('checked');
            if (checkinStatus) {
                checkinStatus.textContent = '✓ 打卡成功！继续保持！';
            }

            // 重新生成日历
            if (calendarDays) {
                this.generateCalendar(calendarDays, checkinData.dates);
            }

            // 显示祝贺动画
            this.showCheckinAnimation();

            // 发送打卡通知
            this.createNotification({
                type: 'checkin',
                message: '打卡成功！连续打卡' + checkinData.streak + '天',
                timestamp: new Date()
            });
        });
    }

    /**
     * 生成打卡日历
     */
    generateCalendar(container, checkedDates) {
        if (!container) return;

        container.innerHTML = '';
        const today = new Date();

        // 生成最近14天的日历
        for (let i = 13; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);

            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day';
            dayDiv.textContent = date.getDate();

            // 检查是否已打卡
            if (checkedDates.includes(date.toDateString())) {
                dayDiv.classList.add('checked');
                dayDiv.textContent = '✓';
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
        const postContent = document.getElementById('postContent');
        const charCount = document.getElementById('charCount');
        const publishBtn = document.getElementById('publishBtn');

        if (!postContent || !publishBtn) return;

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
        publishBtn.addEventListener('click', () => {
            const title = document.getElementById('postTitle')?.value.trim() || '';
            const content = postContent.value.trim();

            if (!content) {
                this.showToast('请输入帖子内容', 'error');
                return;
            }

            // 创建新帖子
            const newPost = this.createPostElement({
                author: this.currentUser?.username || '我',
                avatar: this.currentUser?.avatar || '我',
                time: '刚刚',
                title: title,
                content: content,
                likes: 0,
                comments: 0,
                shares: 0
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
        });
    }

    /**
     * 创建帖子元素
     */
    createPostElement(data) {
        const article = document.createElement('article');
        article.className = 'post-card';

        article.innerHTML = `
            <div class="post-header">
                <div class="post-author">
                    <div class="author-avatar">${data.avatar}</div>
                    <div class="author-info">
                        <h4 class="author-name">${data.author}</h4>
                        <p class="post-time">${data.time}</p>
                    </div>
                </div>
                <button type="button" class="post-menu-btn" aria-label="更多操作">⋯</button>
            </div>
            <div class="post-body">
                ${data.title ? `<h3 class="post-title">${data.title}</h3>` : ''}
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
            tab.addEventListener('click', () => {
                filterTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const filter = tab.dataset.filter;
                this.filterPosts(filter);
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
     * 筛选帖子
     */
    filterPosts(filter) {
        const posts = document.querySelectorAll('.post-card');

        posts.forEach(post => {
            switch (filter) {
                case 'hot':
                    // 按热度排序（点赞+评论数）
                    post.style.display = '';
                    break;
                case 'latest':
                    // 按时间排序
                    post.style.display = '';
                    break;
                case 'following':
                    // 只显示关注用户的帖子
                    const author = post.querySelector('.author-name').textContent;
                    post.style.display = this.isFollowing(author) ? '' : 'none';
                    break;
                case 'all':
                default:
                    post.style.display = '';
            }
        });

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
                text: '来自 iCalligraphy 书法社区',
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
            if (e.target.classList.contains('btn-follow') ||
                e.target.closest('.btn-follow')) {
                const button = e.target.classList.contains('btn-follow') ?
                    e.target : e.target.closest('.btn-follow');
                this.toggleFollow(button);
            }
        });
    }

    /**
     * 切换关注状态
     */
    toggleFollow(button) {
        const userElement = button.closest('.recommended-user, .user-card');
        const userName = userElement.querySelector('.user-name').textContent;

        if (button.textContent === '关注') {
            button.textContent = '已关注';
            button.classList.add('following');
            this.showToast(`已关注 ${userName}`, 'success');

            // 发送关注通知
            this.createNotification({
                type: 'follow',
                from: this.currentUser?.username || '用户',
                target: userName,
                message: '关注了你',
                timestamp: new Date()
            });
        } else {
            button.textContent = '关注';
            button.classList.remove('following');
            this.showToast(`已取消关注 ${userName}`, 'info');
        }
    }

    /**
     * 检查是否关注了某个用户
     */
    isFollowing(username) {
        // 这里应该从用户数据中检查关注列表
        const following = JSON.parse(localStorage.getItem('following') || '[]');
        return following.includes(username);
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