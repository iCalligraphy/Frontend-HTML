/**
 * 话题详情页交互脚本
 */

class TopicDetailManager {
  constructor() {
    this.currentTopic = null;
    this.currentUser = null;
    this.posts = [];
    this.page = 1;
    this.isLoading = false;
    this.init();
  }

  init() {
    this.initCommunityNav();
    this.initTopicData();
    this.initQuickPost();
    this.initPostFilters();
    this.initPostActions();
    this.initFollowTopic();
    this.loadUserData();
    this.loadTopicPosts();
    this.loadRelatedTopics();
    this.loadActiveUsers();
  }

  /**
   * 初始化社区导航
   */
  initCommunityNav() {
    this.updateNavNotificationBadge();
    this.highlightCurrentNavTab();
    this.bindNavTabEvents();
  }

  /**
   * 更新导航栏通知徽章
   */
  updateNavNotificationBadge() {
    const badge = document.getElementById('navNotificationBadge');
    if (!badge) return;

    // 这里应该从服务器获取未读通知数量
    const unreadCount = 0; // 暂时设为0
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

      // 所有话题页面都高亮话题分类
      if (href === '/community/topics') {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
  }

  /**
   * 绑定导航标签事件
   */
  bindNavTabEvents() {
    const navTabs = document.querySelectorAll('.nav-tab');

    navTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        const href = tab.getAttribute('href');

        // 添加点击效果
        tab.style.transform = 'scale(0.95)';
        setTimeout(() => {
          tab.style.transform = '';
        }, 150);

        window.location.href = href;
      });
    });
  }

  /**
   * 加载用户数据
   */
  loadUserData() {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
      this.currentUser = JSON.parse(userData);

      // 更新用户头像
      const userAvatar = document.getElementById('currentUserAvatar');
      if (userAvatar && this.currentUser.avatar) {
        userAvatar.textContent = this.currentUser.avatar;
      }
    }
  }

  /**
   * 初始化话题数据
   */
  initTopicData() {
    // 从URL获取话题名称
    const pathParts = window.location.pathname.split('/');
    const topicName = pathParts[pathParts.length - 1];

    // 话题数据配置
    const topicConfig = {
      'technique': {
        name: '技法交流',
        description: '分享书写技巧，讨论笔法、结构、章法等',
        fullDescription: '欢迎来到技法交流区！这里是书法爱好者分享书写技巧、讨论笔法、结构、章法的专属空间。无论你是初学者还是资深书法家，都可以在这里交流心得，共同进步。',
        icon: '🖌️',
        color: '#8b4513',
        posts: 1250,
        users: 450,
        todayPosts: 23,
        createdDate: '2022-03-15',
        moderators: ['书法小助手', '墨香居士'],
        tags: ['#楷书', '#入门', '#技巧', '#练习', '#基本功']
      },
      'appreciation': {
        name: '作品欣赏',
        description: '欣赏经典与原创书法作品，交流鉴赏心得',
        fullDescription: '作品欣赏区汇集了大量经典与原创书法作品。在这里你可以欣赏到各种书体的优美作品，学习鉴赏方法，提升审美能力。也欢迎分享你的作品！',
        icon: '👁️',
        color: '#4a7c59',
        posts: 890,
        users: 320,
        todayPosts: 15,
        createdDate: '2022-04-10',
        moderators: ['艺术鉴赏家', '书画收藏家'],
        tags: ['#行书', '#作品', '#赏析', '#经典', '#原创']
      },
      'qna': {
        name: '问答求助',
        description: '提出书法学习中的疑问，互相解答帮助',
        fullDescription: '问答求助区是解决书法学习疑问的最佳场所。无论遇到什么问题，都可以在这里提问，热心的社区成员会为你解答。助人为乐，共同进步！',
        icon: '❓',
        color: '#2c5aa0',
        posts: 670,
        users: 280,
        todayPosts: 18,
        createdDate: '2022-05-20',
        moderators: ['书法老师', '热心学长'],
        tags: ['#求助', '#解答', '#疑问', '#指导', '#学习']
      },
      'materials': {
        name: '文房四宝',
        description: '讨论笔墨纸砚等书法工具的选择与使用',
        fullDescription: '工欲善其事，必先利其器。文房四宝区专注于讨论书法工具的选择、使用和保养。分享你的工具心得，交流选购经验，找到最适合你的文房用品。',
        icon: '📦',
        color: '#a0522d',
        posts: 450,
        users: 190,
        todayPosts: 8,
        createdDate: '2022-06-05',
        moderators: ['文房专家', '工具控'],
        tags: ['#毛笔', '#宣纸', '#墨汁', '#砚台', '#工具']
      },
      'events': {
        name: '活动赛事',
        description: '书法比赛、展览、线下活动等信息分享',
        fullDescription: '活动赛事区汇集了最新的书法比赛、展览、线下活动信息。第一时间获取活动资讯，参与社区活动，与更多书法爱好者面对面交流。',
        icon: '🎯',
        color: '#c84b31',
        posts: 320,
        users: 150,
        todayPosts: 5,
        createdDate: '2022-07-12',
        moderators: ['活动组织者', '赛事管理员'],
        tags: ['#比赛', '#展览', '#活动', '#线下', '#赛事']
      }
    };

    this.currentTopic = topicConfig[topicName] || topicConfig['technique'];
    this.updateTopicUI();
  }

  /**
   * 更新话题UI
   */
  updateTopicUI() {
    // 更新页面标题
    document.title = `${this.currentTopic.name} · 墨智帖`;

    // 更新话题名称
    const topicNameElements = document.querySelectorAll('#topicNameDisplay, h1');
    topicNameElements.forEach(el => {
      if (el.id === 'topicNameDisplay' || el.tagName === 'H1') {
        el.textContent = this.currentTopic.name;
      }
    });

    // 更新话题描述
    const descShort = document.getElementById('topicDescription');
    const descFull = document.getElementById('topicFullDescription');
    if (descShort) descShort.textContent = this.currentTopic.description;
    if (descFull) descFull.textContent = this.currentTopic.fullDescription;

    // 更新话题图标
    const iconLarge = document.getElementById('topicIcon');
    if (iconLarge) {
      iconLarge.textContent = this.currentTopic.icon;
      iconLarge.style.color = this.currentTopic.color;
      iconLarge.style.background = this.hexToRgba(this.currentTopic.color, 0.1);
    }

    // 更新统计信息
    const totalPosts = document.getElementById('totalPosts');
    const activeUsers = document.getElementById('activeUsers');
    const todayPosts = document.getElementById('todayPosts');

    if (totalPosts) totalPosts.textContent = this.currentTopic.posts.toLocaleString();
    if (activeUsers) activeUsers.textContent = this.currentTopic.users.toLocaleString();
    if (todayPosts) todayPosts.textContent = this.currentTopic.todayPosts;

    // 更新创建日期
    const createdDate = document.getElementById('topicCreatedDate');
    if (createdDate) createdDate.textContent = this.currentTopic.createdDate;

    // 更新版主
    const moderators = document.getElementById('topicModerators');
    if (moderators) moderators.textContent = this.currentTopic.moderators.join('、');

    // 更新标签
    const tagsContainer = document.getElementById('topicTags');
    if (tagsContainer) {
      tagsContainer.innerHTML = this.currentTopic.tags
        .map(tag => `<span class="topic-tag">${tag}</span>`)
        .join('');
    }

    // 更新快速发帖占位符
    const quickPostTextarea = document.getElementById('quickPostContent');
    if (quickPostTextarea) {
      quickPostTextarea.placeholder = `在${this.currentTopic.name}话题下分享你的想法...`;
    }
  }

  /**
   * 初始化快速发帖
   */
  initQuickPost() {
    const quickPostContent = document.getElementById('quickPostContent');
    const charCount = document.getElementById('quickPostCharCount');
    const quickPostBtn = document.getElementById('quickPostBtn');

    if (!quickPostContent || !quickPostBtn) return;

    // 字数统计
    quickPostContent.addEventListener('input', function() {
      const length = this.value.length;
      if (charCount) {
        charCount.textContent = length;
        charCount.style.color = length > 450 ? '#d32f2f' : 'inherit';
      }
    });

    // 发布按钮
    quickPostBtn.addEventListener('click', () => {
      const content = quickPostContent.value.trim();

      if (!content) {
        this.showToast('请输入帖子内容', 'error');
        return;
      }

      if (content.length > 500) {
        this.showToast('内容不能超过500字', 'error');
        return;
      }

      // 创建新帖子
      const newPost = this.createPostElement({
        author: this.currentUser?.username || '我',
        avatar: this.currentUser?.avatar || '我',
        time: '刚刚',
        content: content,
        likes: 0,
        comments: 0,
        isQuickPost: true
      });

      // 插入到帖子列表顶部
      const postsList = document.getElementById('topicPostsList');
      if (postsList) {
        const loadingDiv = postsList.querySelector('.loading-posts');
        if (loadingDiv) {
          loadingDiv.remove();
        }
        postsList.insertBefore(newPost, postsList.firstChild);
      }

      // 清空输入框
      quickPostContent.value = '';
      if (charCount) charCount.textContent = '0';

      // 更新统计数据
      this.currentTopic.posts++;
      this.currentTopic.todayPosts++;
      this.updateTopicUI();

      // 显示成功提示
      this.showToast('发布成功！', 'success');
    });
  }

  /**
   * 初始化帖子筛选
   */
  initPostFilters() {
    const filterTabs = document.querySelectorAll('.filter-tab');
    const searchInput = document.getElementById('topicPostSearch');

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
          // 按热度筛选
          const likes = parseInt(post.querySelector('[data-action="like"] .action-count').textContent);
          post.style.display = likes >= 10 ? '' : 'none';
          break;
        case 'top':
          // 精华帖
          const isTop = post.dataset.isTop === 'true';
          post.style.display = isTop ? '' : 'none';
          break;
        case 'following':
          // 关注用户
          const author = post.querySelector('.author-name').textContent;
          post.style.display = this.isFollowing(author) ? '' : 'none';
          break;
        case 'latest':
        default:
          post.style.display = '';
      }
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
      const content = post.querySelector('.post-content').textContent.toLowerCase();
      const author = post.querySelector('.author-name').textContent.toLowerCase();

      if (content.includes(keyword) || author.includes(keyword)) {
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
    // 使用事件委托处理动态加载的帖子
    document.addEventListener('click', (e) => {
      // 点赞
      if (e.target.closest('.post-action[data-action="like"]')) {
        this.handleLike(e.target.closest('.post-action'));
      }
      // 评论
      else if (e.target.closest('.post-action[data-action="comment"]')) {
        this.handleCommentToggle(e.target.closest('.post-action'));
      }
      // 分享
      else if (e.target.closest('.post-action[data-action="share"]')) {
        this.handleShare(e.target.closest('.post-action'));
      }
      // 评论点赞
      else if (e.target.closest('.comment-like')) {
        this.handleCommentLike(e.target.closest('.comment-like'));
      }
      // 评论提交
      else if (e.target.closest('.btn-small') &&
               e.target.closest('.comment-composer')) {
        this.handleCommentSubmit(e.target.closest('.btn-small'));
      }
    });
  }

  /**
   * 加载话题帖子
   */
  loadTopicPosts() {
    if (this.isLoading) return;

    this.isLoading = true;
    const postsList = document.getElementById('topicPostsList');

    // 模拟API请求延迟
    setTimeout(() => {
      // 清除加载状态
      const loadingDiv = postsList.querySelector('.loading-posts');
      if (loadingDiv) {
        loadingDiv.remove();
      }

      // 生成示例帖子数据
      const samplePosts = this.generateSamplePosts(10);

      // 创建帖子元素
      samplePosts.forEach(postData => {
        const postElement = this.createPostElement(postData);
        postsList.appendChild(postElement);
      });

      this.isLoading = false;
      this.page++;
    }, 1000);
  }

  /**
   * 生成示例帖子
   */
  generateSamplePosts(count) {
    const authors = ['王墨客', '李墨香', '张书生', '赵字痴', '孙笔墨', '周砚台'];
    const topics = ['楷书', '行书', '草书', '隶书', '篆书'];

    return Array.from({ length: count }, (_, i) => ({
      author: authors[i % authors.length],
      avatar: authors[i % authors.length].charAt(0),
      time: `${i + 1}小时前`,
      content: `我在${this.currentTopic.name}话题下分享一个关于${topics[i % topics.length]}的心得...`,
      likes: Math.floor(Math.random() * 50),
      comments: Math.floor(Math.random() * 20),
      isTop: i % 5 === 0 // 每5个有一个精华帖
    }));
  }

  /**
   * 创建帖子元素
   */
  createPostElement(data) {
    const article = document.createElement('article');
    article.className = 'post-card';
    if (data.isTop) {
      article.dataset.isTop = 'true';
      article.classList.add('top-post');
    }

    article.innerHTML = `
      <div class="post-header">
        <div class="post-author">
          <div class="author-avatar">${data.avatar}</div>
          <div class="author-info">
            <h4 class="author-name">${data.author}</h4>
            <p class="post-time">${data.time}</p>
          </div>
        </div>
        ${data.isTop ? '<span class="top-badge">🔥 精华</span>' : ''}
        <button type="button" class="post-menu-btn" aria-label="更多操作">⋯</button>
      </div>
      <div class="post-body">
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

    return article;
  }

  /**
   * 处理点赞
   */
  handleLike(button) {
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
   * 处理评论区显示/隐藏
   */
  handleCommentToggle(button) {
    const post = button.closest('.post-card');
    const commentsSection = post.querySelector('.comments-section');

    commentsSection.classList.toggle('hidden');

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
    const title = `${this.currentTopic.name}话题帖子`;

    if (navigator.share) {
      navigator.share({
        title: title,
        text: '来自 墨智帖 书法社区',
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href).then(() => {
        this.showToast('链接已复制到剪贴板', 'success');
      });
    }
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
   * 初始化关注话题
   */
  initFollowTopic() {
    const followBtn = document.getElementById('followTopicBtn');
    if (!followBtn) return;

    // 检查是否已关注
    const followedTopics = JSON.parse(localStorage.getItem('followedTopics') || '[]');
    if (followedTopics.includes(this.currentTopic.name)) {
      this.updateFollowButton(true);
    }

    // 点击事件
    followBtn.addEventListener('click', () => {
      this.toggleFollowTopic(followBtn);
    });
  }

  /**
   * 切换关注话题
   */
  toggleFollowTopic(button) {
    const followedTopics = JSON.parse(localStorage.getItem('followedTopics') || '[]');
    const topicName = this.currentTopic.name;

    if (followedTopics.includes(topicName)) {
      // 取消关注
      const index = followedTopics.indexOf(topicName);
      followedTopics.splice(index, 1);
      this.updateFollowButton(false);
      this.showToast(`已取消关注 ${topicName}`, 'info');
    } else {
      // 关注
      followedTopics.push(topicName);
      this.updateFollowButton(true);
      this.showToast(`已关注 ${topicName}`, 'success');
    }

    localStorage.setItem('followedTopics', JSON.stringify(followedTopics));
  }

  /**
   * 更新关注按钮状态
   */
  updateFollowButton(isFollowing) {
    const button = document.getElementById('followTopicBtn');
    if (!button) return;

    if (isFollowing) {
      button.innerHTML = '<span class="btn-icon">✓</span><span class="btn-text">已关注</span>';
      button.classList.add('following');
    } else {
      button.innerHTML = '<span class="btn-icon">+</span><span class="btn-text">关注此话题</span>';
      button.classList.remove('following');
    }
  }

  /**
   * 加载相关话题
   */
  loadRelatedTopics() {
    const container = document.getElementById('relatedTopics');
    if (!container) return;

    const relatedTopics = [
      { name: '作品欣赏', icon: '👁️', posts: 890, color: '#4a7c59' },
      { name: '问答求助', icon: '❓', posts: 670, color: '#2c5aa0' },
      { name: '文房四宝', icon: '📦', posts: 450, color: '#a0522d' }
    ];

    container.innerHTML = relatedTopics
      .map(topic => `
        <a href="/community/topics/${this.getTopicSlug(topic.name)}" class="related-topic-item">
          <span class="related-topic-icon" style="color: ${topic.color}; background: ${this.hexToRgba(topic.color, 0.1)};">
            ${topic.icon}
          </span>
          <div class="related-topic-info">
            <div class="related-topic-name">${topic.name}</div>
            <div class="related-topic-stats">${topic.posts} 帖子</div>
          </div>
        </a>
      `).join('');
  }

  /**
   * 加载活跃用户
   */
  loadActiveUsers() {
    const container = document.getElementById('activeUsersList');
    if (!container) return;

    const activeUsers = [
      { name: '书法达人', posts: 128 },
      { name: '墨香居士', posts: 89 },
      { name: '笔走龙蛇', posts: 67 },
      { name: '砚台小生', posts: 45 }
    ];

    container.innerHTML = activeUsers
      .map(user => `
        <div class="active-user-item">
          <div class="active-user-avatar">${user.name.charAt(0)}</div>
          <div class="active-user-info">
            <div class="active-user-name">${user.name}</div>
            <div class="active-user-contribution">贡献 ${user.posts} 帖子</div>
          </div>
        </div>
      `).join('');
  }

  /**
   * 检查是否关注用户
   */
  isFollowing(username) {
    const following = JSON.parse(localStorage.getItem('following') || '[]');
    return following.includes(username);
  }

  /**
   * 获取话题slug
   */
  getTopicSlug(topicName) {
    const slugMap = {
      '技法交流': 'technique',
      '作品欣赏': 'appreciation',
      '问答求助': 'qna',
      '文房四宝': 'materials',
      '活动赛事': 'events'
    };
    return slugMap[topicName] || 'technique';
  }

  /**
   * 颜色转换辅助函数
   */
  hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  /**
   * 显示提示消息
   */
  showToast(message, type = 'info') {
    let toast = document.getElementById('topicToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'topicToast';
      toast.className = 'toast';
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.className = `toast ${type} show`;

    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }
}

// 添加全局事件监听
document.addEventListener('DOMContentLoaded', () => {
  // 初始化话题详情管理器
  window.topicDetailManager = new TopicDetailManager();

  // 加载更多按钮
  const loadMoreBtn = document.getElementById('loadMorePosts');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', function() {
      this.textContent = '加载中...';
      this.disabled = true;

      setTimeout(() => {
        window.topicDetailManager.loadTopicPosts();
        this.textContent = '加载更多帖子';
        this.disabled = false;
      }, 1500);
    });
  }
});

// 添加CSS样式
const style = document.createElement('style');
style.textContent = `
  /* 精华帖样式 */
  .top-post {
    border: 2px solid var(--theme-brown);
  }

  .top-badge {
    position: absolute;
    top: 24px;
    right: 70px;
    background: linear-gradient(135deg, var(--theme-brown) 0%, #c84b31 100%);
    color: white;
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
  }

  /* 关注按钮状态 */
  .btn.following {
    background: var(--gray);
    border-color: var(--gray);
  }

  .btn.following:hover {
    background: var(--gray-dark);
    border-color: var(--gray-dark);
  }

  /* 导航栏话题分类棕色高亮 */
  .nav-tab.active[href="/community/topics"] {
    background: linear-gradient(135deg, var(--theme-brown) 0%, #a67c52 100%) !important;
    border-color: var(--theme-brown) !important;
    color: #fff !important;
  }

  /* 提示消息样式 */
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

  /* 点赞效果 */
  .post-action.liked .action-icon {
    color: #c84b31;
    transform: scale(1.1);
  }

  .comment-like.liked {
    background: rgba(184, 136, 90, 0.2);
  }
`;
document.head.appendChild(style);