/**
 * 消息通知页交互脚本 - 简化版（无侧边栏）
 */

class NotificationsManager {
  constructor() {
    this.notifications = [];
    this.selectedNotifications = new Set();
    this.currentFilter = 'all';
    this.init();
  }

  init() {
    // 初始化社区导航
    this.initCommunityNav();
    
    // 加载通知数据
    this.loadNotifications();
    
    // 初始化功能
    this.initTabs();
    this.initCheckboxes();
    this.initBatchActions();
    this.initMarkAllRead();
    this.initClearAll();
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

  /**
   * 初始化标签页筛选
   */
  initTabs() {
    const tabs = document.querySelectorAll('.type-tab');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const type = tab.dataset.type;
        this.filterNotifications(type);

        // 更新标签状态
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
      });
    });
  }

  /**
   * 初始化复选框
   */
  initCheckboxes() {
    // 全选复选框 - 与顶部按钮相同的方法
    const selectAllCheckbox = document.querySelector('.select-all-checkbox');
    if (selectAllCheckbox) {
      selectAllCheckbox.addEventListener('change', (e) => {
        this.toggleSelectAll(e.target.checked);
      });
    }
  }

  /**
   * 初始化批量操作 - 与顶部按钮相同的方法
   */
  initBatchActions() {
    const batchButtons = document.querySelectorAll('.btn-batch');

    batchButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        this.handleBatchAction(action);
      });
    });
  }

  /**
   * 初始化标记全部为已读 - 与顶部按钮相同的方法
   */
  initMarkAllRead() {
    const markAllBtn = document.querySelector('.mark-all-read');
    if (markAllBtn) {
      markAllBtn.addEventListener('click', () => {
        this.markAllAsRead();
      });
    }
  }

  /**
   * 初始化清空所有按钮 - 与顶部按钮相同的方法
   */
  initClearAll() {
    const clearAllBtn = document.getElementById('clearAllBtn');
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', () => {
        this.clearAllNotifications();
      });
    }
  }

  /**
   * 清空所有通知 - 顶部按钮的工作方法
   */
  clearAllNotifications() {
    if (this.notifications.length === 0) {
      this.showToast('没有通知可以清空', 'info');
      return;
    }

    if (!confirm(`确定要清空所有 ${this.notifications.length} 条通知吗？此操作不可撤销。`)) {
      return;
    }

    this.notifications = [];
    this.saveNotifications();
    this.renderNotifications();
    this.updateStats();
    this.showToast('所有通知已清空', 'success');
  }

  /**
   * 加载通知数据
   */
  loadNotifications() {
    // 从本地存储加载通知
    const storedNotifications = localStorage.getItem('userNotifications');
    if (storedNotifications) {
      this.notifications = JSON.parse(storedNotifications);
    } else {
      // 生成示例数据
      this.notifications = this.generateMockNotifications();
    }

    this.renderNotifications();
    this.updateStats();
  }

  /**
   * 生成模拟通知数据
   */
  generateMockNotifications() {
    return [
      {
        id: '1',
        type: 'like',
        from: '王墨客',
        fromAvatar: '王',
        title: '点赞通知',
        message: '点赞了你的帖子"初学楷书心得"',
        extra: '这个帖子写得真好，学到了很多！',
        timestamp: new Date(Date.now() - 10 * 60000), // 10分钟前
        read: false
      },
      {
        id: '2',
        type: 'comment',
        from: '李墨香',
        fromAvatar: '李',
        title: '评论通知',
        message: '评论了你的帖子"行书练习技巧"',
        extra: '我也有类似的体会，特别是行书的气韵很难把握...',
        timestamp: new Date(Date.now() - 2 * 3600000), // 2小时前
        read: false
      },
      {
        id: '3',
        type: 'follow',
        from: '张书生',
        fromAvatar: '张',
        title: '关注通知',
        message: '关注了你',
        extra: '现在你们是好友了，可以互相交流书法心得！',
        timestamp: new Date(Date.now() - 5 * 3600000), // 5小时前
        read: true
      },
      {
        id: '4',
        type: 'mention',
        from: '孙笔墨',
        fromAvatar: '孙',
        title: '@提到你',
        message: '在帖子"文房四宝选购指南"中提到了你',
        extra: '@书法爱好者 这个毛笔品牌怎么样？',
        timestamp: new Date(Date.now() - 1 * 86400000), // 1天前
        read: true
      },
      {
        id: '5',
        type: 'system',
        from: '系统通知',
        fromAvatar: '系',
        title: '系统消息',
        message: '你的作品"兰亭临摹"已通过审核',
        extra: '作品已成功发布到平台，获得了很多好评！',
        timestamp: new Date(Date.now() - 2 * 86400000), // 2天前
        read: true
      }
    ];
  }

  /**
   * 更新统计信息
   */
  updateStats() {
    const unreadCount = this.notifications.filter(n => !n.read).length;
    const today = new Date().toDateString();
    const todayCount = this.notifications.filter(n =>
      new Date(n.timestamp).toDateString() === today
    ).length;

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekCount = this.notifications.filter(n =>
      new Date(n.timestamp) > weekAgo
    ).length;

    document.getElementById('unreadCount').textContent = unreadCount;
    document.getElementById('todayCount').textContent = todayCount;
    document.getElementById('weekCount').textContent = weekCount;
  }

  /**
   * 渲染通知列表
   */
  renderNotifications() {
    const container = document.querySelector('.notifications-list');
    if (!container) return;

    // 筛选通知
    let filteredNotifications = this.notifications;
    if (this.currentFilter !== 'all') {
      filteredNotifications = this.notifications.filter(n => n.type === this.currentFilter);
    }

    if (filteredNotifications.length === 0) {
      container.innerHTML = `
        <div class="notifications-empty">
          <div class="empty-icon">🔔</div>
          <h3>暂无通知</h3>
          <p>${this.currentFilter === 'all' ? '暂时还没有收到任何通知' : '暂时没有此类通知'}</p>
          <button class="btn btn-primary" onclick="location.reload()">刷新页面</button>
        </div>
      `;
      return;
    }

    // 按时间倒序排序
    filteredNotifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    container.innerHTML = filteredNotifications.map(notification => `
      <div class="notification-item ${notification.read ? 'read' : 'unread'}"
           data-id="${notification.id}"
           data-type="${notification.type}">
        ${!notification.read ? '<span class="unread-dot"></span>' : ''}
        <div class="notification-content">
          <div class="notification-icon">
            ${this.getNotificationIcon(notification.type)}
          </div>
          <div class="notification-details">
            <div class="notification-header">
              <h4 class="notification-title">${notification.title}</h4>
              <span class="notification-time">${this.formatTime(notification.timestamp)}</span>
            </div>
            <p class="notification-message">
              <strong>${notification.from}</strong> ${notification.message}
            </p>
            ${notification.extra ? `<div class="notification-extra">${notification.extra}</div>` : ''}
            <div class="notification-actions">
              ${!notification.read ? `
                <button class="notification-action-btn mark-read-btn" data-action="mark-read" data-id="${notification.id}">
                  <span class="btn-icon">✓</span>
                  标记已读
                </button>
              ` : ''}
              <button class="notification-action-btn delete-btn" data-action="delete" data-id="${notification.id}">
                <span class="btn-icon">🗑️</span>
                删除
              </button>
            </div>
          </div>
        </div>
        <label class="batch-checkbox">
          <input type="checkbox" class="notification-checkbox" data-id="${notification.id}" 
                 ${this.selectedNotifications.has(notification.id) ? 'checked' : ''}>
          <span class="checkmark"></span>
        </label>
      </div>
    `).join('');

    // 为动态生成的元素绑定事件 - 使用与顶部按钮相同的方法
    this.bindDynamicEvents();
  }

  /**
   * 为动态生成的元素绑定事件 - 关键修复！
   */
  bindDynamicEvents() {
    // 绑定单条通知的"标记已读"按钮 - 使用明确的选择器
    const markReadButtons = document.querySelectorAll('.mark-read-btn');
    markReadButtons.forEach(button => {
      // 移除可能存在的旧监听器
      button.removeEventListener('click', this.handleSingleMarkRead);
      // 添加新监听器
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const notificationId = button.dataset.id;
        this.markSingleAsRead(notificationId);
      });
    });

    // 绑定单条通知的"删除"按钮 - 使用明确的选择器
    const deleteButtons = document.querySelectorAll('.delete-btn');
    deleteButtons.forEach(button => {
      // 移除可能存在的旧监听器
      button.removeEventListener('click', this.handleSingleDelete);
      // 添加新监听器
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const notificationId = button.dataset.id;
        this.deleteSingleNotification(notificationId);
      });
    });

    // 绑定单条通知复选框
    const checkboxes = document.querySelectorAll('.notification-checkbox');
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const notificationId = checkbox.dataset.id;
        this.toggleNotificationSelection(notificationId, checkbox.checked);
      });
    });

    // 绑定通知项点击事件（查看详情）
    const notificationItems = document.querySelectorAll('.notification-item');
    notificationItems.forEach(item => {
      item.addEventListener('click', (e) => {
        // 如果点击的是操作按钮或复选框，不触发查看详情
        if (e.target.closest('.notification-action-btn') || 
            e.target.closest('.notification-checkbox') ||
            e.target.closest('.batch-checkbox')) {
          return;
        }
        const notificationId = item.dataset.id;
        this.viewNotification(notificationId);
      });
    });
  }

  /**
   * 单条消息标记为已读 - 简单直接的方法
   */
  markSingleAsRead(id) {
    const notification = this.notifications.find(n => n.id === id);
    if (!notification) return;

    if (notification.read) {
      this.showToast('这条通知已经是已读状态', 'info');
      return;
    }

    notification.read = true;
    this.saveNotifications();

    // 直接更新UI - 与顶部按钮相同的逻辑
    const notificationItem = document.querySelector(`.notification-item[data-id="${id}"]`);
    if (notificationItem) {
      notificationItem.classList.remove('unread');
      notificationItem.classList.add('read');
      
      // 移除未读点
      const unreadDot = notificationItem.querySelector('.unread-dot');
      if (unreadDot) unreadDot.remove();
      
      // 移除"标记已读"按钮
      const markReadBtn = notificationItem.querySelector('.mark-read-btn');
      if (markReadBtn) markReadBtn.remove();
    }

    this.updateStats();
    this.updateNotificationBadge();
    this.showToast('已标记为已读', 'success');
  }

  /**
   * 单条消息删除 - 简单直接的方法
   */
  deleteSingleNotification(id) {
    if (!confirm('确定要删除这条通知吗？')) {
      return;
    }

    // 找到并删除通知
    const index = this.notifications.findIndex(n => n.id === id);
    if (index === -1) return;

    // 从数组中删除
    this.notifications.splice(index, 1);
    this.saveNotifications();

    // 从选择集中删除（如果被选中）
    this.selectedNotifications.delete(id);

    // 重新渲染列表
    this.renderNotifications();
    this.updateStats();
    this.showToast('通知已删除', 'success');
  }

  /**
   * 获取通知图标
   */
  getNotificationIcon(type) {
    const icons = {
      'like': '👍',
      'comment': '💬',
      'follow': '👤',
      'mention': '@',
      'system': '📢'
    };
    return icons[type] || '🔔';
  }

  /**
   * 筛选通知
   */
  filterNotifications(type) {
    this.currentFilter = type;
    this.renderNotifications();
  }

  /**
   * 切换全选
   */
  toggleSelectAll(checked) {
    // 获取当前显示的所有通知ID
    const notificationItems = document.querySelectorAll('.notification-item');
    const currentIds = Array.from(notificationItems).map(item => item.dataset.id);
    
    if (checked) {
      // 选择当前显示的所有通知
      currentIds.forEach(id => {
        this.selectedNotifications.add(id);
      });
    } else {
      // 只清除当前显示的通知的选择
      currentIds.forEach(id => {
        this.selectedNotifications.delete(id);
      });
    }
    
    // 更新所有复选框状态
    const checkboxes = document.querySelectorAll('.notification-checkbox');
    checkboxes.forEach(checkbox => {
      checkbox.checked = this.selectedNotifications.has(checkbox.dataset.id);
    });
    
    this.updateBatchActionsVisibility();
  }

  /**
   * 切换单个通知选择
   */
  toggleNotificationSelection(id, checked) {
    if (checked) {
      this.selectedNotifications.add(id);
    } else {
      this.selectedNotifications.delete(id);
    }
    
    // 更新全选复选框状态
    const selectAllCheckbox = document.querySelector('.select-all-checkbox');
    if (selectAllCheckbox) {
      const totalCheckboxes = document.querySelectorAll('.notification-checkbox').length;
      selectAllCheckbox.checked = this.selectedNotifications.size === totalCheckboxes;
    }
    
    this.updateBatchActionsVisibility();
  }

  /**
   * 更新批量操作按钮可见性
   */
  updateBatchActionsVisibility() {
    const batchActions = document.querySelector('.batch-actions');
    if (batchActions) {
      if (this.selectedNotifications.size > 0) {
        batchActions.style.display = 'flex';
      } else {
        batchActions.style.display = 'none';
      }
    }
  }

  /**
   * 处理批量操作 - 使用与单条操作相同的逻辑
   */
  handleBatchAction(action) {
    if (this.selectedNotifications.size === 0) {
      this.showToast('请先选择通知', 'error');
      return;
    }
    
    switch (action) {
      case 'mark-read':
        this.batchMarkAsRead();
        break;
      case 'delete':
        this.batchDelete();
        break;
    }
  }

  /**
   * 查看通知详情
   */
  viewNotification(id) {
    const notification = this.notifications.find(n => n.id === id);
    if (!notification) return;

    // 标记为已读
    if (!notification.read) {
      this.markSingleAsRead(id);
    }

    // 根据通知类型跳转到对应页面
    switch (notification.type) {
      case 'like':
      case 'comment':
        this.showToast('跳转到帖子详情页', 'info');
        break;
      case 'follow':
        this.showToast('跳转到用户主页', 'info');
        break;
    }
  }

  /**
   * 标记全部为已读 - 顶部按钮的方法
   */
  markAllAsRead() {
    this.notifications.forEach(notification => {
      notification.read = true;
    });
    
    this.saveNotifications();
    this.renderNotifications();
    this.updateStats();
    this.showToast('所有通知已标记为已读', 'success');
    
    this.updateNotificationBadge();
  }

  /**
   * 批量标记为已读 - 复用单条操作的逻辑
   */
  batchMarkAsRead() {
    const selectedIds = Array.from(this.selectedNotifications);
    
    selectedIds.forEach(id => {
      const notification = this.notifications.find(n => n.id === id);
      if (notification) {
        notification.read = true;
      }
    });
    
    this.saveNotifications();
    this.renderNotifications();
    this.updateStats();
    this.selectedNotifications.clear();
    this.updateBatchActionsVisibility();
    this.showToast(`已标记 ${selectedIds.length} 条通知为已读`, 'success');
    
    this.updateNotificationBadge();
  }

  /**
   * 批量删除 - 复用单条操作的逻辑
   */
  batchDelete() {
    const selectedCount = this.selectedNotifications.size;
    if (selectedCount === 0) {
      this.showToast('请先选择通知', 'error');
      return;
    }
    
    if (!confirm(`确定要删除选中的 ${selectedCount} 条通知吗？`)) {
      return;
    }
    
    // 删除选中的通知
    this.notifications = this.notifications.filter(
      n => !this.selectedNotifications.has(n.id)
    );
    
    this.saveNotifications();
    this.renderNotifications();
    this.updateStats();
    this.selectedNotifications.clear();
    this.updateBatchActionsVisibility();
    this.showToast(`已删除 ${selectedCount} 条通知`, 'success');
  }

  /**
   * 创建新通知（供其他页面调用）
   */
  createNotification(notification) {
    const newNotification = {
      id: Date.now().toString(),
      ...notification,
      read: false
    };

    // 特别处理关注通知
    if (newNotification.type === 'follow' && newNotification.message === '关注了你') {
      // 这是粉丝关注我
      newNotification.title = '关注通知';
      newNotification.message = '关注了你';
    } else if (newNotification.type === 'follow' && newNotification.from !== '系统通知') {
      // 这是我关注别人
      newNotification.title = '关注操作';
      newNotification.message = `关注了 ${newNotification.target}`;
      const originalFrom = newNotification.from;
      newNotification.from = '我';
      newNotification.target = originalFrom;
    }

    this.notifications.unshift(newNotification);
    this.saveNotifications();

    // 如果当前在通知页面，更新显示
    if (window.location.pathname.includes('/notifications')) {
      this.renderNotifications();
      this.updateStats();
    }

    // 更新通知徽章
    this.updateNotificationBadge();

    return newNotification;
  }

  /**
   * 保存通知数据
   */
  saveNotifications() {
    localStorage.setItem('userNotifications', JSON.stringify(this.notifications));
  }

  /**
   * 更新通知徽章
   */
  updateNotificationBadge() {
    const unreadCount = this.notifications.filter(n => !n.read).length;
    
    // 更新页面标题的徽章
    const badge = document.getElementById('navNotificationBadge');
    if (badge) {
      if (unreadCount > 0) {
        badge.textContent = unreadCount;
        badge.style.display = 'flex';
      } else {
        badge.style.display = 'none';
      }
    }
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
    let toast = document.getElementById('notificationsToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'notificationsToast';
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

// 初始化通知管理器
let notificationsManager = null;

document.addEventListener('DOMContentLoaded', () => {
  notificationsManager = new NotificationsManager();
  window.notificationsManager = notificationsManager;
});

// 导出供其他页面使用的API
window.NotificationsAPI = {
  createNotification: (notification) => {
    if (window.notificationsManager) {
      return window.notificationsManager.createNotification(notification);
    }
    return null;
  }
};