/**
 * 认证管理类，处理用户登录状态、token管理和导航栏更新
 */
class AuthManager {
  constructor() {
    this.ACCESS_TOKEN_KEY = 'access_token';
    this.REFRESH_TOKEN_KEY = 'refresh_token';
    this.USER_INFO_KEY = 'user_info';
    this.tokenExpiryCheckInterval = null;
  }

  /**
   * 保存登录凭据
   * @param {string} accessToken - 访问令牌
   * @param {string} refreshToken - 刷新令牌
   * @param {Object} userInfo - 用户信息
   */
  saveCredentials(accessToken, refreshToken, userInfo) {
    console.log('AuthManager: 保存登录凭据', userInfo);
    localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(this.USER_INFO_KEY, JSON.stringify(userInfo || {}));
    
    // 启动token过期检查
    this.startTokenExpiryCheck();
    
    // 更新导航栏
    this.updateNavbar();
  }

  /**
   * 获取访问令牌
   * @returns {string|null} 访问令牌或null
   */
  getAccessToken() {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  /**
   * 获取刷新令牌
   * @returns {string|null} 刷新令牌或null
   */
  getRefreshToken() {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * 获取用户信息
   * @returns {Object|null} 用户信息对象或null
   */
  getUserInfo() {
    const userInfoStr = localStorage.getItem(this.USER_INFO_KEY);
    try {
      return userInfoStr ? JSON.parse(userInfoStr) : null;
    } catch (error) {
      console.error('解析用户信息失败:', error);
      return null;
    }
  }

  /**
   * 检查是否已登录
   * @returns {boolean} 是否已登录
   */
  isLoggedIn() {
    return !!this.getAccessToken();
  }

  /**
   * 退出登录
   */
  logout() {
    // 清除localStorage中的凭据
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_INFO_KEY);
    
    // 停止token过期检查
    this.stopTokenExpiryCheck();
    
    // 更新导航栏
    this.updateNavbar();
    
    // 显示退出登录消息
    alert('已成功退出登录');
    
    // 可以选择跳转到登录页或首页
    window.location.href = '/login';
  }

  /**
   * 刷新访问令牌
   * @returns {Promise<boolean>} 刷新是否成功
   */
  async refreshToken() {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      console.log('AuthManager: 没有找到refresh token');
      return false;
    }

    try {
      // 修改为正确的JWT刷新token方式 - 在Authorization头中使用Bearer
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${refreshToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem(this.ACCESS_TOKEN_KEY, data.access_token);
        console.log('AuthManager: token刷新成功');
        return true;
      } else {
        // 服务器返回错误，只有明确的401/403才清除凭据
        console.log('AuthManager: token刷新失败，服务器返回错误');
        const status = response.status;
        if (status === 401 || status === 403) {
          console.log('AuthManager: token无效，执行登出');
          this.logout();
        }
        return false;
      }
    } catch (error) {
      console.error('AuthManager: 刷新token网络错误:', error);
      // 网络错误时不自动登出，避免用户体验问题
      // 仅在控制台记录错误，让用户可以继续使用
      return false;
    }
  }

  /**
   * 启动token过期检查
   */
  startTokenExpiryCheck() {
    // 每5分钟检查一次
    this.tokenExpiryCheckInterval = setInterval(() => {
      this.checkTokenExpiry();
    }, 5 * 60 * 1000);
  }

  /**
   * 停止token过期检查
   */
  stopTokenExpiryCheck() {
    if (this.tokenExpiryCheckInterval) {
      clearInterval(this.tokenExpiryCheckInterval);
      this.tokenExpiryCheckInterval = null;
    }
  }

  /**
   * 检查token是否即将过期
   */
  async checkTokenExpiry() {
    // 简单实现，实际项目中可以解析JWT token检查过期时间
    // 这里我们假设token会在一段时间后过期，尝试自动刷新
    if (this.isLoggedIn()) {
      this.refreshToken();
    }
  }

  /**
   * 获取当前用户信息
   * @returns {Promise<Object|null>} 用户信息或null
   */
  async fetchCurrentUser() {
    const token = this.getAccessToken();
    if (!token) {
      console.log('AuthManager: 没有找到access token');
      return null;
    }

    try {
      console.log('AuthManager: 尝试获取用户信息');
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const user = data.user || data; // 处理不同的响应格式
        localStorage.setItem(this.USER_INFO_KEY, JSON.stringify(user));
        console.log('AuthManager: 获取用户信息成功');
        return user;
      } else if (response.status === 401) {
        // Token过期，尝试刷新
        console.log('AuthManager: 用户信息获取失败，token可能过期，尝试刷新');
        const refreshed = await this.refreshToken();
        if (refreshed) {
          console.log('AuthManager: token刷新成功后再次尝试获取用户信息');
          return this.fetchCurrentUser();
        }
        console.log('AuthManager: token刷新失败，无法获取用户信息');
      } else {
        console.log(`AuthManager: 获取用户信息失败，状态码: ${response.status}`);
      }
      return null;
    } catch (error) {
      console.error('AuthManager: 获取用户信息网络错误:', error);
      // 网络错误时不自动登出，只记录错误
      return null;
    }
  }

  /**
   * 更新导航栏显示
   */
  updateNavbar() {
    console.log('AuthManager: 开始更新导航栏');
    const navAuthContainer = document.querySelector('.nav-auth');
    if (!navAuthContainer) {
      console.log('AuthManager: 未找到导航栏容器');
      return;
    }

    const isLoggedIn = this.isLoggedIn();
    const userInfo = this.getUserInfo();
    
    console.log('AuthManager: 登录状态', isLoggedIn);
    console.log('AuthManager: 用户信息', userInfo);
    
    if (isLoggedIn && userInfo) {
      // 已登录状态：显示用户菜单
      navAuthContainer.innerHTML = `
        <div class="user-menu-container">
          <button class="user-menu-btn" id="user-menu-btn">
            <span class="user-avatar">${userInfo.username?.[0] || 'U'}</span>
            <span class="user-name">${userInfo.username || '用户'}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
          <div class="user-dropdown-menu" id="user-dropdown-menu">
            <div class="user-info">
              <div class="user-avatar-large">${userInfo.username?.[0] || 'U'}</div>
              <div class="user-details">
                <div class="user-fullname">${userInfo.username || '用户'}</div>
                <div class="user-email">${userInfo.email || ''}</div>
              </div>
            </div>
            <div class="dropdown-divider"></div>
            <a href="/profile" class="dropdown-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              个人中心
            </a>
            <div class="dropdown-divider"></div>
            <button class="dropdown-item logout-btn" id="logout-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              退出登录
            </button>
          </div>
        </div>
      `;
      
      // 添加用户菜单事件监听
      const userMenuBtn = document.getElementById('user-menu-btn');
      const userDropdownMenu = document.getElementById('user-dropdown-menu');
      const logoutBtn = document.getElementById('logout-btn');
      
      if (userMenuBtn && userDropdownMenu) {
        userMenuBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          userDropdownMenu.classList.toggle('active');
        });
        
        // 点击页面其他地方关闭菜单
        document.addEventListener('click', () => {
          userDropdownMenu.classList.remove('active');
        });
        
        // 阻止菜单内部点击冒泡
        userDropdownMenu.addEventListener('click', (e) => {
          e.stopPropagation();
        });
      }
      
      if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
          this.logout();
        });
      }
    } else {
      // 未登录状态：显示登录/注册按钮
      navAuthContainer.innerHTML = `
        <a href="/login" class="btn btn-outline">登录/注册</a>
      `;
    }
    console.log('AuthManager: 导航栏更新完成');
  }
}

// 创建全局实例
const authManager = new AuthManager();

// 页面加载时检查登录状态并更新导航栏
document.addEventListener('DOMContentLoaded', () => {
  console.log('AuthManager: 页面加载完成，检查登录状态');
  
  // 先更新导航栏，让用户界面立即显示正确状态
  authManager.updateNavbar();
  
  // 延迟获取用户信息，避免登录后立即触发可能的错误处理
  if (authManager.isLoggedIn()) {
    setTimeout(() => {
      console.log('AuthManager: 延迟获取用户信息');
      authManager.fetchCurrentUser().then(() => {
        // 重新更新导航栏以显示最新用户信息
        console.log('AuthManager: 获取用户信息后更新导航栏');
        authManager.updateNavbar();
      });
    }, 500);
  }
});

// 为API请求添加拦截器，自动附加Authorization头
document.addEventListener('DOMContentLoaded', () => {
  // 保存原始fetch
  const originalFetch = window.fetch;
  
  // 用于防止无限刷新的标志
  let isRefreshing = false;
  
  // 重写fetch
  window.fetch = async (url, options = {}) => {
    // 只对API请求添加token（排除refresh请求，避免重复添加refresh token）
    if (url.startsWith('/api') && !url.includes('/login') && !url.includes('/register') && !url.includes('/refresh')) {
      const token = authManager.getAccessToken();
      if (token) {
        options.headers = {
          ...options.headers,
          'Authorization': `Bearer ${token}`
        };
      }
    }
    
    // 执行原始fetch
    let response = await originalFetch(url, options);
    
    // 处理401错误（token过期）- 只处理非refresh请求和避免重复刷新
    if (response.status === 401 && url.startsWith('/api') && !url.includes('/refresh') && !isRefreshing) {
      console.log(`AuthManager: 请求${url}返回401，尝试刷新token`);
      try {
        // 设置刷新中标志
        isRefreshing = true;
        
        // 尝试刷新token
        const refreshed = await authManager.refreshToken();
        
        if (refreshed) {
          // 刷新成功后重新请求
          console.log(`AuthManager: token刷新成功，重新请求${url}`);
          const newToken = authManager.getAccessToken();
          options.headers = {
            ...options.headers,
            'Authorization': `Bearer ${newToken}`
          };
          response = await originalFetch(url, options);
        }
      } finally {
        // 无论成功失败都重置刷新标志
        isRefreshing = false;
      }
    }
    
    return response;
  };
});

// 认证页面交互逻辑
document.addEventListener('DOMContentLoaded', () => {
  // 登录/注册标签切换
  const tabBtns = document.querySelectorAll('.tab-btn');
  if (tabBtns.length > 0) {
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        
        // 更新标签样式
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // 切换表单显示
        document.querySelectorAll('.auth-form-container').forEach(container => {
          container.classList.remove('active');
        });
        document.getElementById(`${tab}-form`).classList.add('active');
      });
    });
  }
  
  // 登录方式切换
  const modeBtns = document.querySelectorAll('.login-mode-switch .mode-btn');
  if (modeBtns.length > 0) {
    modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        
        // 更新按钮样式
        modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // 切换登录表单
        document.querySelectorAll('#login-form .auth-form').forEach(form => {
          form.classList.remove('active');
        });
        document.getElementById(`${mode}-login-form`).classList.add('active');
      });
    });
  }
  
  // 显示/隐藏密码
  const togglePasswordBtns = document.querySelectorAll('.toggle-password');
  togglePasswordBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.closest('.password-input-wrapper').querySelector('input');
      const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
      input.setAttribute('type', type);
      
      // 切换图标
      const svg = btn.querySelector('svg');
      if (type === 'text') {
        // 切换为隐藏密码图标
        svg.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><line x1="12" y1="4" x2="12" y2="20"></line>';
      } else {
        // 切换为显示密码图标
        svg.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>';
      }
    });
  });
});

