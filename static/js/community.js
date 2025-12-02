/**
 * 社区页面交互脚本
 * 包含每日打卡、发帖、评论点赞等功能
 */

// API基础URL
const API_BASE_URL = 'http://localhost:5000';
let currentUserId = null;

/**
 * 显示消息提示函数
 * @param {string} message - 消息内容
 * @param {string} type - 消息类型：info, success, error, warning
 */
function showMessage(message, type = 'info') {
  // 创建消息元素
  const msgElement = document.createElement('div');
  msgElement.className = `message notification ${type}`;
  msgElement.textContent = message;
  
  // 设置样式
  Object.assign(msgElement.style, {
    position: 'fixed',
    top: '80px',
    right: '20px',
    padding: '12px 20px',
    borderRadius: '4px',
    color: 'white',
    zIndex: '9999',
    fontSize: '14px',
    fontWeight: '500',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
  });
  
  // 根据类型设置背景色
  switch(type) {
    case 'success':
      msgElement.style.backgroundColor = '#4caf50';
      break;
    case 'error':
      msgElement.style.backgroundColor = '#f44336';
      break;
    case 'warning':
      msgElement.style.backgroundColor = '#ff9800';
      break;
    default:
      msgElement.style.backgroundColor = '#2196f3';
  }
  
  // 添加到页面
  document.body.appendChild(msgElement);
  
  // 3秒后自动移除
  setTimeout(() => {
    msgElement.style.transition = 'opacity 0.3s ease';
    msgElement.style.opacity = '0';
    setTimeout(() => {
      msgElement.remove();
    }, 300);
  }, 3000);
}

// 等待 DOM 加载完成
document.addEventListener('DOMContentLoaded', function() {
  // 检查用户登录状态
  checkUserLogin().then(() => {
    // 初始化所有功能
    initCheckin();
    initPostComposer();
    initPostFilters();
    loadPosts();
    initComments();
    
    // 根据登录状态显示/隐藏相应元素
    updateUIByLoginStatus();
  });
});

/**
 * 完整的登出功能
 */
function logout() {
  console.log('执行完整登出操作...');
  
  // 清除所有相关的localStorage项目
  localStorage.removeItem('user');
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  
  // 重置当前用户ID
  currentUserId = null;
  
  console.log('登出成功，所有localStorage数据已清理');
  
  // 可选：重定向到登录页面
  // window.location.href = '/auth.html';
}

/**
 * 检查用户登录状态
 */
async function checkUserLogin() {
  try {
    console.log('开始检查用户登录状态');
    
    // 首先获取localStorage中的数据
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('access_token');
    
    console.log('localStorage中的token存在性:', !!token);
    console.log('localStorage中的用户信息存在性:', !!userStr);
    
    // 重要：只有当user和token都存在时才认为是登录状态
    // 避免只有token没有user信息的情况
    if (userStr && token) {
      try {
        // 解析用户信息
        const user = JSON.parse(userStr);
        
        // 尝试验证token有效性
        console.log('尝试验证token有效性...');
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include'
        });
        
        console.log('token验证响应状态:', response.status);
        
        if (response.ok) {
          const verifyData = await response.json();
          console.log('token验证成功! 用户信息:', verifyData.user || user);
          currentUserId = user.id;
          return;
        } else {
          console.error('token验证失败，状态码:', response.status);
          // 尝试获取错误详情
          try {
            const errorData = await response.json();
            console.error('token验证错误详情:', errorData);
          } catch (e) {
            console.error('无法解析错误响应:', e);
          }
          
          // token无效，执行完整的登出逻辑
          console.log('执行完整登出以清除无效数据');
          logout();
        }
      } catch (e) {
        console.error('解析localStorage用户信息失败:', e);
        // 解析失败也执行登出
        logout();
      }
    } else {
      // 如果只有token没有user信息，或者两者都没有，确保清除token
      if (token && !userStr) {
        console.warn('检测到只有token没有用户信息，清除无效的token');
        localStorage.removeItem('access_token');
      }
      
      // 确保currentUserId为null
      currentUserId = null;
    }
    
    console.log('检查登录状态完成，当前用户ID:', currentUserId);
  } catch (error) {
    console.error('检查登录状态异常:', error);
    currentUserId = null;
  }
}

/**
 * 根据登录状态更新UI
 */
function updateUIByLoginStatus() {
  const checkinBtn = document.getElementById('checkinBtn');
  const postForm = document.querySelector('.post-composer');
  
  if (!currentUserId) {
    // 未登录状态
    if (checkinBtn) {
      checkinBtn.disabled = true;
      checkinBtn.textContent = '请先登录';
    }
    if (postForm) {
      postForm.innerHTML = '<p class="login-hint">请先登录后发布帖子</p>';
    }
  }
}

/**
 * 通用API请求函数 - 带重试机制
 * @param {string} url - 请求URL
 * @param {object} options - 请求选项
 * @param {number} retryLimit - 最大重试次数（默认3次）
 * @param {number} retryDelay - 重试间隔（默认1000ms）
 */
async function apiRequest(url, options = {}, retryLimit = 3, retryDelay = 1000) {
  // 直接从localStorage获取token，确保使用最新值
  let token = localStorage.getItem('access_token');
  
  // 最小化token处理，只进行最必要的操作
  console.log('API请求URL:', url);
  console.log('token存在性:', !!token);
  console.log('token类型:', typeof token);
  
  // 增强的防御性token处理
  if (token) {
    try {
      // 检查token类型是否为字符串
      if (typeof token !== 'string') {
        console.error('警告: token不是字符串类型，将被忽略');
        token = null;
      } else {
        // 只做最基本的清理 - 移除首尾空格
        token = token.trim();
        
        // 防御性检查：如果token长度为0，设为null
        if (token.length === 0) {
          console.error('警告: token为空字符串，将被忽略');
          token = null;
        } else {
          // 关键：不进行任何可能改变token原始字符的处理
          // 不进行Base64解码验证，不修改token字符
          console.log('处理后token前20个字符:', token.substring(0, 20) + '...');
          console.log('处理后token长度:', token.length);
        }
      }
    } catch (e) {
      console.error('token处理过程出错:', e);
      token = null;
    }
  }
  
  // 创建一个全新的headers对象
  const headers = { ...options.headers } || {};
  
  // 确保Content-Type设置正确
  if (!headers['Content-Type'] && !headers['content-type']) {
    headers['Content-Type'] = 'application/json';
  }
  
  // 显式设置Authorization头，确保格式正确
  if (token) {
    try {
      // 关键修复：确保Authorization头格式正确，避免重复前缀
      // 移除可能存在的前缀，然后统一添加正确的Bearer格式
      const cleanToken = token.replace(/^Bearer\s+/i, '').trim();
      headers['Authorization'] = `Bearer ${cleanToken}`;
      console.log('设置Authorization头: Bearer [token]');
      console.log('清理后的token前20个字符:', cleanToken.substring(0, 20) + '...');
    } catch (e) {
      console.error('设置Authorization头出错:', e);
      // 出错时不设置Authorization头，避免使用无效token
    }
  } else {
    console.log('未设置Authorization头，因为token不存在');
  }
  
  // 构建最终请求选项
  const requestOptions = {
    ...options,
    credentials: 'include',
    headers: headers
  };
  
  // 记录请求头信息（排除敏感信息）
  console.log('最终请求头:', {
    ...requestOptions.headers,
    'Authorization': requestOptions.headers['Authorization'] ? 'Bearer [REDACTED]' : undefined
  });
  
  // 调试信息：显示完整的请求配置（隐藏token完整值）
  const debugOptions = { ...requestOptions };
  if (debugOptions.headers && debugOptions.headers['Authorization']) {
    debugOptions.headers['Authorization'] = 'Bearer [REDACTED]';
  }
  console.log('请求配置概览:', debugOptions);
  
  // 实现重试逻辑
  let attempts = 0;
  
  while (attempts <= retryLimit) {
    attempts++;
    console.log(`请求尝试 ${attempts}/${retryLimit + 1} - 路径: ${url}`);
    
    try {
      // 记录请求开始时间用于性能监控
      const startTime = Date.now();
      
      // 使用更新后的requestOptions进行fetch调用
      console.log('执行fetch请求...');
      console.log('请求选项摘要:', {
        method: requestOptions.method,
        hasHeaders: !!requestOptions.headers,
        hasAuthorization: requestOptions.headers?.Authorization ? true : false,
        hasCredentials: requestOptions.credentials
      });
      
      const response = await fetch(url, requestOptions);
      
      // 计算请求耗时
      const endTime = Date.now();
      console.log(`API响应状态: ${response.status} ${response.statusText} (耗时: ${endTime - startTime}ms)`);
      
      // 获取和记录响应头信息
      const contentType = response.headers.get('content-type');
      console.log('响应内容类型:', contentType);
      
      if (response.ok) {
        // 检查响应内容类型
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          console.log('API请求成功，返回JSON数据');
          return data;
        } else {
          const text = await response.text();
          console.log('API请求成功，返回文本数据');
          return text;
        }
      } else {
        // 统一处理所有错误响应的内容解析
        const errorData = await response.json().catch(() => ({}));
        console.error(`请求失败，状态码: ${response.status}，错误详情:`, errorData);
        
        // 特别处理401错误（token无效）- 不重试
          if (response.status === 401) {
            console.error('🔴 401未授权错误，token可能已过期或无效 - 不重试');
            
            // 检查是否是打卡相关的端点
            const isCheckinEndpoint = url.includes('/api/checkin');
            
            if (isCheckinEndpoint) {
              // 针对打卡端点的特殊处理：可能是权限问题而非token无效
              console.log('注意：打卡相关端点返回401，这可能是权限问题而非token无效');
              
              // 记录这是权限问题而非token问题
              sessionStorage.setItem('checkin_permission_denied', 'true');
              
              if (!options.suppressErrorAlert) {
                showMessage('打卡功能需要特殊权限，请联系管理员获取访问权限', 'warning');
              }
              
              throw new Error('打卡功能需要特殊权限，请联系管理员获取访问权限');
            } else {
              // 其他端点的401错误仍然执行完整的登出逻辑
              // 使用统一的登出函数进行完整的清理
              logout();
              
              // 显示用户友好的错误消息
              if (!options.suppressErrorAlert) {
                showMessage('登录已过期，请重新登录', 'error');
                // 可以选择跳转到登录页
                if (options.redirectOn401 !== false) {
                  setTimeout(() => {
                    window.location.href = '/auth.html';
                  }, 2000);
                }
              }
            }
            
            // 立即抛出错误，不重试，使用更安全的错误消息
            throw new Error(isCheckinEndpoint ? '打卡功能需要特殊权限，请联系管理员获取访问权限' : '授权失败，请重新登录');
          }
        
        // 特别处理403错误（权限不足）
        if (response.status === 403) {
          console.error('🔴 403权限不足错误');
          if (!options.suppressErrorAlert) {
            showMessage('没有足够的权限执行此操作', 'error');
          }
          throw new Error(errorData.message || errorData.error || '权限不足');
        }
        
        // 特别处理404错误
        if (response.status === 404) {
          console.error('🔴 404资源未找到错误');
          if (!options.suppressErrorAlert) {
            showMessage('请求的资源不存在', 'error');
          }
          throw new Error(errorData.message || errorData.error || '资源不存在');
        }
        
        // 对于服务器错误(5xx)，可以重试
        if (response.status >= 500 && response.status < 600) {
          if (attempts <= retryLimit) {
            console.warn(`🟡 服务器错误 ${response.status}，将在 ${retryDelay}ms 后重试 (尝试 ${attempts}/${retryLimit})`);
            // 等待指定时间后重试
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            continue; // 进行下一次尝试
          } else {
            // 重试失败后的友好提示
            if (!options.suppressErrorAlert) {
              showMessage('服务器暂时无法响应，请稍后再试', 'error');
            }
          }
        }
        
        // 其他客户端错误(4xx)不重试
        if (!options.suppressErrorAlert && response.status >= 400 && response.status < 500) {
          showMessage(`请求错误: ${errorData.message || errorData.error || '操作失败'}`, 'error');
        }
        
        throw new Error(errorData.message || errorData.error || `请求失败: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      // 网络错误（如连接断开、超时等）可以重试
      if (error.name === 'TypeError' || error.message.includes('Network') || error.message.includes('Failed to fetch')) {
        if (attempts <= retryLimit) {
          console.warn(`🟡 网络错误: ${error.message}，将在 ${retryDelay}ms 后重试 (尝试 ${attempts}/${retryLimit})`);
          // 等待指定时间后重试
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue; // 进行下一次尝试
        } else {
          // 网络错误重试失败
          console.error('🔴 网络错误重试失败:', error);
          if (!options.suppressErrorAlert) {
            showMessage('网络连接失败，请检查您的网络设置', 'error');
          }
        }
      }
      
      // 其他错误或已达到最大重试次数
      if (attempts > retryLimit) {
        console.error(`🔴 达到最大重试次数 ${retryLimit}，请求最终失败:`, error);
        
        // 避免重复显示错误信息
        if (!options.suppressErrorAlert && !['登录已过期', '权限不足', '资源不存在'].some(msg => error.message.includes(msg))) {
          const userErrorMessage = error.message || '操作失败，请稍后重试';
          showMessage(userErrorMessage, 'error');
        }
      }
      
      throw error;
    }
  }
  
  // 防止函数无返回值
  throw new Error('请求重试失败，请稍后再试');
}

/**
 * 初始化每日打卡功能
 */
async function initCheckin() {
  const checkinBtn = document.getElementById('checkinBtn');
  const checkinStatus = document.getElementById('checkinStatus');
  const streakDays = document.getElementById('streakDays');
  const calendarDays = document.getElementById('calendarDays');
  const checkinSection = document.getElementById('checkin-section') || document.querySelector('.checkin-container');

  // 如果未登录，不初始化打卡功能
  if (!currentUserId) {
    return;
  }

  try {
    // 清除权限拒绝标记（如果存在）
    sessionStorage.removeItem('checkin_permission_denied');
    
    // 从后端获取打卡状态
    const statusData = await apiRequest(`${API_BASE_URL}/api/checkin/status`);
    
    // 更新连续天数显示
    streakDays.textContent = statusData.consecutive_days;

    // 生成日历
    generateCalendar(calendarDays, statusData.month_checkins);

    // 检查今天是否已打卡
    if (statusData.checked_today) {
      checkinBtn.disabled = true;
      checkinBtn.textContent = '今日已打卡';
      checkinBtn.classList.add('checked');
      checkinStatus.textContent = '✓ 今日已完成打卡';
    }

    // 打卡按钮点击事件
    checkinBtn.addEventListener('click', async function() {
      if (statusData.checked_today) return;

      try {
        // 调用后端打卡API
        const result = await apiRequest(`${API_BASE_URL}/api/checkin`, {
          method: 'POST'
        });

        // 更新UI
        streakDays.textContent = result.consecutive_days;
        checkinBtn.disabled = true;
        checkinBtn.innerHTML = '<span class="btn-text">今日已打卡</span>';
        checkinBtn.classList.add('checked');
        checkinStatus.textContent = '✓ 打卡成功！继续保持！';

        // 重新生成日历（添加今天）
        const today = new Date().getDate();
        statusData.month_checkins.push(today);
        generateCalendar(calendarDays, statusData.month_checkins);

        // 显示祝贺动画
        showCheckinAnimation();
        
        // 更新状态
        statusData.checked_today = true;
        statusData.consecutive_days = result.consecutive_days;

      } catch (error) {
        console.error('打卡失败:', error);
      }
    });
  } catch (error) {
    console.error('获取打卡状态失败:', error);
    
    // 检查是否是权限问题
    const isPermissionDenied = sessionStorage.getItem('checkin_permission_denied') === 'true';
    
    // 更新UI以适应权限受限的情况
    if (checkinSection) {
      // 不要完全隐藏打卡部分，而是显示一个友好的提示
      checkinSection.innerHTML = `
        <div class="checkin-permission-container">
          <div class="checkin-permission-icon">🔒</div>
          <h3>打卡功能权限</h3>
          <p>您当前没有打卡功能的访问权限</p>
          <p class="permission-description">
            打卡功能需要特殊权限，请联系管理员获取访问权限。
            您仍然可以浏览社区内容和参与其他互动。
          </p>
          <div class="checkin-permission-footer">
            <button class="btn btn-secondary" onclick="window.location.reload()">刷新页面</button>
          </div>
        </div>
      `;
      
      // 添加样式
      const style = document.createElement('style');
      style.textContent = `
        .checkin-permission-container {
          text-align: center;
          padding: 30px;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .checkin-permission-icon {
          font-size: 48px;
          margin-bottom: 20px;
        }
        .checkin-permission-container h3 {
          color: #333;
          margin-bottom: 15px;
          font-size: 22px;
        }
        .checkin-permission-container p {
          color: #666;
          margin-bottom: 10px;
          font-size: 16px;
        }
        .permission-description {
          font-style: italic;
          line-height: 1.5;
          max-width: 400px;
          margin: 15px auto;
        }
        .checkin-permission-footer {
          margin-top: 25px;
        }
        .btn-secondary {
          background-color: #6c757d;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 14px;
          transition: background-color 0.3s;
        }
        .btn-secondary:hover {
          background-color: #5a6268;
        }
      `;
      document.head.appendChild(style);
    } else if (checkinStatus) {
      checkinStatus.textContent = '获取状态失败，请刷新页面';
    }
  }
}

/**
 * 生成打卡日历
 */
function generateCalendar(container, checkedDates) {
  container.innerHTML = '';
  const today = new Date();
  
  // 获取当前月份的天数
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

  // 生成当前月份的日历
  for (let day = 1; day <= daysInMonth; day++) {
    const dayDiv = document.createElement('div');
    dayDiv.className = 'calendar-day';
    dayDiv.textContent = day;

    // 检查是否已打卡
    if (checkedDates.includes(day)) {
      dayDiv.classList.add('checked');
      dayDiv.textContent = '✓';
    }

    // 标记今天
    if (day === today.getDate()) {
      dayDiv.classList.add('today');
    }

    container.appendChild(dayDiv);
  }
}

/**
 * 打卡成功动画
 */
function showCheckinAnimation() {
  const status = document.getElementById('checkinStatus');
  status.style.animation = 'fadeIn 0.5s ease';
}

/**
 * 初始化发帖功能
 */
function initPostComposer() {
  const postContent = document.getElementById('postContent');
  const charCount = document.getElementById('charCount');
  const publishBtn = document.getElementById('publishBtn');

  // 如果未登录，不初始化发帖功能
  if (!currentUserId) {
    return;
  }

  // 字数统计
  postContent.addEventListener('input', function() {
    const length = this.value.length;
    charCount.textContent = length;

    if (length > 1900) {
      charCount.style.color = '#d32f2f';
    } else {
      charCount.style.color = 'inherit';
    }
  });

  // 发布按钮
  publishBtn.addEventListener('click', async function() {
    const title = document.getElementById('postTitle').value.trim();
    const content = postContent.value.trim();

    if (!content) {
      alert('请输入帖子内容');
      return;
    }

    try {
      // 调用后端发布帖子API
      const result = await apiRequest(`${API_BASE_URL}/api/posts`, {
        method: 'POST',
        body: JSON.stringify({
          title: title,
          content: content
        })
      });

      // 创建新帖子元素
      const newPost = createPostElement(result.post);

      // 插入到帖子列表顶部
      const postsList = document.getElementById('postsList');
      postsList.insertBefore(newPost, postsList.firstChild);

      // 清空输入框
      document.getElementById('postTitle').value = '';
      postContent.value = '';
      charCount.textContent = '0';

      // 显示成功提示
      alert('发布成功！');
    } catch (error) {
      console.error('发布帖子失败:', error);
    }
  });
}

/**
 * 格式化时间
 */
function formatTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 30) return `${diffDays}天前`;
  
  return date.toLocaleDateString('zh-CN');
}

/**
 * 创建帖子元素
 */
function createPostElement(data) {
  const article = document.createElement('article');
  article.className = 'post-card';
  article.dataset.postId = data.id;

  const authorInfo = data.author || {};
  
  article.innerHTML = `
    <div class="post-header">
      <div class="post-author">
        <div class="author-avatar">${authorInfo.avatar || '👤'}</div>
        <div class="author-info">
          <h4 class="author-name">${authorInfo.username || '匿名用户'}</h4>
          <p class="post-time">${formatTime(data.created_at)}</p>
        </div>
      </div>
      <button type="button" class="post-menu-btn" aria-label="更多操作">⋯</button>
    </div>
    <div class="post-body">
      ${data.title ? `<h3 class="post-title">${data.title}</h3>` : ''}
      <p class="post-content">${data.content}</p>
    </div>
    <div class="post-footer">
      <button type="button" class="post-action" data-action="like" ${data.is_liked ? 'data-liked="true" class="liked"' : ''}>
        <span class="action-icon">👍</span>
        <span class="action-count">${data.likes_count || 0}</span>
      </button>
      <button type="button" class="post-action" data-action="comment">
        <span class="action-icon">💬</span>
        <span class="action-count">${data.comments_count || 0}</span>
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

  // 绑定事件
  bindPostActions(article);

  return article;
}

/**
 * 初始化帖子筛选
 */
function initPostFilters() {
  const filterTabs = document.querySelectorAll('.filter-tab');
  const searchInput = document.getElementById('postSearch');

  // 筛选标签切换
  filterTabs.forEach(tab => {
    tab.addEventListener('click', function() {
      filterTabs.forEach(t => t.classList.remove('active'));
      this.classList.add('active');

      const filter = this.dataset.filter;
      filterPosts(filter);
    });
  });

  // 搜索功能
  searchInput.addEventListener('input', function() {
    const keyword = this.value.toLowerCase().trim();
    searchPosts(keyword);
  });
}

/**
 * 加载帖子列表
 */
async function loadPosts() {
  const postsList = document.getElementById('postsList');
  postsList.innerHTML = '<div class="loading">加载中...</div>';
  
  try {
    // 从后端获取帖子列表
    const result = await apiRequest(`${API_BASE_URL}/api/posts`, {
      method: 'GET'
    });
    
    postsList.innerHTML = '';
    
    if (result.posts && result.posts.length > 0) {
      result.posts.forEach(post => {
        const postElement = createPostElement(post);
        postsList.appendChild(postElement);
      });
    } else {
      postsList.innerHTML = '<div class="no-posts">暂无帖子，来发表第一条帖子吧！</div>';
    }
  } catch (error) {
    console.error('加载帖子失败:', error);
    postsList.innerHTML = '<div class="error">加载帖子失败，请重试</div>';
  }
}

/**
 * 筛选帖子
 */
function filterPosts(filter) {
  const posts = document.querySelectorAll('.post-card');

  // 示例：实际应用中应该根据真实数据进行筛选
  console.log('筛选模式:', filter);

  // 这里可以实现不同的筛选逻辑
  // 例如：按热度、时间、关注等排序
}

/**
 * 搜索帖子
 */
function searchPosts(keyword) {
  if (!keyword) {
    // 显示所有帖子
    document.querySelectorAll('.post-card').forEach(post => {
      post.style.display = '';
    });
    return;
  }

  document.querySelectorAll('.post-card').forEach(post => {
    const title = post.querySelector('.post-title')?.textContent.toLowerCase() || '';
    const content = post.querySelector('.post-content').textContent.toLowerCase();
    const author = post.querySelector('.author-name').textContent.toLowerCase();

    if (title.includes(keyword) || content.includes(keyword) || author.includes(keyword)) {
      post.style.display = '';
    } else {
      post.style.display = 'none';
    }
  });
}

/**
 * 初始化帖子操作
 */
function initPostActions() {
  const posts = document.querySelectorAll('.post-card');
  posts.forEach(post => bindPostActions(post));
}

/**
 * 加载评论
 */
async function loadComments(postElement, postId) {
  const commentsList = postElement.querySelector('.comments-list');
  
  // 显示加载中
  commentsList.innerHTML = '<div class="loading">加载中...</div>';
  
  try {
    // 从后端获取评论
    const result = await apiRequest(`${API_BASE_URL}/api/posts/${postId}/comments`, {
      method: 'GET'
    });
    
    // 清空评论列表
    commentsList.innerHTML = '';
    
    if (result.comments && result.comments.length > 0) {
      // 添加评论
      result.comments.forEach(comment => {
        const commentElement = createCommentElement(comment);
        commentsList.appendChild(commentElement);
      });
    } else {
      commentsList.innerHTML = '<div class="no-comments">暂无评论，来发表第一条评论吧！</div>';
    }
  } catch (error) {
    console.error('加载评论失败:', error);
    commentsList.innerHTML = '<div class="error">加载评论失败，请重试</div>';
  }
}

/**
 * 绑定帖子操作事件
 */
function bindPostActions(postElement) {
  const postId = postElement.dataset.postId;
  
  // 点赞按钮
  const likeButton = postElement.querySelector('.post-action[data-action="like"]');
  likeButton.addEventListener('click', async function() {
    if (!currentUserId) {
      alert('请先登录');
      return;
    }
    
    try {
      const isLiked = this.hasAttribute('data-liked');
      const url = isLiked ? `${API_BASE_URL}/api/posts/${postId}/like` : `${API_BASE_URL}/api/posts/${postId}/like`;
      const method = isLiked ? 'DELETE' : 'POST';
      
      const result = await apiRequest(url, { method });
      
      // 更新UI
      if (isLiked) {
        this.removeAttribute('data-liked');
        this.classList.remove('liked');
      } else {
        this.setAttribute('data-liked', 'true');
        this.classList.add('liked');
      }
      
      const countElement = this.querySelector('.action-count');
      countElement.textContent = result.likes_count;
    } catch (error) {
      console.error('点赞操作失败:', error);
    }
  });

  // 评论按钮
  const commentButton = postElement.querySelector('.post-action[data-action="comment"]');
  const commentsSection = postElement.querySelector('.comments-section');
  
  commentButton.addEventListener('click', function() {
    commentsSection.classList.toggle('hidden');
    
    // 如果显示评论区，加载评论
    if (!commentsSection.classList.contains('hidden')) {
      loadComments(postElement, postId);
    }
  });

  // 分享按钮
  const shareButton = postElement.querySelector('.post-action[data-action="share"]');
  shareButton.addEventListener('click', function() {
    alert('分享功能即将上线');
  });

  // 评论发送
  const commentSubmit = postElement.querySelector('.comment-composer button');
  const commentInput = postElement.querySelector('.comment-input');
  
  commentSubmit.addEventListener('click', async function() {
    if (!currentUserId) {
      alert('请先登录');
      return;
    }
    
    const commentText = commentInput.value.trim();
    if (!commentText) return;
    
    try {
      // 发送评论到后端
      const result = await apiRequest(`${API_BASE_URL}/api/posts/${postId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: commentText })
      });
      
      // 添加新评论到列表
      const commentElement = createCommentElement(result.comment);
      const commentsList = postElement.querySelector('.comments-list');
      commentsList.appendChild(commentElement);
      
      // 更新评论数
      const commentCount = postElement.querySelector('.post-action[data-action="comment"] .action-count');
      commentCount.textContent = result.comments_count;
      
      // 清空输入框
      commentInput.value = '';
    } catch (error) {
      console.error('发表评论失败:', error);
    }
  });

  // 回车发送评论
  commentInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      commentSubmit.click();
    }
  });
}

/**
 * 创建评论元素
 */
function createCommentElement(data) {
  const commentElement = document.createElement('div');
  commentElement.className = 'comment-item';
  commentElement.dataset.commentId = data.id;
  
  const authorInfo = data.author || {};
  
  commentElement.innerHTML = `
    <div class="comment-avatar">${authorInfo.avatar || '👤'}</div>
    <div class="comment-content">
      <div class="comment-author">${authorInfo.username || '匿名用户'}</div>
      <div class="comment-text">${data.content}</div>
      <div class="comment-time">${formatTime(data.created_at)}</div>
    </div>
  `;
  
  return commentElement;
}

/**
 * 初始化帖子操作
 */
function initPostActions() {
  // 此函数已被bindPostActions替代，不再需要单独调用
}

/**
 * 初始化评论功能
 */
function initComments() {
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('btn-small') &&
        e.target.closest('.comment-composer')) {
      handleCommentSubmit(e.target);
    }

    if (e.target.closest('.comment-like')) {
      handleCommentLike(e.target.closest('.comment-like'));
    }
  });
}

/**
 * 处理评论提交
 */
function handleCommentSubmit(button) {
  const composer = button.closest('.comment-composer');
  const input = composer.querySelector('.comment-input');
  const content = input.value.trim();

  if (!content) {
    alert('请输入评论内容');
    return;
  }

  // 创建评论元素
  const commentsList = composer.nextElementSibling;
  const comment = createCommentElement({
    author: '我',
    avatar: '我',
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
function createCommentElement(data) {
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
function handleCommentLike(button) {
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
 * 加载更多帖子
 */
const loadMoreBtn = document.getElementById('loadMoreBtn');
if (loadMoreBtn) {
  loadMoreBtn.addEventListener('click', function() {
    // 实际应用中应该从服务器加载更多数据
    console.log('加载更多帖子...');
    this.textContent = '加载中...';

    setTimeout(() => {
      this.textContent = '加载更多';
      alert('没有更多帖子了');
    }, 1000);
  });
}
