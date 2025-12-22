// ========== 个人中心页面 JavaScript (支持 Mock 模式) ========== 

let API_BASE = 'http://10.234.242.47:5000';
let USE_MOCK_DATA = false; // 默认使用真实 API，可通过页面调试面板切换

let currentUser = null;
let currentPage = {
  works: 1,
  collections: 1,
  posts: 1
};

// ========== Mock 数据生成器 ========== 
const MockDataGenerator = {
  // 生成 Mock 用户信息
  generateUser() {
    return {
      id: 1,
      username: '书法爱好者',
      email: 'user@example.com',
      avatar: null,
      bio: '专注于传统书法研究与创作，喜欢篆书和隶书的结合表现。',
      created_at: '2024-01-15T10:00:00Z',
      stats: {
        works_count: 12,
        collections_count: 8,
        posts_count: 15,
        followers_count: 42,
        following_count: 28
      }
    };
  },

  // 生成 Mock 作品列表
  generateWorks(count = 12) {
    const styles = ['楷书', '行书', '草书', '篆书', '隶书'];
    const works = [];
    
    for (let i = 1; i <= count; i++) {
      works.push({
        id: i,
        title: `作品 ${i}`,
        description: `这是一件精美的书法作品，展现了中国传统文化的魅力。`,
        image_url: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect width='200' height='200' fill='%23f8f6ee'/%3E%3Ctext x='50%25' y='50%25' font-size='48' fill='%238b4513' text-anchor='middle' dominant-baseline='middle'%3E${String.fromCharCode(19968 + Math.floor(Math.random() * 100))}%3C/text%3E%3C/svg%3E`,
        style: styles[Math.floor(Math.random() * styles.length)],
        views: Math.floor(Math.random() * 500) + 10,
        status: 'approved',
        created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        likes_count: Math.floor(Math.random() * 50),
        comments_count: Math.floor(Math.random() * 20),
        collections_count: Math.floor(Math.random() * 15),
        author: {
          id: 1,
          username: '书法爱好者',
          avatar: null
        }
      });
    }
    
    return works;
  },

  // 生成 Mock 收藏列表
  generateCollections(count = 8) {
    const works = this.generateWorks(count);
    return works.map((work, index) => ({
      id: index + 1,
      user_id: 1,
      work_id: work.id,
      work: work,
      created_at: new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000).toISOString()
    }));
  },

  // 生成 Mock 帖子列表
  generatePosts(count = 15) {
    const topics = [
      '分享我最近的书法练习心得',
      '如何快速提升书法水平？',
      '楷书VS行书，哪个更难？',
      '毛笔选择有讲究吗？',
      '古人的书法是如何传承的',
      '现代人学书法还有意义吗？',
      '如何评判一件书法作品的好坏',
      '书法笔画的力道该如何控制'
    ];

    const posts = [];
    for (let i = 1; i <= count; i++) {
      posts.push({
        id: i,
        title: topics[i % topics.length],
        content: `这是一篇关于书法的精彩讨论。我分享了我在书法学习过程中的经验和感悟，希望能帮助更多人了解和热爱书法艺术。这件作品融合了传统和现代元素，体现了中国文化的深厚底蕴。`,
        author_id: 1,
        created_at: new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000).toISOString(),
        likes_count: Math.floor(Math.random() * 100),
        comments_count: Math.floor(Math.random() * 30),
        author: {
          id: 1,
          username: '书法爱好者',
          avatar: null
        }
      });
    }
    
    return posts;
  },

  // 生成 Mock 粉丝/关注列表
  generateUsers(count = 10) {
    const names = ['张三', '李四', '王五', '赵六', '孙七', '周八', '吴九', '郑十', '韩十一', '曹十二'];
    const users = [];
    
    for (let i = 0; i < count; i++) {
      users.push({
        id: i + 2,
        username: names[i % names.length] + Math.floor(Math.random() * 100),
        avatar: null,
        email: `user${i + 2}@example.com`
      });
    }
    
    return users;
  }
};

// ========== Mock API 模拟 ========== 
const MockAPI = {
  async get(url) {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 300));

    if (url.includes('/api/auth/me')) {
      return {
        ok: true,
        json: async () => MockDataGenerator.generateUser()
      };
    } else if (url.includes('/api/users/') && url.includes('/works')) {
      return {
        ok: true,
        json: async () => ({
          total: 12,
          pages: 1,
          current_page: 1,
          items: MockDataGenerator.generateWorks(12)
        })
      };
    } else if (url.includes('/api/collections')) {
      return {
        ok: true,
        json: async () => ({
          total: 8,
          pages: 1,
          current_page: 1,
          items: MockDataGenerator.generateCollections(8)
        })
      };
    } else if (url.includes('/api/posts')) {
      return {
        ok: true,
        json: async () => ({
          total: 15,
          pages: 1,
          current_page: 1,
          items: MockDataGenerator.generatePosts(15)
        })
      };
    } else if (url.includes('/api/users/') && url.includes('/followers')) {
      return {
        ok: true,
        json: async () => ({
          total: 42,
          items: MockDataGenerator.generateUsers(10)
        })
      };
    } else if (url.includes('/api/users/') && url.includes('/following')) {
      return {
        ok: true,
        json: async () => ({
          total: 28,
          items: MockDataGenerator.generateUsers(8)
        })
      };
    }

    return {
      ok: false,
      json: async () => ({ error: '未找到匹配的API' })
    };
  },

  async post(url, data) {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (url.includes('/api/users/profile')) {
      localStorage.setItem('mockUserData', JSON.stringify({
        ...MockDataGenerator.generateUser(),
        ...data
      }));
      return {
        ok: true,
        json: async () => ({
          message: '资料更新成功',
          user: { ...MockDataGenerator.generateUser(), ...data }
        })
      };
    } else if (url.includes('/api/users/password')) {
      return {
        ok: true,
        json: async () => ({ message: '密码修改成功' })
      };
    } else if (url.includes('/api/users/avatar')) {
      return {
        ok: true,
        json: async () => ({
          message: '头像上传成功',
          avatar_url: 'avatars/mock_avatar.jpg'
        })
      };
    } else if (url.includes('/api/auth/logout')) {
      return {
        ok: true,
        json: async () => ({ message: '退出成功' })
      };
    }

    return {
      ok: false,
      json: async () => ({ error: '未找到匹配的API' })
    };
  },
  
  async put(url, data) {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // 处理用户资料更新
    if (url.includes('/api/users/profile')) {
      localStorage.setItem('mockUserData', JSON.stringify({
        ...MockDataGenerator.generateUser(),
        ...data
      }));
      return {
        ok: true,
        json: async () => ({
          message: '资料更新成功',
          user: { ...MockDataGenerator.generateUser(), ...data }
        })
      };
    } 
    // 处理密码修改
    else if (url.includes('/api/users/password')) {
      // 模拟原密码验证，在实际应用中应该验证原密码是否正确
      // 这里假设原密码是固定的 'test123'，仅用于测试
      if (data.old_password !== 'test123') {
        return {
          ok: false,
          json: async () => ({ error: '原密码错误' })
        };
      }
      
      // 原密码正确，返回成功响应
      return {
        ok: true,
        json: async () => ({ message: '密码修改成功' })
      };
    }

    return {
      ok: false,
      json: async () => ({ error: '未找到匹配的API' })
    };
  }
};

// ========== 初始化 ========== 
document.addEventListener('DOMContentLoaded', function() {
  // 检查是否在 Mock 模式或有 token
  const token = localStorage.getItem('access_token');
  if (!token && !USE_MOCK_DATA) {
    window.location.href = '/auth';
    return;
  }

  // 初始化 Mock 控制面板
  initMockPanel();
  
  // 初始化事件监听
  initEventListeners();
  
  // 加载用户信息
  loadUserInfo();
});

// ========== 初始化 Mock 控制面板 ========== 
function initMockPanel() {
  const mockToggle = document.getElementById('mockToggle');
  const mockStatus = document.getElementById('mockStatus');
  const apiBaseInput = document.getElementById('apiBaseInput');
  const loadMockDataBtn = document.getElementById('loadMockDataBtn');
  const showMockDataBtn = document.getElementById('showMockDataBtn');
  const clearStorageBtn = document.getElementById('clearStorageBtn');

  // 从 localStorage 读取设置
  const savedSettings = JSON.parse(localStorage.getItem('profileSettings') || '{}');
  USE_MOCK_DATA = savedSettings.useMockData !== false;
  API_BASE = savedSettings.apiBase || 'http://localhost:5000';

  mockToggle.checked = USE_MOCK_DATA;
  apiBaseInput.value = API_BASE;
  updateMockStatus();

  // Mock 模式切换
  mockToggle.addEventListener('change', function() {
    USE_MOCK_DATA = this.checked;
    localStorage.setItem('profileSettings', JSON.stringify({
      useMockData: USE_MOCK_DATA,
      apiBase: API_BASE
    }));
    updateMockStatus();
    loadUserInfo();
  });

  // API 地址更新
  apiBaseInput.addEventListener('change', function() {
    API_BASE = this.value || 'http://localhost:5000';
    localStorage.setItem('profileSettings', JSON.stringify({
      useMockData: USE_MOCK_DATA,
      apiBase: API_BASE
    }));
  });

  // 重新加载 Mock 数据
  loadMockDataBtn.addEventListener('click', function() {
    localStorage.removeItem('mockUserData');
    loadUserInfo();
    showToast('Mock 数据已重新生成', 'success');
  });

  // 查看 Mock 数据
  showMockDataBtn.addEventListener('click', showMockDataModal);

  // 清空本地存储
  clearStorageBtn.addEventListener('click', function() {
    if (confirm('确定要清空所有本地存储数据吗？')) {
      localStorage.clear();
      showToast('本地存储已清空', 'success');
      setTimeout(() => location.reload(), 500);
    }
  });
}

function updateMockStatus() {
  const mockStatus = document.getElementById('mockStatus');
  if (USE_MOCK_DATA) {
    mockStatus.textContent = '✓ Mock 模式已启用';
    mockStatus.style.color = '#28a745';
  } else {
    mockStatus.textContent = '✗ 使用真实 API';
    mockStatus.style.color = '#ff6b6b';
  }
}

function showMockDataModal() {
  const modal = document.getElementById('mockDataModal');
  const mockDataBody = document.getElementById('mockDataBody');

  const mockData = {
    user: MockDataGenerator.generateUser(),
    works: MockDataGenerator.generateWorks(3),
    collections: MockDataGenerator.generateCollections(2),
    posts: MockDataGenerator.generatePosts(3),
    followers: MockDataGenerator.generateUsers(3),
    following: MockDataGenerator.generateUsers(3)
  };

  mockDataBody.innerHTML = `
    <pre style="background: #f5f5f5; padding: 12px; border-radius: 8px; overflow-x: auto; font-size: 12px;">
${JSON.stringify(mockData, null, 2)}
    </pre>
  `;

  modal.classList.add('show');
}

// ========== 事件监听初始化 ========== 
function initEventListeners() {
  // 标签页切换
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.addEventListener('click', function() {
      const tabName = this.dataset.tab;
      switchTab(tabName);
    });
  });

  // 头像上传
  document.getElementById('avatarInput').addEventListener('change', handleAvatarUpload);

  // 设置按钮
  document.getElementById('editProfileBtn').addEventListener('click', function() {
    switchTab('settings');
  });
  
  document.getElementById('settingsBtn').addEventListener('click', function() {
    switchTab('settings');
  });

  // 保存资料
  document.getElementById('saveProfileBtn').addEventListener('click', updateProfile);

  // 修改密码
  document.getElementById('changePasswordBtn').addEventListener('click', changePassword);

  // 退出登录
  document.getElementById('logoutBtn').addEventListener('click', logout);

  // 模态框关闭
  document.getElementById('modalCloseBtn').addEventListener('click', closeModal);
  document.getElementById('mockDataCloseBtn').addEventListener('click', closeMockDataModal);
  
  document.getElementById('userListModal').addEventListener('click', function(e) {
    if (e.target === this) closeModal();
  });

  document.getElementById('mockDataModal').addEventListener('click', function(e) {
    if (e.target === this) closeMockDataModal();
  });

  // 统计卡片点击事件
  const worksStatCard = document.getElementById('worksStatCard');
  if (worksStatCard) {
    worksStatCard.addEventListener('click', function() {
      switchTab('works');
    });
  }
  
  const collectionsStatCard = document.getElementById('collectionsStatCard');
  if (collectionsStatCard) {
    collectionsStatCard.addEventListener('click', function() {
      switchTab('collections');
    });
  }
  
  // postsStatCard 元素已移除，注释掉或移除相关代码
  // const postsStatCard = document.getElementById('postsStatCard');
  // if (postsStatCard) {
  //   postsStatCard.addEventListener('click', function() {
  //     switchTab('posts');
  //   });
  // }
  
  const followersStatCard = document.getElementById('followersStatCard');
  if (followersStatCard) {
    followersStatCard.addEventListener('click', function() {
      showFollowers();
    });
  }
}

// ========== 统一 fetch 函数 ========== 
async function customFetch(url, options = {}) {
  console.log('[customFetch] 请求开始:', {
    url,
    method: options.method || 'GET',
    useMock: USE_MOCK_DATA,
    hasToken: !!localStorage.getItem('access_token')
  });
  
  if (USE_MOCK_DATA) {
    console.log('[customFetch] 使用 Mock 数据模式');
    // 根据请求方法调用相应的 MockAPI 方法
    const method = options.method || 'GET';
    const body = options.body && typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
    
    switch (method.toUpperCase()) {
      case 'POST':
        return await MockAPI.post(url, body);
      case 'PUT':
        return await MockAPI.put(url, body);
      default:
        return await MockAPI.get(url);
    }
  } else {
    // 真实 API 调用，添加 Token 管理和错误处理
    const token = localStorage.getItem('access_token');
    
    // 合并请求头
    let headers = {
      ...options.headers,
    };
    
    // 仅在 body 存在且不是 FormData 时设置 Content-Type
    if (options.body && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
    
    // 添加 Authorization 头
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // 更新 options
    const fetchOptions = {
      ...options,
      headers,
    };
    
    try {
      const response = await fetch(url, fetchOptions);
      
      console.log('[customFetch] 请求成功:', {
        url,
        status: response.status,
        statusText: response.statusText
      });
      
      // 处理 401 未授权错误
      if (response.status === 401) {
        console.error('[customFetch] 401 未授权，跳转到登录页面');
        // 清除本地存储的 Token
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        
        // 跳转到登录页面
        window.location.href = '/auth';
        return;
      }
      
      return response;
    } catch (error) {
      console.error('[customFetch] API 请求错误:', error);
      throw new Error('网络错误，请稍后重试');
    }
  }
}

// ========== 加载用户信息 ========== 
async function loadUserInfo() {
  console.log('[loadUserInfo] 开始加载用户信息');
  
  // 显示加载状态
  showLoadingState();
  
  try {
    const response = await customFetch(`${API_BASE}/api/auth/me`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[loadUserInfo] 加载失败:', errorData);
      throw new Error(errorData.error || '加载用户信息失败');
    }

    const responseData = await response.json();
    // 后端返回的是 {user: {...}}，所以需要获取 user 属性
    currentUser = responseData.user;
    console.log('[loadUserInfo] 加载成功，用户信息:', currentUser);
    
    // 将用户信息保存到localStorage，确保其他页面能获取到最新信息
    localStorage.setItem('user', JSON.stringify(currentUser));
    
    renderUserInfo();
    loadWorks(); // 默认加载作品
    
    // 隐藏加载状态
    hideLoadingState();
  } catch (error) {
    console.error('[loadUserInfo] 异常:', error);
    hideLoadingState();
    showToast('加载用户信息失败: ' + error.message, 'error');
  }
}

// ========== 显示加载状态 ========== 
function showLoadingState() {
  // 在用户信息区域显示加载状态
  document.querySelectorAll('.profile-header, .tabs-content').forEach(el => {
    el.style.opacity = '0.6';
  });
  
  // 如果需要，可以添加更详细的加载指示器
}

// ========== 隐藏加载状态 ========== 
function hideLoadingState() {
  document.querySelectorAll('.profile-header, .tabs-content').forEach(el => {
    el.style.opacity = '1';
  });
}

// ========== 渲染用户信息 ========== 
function renderUserInfo() {
  if (!currentUser) return;

  // 基本信息
  const userNameEl = document.getElementById('userName');
  const userBioEl = document.getElementById('userBio');
  
  if (userNameEl) {
    userNameEl.textContent = currentUser.username;
  }
  
  // 注意：userEmail 元素在 HTML 中不存在，只在设置表单中使用 editEmail 元素
  if (userBioEl) {
    userBioEl.textContent = currentUser.bio || '暂无简介';
  }
  
  // 头像
  const avatarImg = document.getElementById('userAvatar');
  if (avatarImg) {
    if (currentUser.avatar && currentUser.avatar !== 'default_avatar.png') {
      // 正确构建头像URL，包含avatars子路径
      avatarImg.src = `/uploads/avatars/${currentUser.avatar}`;
      // 重置样式，确保图片显示
      avatarImg.style.background = '';
      avatarImg.style.display = '';
      avatarImg.style.alignItems = '';
      avatarImg.style.justifyContent = '';
      avatarImg.style.color = '';
      avatarImg.style.fontSize = '';
      avatarImg.textContent = '';
    } else {
      // 使用默认头像或生成一个颜色背景
      avatarImg.style.background = 'linear-gradient(135deg, #8b4513, #6d380e)';
      avatarImg.style.display = 'flex';
      avatarImg.style.alignItems = 'center';
      avatarImg.style.justifyContent = 'center';
      avatarImg.style.color = 'white';
      avatarImg.style.fontSize = '48px';
      avatarImg.textContent = currentUser.username.charAt(0).toUpperCase();
      // 清空src，避免404错误
      avatarImg.src = '';
    }
  }

  // 统计数据
  const worksCountEl = document.getElementById('worksCount');
  const collectionsCountEl = document.getElementById('collectionsCount');
  const postsCountEl = document.getElementById('postsCount');
  const followersCountEl = document.getElementById('followersCount');
  
  // 兼容 Mock 数据和真实 API 数据格式
  const userStats = currentUser.stats || currentUser;
  
  if (worksCountEl) {
    worksCountEl.textContent = userStats.works_count;
  }
  
  if (collectionsCountEl) {
    collectionsCountEl.textContent = userStats.collections_count;
  }
  
  if (postsCountEl) {
    postsCountEl.textContent = userStats.posts_count;
  }
  
  if (followersCountEl) {
    followersCountEl.textContent = userStats.followers_count;
  }

  // 填充设置表单
  document.getElementById('editEmail').value = currentUser.email;
  document.getElementById('editBio').value = currentUser.bio || '';
}

// ========== 标签页切换 ========== 
function switchTab(tabName) {
  // 隐藏所有标签页
  document.querySelectorAll('.tab-content').forEach(el => {
    el.classList.remove('active');
  });

  // 取消所有按钮激活状态
  document.querySelectorAll('.tab-button').forEach(el => {
    el.classList.remove('active');
  });

  // 激活选中的标签页和按钮
  document.getElementById(tabName).classList.add('active');
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

  // 加载相应数据
  if (tabName === 'works') {
    loadWorks();
  } else if (tabName === 'collections') {
    loadCollections();
  } else if (tabName === 'posts') {
    loadPosts();
  }
}

// ========== 加载作品 ========== 
async function loadWorks(page = 1) {
  try {
    const container = document.getElementById('worksContainer');
    container.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>加载中...</p></div>';

    const response = await customFetch(
      `${API_BASE}/api/users/${currentUser.id}/works?page=${page}&per_page=12`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token') || 'mock-token'}`
        }
      }
    );

    if (!response.ok) throw new Error('加载失败');

    const data = await response.json();
    // 兼容真实 API 和 Mock 数据格式
    const works = data.works || data.items || [];
    renderWorksGrid(works);
    currentPage.works = page;
  } catch (error) {
    document.getElementById('worksContainer').innerHTML = 
      `<div class="empty-state"><div class="empty-icon">❌</div><div class="empty-text">加载失败: ${error.message}</div></div>`;
  }
}

// ========== 渲染作品网格 ========== 
function renderWorksGrid(works) {
  const container = document.getElementById('worksContainer');
  
  if (works.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📚</div>
        <div class="empty-text">还没有作品</div>
        <div class="empty-action">
          <a href="/work-upload" class="btn btn-primary">上传作品</a>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="works-grid">
      ${works.map(work => `
        <div class="grid-item" onclick="viewWork(${work.id})">
          <img src="${work.image_url.startsWith('http') || work.image_url.startsWith('/uploads/') ? work.image_url : `${API_BASE}/uploads/works/${work.image_url}`}" alt="${work.title}" class="grid-item-image" style="background: linear-gradient(135deg, #f8f6ee 0%, #f1ede0 50%, #ece6d6 100%); object-fit: cover;">
          <div class="grid-item-info">
            <p class="grid-item-title">${work.title}</p>
            <p class="grid-item-meta">👁️ ${work.views} | ❤️ ${work.likes_count}</p>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// ========== 加载收藏 ========== 
async function loadCollections(page = 1) {
  try {
    const container = document.getElementById('collectionsContainer');
    container.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>加载中...</p></div>';

    const response = await customFetch(
      `${API_BASE}/api/collections?page=${page}&per_page=12`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token') || 'mock-token'}`
        }
      }
    );

    if (!response.ok) throw new Error('加载失败');

    const data = await response.json();
    // 兼容真实 API 和 Mock 数据格式
    const collections = data.items || [];
    const works = collections.map(col => col.work).filter(w => w);
    renderCollectionsGrid(works);
    currentPage.collections = page;
  } catch (error) {
    document.getElementById('collectionsContainer').innerHTML = 
      `<div class="empty-state"><div class="empty-icon">❌</div><div class="empty-text">加载失败: ${error.message}</div></div>`;
  }
}

// ========== 渲染收藏网格 ========== 
function renderCollectionsGrid(works) {
  const container = document.getElementById('collectionsContainer');
  
  if (works.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">❤️</div>
        <div class="empty-text">还没有收藏</div>
        <div class="empty-action">
          <a href="/" class="btn btn-primary">去浏览作品</a>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="collections-grid">
      ${works.map(work => `
        <div class="grid-item" onclick="viewWork(${work.id})">
        <img src="${work.image_url.startsWith('http') || work.image_url.startsWith('/uploads/') ? work.image_url : `${API_BASE}/uploads/works/${work.image_url}`}" alt="${work.title}" class="grid-item-image" style="background: linear-gradient(135deg, #f8f6ee 0%, #f1ede0 50%, #ece6d6 100%); object-fit: cover;">
        <div class="grid-item-info">
          <p class="grid-item-title">${work.title}</p>
          <p class="grid-item-meta">by ${work.author.username}</p>
        </div>
      </div>
      `).join('')}
    </div>
  `;
}

// ========== 加载帖子 ========== 
async function loadPosts(page = 1) {
  try {
    const container = document.getElementById('postsContainer');
    container.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>加载中...</p></div>';

    const response = await customFetch(
      `${API_BASE}/api/posts?author_id=${currentUser.id}&page=${page}&per_page=12`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token') || 'mock-token'}`
        }
      }
    );

    if (!response.ok) throw new Error('加载失败');

    const data = await response.json();
    // 兼容真实 API 和 Mock 数据格式
    const posts = data.posts || data.items || [];
    renderPostsList(posts);
    currentPage.posts = page;
  } catch (error) {
    document.getElementById('postsContainer').innerHTML = 
      `<div class="empty-state"><div class="empty-icon">❌</div><div class="empty-text">加载失败: ${error.message}</div></div>`;
  }
}

// ========== 渲染帖子列表 ========== 
function renderPostsList(posts) {
  const container = document.getElementById('postsContainer');
  
  if (posts.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">💬</div>
        <div class="empty-text">还没有发布帖子</div>
        <div class="empty-action">
          <a href="/community" class="btn btn-primary">去社区</a>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="posts-list">
      ${posts.map(post => `
        <div class="post-item" onclick="viewPost(${post.id})">
          <h4 class="post-title">${post.title || '无标题'}</h4>
          <p class="post-content">${post.content}</p>
          <div class="post-meta">
            <span>❤️ ${post.likes_count} 赞</span>
            <span>💬 ${post.comments_count} 条评论</span>
            <span>${formatDate(post.created_at)}</span>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// ========== 更新资料 ========== 
async function updateProfile() {
  const email = document.getElementById('editEmail').value.trim();
  const bio = document.getElementById('editBio').value.trim();
  const saveBtn = document.getElementById('saveProfileBtn');
  
  // 保存原始按钮文本
  const originalBtnText = saveBtn.textContent;

  console.log('[updateProfile] 开始更新资料:', { email, bio });

  // 表单验证
  if (!email) {
    showToast('邮箱地址不能为空', 'error');
    return;
  }
  
  // 邮箱格式验证
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showToast('请输入有效的邮箱地址', 'error');
    return;
  }
  
  // 显示加载状态
  saveBtn.textContent = '保存中...';
  saveBtn.disabled = true;

  try {
    const response = await customFetch(`${API_BASE}/api/users/profile`, {
      method: 'PUT',
      body: JSON.stringify({ email, bio })
    });

    console.log('[updateProfile] 响应状态:', { ok: response.ok, status: response.status });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[updateProfile] 更新失败:', errorData);
      throw new Error(errorData.error || '更新失败');
    }

    const result = await response.json();
    console.log('[updateProfile] 更新成功:', result);

    showToast('资料更新成功', 'success');
    console.log('[updateProfile] 开始重新加载用户信息');
    await loadUserInfo();
    console.log('[updateProfile] 用户信息重新加载完成');
  } catch (error) {
    console.error('[updateProfile] 异常:', error);
    showToast('资料更新失败: ' + error.message, 'error');
  } finally {
    // 恢复按钮状态
    saveBtn.textContent = originalBtnText;
    saveBtn.disabled = false;
  }
}

// ========== 修改密码 ========== 
async function changePassword() {
  const oldPassword = document.getElementById('oldPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const changeBtn = document.getElementById('changePasswordBtn');
  
  // 保存原始按钮文本
  const originalBtnText = changeBtn.textContent;

  // 表单验证
  if (!oldPassword || !newPassword || !confirmPassword) {
    showToast('请填写所有密码字段', 'error');
    return;
  }

  if (newPassword !== confirmPassword) {
    showToast('两次输入的密码不一致', 'error');
    return;
  }

  if (newPassword.length < 6) {
    showToast('新密码长度至少为 6 个字符', 'error');
    return;
  }
  
  // 显示加载状态
  changeBtn.textContent = '修改中...';
  changeBtn.disabled = true;

  try {
    const response = await customFetch(`${API_BASE}/api/users/password`, {
      method: 'PUT',
      body: JSON.stringify({
        old_password: oldPassword,
        new_password: newPassword
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || '修改失败');
    }

    showToast('密码修改成功', 'success');
    
    // 清空表单
    document.getElementById('oldPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
  } catch (error) {
    showToast('密码修改失败: ' + error.message, 'error');
  } finally {
    // 恢复按钮状态
    changeBtn.textContent = originalBtnText;
    changeBtn.disabled = false;
  }
}

// ========== 头像上传 ========== 
async function handleAvatarUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (USE_MOCK_DATA) {
    showToast('Mock 模式：头像上传已模拟', 'success');
    e.target.value = '';
    return;
  }

  // 验证文件大小（最大 5MB）
  if (file.size > 5 * 1024 * 1024) {
    showToast('文件大小不能超过 5MB', 'error');
    return;
  }

  // 验证文件类型
  if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
    showToast('仅支持 JPG、PNG、GIF、WebP 格式', 'error');
    return;
  }

  // 显示上传中提示
  const avatarUploadBtn = document.querySelector('.avatar-upload-btn');
  const originalBtnText = avatarUploadBtn.innerHTML;
  avatarUploadBtn.innerHTML = '<span>上传中...</span>';
  avatarUploadBtn.style.pointerEvents = 'none';

  try {
    const formData = new FormData();
    formData.append('avatar', file);

    // 使用 fetch 直接调用，因为 FormData 不需要 Content-Type 头
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE}/api/users/avatar`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || '上传失败');
    }

    showToast('头像上传成功', 'success');
    await loadUserInfo();
  } catch (error) {
    showToast('头像上传失败: ' + error.message, 'error');
  } finally {
    // 恢复按钮状态
    avatarUploadBtn.innerHTML = originalBtnText;
    avatarUploadBtn.style.pointerEvents = 'auto';
    e.target.value = '';
  }
}

// ========== 显示粉丝列表 ========== 
async function showFollowers() {
  try {
    const modal = document.getElementById('userListModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');

    modalTitle.textContent = '粉丝列表';
    modalBody.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';

    const response = await customFetch(
      `${API_BASE}/api/users/${currentUser.id}/followers`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token') || 'mock-token'}`
        }
      }
    );

    if (!response.ok) throw new Error('加载失败');

    const data = await response.json();
    renderUserList(data.items, modalBody);
    modal.classList.add('show');
  } catch (error) {
    showToast('加载粉丝列表失败: ' + error.message, 'error');
  }
}

// ========== 显示关注列表 ========== 
async function showFollowing() {
  try {
    const modal = document.getElementById('userListModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');

    modalTitle.textContent = '关注列表';
    modalBody.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';

    const response = await customFetch(
      `${API_BASE}/api/users/${currentUser.id}/following`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token') || 'mock-token'}`
        }
      }
    );

    if (!response.ok) throw new Error('加载失败');

    const data = await response.json();
    renderUserList(data.items, modalBody);
    modal.classList.add('show');
  } catch (error) {
    showToast('加载关注列表失败: ' + error.message, 'error');
  }
}

// ========== 渲染用户列表 ========== 
function renderUserList(users, container) {
  if (users.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">暂无用户</p>';
    return;
  }

  container.innerHTML = users.map(user => `
    <div class="user-list-item">
      <div class="user-list-avatar">${user.username.charAt(0).toUpperCase()}</div>
      <div class="user-list-info">
        <p class="user-list-name">${user.username}</p>
        <p class="user-list-email">${user.email || '-'}</p>
      </div>
    </div>
  `).join('');
}

// ========== 关闭模态框 ========== 
function closeModal() {
  document.getElementById('userListModal').classList.remove('show');
}

function closeMockDataModal() {
  document.getElementById('mockDataModal').classList.remove('show');
}

// ========== 退出登录 ========== 
async function logout() {
  if (!confirm('确定要退出登录吗？')) return;
  
  const logoutBtn = document.getElementById('logoutBtn');
  const originalBtnText = logoutBtn.textContent;
  
  // 显示加载状态
  logoutBtn.textContent = '退出中...';
  logoutBtn.disabled = true;

  try {
    await customFetch(`${API_BASE}/api/auth/logout`, {
      method: 'POST'
    });

    // 清理本地存储
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');

    showToast('已退出登录', 'success');
    setTimeout(() => {
      window.location.href = '/';
    }, 1000);
  } catch (error) {
    // 即使API调用失败，也要清理本地存储
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    
    showToast('已退出登录', 'success');
    setTimeout(() => {
      window.location.href = '/';
    }, 1000);
  } finally {
    // 恢复按钮状态（虽然会跳转，但还是添加以防万一）
    logoutBtn.textContent = originalBtnText;
    logoutBtn.disabled = false;
  }
}

// ========== 工具函数 ========== 

// 显示提示消息
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// 格式化日期
function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} 天前`;
  } else if (hours > 0) {
    return `${hours} 小时前`;
  } else if (minutes > 0) {
    return `${minutes} 分钟前`;
  } else {
    return '刚刚';
  }
}

// 查看作品详情
function viewWork(workId) {
  window.location.href = `/work/${workId}`;
}

// 查看帖子
function viewPost(postId) {
  // 根据实际路由调整
  showToast('帖子详情页开发中', 'error');
}