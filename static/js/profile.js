// ========== 个人中心页面 JavaScript (支持 Mock 模式) ========== 

let API_BASE = 'http://localhost:5000';
let USE_MOCK_DATA = true; // 改为 false 时使用真实 API

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

    return { ok: false };
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

    return { ok: false };
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
  document.getElementById('worksStatCard').addEventListener('click', function() {
    switchTab('works');
  });
  
  document.getElementById('collectionsStatCard').addEventListener('click', function() {
    switchTab('collections');
  });
  
  document.getElementById('postsStatCard').addEventListener('click', function() {
    switchTab('posts');
  });
  
  document.getElementById('followersStatCard').addEventListener('click', function() {
    showFollowers();
  });
}

// ========== 统一 fetch 函数 ========== 
async function customFetch(url, options = {}) {
  if (USE_MOCK_DATA) {
    if (options.method === 'POST') {
      return await MockAPI.post(url, options.body && typeof options.body === 'string' ? JSON.parse(options.body) : options.body);
    } else {
      return await MockAPI.get(url);
    }
  } else {
    return await fetch(url, options);
  }
}

// ========== 加载用户信息 ========== 
async function loadUserInfo() {
  try {
    const response = await customFetch(`${API_BASE}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token') || 'mock-token'}`
      }
    });

    if (!response.ok) {
      if (response.status === 401 && !USE_MOCK_DATA) {
        localStorage.removeItem('access_token');
        window.location.href = '/auth';
        return;
      }
      throw new Error('加载失败');
    }

    currentUser = await response.json();
    renderUserInfo();
    loadWorks(); // 默认加载作品
  } catch (error) {
    showToast('加载用户信息失败: ' + error.message, 'error');
  }
}

// ========== 渲染用户信息 ========== 
function renderUserInfo() {
  if (!currentUser) return;

  // 基本信息
  document.getElementById('userName').textContent = currentUser.username;
  document.getElementById('userEmail').textContent = currentUser.email;
  document.getElementById('userBio').textContent = currentUser.bio || '暂无简介';
  
  // 头像
  const avatarImg = document.getElementById('userAvatar');
  if (currentUser.avatar) {
    avatarImg.src = `${API_BASE}/uploads/${currentUser.avatar}`;
  } else if (USE_MOCK_DATA) {
    // Mock 模式下使用默认头像或生成一个颜色背景
    avatarImg.style.background = 'linear-gradient(135deg, #8b4513, #6d380e)';
    avatarImg.style.display = 'flex';
    avatarImg.style.alignItems = 'center';
    avatarImg.style.justifyContent = 'center';
    avatarImg.style.color = 'white';
    avatarImg.style.fontSize = '48px';
    avatarImg.textContent = currentUser.username.charAt(0).toUpperCase();
  }

  // 统计数据
  document.getElementById('worksCount').textContent = currentUser.stats.works_count;
  document.getElementById('collectionsCount').textContent = currentUser.stats.collections_count;
  document.getElementById('postsCount').textContent = currentUser.stats.posts_count;
  document.getElementById('followersCount').textContent = currentUser.stats.followers_count;

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
    renderWorksGrid(data.items);
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
          <img src="${work.image_url}" alt="${work.title}" class="grid-item-image" style="background: linear-gradient(135deg, #f8f6ee 0%, #f1ede0 50%, #ece6d6 100%);">
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
    const works = data.items.map(col => col.work).filter(w => w);
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
          <img src="${work.image_url}" alt="${work.title}" class="grid-item-image" style="background: linear-gradient(135deg, #f8f6ee 0%, #f1ede0 50%, #ece6d6 100%);">
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
    renderPostsList(data.items);
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

  if (!email) {
    showToast('邮箱地址不能为空', 'error');
    return;
  }

  try {
    const response = await customFetch(`${API_BASE}/api/users/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token') || 'mock-token'}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, bio })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '更新失败');
    }

    showToast('资料更新成功', 'success');
    await loadUserInfo();
  } catch (error) {
    showToast('资料更新失败: ' + error.message, 'error');
  }
}

// ========== 修改密码 ========== 
async function changePassword() {
  const oldPassword = document.getElementById('oldPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

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

  try {
    const response = await customFetch(`${API_BASE}/api/users/password`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token') || 'mock-token'}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        old_password: oldPassword,
        new_password: newPassword
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '修改失败');
    }

    showToast('密码修改成功', 'success');
    
    // 清空表单
    document.getElementById('oldPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
  } catch (error) {
    showToast('密码修改失败: ' + error.message, 'error');
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

  try {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await fetch(`${API_BASE}/api/users/avatar`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '上传失败');
    }

    showToast('头像上传成功', 'success');
    await loadUserInfo();
  } catch (error) {
    showToast('头像上传失败: ' + error.message, 'error');
  }

  e.target.value = '';
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

  try {
    await customFetch(`${API_BASE}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token') || 'mock-token'}`
      }
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
    showToast('退出登录失败: ' + error.message, 'error');
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