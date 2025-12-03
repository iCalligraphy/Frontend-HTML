/**
 * 关注/粉丝页交互脚本 - 完整版（包含导航功能）
 */

class FollowManager {
  constructor() {
    this.currentTab = 'following';
    this.followingUsers = [];
    this.followerUsers = [];
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
  toggleFollow(button) {
    const userId = button.dataset.userId;
    const userCard = button.closest('.user-card-large');
    const userName = userCard.querySelector('.user-name-large').textContent;
    const isFollowing = button.textContent === '已关注';

    if (isFollowing) {
      button.textContent = '关注';
      button.classList.remove('btn-following');
      button.classList.add('btn-follow');
      this.showToast(`已取消关注 ${userName}`, 'info');

      // 从关注列表中移除
      if (this.currentTab === 'following') {
        this.followingUsers = this.followingUsers.filter(user => user.id !== userId);
        this.updateContent();
      }
    } else {
      button.textContent = '已关注';
      button.classList.remove('btn-follow');
      button.classList.add('btn-following');
      this.showToast(`已成功关注 ${userName}`, 'success');

      // 添加到关注列表
      if (this.currentTab === 'followers') {
        const user = this.followerUsers.find(u => u.id === userId);
        if (user) {
          user.isFollowing = true;
        }
      }
    }

    // 更新统计
    this.updateFollowStats();
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
   * 加载用户数据
   */
  loadUserData() {
    // 模拟关注列表数据
    this.followingUsers = [
      {
        id: '1',
        name: '王墨客',
        title: '楷书专家',
        bio: '专注欧体楷书研究，分享传统笔法技巧',
        avatar: '王',
        followers: 1250,
        following: 340,
        isFollowing: true
      },
      {
        id: '2',
        name: '李墨香',
        title: '行书爱好者',
        bio: '热爱王羲之行书，每日练习《兰亭序》',
        avatar: '李',
        followers: 890,
        following: 210,
        isFollowing: true
      },
      {
        id: '3',
        name: '张书生',
        title: '草书传承者',
        bio: '致力于草书艺术的传承与创新',
        avatar: '张',
        followers: 670,
        following: 180,
        isFollowing: true
      },
      {
        id: '4',
        name: '孙笔墨',
        title: '书法教师',
        bio: '多年书法教学经验，擅长隶书教学',
        avatar: '孙',
        followers: 560,
        following: 210,
        isFollowing: true
      },
      {
        id: '5',
        name: '赵字痴',
        title: '篆书研究者',
        bio: '专注于秦汉篆书的研究与创作',
        avatar: '赵',
        followers: 430,
        following: 95,
        isFollowing: true
      },
      {
        id: '6',
        name: '周砚台',
        title: '文房收藏家',
        bio: '收藏各种文房四宝，分享选购心得',
        avatar: '周',
        followers: 890,
        following: 320,
        isFollowing: true
      }
    ];

    // 模拟粉丝列表数据
    this.followerUsers = [
      {
        id: '7',
        name: '书法初学者',
        title: '新手入门',
        bio: '刚开始学习书法，请多多指教',
        avatar: '初',
        followers: 45,
        following: 120,
        isFollowing: false
      },
      {
        id: '8',
        name: '墨韵传承',
        title: '传统文化爱好者',
        bio: '传承中华传统文化，弘扬书法艺术',
        avatar: '墨',
        followers: 320,
        following: 95,
        isFollowing: false
      },
      {
        id: '9',
        name: '笔尖舞者',
        title: '行楷爱好者',
        bio: '喜欢行书的流畅与楷书的端庄',
        avatar: '笔',
        followers: 210,
        following: 85,
        isFollowing: false
      },
      {
        id: '10',
        name: '纸墨春秋',
        title: '书法博主',
        bio: '分享书法学习心得和创作过程',
        avatar: '纸',
        followers: 1250,
        following: 450,
        isFollowing: false
      }
    ];

    this.updateContent();
    this.updateFollowStats();
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
                data-user-id="${user.id}">
          ${user.isFollowing ? '已关注' : '关注'}
        </button>
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