/**
 * 关注/粉丝页交互脚本 - 完整版（包含导航功能）
 */

class FollowManager {
  constructor() {
    this.currentTab = 'following';
    this.followingUsers = [];
    this.followerUsers = [];
    this.apiBase = 'http://localhost:5000'; // 后端API基础URL
    this.init();
  }

  init() {
    this.initCommunityNav();
    this.initTabs();
    this.initSearch();
    this.initFilters();
    this.initFollowButtons();
    this.initNavigation();
    this.loadUserData();

    // 初始化通知徽章
    this.updateNotificationBadge();
  }

  /**
   * 初始化社区导航高亮
   */
  initCommunityNav() {
    this.highlightCurrentNavTab();
  }

  /**
   * 高亮当前导航标签
   */
  highlightCurrentNavTab() {
    const currentPath = window.location.pathname;
    const navTabs = document.querySelectorAll('.nav-tab');

    navTabs.forEach(tab => {
      const href = tab.getAttribute('href');

      // 移除所有active类
      tab.classList.remove('active');

      // 关注页面特殊处理
      if (currentPath.includes('/community/follow') && href === '/community/follow') {
        tab.classList.add('active');
      }
      // 其他页面精确匹配
      else if (currentPath === href) {
        tab.classList.add('active');
      }
    });
  }

  /**
   * 初始化标签页
   */
  initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');

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
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });

    // 更新标签文本
    const activeBtn = document.querySelector(`.tab-btn[data-tab="${tab}"]`);
    const tabTitle = document.querySelector('.tab-title');
    if (tabTitle) {
      tabTitle.textContent = tab === 'following' ? '我关注的用户' : '关注我的用户';
    }

    // 更新内容显示
    this.updateContent();
  }

  /**
   * 初始化导航功能
   */
  initNavigation() {
    // 绑定导航点击效果
    const navTabs = document.querySelectorAll('.nav-tab');

    navTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        // 如果已经是当前页面，阻止默认行为
        if (tab.classList.contains('active')) {
          e.preventDefault();
          return;
        }

        // 添加点击反馈
        tab.style.transform = 'scale(0.98)';
        setTimeout(() => {
          tab.style.transform = '';
        }, 150);

        // 模拟页面切换效果
        const content = document.querySelector('.users-grid');
        if (content) {
          content.style.opacity = '0.5';
          content.style.transform = 'translateY(10px)';

          setTimeout(() => {
            content.style.opacity = '';
            content.style.transform = '';
          }, 300);
        }
      });
    });
  }

  /**
   * 初始化搜索功能
   */
  initSearch() {
    const searchInput = document.querySelector('.search-input');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
      const keyword = e.target.value.toLowerCase().trim();
      this.searchUsers(keyword);
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
        this.filterUsers(filter);
      });
    });
  }

  /**
   * 初始化关注按钮
   */
  initFollowButtons() {
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('btn-follow-large') ||
          e.target.closest('.btn-follow-large')) {
        const button = e.target.classList.contains('btn-follow-large') ?
          e.target : e.target.closest('.btn-follow-large');
        this.toggleFollow(button);
      }
    });
  }

  /**
   * 切换关注状态
   */
  async toggleFollow(button) {
    const userId = parseInt(button.dataset.userId);
    const userCard = button.closest('.user-card-large');
    const userName = userCard.querySelector('.user-name-large').textContent;
    
    // 从本地数据获取最新的关注状态
    let user = this.followingUsers.find(u => u.id === userId) || 
               this.followerUsers.find(u => u.id === userId);
    const isFollowing = user ? user.isFollowing : button.textContent.trim() === '已关注';

    // 禁用按钮，防止重复点击
    button.disabled = true;
    button.innerHTML = '<span class="loading-spinner-small"></span>';

    try {
      if (isFollowing) {
        // 取消关注
        await this.apiRequest(`/api/users/${userId}/follow`, {
          method: 'DELETE'
        });
        
        this.showToast(`已取消关注 ${userName}`, 'info');
        
        // 直接更新按钮状态
        button.textContent = '关注';
        button.classList.remove('btn-following');
        button.classList.add('btn-follow');

        // 更新本地数据并重新加载，确保状态同步
        await this.loadUserData();
      } else {
        // 关注
        await this.apiRequest(`/api/users/${userId}/follow`, {
          method: 'POST'
        });
        
        this.showToast(`已成功关注 ${userName}`, 'success');
        
        // 直接更新按钮状态
        button.textContent = '已关注';
        button.classList.remove('btn-follow');
        button.classList.add('btn-following');

        // 更新本地数据并重新加载，确保状态同步
        await this.loadUserData();
      }

      // 更新统计
      this.updateFollowStats();
    } catch (error) {
      // 处理409 CONFLICT响应（重复关注）- 这是正常情况，不是错误
      if (error.message.includes('409 CONFLICT')) {
        console.info('用户已关注该作者，无需重复关注');
        this.showToast('已关注该用户', 'info');
        
        // 直接更新按钮状态
        button.textContent = '已关注';
        button.classList.remove('btn-follow');
        button.classList.add('btn-following');
        
        // 更新本地数据并重新加载，确保状态同步
        await this.loadUserData();
      } else {
        // 其他错误才需要显示错误信息
        console.error('切换关注状态失败:', error);
        this.showToast(`操作失败: ${error.message}`, 'error');
        
        // 恢复按钮状态
        button.textContent = isFollowing ? '已关注' : '关注';
        button.classList.remove('btn-follow', 'btn-following');
        button.classList.add(isFollowing ? 'btn-following' : 'btn-follow');
      }
    } finally {
      // 恢复按钮可点击状态
      button.disabled = false;
    }
  }

  /**
   * 搜索用户
   */
  searchUsers(keyword) {
    const userCards = document.querySelectorAll('.user-card-large');

    userCards.forEach(card => {
      const userName = card.querySelector('.user-name-large').textContent.toLowerCase();
      const userTitle = card.querySelector('.user-title').textContent.toLowerCase();
      const userBio = card.querySelector('.user-bio').textContent.toLowerCase();

      if (!keyword ||
          userName.includes(keyword) ||
          userTitle.includes(keyword) ||
          userBio.includes(keyword)) {
        card.style.display = '';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      } else {
        card.style.display = 'none';
      }
    });
  }

  /**
   * 筛选用户
   */
  filterUsers(filter) {
    // 这里可以根据不同的筛选条件过滤用户
    this.showToast(`已筛选: ${filter === 'recent' ? '最近活跃' : filter === 'popular' ? '最受欢迎' : '全部'}`, 'info');
  }

  /**
   * 更新关注统计
   */
  updateFollowStats() {
    const followingBtn = document.querySelector('.tab-btn[data-tab="following"]');
    const followersBtn = document.querySelector('.tab-btn[data-tab="followers"]');

    if (followingBtn) {
      followingBtn.textContent = `我关注的 (${this.followingUsers.length})`;
    }

    if (followersBtn) {
      followersBtn.textContent = `关注我的 (${this.followerUsers.length})`;
    }
  }

  /**
   * 更新通知徽章
   */
  updateNotificationBadge() {
    const badge = document.getElementById('navNotificationBadge');
    if (!badge) return;

    // 模拟未读通知数
    const unreadCount = 3; // 可以从服务器获取

    if (unreadCount > 0) {
      badge.textContent = unreadCount;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
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
   * 从JWT获取当前用户ID
   */
  getCurrentUserId() {
    const token = localStorage.getItem('access_token');
    if (!token) return null;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      // JWT的payload中，用户ID存储在sub字段中
      return payload.sub;
    } catch (error) {
      console.error('解析JWT失败:', error);
      return null;
    }
  }

  /**
   * 加载用户数据
   */
  async loadUserData() {
    // 显示加载状态
    const usersGrid = document.querySelector('.users-grid');
    if (usersGrid) {
      usersGrid.innerHTML = `
        <div class="loading-state">
          <div class="loading-spinner"></div>
          <p>加载中...</p>
        </div>
      `;
    }

    try {
      // 从JWT获取当前用户的ID
      const currentUserId = this.getCurrentUserId();
      if (!currentUserId) {
        throw new Error('未登录或登录已过期');
      }
      
      // 并行加载关注和粉丝列表
      const [followingData, followersData] = await Promise.all([
        this.apiRequest(`/api/users/${currentUserId}/following`),
        this.apiRequest(`/api/users/${currentUserId}/followers`)
      ]);

      // 转换关注列表数据格式
      this.followingUsers = followingData.following.map(user => ({
        id: user.id,
        name: user.username,
        title: '', // API中没有title字段，实际项目中可以从用户资料获取
        bio: user.bio || '',
        avatar: user.avatar || user.username.charAt(0),
        followers: user.followers_count,
        following: user.following_count,
        isFollowing: user.is_following
      }));

      // 转换粉丝列表数据格式
      this.followerUsers = followersData.followers.map(user => ({
        id: user.id,
        name: user.username,
        title: '',
        bio: user.bio || '',
        avatar: user.avatar || user.username.charAt(0),
        followers: user.followers_count,
        following: user.following_count,
        isFollowing: user.is_following
      }));

      this.updateContent();
      this.updateFollowStats();
    } catch (error) {
      console.error('加载用户数据失败:', error);
      const usersGrid = document.querySelector('.users-grid');
      if (usersGrid) {
        usersGrid.innerHTML = `
          <div class="error-state">
            <div class="error-icon">⚠️</div>
            <h3>加载失败</h3>
            <p>无法加载用户数据，请稍后重试</p>
            <button class="btn btn-primary" onclick="window.followManager.loadUserData()">
              重新加载
            </button>
          </div>
        `;
      }
    }
  }

  /**
   * 更新内容显示
   */
  updateContent() {
    const usersGrid = document.querySelector('.users-grid');
    if (!usersGrid) return;

    const users = this.currentTab === 'following' ? this.followingUsers : this.followerUsers;

    if (users.length === 0) {
      usersGrid.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">👥</div>
          <h3>暂无用户</h3>
          <p>${this.currentTab === 'following' ? '你还没有关注任何人' : '还没有人关注你'}</p>
          <button class="btn btn-primary" onclick="window.location.href='/community'">
            去社区发现用户
          </button>
        </div>
      `;
      return;
    }

    usersGrid.innerHTML = users.map(user => `
      <div class="user-card-large">
        <div class="user-avatar-xl">${user.avatar}</div>
        <h3 class="user-name-large">${user.name}</h3>
        <p class="user-title">${user.title}</p>
        <p class="user-bio">${user.bio}</p>
        <div class="user-stats">
          <div class="user-stat">
            <span class="stat-value">${user.followers.toLocaleString()}</span>
            <span class="stat-label">粉丝</span>
          </div>
          <div class="user-stat">
            <span class="stat-value">${user.following}</span>
            <span class="stat-label">关注</span>
          </div>
        </div>
        <button class="btn-follow-large ${user.isFollowing ? 'btn-following' : 'btn-follow'}"
                data-user-id="${user.id}">${user.isFollowing ? '已关注' : '关注'}</button>
      </div>
    `).join('');

    // 添加淡入动画
    setTimeout(() => {
      const cards = usersGrid.querySelectorAll('.user-card-large');
      cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';

        setTimeout(() => {
          card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        }, index * 50);
      });
    }, 50);
  }

  /**
   * 显示提示消息
   */
  showToast(message, type = 'info') {
    let toast = document.getElementById('followToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'followToast';
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

  .btn-follow-large {
    position: relative;
    overflow: hidden;
  }

  .btn-follow-large:active {
    transform: scale(0.98);
  }

  .nav-tab:active {
    transform: scale(0.98) !important;
  }

  .users-grid {
    transition: opacity 0.3s ease, transform 0.3s ease;
  }

  .user-card-large {
    transition: all 0.3s ease;
  }
`;

document.head.appendChild(style);

// 初始化关注管理器
document.addEventListener('DOMContentLoaded', () => {
  window.followManager = new FollowManager();
});