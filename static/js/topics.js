/**
 * 话题列表页交互脚本
 */

class TopicsManager {
  constructor() {
    this.currentUser = null;
    this.notifications = [];
    this.init();
  }

  init() {
    this.initTopicCards();
    this.initViewAllButtons();
    this.initCommunityNav();
    this.loadTopicData();
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

    // 更新通知徽章
    this.updateNavNotificationBadge();
  }

  /**
   * 初始化社区导航
   */
  initCommunityNav() {
    // 更新通知徽章
    this.updateNavNotificationBadge();

    // 为当前页面高亮对应的导航标签
    this.highlightCurrentNavTab();

    // 绑定导航标签点击事件
    this.bindNavTabEvents();
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
      // 话题页面特殊处理
      else if (currentPath === '/community/topics' && href === '/community/topics') {
        tab.classList.add('active');
      }
      // 其他页面：只有当路径完全匹配时才高亮
      else {
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
        // 阻止默认行为
        e.preventDefault();

        const href = tab.getAttribute('href');

        // 添加点击效果
        tab.style.transform = 'scale(0.95)';
        setTimeout(() => {
          tab.style.transform = '';
        }, 150);

        // 跳转到对应页面
        window.location.href = href;
      });
    });
  }

  /**
   * 初始化话题卡片交互
   */
  initTopicCards() {
    const topicCards = document.querySelectorAll('.topic-card');

    topicCards.forEach(card => {
      card.addEventListener('click', (e) => {
        // 如果不是点击在按钮上，则跳转到话题详情
        if (!e.target.closest('.btn-view-all')) {
          const category = card.dataset.category;
          this.viewTopic(category);
        }
      });
    });
  }

  /**
   * 初始化查看全部按钮
   */
  initViewAllButtons() {
    const viewAllBtns = document.querySelectorAll('.btn-view-all');

    viewAllBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const category = btn.dataset.category;
        this.viewTopic(category);
      });
    });
  }

  /**
   * 查看话题详情
   */
  viewTopic(category) {
    // 跳转到对应话题的帖子列表
    window.location.href = `/community/topics/${category}`;
  }

  /**
   * 加载话题数据
   */
  loadTopicData() {
    // 这里可以加载话题的统计数据
    // 例如：帖子数量、今日更新等

    const topicData = [
      {
        id: 'technique',
        name: '技法交流',
        description: '分享书写技巧，讨论笔法、结构、章法等',
        postCount: 1250,
        todayPosts: 23,
        color: '#8b4513',
        icon: '🖌️'
      },
      {
        id: 'appreciation',
        name: '作品欣赏',
        description: '欣赏经典与原创书法作品，交流鉴赏心得',
        postCount: 890,
        todayPosts: 15,
        color: '#4a7c59',
        icon: '👁️'
      },
      {
        id: 'qna',
        name: '问答求助',
        description: '提出书法学习中的疑问，互相解答帮助',
        postCount: 670,
        todayPosts: 18,
        color: '#2c5aa0',
        icon: '❓'
      },
      {
        id: 'materials',
        name: '文房四宝',
        description: '讨论笔墨纸砚等书法工具的选择与使用',
        postCount: 450,
        todayPosts: 8,
        color: '#a0522d',
        icon: '📦'
      },
      {
        id: 'events',
        name: '活动赛事',
        description: '书法比赛、展览、线下活动等信息分享',
        postCount: 320,
        todayPosts: 5,
        color: '#c84b31',
        icon: '🎯'
      }
    ];

    // 更新页面数据
    topicData.forEach(topic => {
      const card = document.querySelector(`.topic-card[data-category="${topic.id}"]`);
      if (card) {
        const stats = card.querySelector('.topic-stats');
        if (stats) {
          stats.innerHTML = `
            <span>${topic.postCount.toLocaleString()} 帖子</span>
            <span>今日更新 ${topic.todayPosts}</span>
          `;
        }

        // 更新标题
        const title = card.querySelector('h2');
        if (title) {
          title.textContent = topic.name;
        }

        // 更新描述
        const desc = card.querySelector('.topic-desc');
        if (desc) {
          desc.textContent = topic.description;
        }

        // 更新图标
        const icon = card.querySelector('.topic-icon');
        if (icon) {
          icon.textContent = topic.icon;
        }
      }
    });
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
`;
document.head.appendChild(style);

// 初始化话题管理器
document.addEventListener('DOMContentLoaded', () => {
  new TopicsManager();
});