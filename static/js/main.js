document.addEventListener('DOMContentLoaded', () => {
  // 检查用户登录状态并更新导航栏
  checkUserLoginAndUpdateNav();

  const gridBtn = document.getElementById('gridViewBtn');
  const listBtn = document.getElementById('listViewBtn');
  const grid = document.getElementById('worksGrid');
  const list = document.getElementById('worksList');
  const typeButtons = document.querySelectorAll('.type-btn');
  const chips = document.querySelectorAll('.chip');
  const searchInput = document.getElementById('globalSearchInput');
  const searchBtn = document.getElementById('searchBtn');

  /**
   * 检查用户登录状态并更新导航栏
   */
  function checkUserLoginAndUpdateNav() {
    // 尝试从localStorage获取用户信息
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('access_token');
    
    if (userStr && token) {
      try {
        const user = JSON.parse(userStr);
        // 更新导航栏为已登录状态
        updateNavForLoggedInUser(user);
      } catch (e) {
        console.error('解析用户信息失败:', e);
        // 如果解析失败，更新为未登录状态
        updateNavForLoggedOutUser();
      }
    } else {
      // 未登录状态
      updateNavForLoggedOutUser();
    }
  }

  /**
   * 更新导航栏为已登录状态
   */
  function updateNavForLoggedInUser(user) {
    const authLink = document.querySelector('.auth-link');
    if (authLink) {
      // 替换为用户信息和退出登录按钮
      authLink.outerHTML = `
        <div class="user-menu">
          <div class="user-info">
            <span class="user-name">${user.username || '用户'}</span>
          </div>
          <a href="/profile" class="nav-link">个人中心</a>
          <a href="javascript:void(0)" id="logoutBtn" class="nav-link logout-btn">退出登录</a>
        </div>
      `;
      
      // 添加退出登录事件监听
      const logoutBtn = document.getElementById('logoutBtn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
      }
    }
  }

  /**
   * 更新导航栏为未登录状态
   */
  function updateNavForLoggedOutUser() {
    const authLink = document.querySelector('.auth-link');
    if (authLink) {
      // 确保是登录/注册链接
      authLink.href = '/auth';
      authLink.textContent = '登录/注册';
    }
  }

  /**
   * 处理退出登录
   */
  function handleLogout() {
    // 清除localStorage中的用户信息和token
    localStorage.removeItem('user');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    
    // 更新导航栏
    updateNavForLoggedOutUser();
    
    // 刷新页面或跳转到首页
    window.location.href = '/';
  }

  // 视图切换
  if (gridBtn && listBtn && grid && list) {
    gridBtn.addEventListener('click', () => {
      gridBtn.classList.add('active');
      listBtn.classList.remove('active');
      grid.classList.remove('hidden');
      list.classList.add('hidden');
      gridBtn.setAttribute('aria-pressed', 'true');
      listBtn.setAttribute('aria-pressed', 'false');
    });
    listBtn.addEventListener('click', () => {
      listBtn.classList.add('active');
      gridBtn.classList.remove('active');
      list.classList.remove('hidden');
      grid.classList.add('hidden');
      listBtn.setAttribute('aria-pressed', 'true');
      gridBtn.setAttribute('aria-pressed', 'false');
    });
  }

  // 检索类型切换（示例）
  typeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      typeButtons.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
    });
  });

  // 风格筛选 chips（示例）
  chips.forEach(chip => {
    chip.addEventListener('click', () => chip.classList.toggle('selected'));
  });

  // 搜索按钮（示例）
  if (searchBtn && searchInput) {
    searchBtn.addEventListener('click', () => {
      const keyword = searchInput.value.trim();
      if (!keyword) {
        alert('请输入搜索关键词');
        return;
      }
      // 示例：仅提示，后续接入真实检索逻辑
      console.log('搜索：', keyword);
    });
  }
});