/**
 * 话题列表页交互脚本 - 完整版（包含标签页功能）
 */

class TopicsManager {
  constructor() {
    this.currentTab = 'all';
    this.currentFilter = 'all';
    this.allTopics = [];
    this.followedTopics = new Set();
    this.apiBase = 'http://localhost:5000'; // 后端API基础URL
    this.init();
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

  async init() {
    this.initCommunityNav();
    this.initTopicTabs();
    this.initSearch();
    this.initFilters();
    
    // 调用异步的loadTopicData方法，该方法会处理后续的逻辑
    await this.loadTopicData();
    
    // 更新关注计数
    this.updateFollowingCount();
  }

  /**
   * 初始化社区导航
   */
  initCommunityNav() {
    this.updateNavNotificationBadge();
    this.highlightCurrentNavTab();
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

      if (href === '/community/topics') {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
  }

  /**
   * 初始化话题标签页
   */
  initTopicTabs() {
    const tabBtns = document.querySelectorAll('.topic-tab-btn');

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        this.switchTab(tab);
      });
    });
  }

  /**
   * 切换标签页
   */
  switchTab(tab) {
    this.currentTab = tab;

    // 更新按钮状态
    document.querySelectorAll('.topic-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });

    // 更新内容显示
    this.updateContent();

    // 添加切换动画
    const grid = document.getElementById('topicsGrid');
    if (grid) {
      grid.style.opacity = '0.5';
      grid.style.transform = 'translateY(10px)';

      setTimeout(() => {
        grid.style.opacity = '1';
        grid.style.transform = 'translateY(0)';
      }, 200);
    }
  }

  /**
   * 初始化搜索功能
   */
  initSearch() {
    const searchInput = document.querySelector('.topics-search-input');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
      const keyword = e.target.value.toLowerCase().trim();
      this.searchTopics(keyword);
    });
  }

  /**
   * 初始化筛选功能
   */
  initFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');

    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filter = btn.dataset.filter;
        this.filterTopics(filter);
      });
    });
  }

  /**
   * 加载话题数据（从后端API）
   */
  async loadTopicData() {
    try {
      // 从后端API获取话题数据
      const response = await this.apiRequest('/api/topics');
      const topics = response.topics || [];
      
      // 处理话题数据
      this.allTopics = topics.map(topic => ({
        id: topic.id,
        name: topic.name,
        description: topic.description,
        postCount: topic.postCount,
        todayPosts: topic.todayPosts,
        color: topic.color,
        icon: topic.icon,
        isPopular: topic.isPopular,
        createdAt: topic.createdAt,
        isFollowed: false // 初始设为未关注，后续会被loadFollowedTopics更新
      }));
      
      // 加载完话题数据后，加载已关注的话题
      await this.loadFollowedTopics();
      
      // 更新内容显示
      this.updateContent();
    } catch (error) {
      console.error('加载话题数据失败:', error);
      
      // 如果API调用失败，使用模拟数据作为后备
      this.allTopics = [
        {
          id: 'technique',
          name: '技法交流',
          description: '分享书写技巧，讨论笔法、结构、章法等',
          postCount: 1250,
          todayPosts: 23,
          color: '#8b4513',
          icon: '🖌️',
          isPopular: true,
          createdAt: '2022-03-15',
          isFollowed: false
        },
        {
          id: 'appreciation',
          name: '作品欣赏',
          description: '欣赏经典与原创书法作品，交流鉴赏心得',
          postCount: 890,
          todayPosts: 15,
          color: '#4a7c59',
          icon: '👁️',
          isPopular: true,
          createdAt: '2022-04-10',
          isFollowed: false
        },
        {
          id: 'qna',
          name: '问答求助',
          description: '提出书法学习中的疑问，互相解答帮助',
          postCount: 670,
          todayPosts: 18,
          color: '#2c5aa0',
          icon: '❓',
          isPopular: true,
          createdAt: '2022-05-20',
          isFollowed: false
        },
        {
          id: 'materials',
          name: '文房四宝',
          description: '讨论笔墨纸砚等书法工具的选择与使用',
          postCount: 450,
          todayPosts: 8,
          color: '#a0522d',
          icon: '📦',
          isPopular: false,
          createdAt: '2022-06-05',
          isFollowed: false
        },
        {
          id: 'events',
          name: '活动赛事',
          description: '书法比赛、展览、线下活动等信息分享',
          postCount: 320,
          todayPosts: 5,
          color: '#c84b31',
          icon: '🎯',
          isPopular: false,
          createdAt: '2022-07-12',
          isFollowed: false
        }
      ];
      
      // 使用模拟数据后，从本地存储加载已关注话题
      await this.loadFollowedTopics();
      
      // 更新内容显示
      this.updateContent();
    }
  }

  /**
   * 加载已关注的话题（从后端API）
   */
  async loadFollowedTopics() {
    try {
      // 从后端API获取已关注的话题
      const response = await this.apiRequest('/api/users/me/following/topics');
      const followedTopics = response.topics || [];
      
      // 提取话题名称
      const followedTopicNames = new Set(followedTopics.map(topic => topic.name));
      this.followedTopics = followedTopicNames;
      
      // 更新话题的已关注状态
      this.allTopics.forEach(topic => {
        topic.isFollowed = this.followedTopics.has(topic.name);
      });
      
      // 保存到本地存储，作为缓存
      this.saveFollowedTopics();
      
      // 更新关注计数
      this.updateFollowingCount();
    } catch (error) {
      console.error('加载已关注话题失败:', error);
      
      // 如果API调用失败，从本地存储加载作为后备
      const stored = localStorage.getItem('followedTopics');
      if (stored) {
        this.followedTopics = new Set(JSON.parse(stored));
        
        // 更新话题的已关注状态
        this.allTopics.forEach(topic => {
          topic.isFollowed = this.followedTopics.has(topic.name);
        });
        
        // 更新关注计数
        this.updateFollowingCount();
      }
    }
  }

  /**
   * 保存已关注的话题
   */
  saveFollowedTopics() {
    localStorage.setItem('followedTopics', JSON.stringify(Array.from(this.followedTopics)));
  }

  /**
   * 更新关注计数
   */
  updateFollowingCount() {
    const followingCount = document.getElementById('followingCount');
    if (followingCount) {
      followingCount.textContent = this.followedTopics.size;
    }
  }

  /**
   * 切换话题关注状态
   */
  async toggleFollowTopic(topicName) {
    // 查找话题ID
    const topic = this.allTopics.find(t => t.name === topicName);
    if (!topic) {
      console.error('未找到指定话题:', topicName);
      return;
    }
    
    const topicId = topic.id;
    const isFollowing = this.followedTopics.has(topicName);

    // 禁用所有关注按钮，防止重复点击
    const followButtons = document.querySelectorAll('.follow-btn');
    followButtons.forEach(btn => btn.disabled = true);

    try {
      if (isFollowing) {
        // 取消关注
        await this.apiRequest(`/api/topics/${topicId}/follow`, {
          method: 'DELETE'
        });
        
        this.followedTopics.delete(topicName);
        this.showToast(`已取消关注 ${topicName}`, 'info');
      } else {
        // 关注
        await this.apiRequest(`/api/topics/${topicId}/follow`, {
          method: 'POST'
        });
        
        this.followedTopics.add(topicName);
        this.showToast(`已关注 ${topicName}`, 'success');
      }

      // 更新话题状态
      this.allTopics.forEach(t => {
        if (t.name === topicName) {
          t.isFollowed = this.followedTopics.has(topicName);
        }
      });

      // 保存到本地存储
      this.saveFollowedTopics();

      // 更新关注计数
      this.updateFollowingCount();

      // 如果在"关注话题"标签页，需要刷新内容
      if (this.currentTab === 'following') {
        this.updateContent();
      } else {
        // 重新渲染所有话题卡片，更新关注状态
        this.updateContent();
      }
    } catch (error) {
      console.error('切换话题关注状态失败:', error);
      this.showToast(`操作失败: ${error.message}`, 'error');
      
      // 恢复原状态
      if (isFollowing) {
        this.followedTopics.add(topicName);
      } else {
        this.followedTopics.delete(topicName);
      }
    } finally {
      // 恢复关注按钮可点击状态
      followButtons.forEach(btn => btn.disabled = false);
    }
  }

  /**
   * 更新内容显示
   */
  updateContent() {
    const topicsGrid = document.getElementById('topicsGrid');
    if (!topicsGrid) return;

    // 根据当前标签页筛选话题
    let topicsToShow;
    if (this.currentTab === 'following') {
      // 只显示已关注的话题
      topicsToShow = this.allTopics.filter(topic => topic.isFollowed);
    } else {
      // 显示所有话题
      topicsToShow = [...this.allTopics];
    }

    // 应用当前筛选器
    topicsToShow = this.applyFilter(topicsToShow, this.currentFilter);

    if (topicsToShow.length === 0) {
      this.showEmptyState(topicsGrid);
      return;
    }

    // 生成话题卡片
    topicsGrid.innerHTML = topicsToShow.map((topic, index) => this.createTopicCard(topic, index)).join('');

    // 绑定卡片事件
    this.bindTopicCardEvents();
  }

  /**
   * 创建话题卡片
   */
  createTopicCard(topic, index) {
    const isLarge = topic.id === 'technique' && this.currentTab === 'all';
    const isFollowing = topic.isFollowed;

    return `
      <div class="topic-card ${isLarge ? 'large' : ''}"
           data-category="${topic.id}"
           data-index="${index}">
        ${isFollowing ? '<div class="topic-followed-badge">✓ 已关注</div>' : ''}
        <div class="topic-header">
          <span class="topic-icon" style="color: ${topic.color}; background: ${this.hexToRgba(topic.color, 0.1)};">${topic.icon}</span>
          <div class="topic-info">
            <h3 class="topic-name">${topic.name}</h3>
            <p class="topic-description">${topic.description}</p>
          </div>
        </div>
        <div class="topic-stats">
          <div class="topic-stat">
            <span class="stat-value">${topic.postCount}</span>
            <span class="stat-label">帖子</span>
          </div>
          <div class="topic-stat">
            <span class="stat-value">${topic.todayPosts}</span>
            <span class="stat-label">今日</span>
          </div>
        </div>
        <button class="btn-follow-large ${isFollowing ? 'btn-following' : 'btn-follow'}" 
                data-topic-id="${topic.id}" 
                data-topic-name="${topic.name}">
          ${isFollowing ? '已关注' : '关注话题'}
        </button>
      </div>
    `;
  }

  /**
   * 绑定话题卡片事件
   */
  bindTopicCardEvents() {
    // 关注按钮点击事件
    const followButtons = document.querySelectorAll('.btn-follow-large');
    followButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const topicId = btn.dataset.topicId;
        const topicName = btn.dataset.topicName;
        this.toggleFollowTopic(topicName);
      });
    });
  }

  /**
   * 应用筛选器
   */
  applyFilter(topics, filter) {
    switch (filter) {
      case 'popular':
        return topics.filter(topic => topic.isPopular);
      case 'newest':
        return [...topics].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      case 'all':
      default:
        return topics;
    }
  }

  /**
 * 创建话题卡片
 */


  /**
   * 显示空状态
   */
  showEmptyState(container) {
    if (this.currentTab === 'following') {
      container.innerHTML = `
        <div class="topics-empty-state">
          <div class="empty-icon">📚</div>
          <h3>你还没有关注任何话题</h3>
          <p>关注你喜欢的话题，可以在这里快速找到它们</p>
          <button class="btn btn-primary" onclick="topicsManager.switchTab('all')">
            去发现话题
          </button>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div class="topics-empty-state">
          <div class="empty-icon">🔍</div>
          <h3>没有找到匹配的话题</h3>
          <p>尝试搜索其他关键词或调整筛选条件</p>
          <button class="btn btn-primary" onclick="topicsManager.clearSearch()">
            清除搜索
          </button>
        </div>
      `;
    }
  }

  /**
   * 搜索话题
   */
  searchTopics(keyword) {
    const topicCards = document.querySelectorAll('.topic-card');
    const grid = document.getElementById('topicsGrid');

    if (!keyword.trim()) {
      // 清空搜索，显示正常内容
      this.updateContent();
      return;
    }

    topicCards.forEach(card => {
      const topicName = card.querySelector('h2').textContent.toLowerCase();
      const topicDesc = card.querySelector('.topic-desc').textContent.toLowerCase();

      if (topicName.includes(keyword) || topicDesc.includes(keyword)) {
        card.style.display = '';
        // 添加淡入动画
        card.style.opacity = '0';
        card.style.transform = 'translateY(10px)';
        setTimeout(() => {
          card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        }, 50);
      } else {
        card.style.display = 'none';
      }
    });

    // 检查是否没有搜索结果
    const visibleCards = Array.from(topicCards).filter(card => card.style.display !== 'none');
    if (visibleCards.length === 0 && grid) {
      this.showEmptyState(grid);
    }
  }

  /**
   * 筛选话题
   */
  filterTopics(filter) {
    this.currentFilter = filter;
    this.showToast(`已筛选: ${this.getFilterLabel(filter)}`, 'info');
    this.updateContent();
  }

  /**
   * 获取筛选器标签
   */
  getFilterLabel(filter) {
    const labels = {
      'all': '全部',
      'popular': '热门',
      'newest': '最新'
    };
    return labels[filter] || '全部';
  }

  /**
   * 清除搜索
   */
  clearSearch() {
    const searchInput = document.querySelector('.topics-search-input');
    if (searchInput) {
      searchInput.value = '';
    }
    this.updateContent();
  }

  /**
   * 查看话题详情
   */
  viewTopic(category) {
    window.location.href = `/community/topics/${category}`;
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
    let toast = document.getElementById('topicsToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'topicsToast';
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

// 添加CSS样式
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

  /* 切换动画 */
  .topics-grid {
    transition: opacity 0.3s ease, transform 0.3s ease;
  }

  .topic-card {
    transition: all 0.3s ease;
  }

  /* 按钮点击效果 */
  .btn-view-all:active {
    transform: scale(0.95);
  }

  .topic-tab-btn:active {
    transform: scale(0.98);
  }
`;

document.head.appendChild(style);

// 初始化话题管理器
document.addEventListener('DOMContentLoaded', async () => {
  window.topicsManager = new TopicsManager();
  await window.topicsManager.init();
});