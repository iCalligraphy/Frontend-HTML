/**
 * 我的字集页面交互脚本
 * 包含字集创建、编辑、删除、单字筛选等功能
 */

// API 请求配置
const API_BASE_URL = '/api';

// API 请求封装
async function apiRequest(endpoint, method = 'GET', data = null, token = null) {
  const url = `${API_BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  };

  // 添加认证令牌
  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  } else {
    // 尝试从 localStorage 获取令牌
    const storedToken = localStorage.getItem('access_token');
    if (storedToken) {
      options.headers['Authorization'] = `Bearer ${storedToken}`;
    }
  }

  if (data && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'API 请求失败');
    }

    return result;
  } catch (error) {
    console.error('API 请求错误:', error);
    throw error;
  }
}

// 等待 DOM 加载完成
document.addEventListener('DOMContentLoaded', function() {
  // 初始化所有功能
  initCollectionButtons();
  initCollectionActions();
  initFiltersAndSearch();
  initModals();
  initCollectionDetails();
  
  // 从后端加载字集数据
  loadCharacterSets();
});

// 全局变量：当前操作的字集ID
let currentEditSetId = null;

/**
 * 初始化创建字集按钮
 */
function initCollectionButtons() {
  const createBtn = document.getElementById('createCollectionBtn');
  const createFirstBtn = document.getElementById('createFirstBtn');

  if (createBtn) {
    createBtn.addEventListener('click', () => openCollectionModal());
  }

  if (createFirstBtn) {
    createFirstBtn.addEventListener('click', () => openCollectionModal());
  }
}

/**
 * 初始化字集操作按钮
 */
function initCollectionActions() {
  // 编辑和删除按钮
  document.addEventListener('click', function(e) {
    const actionBtn = e.target.closest('.action-btn');
    if (!actionBtn) return;

    const action = actionBtn.dataset.action;
    const collectionCard = actionBtn.closest('.collection-card');

    if (action === 'edit') {
      handleEditCollection(collectionCard);
    } else if (action === 'delete') {
      handleDeleteCollection(collectionCard);
    }
  });

  // 卡片内单字预览点击：先打开对应字集详情，再打开单字详情
  document.addEventListener('click', function(e) {
    const charItem = e.target.closest && e.target.closest('.char-item');
    if (!charItem) return;

    // 阻止在预览上的移除按钮触发
    if (e.target.closest && e.target.closest('.char-remove')) return;

    // 找到所属的 collection card
    const collectionCard = charItem.closest('.collection-card');
    // 尝试从卡片的查看详情按钮读取 collectionId
    let collectionId = null;
    if (collectionCard) {
      const btn = collectionCard.querySelector('button[data-collection]');
      if (btn) collectionId = btn.dataset.collection;
    }

    // 打开详情弹窗（如果有 id 就传，否则也打开默认弹窗）
    try {
      openDetailModal(collectionId);
    } catch (err) {
      console.warn('openDetailModal failed', err);
      openDetailModal();
    }

    // 在详情弹窗打开后，直接打开单字详情弹窗显示这个字
    const ch = charItem.dataset.char || (charItem.textContent && charItem.textContent.trim()) || '?';
    // 小延迟等 detailCharGrid 填充（openDetailModal 内部可能同步填充，但用微任务保险）
    setTimeout(() => {
      // 查找 detailCharGrid 中对应项并打开，如果找不到则直接用文本打开小弹窗
      const gridItem = Array.from(document.querySelectorAll('.detail-char-item')).find(it => (it.dataset.char||'').toString() === ch.toString());
      if (gridItem) {
        openCharModalFromItem(gridItem);
      } else {
        openCharModal({ text: ch, work: '' });
      }
    }, 100);
  });

  // 查看详情按钮
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('btn-secondary') ||
        e.target.closest('.btn-secondary')) {
      const button = e.target.classList.contains('btn-secondary') ?
        e.target : e.target.closest('.btn-secondary');
      const collectionId = button.dataset.collection;
      if (collectionId) {
        openDetailModal(collectionId);
      }
    }
  });

  // 添加单字按钮
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('btn-outline') ||
        e.target.closest('.btn-outline')) {
      const button = e.target.classList.contains('btn-outline') ?
        e.target : e.target.closest('.btn-outline');
      const collectionId = button.dataset.collection;
      if (collectionId) {
        handleAddCharacter(collectionId);
      }
    }
  });
}

/**
 * 从后端获取字集统计数据
 */
async function getCharacterSetStats() {
  try {
    const result = await apiRequest('/character-sets/stats');
    return result;
  } catch (error) {
    console.error('获取字集统计数据失败:', error);
    return { today_updates: 0 };
  }
}

/**
 * 从后端加载字集列表
 */
async function loadCharacterSets() {
  try {
    const result = await apiRequest('/character-sets');
    const characterSets = result.character_sets;
    
    // 清空现有字集卡片
    const container = document.getElementById('collectionsList');
    container.innerHTML = '';
    
    // 创建新的字集卡片
    characterSets.forEach(set => {
      const card = createCollectionCard(set);
      container.appendChild(card);
    });
    
    // 更新统计数据
    updateStats();
    
    // 检查空状态
    checkEmptyState();
  } catch (error) {
    console.error('加载字集列表失败:', error);
    
    // 处理未登录错误，显示友好提示
    const errorMessage = error.message;
    if (errorMessage.includes('Token') || errorMessage.includes('Authorization') || errorMessage.includes('Missing')) {
      alert('请先登录后查看您的字集列表');
    } else {
      alert('加载字集列表失败，请稍后重试');
    }
  }
}

/**
 * 处理编辑字集
 */
async function handleEditCollection(collectionCard) {
  const setId = collectionCard.dataset.setId;
  
  try {
    // 从后端获取字集详情
    const result = await apiRequest(`/character-sets/${setId}`);
    const characterSet = result.character_set;
    
    // 填充表单数据
    document.getElementById('collectionName').value = characterSet.name;
    document.getElementById('collectionDesc').value = characterSet.description || '';
    document.getElementById('modalTitle').textContent = '编辑字集';
    
    // 设置当前编辑的字集ID
    currentEditSetId = setId;
    
    // 打开弹窗
    openCollectionModal('edit');
  } catch (error) {
    console.error('获取字集详情失败:', error);
    
    // 处理未登录错误，显示友好提示
    const errorMessage = error.message;
    if (errorMessage.includes('Token') || errorMessage.includes('Authorization') || errorMessage.includes('Missing')) {
      alert('请先登录后操作');
    } else {
      alert('获取字集详情失败，请稍后重试');
    }
  }
}

/**
 * 处理删除字集
 */
async function handleDeleteCollection(collectionCard) {
  const setId = collectionCard.dataset.setId;
  const name = collectionCard.querySelector('.collection-name').textContent;

  if (confirm(`确定要删除字集"${name}"吗？此操作无法撤销。`)) {
    try {
      // 调用API删除字集
      await apiRequest(`/character-sets/${setId}`, 'DELETE');
      
      // 添加删除动画
      collectionCard.style.animation = 'fadeOut 0.3s ease';

      setTimeout(() => {
        collectionCard.remove();

        // 更新统计数据
        updateStats();

        // 检查是否需要显示空状态
        checkEmptyState();

        alert('字集已删除');
      }, 300);
    } catch (error) {
      console.error('删除字集失败:', error);
      
      // 处理未登录错误，显示友好提示
      const errorMessage = error.message;
      if (errorMessage.includes('Token') || errorMessage.includes('Authorization') || errorMessage.includes('Missing')) {
        alert('请先登录后操作');
      } else {
        alert('删除字集失败，请稍后重试');
      }
    }
  }
}

/**
 * 处理添加单字
 */
function handleAddCharacter(collectionId) {
  // 打开添加单字选择弹窗
  openAddCharModal(collectionId);
}

/**
 * 打开添加单字弹窗
 */
function openAddCharModal(collectionId) {
  const modal = document.getElementById('addCharModal');
  if (!modal) {
    // 如果弹窗不存在，创建它
    createAddCharModal();
  }

  // 设置当前字集ID
  const modalEl = document.getElementById('addCharModal');
  if (modalEl) modalEl.dataset.collectionId = collectionId;

  // 加载模拟单字数据
  loadMockCharacters();

  // 显示弹窗
  if (modalEl) {
    modalEl.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
}

/**
 * 关闭添加单字弹窗
 */
function closeAddCharModal() {
  const modal = document.getElementById('addCharModal');
  if (modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }
}

/**
 * 生成统一尺寸的单字图片
 */
function generateUniformCharImage(character) {
  const CANVAS_SIZE = 120; // 统一尺寸
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  const ctx = canvas.getContext('2d');
  
  // 填充白色背景
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function() {
      const { x, y, width, height } = character;
      const aspect = width / height;
      
      let destW = CANVAS_SIZE;
      let destH = CANVAS_SIZE;
      let dx = 0;
      let dy = 0;
      
      if (aspect > 1) {
        // 宽大于高，垂直居中
        destH = Math.round(CANVAS_SIZE / aspect);
        dy = Math.floor((CANVAS_SIZE - destH) / 2);
      } else if (aspect < 1) {
        // 高大于宽，水平居中
        destW = Math.round(CANVAS_SIZE * aspect);
        dx = Math.floor((CANVAS_SIZE - destW) / 2);
      }
      
      ctx.drawImage(img, x, y, width, height, dx, dy, destW, destH);
      resolve(canvas.toDataURL());
    };
    img.onerror = function() {
      // 图片加载失败，返回空字符串
      resolve('');
    };
    img.src = character.work_image_url;
  });
}

/**
 * 从后端加载单字数据
 */
async function loadMockCharacters() {
  try {
    // 从后端API获取所有可用单字
    const result = await apiRequest('/works/characters');
    const characters = result.characters;

    const grid = document.getElementById('addCharGrid');
    if (!grid) return;
    
    // 清空网格
    grid.innerHTML = '';
    
    // 添加CSS样式，确保char-image元素显示正确
    const style = document.createElement('style');
    style.textContent = `
      .char-image {
        background-color: white;
        margin: 0 auto;
        width: 120px;
        height: 120px;
        display: block;
      }
      .char-display-large {
        display: none;
      }
      .add-char-item {
        display: flex;
        flex-direction: column;
      }
    `;
    document.head.appendChild(style);

    // 批量处理单字数据
      for (const character of characters) {
        // 创建单字元素
        const charItem = document.createElement('div');
        charItem.className = 'add-char-item';
        charItem.dataset.char = character.recognition;
        charItem.dataset.style = character.style;
        charItem.dataset.charId = character.id;
        
        // 存储原始字符坐标和图片信息到data属性
        charItem.dataset.x = character.x;
        charItem.dataset.y = character.y;
        charItem.dataset.width = character.width;
        charItem.dataset.height = character.height;
        charItem.dataset.workImageUrl = character.work_image_url;
        
        const charCard = document.createElement('div');
        charCard.className = 'char-card';
        
        // 创建图片容器
        const charImage = document.createElement('img');
        charImage.className = 'char-image';
        charImage.ariaHidden = 'true';
        
        // 创建文字标签
        const charLabel = document.createElement('div');
        charLabel.className = 'char-label';
        charLabel.textContent = character.recognition;
        
        // 创建来源信息
        const charSource = document.createElement('div');
        charSource.className = 'char-source';
        charSource.textContent = character.source;
        
        // 创建添加按钮
        const charAddBtn = document.createElement('button');
        charAddBtn.type = 'button';
        charAddBtn.className = 'char-add-btn';
        charAddBtn.title = '添加到字集';
        charAddBtn.innerHTML = '<span>+</span>';
        
        // 组装元素
        charCard.appendChild(charImage);
        charCard.appendChild(charLabel);
        charCard.appendChild(charSource);
        charCard.appendChild(charAddBtn);
        charItem.appendChild(charCard);
        grid.appendChild(charItem);
        
        // 生成统一尺寸的图片
        const imageUrl = await generateUniformCharImage(character);
        if (imageUrl) {
          charImage.src = imageUrl;
        }
        
        // 添加点击事件
        charAddBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          const charItem = this.closest('.add-char-item');
          const char = charItem.dataset.char;
          addCharToCollection(char);
        });
      }
  } catch (error) {
    console.error('加载单字数据失败:', error);
    alert('加载单字数据失败: ' + error.message);
  }
}

/**
 * 添加单字到字集
 */
async function addCharToCollection(char) {
  const modal = document.getElementById('addCharModal');
  const collectionId = modal?.dataset.collectionId;

  if (!collectionId) {
    alert('无法获取字集信息');
    return;
  }

  try {
    // 查找当前要添加的单字元素，获取真实的单字ID
    const charItem = document.querySelector(`.add-char-item[data-char="${char}"]`);
    if (!charItem) {
      throw new Error('未找到该单字元素');
    }
    
    const charId = charItem.dataset.charId;
    if (!charId) {
      throw new Error('无法获取单字ID');
    }
    
    // 调用API添加单字到字集
    await apiRequest(`/character-sets/${collectionId}/characters`, 'POST', {
      character_id: parseInt(charId)
    });

    // 显示成功提示
    alert(`已将 "${char}" 添加到字集`);

    // 关闭弹窗
    closeAddCharModal();

    // 重新加载字集列表，更新卡片信息
    await loadCharacterSets();
  } catch (error) {
    console.error('添加单字失败:', error);
    
    // 处理未登录错误，显示友好提示
    const errorMessage = error.message;
    if (errorMessage.includes('Token') || errorMessage.includes('Authorization') || errorMessage.includes('Missing')) {
      alert('请先登录后操作');
      closeAddCharModal();
    } else {
      alert('添加单字失败，请稍后重试');
    }
  }
}

/**
 * 创建添加单字弹窗
 */
function createAddCharModal() {
  const modalHTML = `
    <div class="modal hidden" id="addCharModal" role="dialog" aria-labelledby="addCharTitle" aria-modal="true">
      <div class="modal-overlay" id="addCharOverlay"></div>
      <div class="modal-content modal-large">
        <div class="modal-header">
          <h2 id="addCharTitle">添加单字</h2>
          <button type="button" class="modal-close" id="addCharClose" aria-label="关闭">×</button>
        </div>
        <div class="modal-body">
          <!-- 搜索栏 -->
          <div class="detail-toolbar">
            <div class="detail-search">
              <input type="search" id="addCharSearch" class="search-input" placeholder="搜索单字、作者或作品..." />
            </div>
            <div class="detail-actions">
              <select id="addCharStyleFilter" class="select-field">
                <option value="all">全部风格</option>
                <option value="kai">楷书</option>
                <option value="xing">行书</option>
                <option value="cao">草书</option>
                <option value="li">隶书</option>
                <option value="zhuan">篆书</option>
              </select>
            </div>
          </div>

          <!-- 单字网格 -->
          <div class="detail-char-grid" id="addCharGrid">
            <!-- 动态生成单字卡片 -->
          </div>
        </div>
      </div>
    </div>
  `;

  // 添加到页面
  document.body.insertAdjacentHTML('beforeend', modalHTML);

  // 绑定关闭事件
  document.getElementById('addCharClose')?.addEventListener('click', closeAddCharModal);
  document.getElementById('addCharOverlay')?.addEventListener('click', closeAddCharModal);

  // 搜索功能
  document.getElementById('addCharSearch')?.addEventListener('input', function() {
    filterAddChars(this.value.trim());
  });

  // 风格筛选
  document.getElementById('addCharStyleFilter')?.addEventListener('change', function() {
    filterAddCharsByStyle(this.value);
  });
}

/**
 * 筛选单字（搜索）
 */
function filterAddChars(keyword) {
  const items = document.querySelectorAll('#addCharGrid .add-char-item');
  const lowerKeyword = (keyword || '').toLowerCase();

  items.forEach(item => {
    const char = item.dataset.char || '';
    const label = item.querySelector('.char-label')?.textContent || '';
    const source = item.querySelector('.char-source')?.textContent || '';

    if (!keyword || char.includes(keyword) || label.toLowerCase().includes(lowerKeyword) || source.toLowerCase().includes(lowerKeyword)) {
      item.style.display = '';
    } else {
      item.style.display = 'none';
    }
  });
}

/**
 * 按风格筛选单字
 */
function filterAddCharsByStyle(style) {
  const items = document.querySelectorAll('#addCharGrid .add-char-item');
  if (!items) return;
  if (!style || style === 'all') {
    items.forEach(i => i.style.display = '');
    return;
  }
  items.forEach(item => {
    const st = item.dataset.style || '';
    item.style.display = (st === style) ? '' : 'none';
  });
}

/**
 * 初始化筛选和搜索
 */
function initFiltersAndSearch() {
  const sortSelect = document.getElementById('sortSelect');
  const styleFilter = document.getElementById('styleFilter');
  const searchInput = document.getElementById('collectionSearch');

  // 排序
  if (sortSelect) {
    sortSelect.addEventListener('change', function() {
      sortCollections(this.value);
    });
  }

  // 风格筛选
  if (styleFilter) {
    styleFilter.addEventListener('change', function() {
      filterByStyle(this.value);
    });
  }

  // 搜索
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      searchCollections(this.value.trim());
    });
  }
}

/**
 * 排序字集
 */
function sortCollections(sortType) {
  const container = document.getElementById('collectionsList');
  const cards = Array.from(container.querySelectorAll('.collection-card'));

  cards.sort((a, b) => {
    switch (sortType) {
      case 'name':
        const nameA = a.querySelector('.collection-name').textContent;
        const nameB = b.querySelector('.collection-name').textContent;
        return nameA.localeCompare(nameB, 'zh-CN');

      case 'count':
        const countA = parseInt(a.querySelector('.collection-meta').textContent);
        const countB = parseInt(b.querySelector('.collection-meta').textContent);
        return countB - countA;

      case 'recent':
      case 'created':
      default:
        // 实际应用中应该根据真实的时间戳排序
        return 0;
    }
  });

  // 重新排列DOM
  cards.forEach(card => container.appendChild(card));
}

/**
 * 按风格筛选
 */
function filterByStyle(style) {
  const cards = document.querySelectorAll('.collection-card');

  cards.forEach(card => {
    const meta = card.querySelector('.collection-meta').textContent;

    if (style === 'all') {
      card.style.display = '';
    } else {
      const styleMap = {
        'kai': '楷书',
        'xing': '行书',
        'cao': '草书',
        'li': '隶书',
        'zhuan': '篆书'
      };

      if (meta.includes(styleMap[style])) {
        card.style.display = '';
      } else {
        card.style.display = 'none';
      }
    }
  });
}

/**
 * 搜索字集
 */
function searchCollections(keyword) {
  if (!keyword) {
    document.querySelectorAll('.collection-card').forEach(card => {
      card.style.display = '';
    });
    return;
  }

  const lowerKeyword = keyword.toLowerCase();

  document.querySelectorAll('.collection-card').forEach(card => {
    const name = card.querySelector('.collection-name').textContent.toLowerCase();
    const meta = card.querySelector('.collection-meta').textContent.toLowerCase();

    // 检查字集名称和单字
    const chars = Array.from(card.querySelectorAll('.char-display'))
      .map(el => el.textContent)
      .join('');

    if (name.includes(lowerKeyword) ||
        meta.includes(lowerKeyword) ||
        chars.includes(keyword)) {
      card.style.display = '';
    } else {
      card.style.display = 'none';
    }
  });
}

/**
 * 初始化弹窗
 */
function initModals() {
  // 创建/编辑字集弹窗
  const modal = document.getElementById('collectionModal');
  const overlay = document.getElementById('modalOverlay');
  const closeBtn = document.getElementById('modalClose');
  const cancelBtn = document.getElementById('modalCancel');
  const confirmBtn = document.getElementById('modalConfirm');

  if (closeBtn) {
    closeBtn.addEventListener('click', () => closeCollectionModal());
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => closeCollectionModal());
  }

  if (overlay) {
    overlay.addEventListener('click', () => closeCollectionModal());
  }

  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => handleCollectionSubmit());
  }

  // 详情弹窗
  const detailModal = document.getElementById('detailModal');
  const detailOverlay = document.getElementById('detailOverlay');
  const detailClose = document.getElementById('detailClose');

  if (detailClose) {
    detailClose.addEventListener('click', () => closeDetailModal());
  }

  if (detailOverlay) {
    detailOverlay.addEventListener('click', () => closeDetailModal());
  }

  // 通用 modal-close 代理：处理页面上所有 modal 的关闭按钮，避免单个绑定遗漏
  document.addEventListener('click', function(e) {
    const closeBtn = e.target.closest && e.target.closest('.modal-close');
    if (!closeBtn) return;
    const modalEl = closeBtn.closest && closeBtn.closest('.modal');
    if (modalEl) {
      modalEl.classList.add('hidden');
      // 清除显示回退样式
      modalEl.style.display = '';
      document.body.style.overflow = '';
    }
  });

  // 单字详情弹窗（charModal）关闭绑定
  const charModal = document.getElementById('charModal');
  const charModalOverlay = document.getElementById('charModalOverlay');
  const charModalClose = document.getElementById('charModalClose');
  if (charModalClose) charModalClose.addEventListener('click', () => closeCharModal());
  if (charModalOverlay) charModalOverlay.addEventListener('click', () => closeCharModal());

  // ESC键关闭弹窗
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      closeCollectionModal();
      closeDetailModal();
      closeCharModal();
    }
  });
}

/**
 * 打开单字详情弹窗（基于 detail 列表内的项）
 */
function openCharModalFromItem(item) {
  if (!item) return;
  
  // 获取单字信息
  const char = item.dataset.char || (item.querySelector('.char-label') && item.querySelector('.char-label').textContent) || '?';
  const source = item.querySelector('.char-source') ? item.querySelector('.char-source').textContent : '';
  const charId = item.dataset.charId;
  
  // 从data属性获取原始字符坐标和图片信息
  const x = parseFloat(item.dataset.x) || 0;
  const y = parseFloat(item.dataset.y) || 0;
  const width = parseFloat(item.dataset.width) || 0;
  const height = parseFloat(item.dataset.height) || 0;
  const workImageUrl = item.dataset.workImageUrl || '';

  // 调用与作品详情页面相同的弹窗逻辑
  showCharDetail({
    char: char,
    work_title: source,
    id: charId,
    x: x,
    y: y,
    width: width,
    height: height,
    style: '',
    workImageUrl: workImageUrl
  }, 0);
}

function openCharModal(data = {}) {
  const modal = document.getElementById('charModal');
  if (!modal) return;

  const text = data.text || '-';
  const work = data.work || '-';
  const charId = data.charId;
  const workImageUrl = data.workImageUrl;
  const x = data.x;
  const y = data.y;
  const width = data.width;
  const height = data.height;

  const titleEl = document.getElementById('modalCharText');
  const workEl = document.getElementById('modalWork');
  const styleEl = document.getElementById('modalStyle');
  const previewEl = document.getElementById('modalPreview');
  const strokeCountEl = document.getElementById('modalStrokeCount');
  const strokeOrderEl = document.getElementById('modalStrokeOrder');
  const confidenceEl = document.getElementById('modalConfidence');
  const annotationsEl = document.getElementById('modalAnnotations');
  const collectedAtEl = document.getElementById('modalCollectedAt');

  titleEl.textContent = text;
  workEl.textContent = work;
  styleEl.textContent = ''; // unknown in this simplified view
  strokeCountEl.textContent = '-';
  strokeOrderEl.textContent = '-';
  confidenceEl.textContent = '-';
  annotationsEl.textContent = '-';
  collectedAtEl.textContent = '-';

  // render preview
  previewEl.innerHTML = '';
  let canvas = null;
  
  if (workImageUrl && width > 0 && height > 0) {
    // 使用真实的单字图片
    const previewContainer = document.createElement('div');
    previewContainer.style.width = '340px';
    previewContainer.style.height = '340px';
    previewContainer.style.display = 'flex';
    previewContainer.style.justifyContent = 'center';
    previewContainer.style.alignItems = 'center';
    previewContainer.style.backgroundColor = 'white';
    previewContainer.style.overflow = 'hidden';
    
    const charImage = document.createElement('div');
    charImage.style.backgroundImage = `url('${workImageUrl}')`;
    charImage.style.backgroundPosition = `${x}px ${y}px`;
    charImage.style.width = `${width}px`;
    charImage.style.height = `${height}px`;
    charImage.style.backgroundSize = 'contain';
    charImage.style.backgroundRepeat = 'no-repeat';
    charImage.style.transform = 'scale(3)'; // 放大显示，确保清晰
    
    previewContainer.appendChild(charImage);
    previewEl.appendChild(previewContainer);
    
    // 创建canvas用于下载和读帖功能
    canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function() {
      ctx.drawImage(img, -x, -y, img.width, img.height);
    };
    img.src = workImageUrl;
  } else {
    // 回退到 Canvas 绘制
    canvas = document.createElement('canvas');
    canvas.width = 340; canvas.height = 340;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#8B4513';
    ctx.font = 'bold 200px KaiTi, STKaiti, serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width/2, canvas.height/2);
    previewEl.appendChild(canvas);
  }

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  // bind modal action buttons (download/remove/view)
  const downloadBtn = document.getElementById('downloadCharBtn');
  const viewAnnoBtn = document.getElementById('viewAnnotationsBtn');
  const removeBtn = document.getElementById('removeCharBtn');

  if (downloadBtn) {
    downloadBtn.onclick = () => {
      if (canvas) {
        downloadCanvasAsImage(canvas, `${text}.png`);
      } else {
        alert('无法生成图片');
      }
    };
  }
  if (viewAnnoBtn) {
    viewAnnoBtn.onclick = () => alert('读帖功能开发中');
  }
  if (removeBtn) {
    removeBtn.onclick = () => {
      if (confirm(`确定要从字集中移除 “${text}” 吗？`)) {
        // try to remove from detail grid if present
        const item = Array.from(document.querySelectorAll('.detail-char-item')).find(it => (it.dataset.char || '').toString() === text.toString());
        if (item) item.remove();
        closeCharModal();
      }
    };
  }
  // 读帖按钮：将 canvas 导出为 dataURL 写入 localStorage，然后跳转到 /read-post
  const readPostBtn = document.getElementById('readPostCharBtn');
  if (readPostBtn) {
    readPostBtn.onclick = () => {
      try {
        if (canvas) {
          const dataURL = canvas.toDataURL('image/png');
          localStorage.setItem('readPostImage', dataURL);
          window.location.href = '/read-post';
        } else {
          alert('无法生成图片');
        }
      } catch (e) {
        console.error('readPost error', e);
        alert('无法发送到读帖页面');
      }
    };
  }
}

function closeCharModal() {
  const modal = document.getElementById('charModal');
  if (!modal) return;
  modal.classList.add('hidden');
  const previewEl = document.getElementById('modalPreview');
  if (previewEl) previewEl.innerHTML = '';
  document.body.style.overflow = '';
}

// 添加与作品详情页面相同的弹窗逻辑
/**
 * 显示单字详情弹窗
 */
function showCharDetail(box, index) {
  console.debug && console.debug('showCharDetail called', box, index);
  
  // 创建弹窗元素（如果不存在）
  let charModal = document.getElementById('charModal');
  if (!charModal) {
    charModal = createCharModal();
  }
  
  // 获取弹窗元素
  const modalCharText = document.getElementById('modalCharText');
  const modalWorkTitle = document.getElementById('modalWorkTitle');
  const modalCharIndex = document.getElementById('modalCharIndex');
  const modalCharPosition = document.getElementById('modalCharPosition');
  const modalPreview = document.getElementById('modalPreview');
  const modalClose = document.getElementById('modalClose');
  const modalOverlay = document.getElementById('modalOverlay');
  
  // 填充弹窗内容
  modalCharText.textContent = box.char || '?';
  modalWorkTitle.textContent = box.work_title || '';
  modalCharIndex.textContent = index + 1;
  modalCharPosition.textContent = `x: ${Math.round(box.x)}, y: ${Math.round(box.y)}`;
  
  // 创建单字预览
  modalPreview.innerHTML = '';
  const largePreview = createLargeCharPreview(box);
  modalPreview.appendChild(largePreview);
  
  // 移除旧的收藏按钮和读帖按钮
  const prevCollectBtn = document.getElementById('collectCharBtn');
  if (prevCollectBtn) prevCollectBtn.remove();
  
  const prevReadPostBtn = document.getElementById('readPostBtn');
  if (prevReadPostBtn) prevReadPostBtn.remove();
  
  // 创建收藏按钮
  const collectBtn = document.createElement('button');
  collectBtn.type = 'button';
  collectBtn.className = 'btn btn-primary';
  collectBtn.id = 'collectCharBtn';
  collectBtn.innerHTML = '⭐ 收藏';
  
  // 创建读帖按钮
  const readPostBtn = document.createElement('button');
  readPostBtn.type = 'button';
  readPostBtn.className = 'btn btn-outline';
  readPostBtn.id = 'readPostBtn';
  readPostBtn.innerHTML = '📝 读帖';
  
  // 添加到弹窗按钮区
  const modalActions = charModal.querySelector('.char-actions') || (() => {
    const el = document.createElement('div');
    el.className = 'char-actions';
    charModal.querySelector('.modal-body').appendChild(el);
    return el;
  })();
  
  // 插入按钮到弹窗按钮区
  modalActions.insertBefore(readPostBtn, modalActions.firstChild);
  modalActions.insertBefore(collectBtn, modalActions.firstChild);
  
  // 添加收藏按钮点击事件
  const charIdForCollect = Number(box.id !== undefined ? box.id : index);
  
  // 检查收藏状态
  function ensureMockAPI() {
    return new Promise((resolve, reject) => {
      if (window.mockAPI) return resolve(window.mockAPI);
      const existing = document.getElementById('mock-api-script');
      if (existing) {
        existing.addEventListener('load', () => { if (window.mockAPI) resolve(window.mockAPI); else reject(new Error('mockAPI 未初始化')); });
        existing.addEventListener('error', () => reject(new Error('加载 mockAPI 失败')));
        return;
      }
      const script = document.createElement('script');
      script.id = 'mock-api-script';
      script.src = '/static/js/api_mock.js';
      script.onload = () => { if (window.mockAPI) resolve(window.mockAPI); else reject(new Error('mockAPI 未初始化')); };
      script.onerror = () => reject(new Error('加载 mockAPI 失败'));
      document.head.appendChild(script);
    });
  }
  
  ensureMockAPI().then(api => {
    try {
      if (api.isCollected(Number(charIdForCollect))) {
        collectBtn.innerHTML = '✅ 已收藏';
        collectBtn.disabled = true;
        collectBtn.className = 'btn btn-outline';
      }
    } catch (e) {
      console.error('检查收藏状态失败:', e);
    }
  }).catch(err => console.error('加载 mockAPI 失败:', err));
  
  collectBtn.onclick = async (e) => {
    e.stopPropagation();
    if (collectBtn.disabled) return;
    collectBtn.disabled = true;
    collectBtn.innerHTML = '⏳ 处理中...';
    try {
      const api = await ensureMockAPI();
      
      // 实现收藏逻辑
      const charData = {
        character_id: charIdForCollect,
        text: box.char || '',
        work_id: box.work_id || '',
        work_title: box.work_title || '',
        work_style: box.style || '',
        position: [box.x || 0, box.y || 0, (box.x || 0) + (box.width || 0), (box.y || 0) + (box.height || 0)],
        imageData: null,
        collected_at: new Date().toISOString()
      };
      
      let res;
      if (typeof api.collectCharacterWithData === 'function') {
        res = await api.collectCharacterWithData(charData);
      } else if (typeof api.collectCharacter === 'function') {
        res = await api.collectCharacter(Number(charIdForCollect));
      } else {
        throw new Error('收藏接口不可用');
      }
      
      if (res && res.code === 201) {
        collectBtn.innerHTML = '✅ 已收藏';
        collectBtn.disabled = true;
        collectBtn.className = 'btn btn-outline';
        alert('收藏成功！\n已保存单字，可在“我的字集”查看。');
      } else {
        collectBtn.innerHTML = '⭐ 收藏';
        collectBtn.disabled = false;
        collectBtn.className = 'btn btn-primary';
        alert(res?.message || '收藏失败');
      }
    } catch (err) {
      console.error('收藏失败', err);
      collectBtn.innerHTML = '⭐ 收藏';
      collectBtn.disabled = false;
      collectBtn.className = 'btn btn-primary';
      alert('收藏失败：' + (err.message || '未知错误'));
    }
  };
  
  // 截取单字图片函数
  function captureCharImage(box) {
    return new Promise((resolve) => {
      // 创建一个Image对象加载原始作品图片
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = function() {
        try {
          // 创建canvas用于截取单字
          const captureCanvas = document.createElement('canvas');
          const captureSize = 200;
          captureCanvas.width = captureSize;
          captureCanvas.height = captureSize;
          const ctx = captureCanvas.getContext('2d');
          
          // 填充白色背景
          ctx.fillStyle = '#fff';
          ctx.fillRect(0, 0, captureSize, captureSize);
          
          // 计算单字在作品图片中的位置和尺寸
          const x = box.x || 0;
          const y = box.y || 0;
          const width = box.width || 100;
          const height = box.height || 100;
          
          // 计算缩放比例，确保单字完整显示在captureSize范围内
          const aspect = width / Math.max(1, height);
          let destW = captureSize;
          let destH = captureSize;
          let dx = 0;
          let dy = 0;
          
          if (aspect > 1) {
            // 宽大于高，以宽度为基准缩放
            destH = Math.round(captureSize / aspect);
            dy = Math.floor((captureSize - destH) / 2);
          } else if (aspect < 1) {
            // 高大于宽，以高度为基准缩放
            destW = Math.round(captureSize * aspect);
            dx = Math.floor((captureSize - destW) / 2);
          }
          
          // 从原始图片中截取单字
          ctx.drawImage(img, x, y, width, height, dx, dy, destW, destH);
          
          // 将canvas转换为base64图片数据
          const imageData = captureCanvas.toDataURL('image/png');
          resolve(imageData);
        } catch (err) {
          console.error('截取图片失败:', err);
          resolve(null);
        }
      };
      
      img.onerror = function() {
        console.error('加载图片失败:', box.workImageUrl);
        resolve(null);
      };
      
      // 设置图片源
      img.src = box.workImageUrl;
    });
  }
  
  // 读帖按钮点击事件
  readPostBtn.onclick = async (e) => {
    e.stopPropagation();
    readPostBtn.disabled = true;
    readPostBtn.innerHTML = '⏳ 处理中...';
    try {
      // 截取单字图片
      readPostBtn.innerHTML = '📸 截取图片...';
      const imageData = await captureCharImage(box);
      
      if (!imageData) {
        throw new Error('图片截取失败');
      }
      
      // 存储单字信息到 localStorage，供读帖页面使用
      localStorage.setItem('readPostImage', imageData);
      localStorage.setItem('readPostCharId', box.id);
      localStorage.setItem('readPostChar', box.char);
      localStorage.setItem('readPostWorkId', box.work_id || '');
      
      // 跳转到读帖页面
      readPostBtn.innerHTML = '🚀 跳转中...';
      window.location.href = '/read-post';
    } catch (err) {
      alert('读帖失败：' + (err.message || '未知错误'));
      readPostBtn.disabled = false;
      readPostBtn.innerHTML = '📝 读帖';
    }
  };
  
  // 显示弹窗
  charModal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  
  // 绑定关闭事件
  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (modalOverlay) modalOverlay.addEventListener('click', closeModal);
  
  // 绑定下载和复制按钮事件
  const downloadBtn = document.getElementById('downloadCharBtn');
  const copyBtn = document.getElementById('copyCharBtn');
  
  if (downloadBtn) {
    downloadBtn.onclick = () => {
      const canvas = createLargeCharPreview(box);
      const link = document.createElement('a');
      link.download = `${box.char || '单字'}.png`;
      link.href = canvas.toDataURL();
      link.click();
    };
  }
  
  if (copyBtn) {
    copyBtn.onclick = () => {
      if (navigator.clipboard && box.char) {
        navigator.clipboard.writeText(box.char).then(() => {
          alert(`已复制：${box.char}`);
        }).catch(() => {
          alert(`文字：${box.char || '?'}`);
        });
      } else {
        alert(`文字：${box.char || '?'}`);
      }
    };
  }
}

/**
 * 创建单字详情弹窗
 */
function createCharModal() {
  // 创建弹窗容器
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'charModal';
  modal.style.display = 'none';
  modal.innerHTML = `
    <div class="modal-overlay" id="modalOverlay"></div>
    <div class="modal-content">
      <button class="modal-close" id="modalClose">×</button>
      <div class="modal-body">
        <div class="char-detail-preview" id="modalPreview"></div>
        <div class="char-detail-info">
          <h3 class="char-detail-text" id="modalCharText">永</h3>
          <div class="char-detail-meta">
            <p class="meta-row">
              <span class="meta-label">作品：</span>
              <span class="meta-value" id="modalWorkTitle">-</span>
            </p>
            <p class="meta-row">
              <span class="meta-label">序号：</span>
              <span class="meta-value" id="modalCharIndex">1</span>
            </p>
            <p class="meta-row">
              <span class="meta-label">位置：</span>
              <span class="meta-value" id="modalCharPosition">x: 0, y: 0</span>
            </p>
          </div>
          <div class="char-actions">
            <button type="button" class="btn btn-outline" id="downloadCharBtn">
              下载此字
            </button>
            <button type="button" class="btn btn-outline" id="copyCharBtn">
              复制文字
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // 添加到页面
  document.body.appendChild(modal);
  return modal;
}

/**
 * 创建大尺寸单字预览
 */
/**
 * 生成统一尺寸的单字预览图
 * @param {Object} box - 单字信息对象
 * @param {number} [size=180] - 生成图片的尺寸
 * @param {HTMLImageElement} [image=null] - 可选的图片对象，如果提供则直接使用
 * @returns {HTMLCanvasElement} 生成的canvas元素
 */
function createLargeCharPreview(box, size = 180, image = null) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  // 填充白色背景
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);
  
  const drawChar = (img) => {
    const { x, y, width, height } = box;
    const aspect = width / height;
    
    let destW = size;
    let destH = size;
    let dx = 0;
    let dy = 0;
    
    if (aspect > 1) {
      // 宽大于高，垂直居中
      destH = Math.round(size / aspect);
      dy = Math.floor((size - destH) / 2);
    } else if (aspect < 1) {
      // 高大于宽，水平居中
      destW = Math.round(size * aspect);
      dx = Math.floor((size - destW) / 2);
    }
    
    ctx.drawImage(img, x, y, width, height, dx, dy, destW, destH);
  };
  
  if (image && image.complete) {
    // 使用已加载的图片对象
    drawChar(image);
  } else if (box.workImageUrl) {
    // 从URL加载图片
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function() {
      drawChar(img);
    };
    img.src = box.workImageUrl;
  } else {
    // 如果没有图片，显示文字
    const fontSize = Math.round(size * 0.7);
    ctx.font = `${fontSize}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#000000';
    ctx.fillText(box.char || '?', size / 2, size / 2);
  }
  
  return canvas;
}

/**
 * 关闭单字详情弹窗
 */
function closeModal() {
  const charModal = document.getElementById('charModal');
  if (charModal) {
    charModal.style.display = 'none';
    document.body.style.overflow = '';
  }
}

function downloadCanvasAsImage(canvas, filename) {
  if (!canvas) return;
  const link = document.createElement('a');
  link.download = filename || 'char.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}

/**
 * 动态创建创建/编辑字集弹窗（当模板未包含时备用）
 */
function createCollectionModal() {
  if (document.getElementById('collectionModal')) return;
  const html = `
    <div class="modal hidden" id="collectionModal" role="dialog" aria-labelledby="modalTitle" aria-modal="true">
      <div class="modal-overlay" id="modalOverlay"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h2 id="modalTitle">创建字集</h2>
          <button type="button" class="modal-close" id="modalClose" aria-label="关闭">×</button>
        </div>
        <div class="modal-body">
          <form id="collectionForm" class="form">
            <div class="form-group">
              <label for="collectionName" class="form-label">字集名称 <span class="required">*</span></label>
              <input type="text" id="collectionName" class="form-input" maxlength="50" required />
            </div>
            <div class="form-group">
              <label for="collectionDesc" class="form-label">描述（选填）</label>
              <textarea id="collectionDesc" class="form-textarea" rows="3" maxlength="200"></textarea>
            </div>
            <div class="form-group">
              <label for="collectionStyle" class="form-label">主要风格</label>
              <select id="collectionStyle" class="form-select">
                <option value="">不限</option>
                <option value="kai">楷书</option>
                <option value="xing">行书</option>
                <option value="cao">草书</option>
                <option value="li">隶书</option>
                <option value="zhuan">篆书</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">可见性</label>
              <div class="radio-group">
                <label class="radio-label"><input type="radio" name="visibility" value="private" checked /> 私密</label>
                <label class="radio-label"><input type="radio" name="visibility" value="public" /> 公开</label>
              </div>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" id="modalCancel">取消</button>
          <button type="button" class="btn btn-primary" id="modalConfirm">确定</button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', html);

  // 绑定基础事件
  document.getElementById('modalClose')?.addEventListener('click', () => closeCollectionModal());
  document.getElementById('modalCancel')?.addEventListener('click', () => closeCollectionModal());
  document.getElementById('modalOverlay')?.addEventListener('click', () => closeCollectionModal());
  document.getElementById('modalConfirm')?.addEventListener('click', () => handleCollectionSubmit());
}

/**
 * 打开创建/编辑字集弹窗
 */
function openCollectionModal(mode = 'create') {
  let modal = document.getElementById('collectionModal');
  let title = document.getElementById('modalTitle');

  // 如果缺失 modal，则动态创建一个（保证按钮在任意页面都可用）
  if (!modal) {
    createCollectionModal();
    modal = document.getElementById('collectionModal');
    title = document.getElementById('modalTitle');
  }

  if (mode === 'create') {
    if (title) title.textContent = '创建字集';
    const formEl = document.getElementById('collectionForm');
    if (formEl && typeof formEl.reset === 'function') formEl.reset();
  }

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

/**
 * 关闭创建/编辑字集弹窗
 */
function closeCollectionModal() {
  const modal = document.getElementById('collectionModal');
  modal.classList.add('hidden');
  document.body.style.overflow = '';
}

/**
 * 处理字集表单提交
 */
async function handleCollectionSubmit() {
  const name = document.getElementById('collectionName').value.trim();
  const desc = document.getElementById('collectionDesc').value.trim();
  const style = document.getElementById('collectionStyle').value;

  if (!name) {
    alert('请输入字集名称');
    return;
  }

  const data = {
    name: name,
    description: desc,
    style: style
  };

  try {
    let result;
    if (currentEditSetId) {
      // 编辑现有字集
      result = await apiRequest(`/character-sets/${currentEditSetId}`, 'PUT', data);
    } else {
      // 创建新字集
      result = await apiRequest('/character-sets', 'POST', data);
    }
    
    // 重新加载字集列表
    await loadCharacterSets();
    
    // 关闭弹窗
    closeCollectionModal();
    
    // 重置编辑状态
    currentEditSetId = null;
    
    alert(currentEditSetId ? '字集更新成功！' : '字集创建成功！');
    
    // 自动刷新页面，确保所有数据及时更新
    window.location.reload();
  } catch (error) {
    console.error('保存字集失败:', error);
    
    // 处理未登录错误，显示友好提示
    const errorMessage = error.message;
    if (errorMessage.includes('Token') || errorMessage.includes('Authorization') || errorMessage.includes('Missing')) {
      alert('请先登录后操作');
    } else {
      alert('保存字集失败，请稍后重试');
    }
  }
}

/**
 * 创建字集卡片元素
 */
function createCollectionCard(data) {
  const article = document.createElement('article');
  article.className = 'collection-card';
  article.dataset.setId = data.id;

  // 格式化更新时间
  const updateTime = new Date(data.updated_at);
  const now = new Date();
  const diffTime = Math.abs(now - updateTime);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  let timeText;
  if (diffDays === 0) {
    timeText = '今天';
  } else if (diffDays === 1) {
    timeText = '昨天';
  } else if (diffDays < 7) {
    timeText = `${diffDays}天前`;
  } else {
    timeText = updateTime.toLocaleDateString();
  }

  article.innerHTML = `
    <div class="collection-header">
      <div class="collection-info">
        <h3 class="collection-name">${data.name}</h3>
        <p class="collection-meta">${data.characters_count}个字 · 更新于 ${timeText}</p>
      </div>
      <div class="collection-actions">
        <button type="button" class="action-btn" data-action="edit" aria-label="编辑字集">
          <span class="action-icon">✏️</span>
        </button>
        <button type="button" class="action-btn" data-action="delete" aria-label="删除字集">
          <span class="action-icon">🗑️</span>
        </button>
      </div>
    </div>
    <div class="collection-preview">
      <div class="char-grid">
      </div>
    </div>
    <div class="collection-footer">
      <button type="button" class="btn btn-secondary btn-small" data-collection="${data.id}">查看详情</button>
      <button type="button" class="btn btn-outline btn-small" data-collection="${data.id}">添加单字</button>
    </div>
  `;

  return article;
}

/**
 * 打开字集详情弹窗
 */
async function openDetailModal(collectionId) {
  let modal = document.getElementById('detailModal');
  try {
    // 如果已经在 DOM 中，直接显示
    if (modal) {
      modal.classList.remove('hidden');
      // 设置回退内联样式，确保在被覆盖或优先级问题下可见
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    } else {
      // 动态创建回退 modal，以防模板未包含 detailModal
      modal = document.createElement('div');
      modal.id = 'detailModal';
      modal.className = 'modal';
      modal.style.display = 'flex';
      modal.innerHTML = `
        <div class="modal-overlay" id="detailOverlay"></div>
        <div class="modal-content modal-large">
          <div class="modal-header">
            <h2 id="detailTitle">字集详情</h2>
            <button type="button" class="modal-close" id="detailClose" aria-label="关闭">×</button>
          </div>
          <div class="modal-body">
            <div class="detail-toolbar">
              <div class="detail-search"><input type="search" id="charSearch" class="search-input" placeholder="搜索单字..." /></div>
              <div class="detail-actions">
                <button type="button" class="btn btn-outline btn-small" id="selectModeBtn">批量选择</button>
                <button type="button" class="btn btn-outline btn-small" id="exportBtn">导出</button>
              </div>
            </div>
            <div class="detail-char-grid" id="detailCharGrid"></div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      // 绑定关闭事件
      const detailOverlay = document.getElementById('detailOverlay');
      const detailClose = document.getElementById('detailClose');
      if (detailOverlay) detailOverlay.addEventListener('click', () => closeDetailModal());
      if (detailClose) detailClose.addEventListener('click', () => closeDetailModal());

      document.body.style.overflow = 'hidden';
    }
  } catch (err) {
    console.error('openDetailModal error:', err);
  }

  try {
    // 从后端加载字集详情和单字列表
    const result = await apiRequest(`/character-sets/${collectionId}/characters`);
    const characters = result.characters;
    
    // 填充 detailCharGrid
    const grid = document.getElementById('detailCharGrid');
    if (grid) {
      grid.innerHTML = '';
      
      // 批量处理单字数据
      for (const charInSet of characters) {
        const character = charInSet.character;
        const item = document.createElement('div');
        item.className = 'detail-char-item';
        item.dataset.char = character.recognition;
        item.dataset.charId = character.id;
        
        // 存储原始字符坐标和图片信息到data属性
        item.dataset.x = character.x;
        item.dataset.y = character.y;
        item.dataset.width = character.width;
        item.dataset.height = character.height;
        item.dataset.workImageUrl = character.work_image_url;
        
        // 创建char-card元素
        const charCard = document.createElement('div');
        charCard.className = 'char-card';
        
        // 创建图片元素
        const charImage = document.createElement('img');
        charImage.className = 'char-image';
        charImage.ariaHidden = 'true';
        
        // 创建文字标签
        const charLabel = document.createElement('div');
        charLabel.className = 'char-label';
        charLabel.textContent = character.recognition;
        
        // 创建来源信息
        const charSource = document.createElement('div');
        charSource.className = 'char-source';
        charSource.textContent = character.source;
        
        // 创建移除按钮
        const charRemoveBtn = document.createElement('button');
        charRemoveBtn.type = 'button';
        charRemoveBtn.className = 'char-remove';
        charRemoveBtn.ariaLabel = '移除';
        charRemoveBtn.title = '从字集中移除';
        charRemoveBtn.innerHTML = '×';
        
        // 组装元素
        charCard.appendChild(charImage);
        charCard.appendChild(charLabel);
        charCard.appendChild(charSource);
        charCard.appendChild(charRemoveBtn);
        item.appendChild(charCard);
        grid.appendChild(item);
        
        // 生成统一尺寸的图片
        const imageUrl = await generateUniformCharImage(character);
        if (imageUrl) {
          charImage.src = imageUrl;
        }
      }
      
      // 添加CSS样式，确保char-image元素显示正确
      const style = document.createElement('style');
      style.textContent = `
        .detail-char-item .char-image {
          background-color: white;
          margin: 0 auto;
          width: 120px;
          height: 120px;
          display: block;
        }
      `;
      document.head.appendChild(style);
    }
  } catch (error) {
    console.error('加载字集详情失败:', error);
    
    // 处理未登录错误，显示友好提示
    const errorMessage = error.message;
    if (errorMessage.includes('Token') || errorMessage.includes('Authorization') || errorMessage.includes('Missing')) {
      alert('请先登录后查看字集详情');
      closeDetailModal();
    } else {
      alert('加载字集详情失败，请稍后重试');
      closeDetailModal();
    }
  }
}

/**
 * 关闭字集详情弹窗
 */
function closeDetailModal() {
  const modal = document.getElementById('detailModal');
  modal.classList.add('hidden');
  document.body.style.overflow = '';
}

/**
 * 初始化字集详情功能
 */
function initCollectionDetails() {
  // 单字搜索
  const charSearch = document.getElementById('charSearch');
  if (charSearch) {
    charSearch.addEventListener('input', function() {
      searchCharacters(this.value.trim());
    });
  }

  // 批量选择模式
  const selectModeBtn = document.getElementById('selectModeBtn');
  if (selectModeBtn) {
    selectModeBtn.addEventListener('click', toggleSelectMode);
  }

  // 导出功能
  const exportBtn = document.getElementById('exportBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', handleExport);
  }

  // 移除单字
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('char-remove') ||
        e.target.closest('.char-remove')) {
      e.stopPropagation(); // 阻止事件冒泡到父元素
      handleRemoveCharacter(e.target.closest('.detail-char-item'));
    }
  });
  // 点击单字打开详情（非批量选择模式）
  document.querySelectorAll('.detail-char-item').forEach(item => {
    item.addEventListener('click', function(e) {
      if (this.classList.contains('selectable')) return; // 批量选择模式下不打开
      if (e.target.classList.contains('char-remove') || e.target.closest('.char-remove')) return;
      openCharModalFromItem(this);
    });
  });

  // 事件委托：支持动态生成的 .detail-char-item 点击打开（优先于单独绑定）
  document.addEventListener('click', function(e) {
    const item = e.target.closest && e.target.closest('.detail-char-item');
    if (!item) return;
    if (e.target.classList.contains('char-remove') || e.target.closest('.char-remove')) return;
    if (item.classList.contains('selectable')) return;
    openCharModalFromItem(item);
  });
}

/**
 * 搜索单字
 */
function searchCharacters(keyword) {
  const charItems = document.querySelectorAll('.detail-char-item');

  charItems.forEach(item => {
    const char = item.dataset.char;
    const label = item.querySelector('.char-label').textContent;
    const source = item.querySelector('.char-source').textContent;

    if (!keyword ||
        char.includes(keyword) ||
        label.includes(keyword) ||
        source.includes(keyword)) {
      item.style.display = '';
    } else {
      item.style.display = 'none';
    }
  });
}

/**
 * 切换批量选择模式
 */
function toggleSelectMode() {
  const btn = document.getElementById('selectModeBtn');
  const charItems = document.querySelectorAll('.detail-char-item');

  if (btn.textContent === '批量选择') {
    btn.textContent = '取消选择';
    btn.classList.add('active');

    // 添加选择功能
    charItems.forEach(item => {
      item.classList.add('selectable');
      item.addEventListener('click', handleCharacterSelect);
    });
  } else {
    btn.textContent = '批量选择';
    btn.classList.remove('active');

    // 移除选择功能
    charItems.forEach(item => {
      item.classList.remove('selectable', 'selected');
      item.removeEventListener('click', handleCharacterSelect);
    });
  }
}

/**
 * 处理单字选择
 */
function handleCharacterSelect(e) {
  if (e.target.classList.contains('char-remove')) return;
  this.classList.toggle('selected');
}

/**
 * 处理导出
 */
function handleExport() {
  const chars = Array.from(document.querySelectorAll('.detail-char-item'))
    .map(item => item.dataset.char)
    .join('');

  if (!chars) {
    alert('当前字集为空');
    return;
  }

  // 简单的导出功能
  const blob = new Blob([chars], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `字集_${new Date().getTime()}.txt`;
  a.click();
  URL.revokeObjectURL(url);

  alert('导出成功！');
}

/**
 * 处理移除单字
 */
async function handleRemoveCharacter(charItem) {
  const char = charItem.dataset.char;
  
  // 获取当前字集ID（从详情弹窗的URL或其他方式获取）
  // 这里简化处理，从当前显示的字集详情中获取
  const detailModal = document.getElementById('detailModal');
  if (!detailModal) return;
  
  // 查找当前字集的按钮，获取字集ID
  const currentSetBtn = Array.from(document.querySelectorAll('button[data-collection]')).find(btn => {
    const card = btn.closest('.collection-card');
    if (!card) return false;
    const name = card.querySelector('.collection-name').textContent;
    const detailTitle = document.getElementById('detailTitle');
    return detailTitle && detailTitle.textContent.includes(name);
  });
  
  if (!currentSetBtn) {
    alert('无法获取当前字集信息');
    return;
  }
  
  const collectionId = currentSetBtn.dataset.collection;

  if (confirm(`确定要从字集中移除"${char}"吗？`)) {
    try {
      // 从后端获取该字集的单字列表，查找匹配的单字ID
      const result = await apiRequest(`/character-sets/${collectionId}/characters`);
      const characters = result.characters;
      
      // 查找要移除的单字
      const charToRemove = characters.find(charInSet => charInSet.character.recognition === char);
      if (!charToRemove) {
        throw new Error('未找到该单字');
      }
      
      // 调用API移除单字
      await apiRequest(`/character-sets/${collectionId}/characters/${charToRemove.character.id}`, 'DELETE');
      
      // 添加删除动画
      charItem.style.animation = 'fadeOut 0.3s ease';

      setTimeout(() => {
        charItem.remove();
        alert('已移除');
      }, 300);
    } catch (error) {
      console.error('移除单字失败:', error);
      
      // 处理未登录错误，显示友好提示
      const errorMessage = error.message;
      if (errorMessage.includes('Token') || errorMessage.includes('Authorization') || errorMessage.includes('Missing')) {
        alert('请先登录后操作');
      } else {
        alert('移除单字失败，请稍后重试');
      }
    }
  }
}

/**
 * 更新统计数据
 */
function updateStats() {
  const collections = document.querySelectorAll('.collection-card');
  const totalCollections = collections.length;

  let totalCharacters = 0;
  collections.forEach(card => {
    const meta = card.querySelector('.collection-meta').textContent;
    const match = meta.match(/(\d+)个字/);
    if (match) {
      totalCharacters += parseInt(match[1]);
    }
  });

  document.getElementById('totalCollections').textContent = totalCollections;
  document.getElementById('totalCharacters').textContent = totalCharacters;
}

/**
 * 检查是否显示空状态
 */
function checkEmptyState() {
  const container = document.getElementById('collectionsList');
  const emptyState = document.getElementById('emptyState');
  const cards = container.querySelectorAll('.collection-card');

  if (cards.length === 0) {
    container.style.display = 'none';
    emptyState.classList.remove('hidden');
  }
}

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeOut {
    from { opacity: 1; transform: scale(1); }
    to { opacity: 0; transform: scale(0.9); }
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .detail-char-item.selectable {
    cursor: pointer;
  }

  .detail-char-item.selected .char-card {
    border-color: var(--theme-brown);
    background: #fff;
    box-shadow: 0 0 0 2px var(--theme-brown);
  }
`;
document.head.appendChild(style);