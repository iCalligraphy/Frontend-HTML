/**
 * 我的字集页面交互脚本
 * 包含字集创建、编辑、删除、单字筛选等功能
 */

// 等待 DOM 加载完成
document.addEventListener('DOMContentLoaded', function() {
  // 初始化所有功能
  initCollectionButtons();
  initCollectionActions();
  initFiltersAndSearch();
  initModals();
  initCollectionDetails();
});

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
 * 处理编辑字集
 */
function handleEditCollection(collectionCard) {
  const name = collectionCard.querySelector('.collection-name').textContent;
  const meta = collectionCard.querySelector('.collection-meta').textContent;

  // 填充表单数据
  document.getElementById('collectionName').value = name;
  document.getElementById('modalTitle').textContent = '编辑字集';

  // 打开弹窗
  openCollectionModal('edit');
}

/**
 * 处理删除字集
 */
function handleDeleteCollection(collectionCard) {
  const name = collectionCard.querySelector('.collection-name').textContent;

  if (confirm(`确定要删除字集"${name}"吗？此操作无法撤销。`)) {
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
 * 加载模拟单字数据
 */
function loadMockCharacters() {
  const mockChars = [
    { char: '永', source: '王羲之 · 兰亭序', style: 'xing' },
    { char: '和', source: '颜真卿 · 多宝塔碑', style: 'kai' },
    { char: '静', source: '欧阳询 · 九成宫', style: 'kai' },
    { char: '雅', source: '柳公权 · 玄秘塔碑', style: 'kai' },
    { char: '韵', source: '怀素 · 自叙帖', style: 'cao' },
    { char: '墨', source: '张旭 · 古诗四帖', style: 'cao' },
    { char: '云', source: '赵孟頫 · 胆巴碑', style: 'xing' },
    { char: '山', source: '米芾 · 蜀素帖', style: 'xing' }
  ];

  const grid = document.getElementById('addCharGrid');
  if (!grid) return;

  grid.innerHTML = mockChars.map(item => `
    <div class="add-char-item" data-char="${item.char}" data-style="${item.style}">
      <div class="char-card">
        <div class="char-image" aria-hidden="true">
          <span class="char-display-large">${item.char}</span>
        </div>
        <div class="char-label">${item.char}</div>
        <div class="char-source">${item.source}</div>
        <button type="button" class="char-add-btn" title="添加到字集">
          <span>+</span>
        </button>
      </div>
    </div>
  `).join('');

  // 添加单字点击事件
  grid.querySelectorAll('.char-add-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      const charItem = this.closest('.add-char-item');
      const char = charItem.dataset.char;
      addCharToCollection(char);
    });
  });
}

/**
 * 添加单字到字集
 */
function addCharToCollection(char) {
  const modal = document.getElementById('addCharModal');
  const collectionId = modal?.dataset.collectionId;

  // 模拟添加逻辑（实际应调用后端API）
  console.log(`添加单字 "${char}" 到字集 ${collectionId}`);

  // 在对应卡片预览中添加单字
  if (collectionId) {
    const cardBtn = document.querySelector(`button[data-collection="${collectionId}"]`);
    const card = cardBtn ? cardBtn.closest('.collection-card') : null;
    if (card) {
      const grid = card.querySelector('.char-grid');
      if (grid) {
        const item = document.createElement('div');
        item.className = 'char-item';
        item.dataset.char = char;
        item.innerHTML = `<span class="char-display">${char}</span>`;
        // insert before the "more" element if exists
        const more = grid.querySelector('.char-more');
        if (more) grid.insertBefore(item, more);
        else grid.appendChild(item);

        // 更新卡片 meta 中的数量
        const metaEl = card.querySelector('.collection-meta');
        if (metaEl) {
          const match = metaEl.textContent.match(/(\d+)个字/);
          if (match) {
            const newCount = parseInt(match[1]) + 1;
            metaEl.textContent = metaEl.textContent.replace(/(\d+)个字/, `${newCount}个字`);
          } else {
            metaEl.textContent = `1个字 · ${metaEl.textContent}`;
          }
        }
      }
    }
  }

  // 显示成功提示
  alert(`已将 "${char}" 添加到字集`);

  // 关闭弹窗
  closeAddCharModal();

  // 更新统计数据
  updateStats();
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
  const char = item.dataset.char || (item.querySelector('.char-label') && item.querySelector('.char-label').textContent) || '?';
  const source = item.querySelector('.char-source') ? item.querySelector('.char-source').textContent : '';

  openCharModal({ text: char, work: source });
}

function openCharModal(data = {}) {
  const modal = document.getElementById('charModal');
  if (!modal) return;

  const text = data.text || '-';
  const work = data.work || '-';

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

  // render preview (simple canvas)
  previewEl.innerHTML = '';
  const canvas = document.createElement('canvas');
  canvas.width = 340; canvas.height = 340;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff'; ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = '#8B4513';
  ctx.font = 'bold 200px KaiTi, STKaiti, serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width/2, canvas.height/2);
  previewEl.appendChild(canvas);

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  // bind modal action buttons (download/remove/view)
  const downloadBtn = document.getElementById('downloadCharBtn');
  const viewAnnoBtn = document.getElementById('viewAnnotationsBtn');
  const removeBtn = document.getElementById('removeCharBtn');

  if (downloadBtn) {
    downloadBtn.onclick = () => downloadCanvasAsImage(canvas, `${text}.png`);
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
        const dataURL = canvas.toDataURL('image/png');
        localStorage.setItem('readPostImage', dataURL);
        window.location.href = '/read-post';
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
function handleCollectionSubmit() {
  const name = document.getElementById('collectionName').value.trim();
  const desc = document.getElementById('collectionDesc').value.trim();
  const style = document.getElementById('collectionStyle').value;
  const visibility = document.querySelector('input[name="visibility"]:checked').value;

  if (!name) {
    alert('请输入字集名称');
    return;
  }

  // 创建新字集卡片
  const newCollection = createCollectionCard({
    name: name,
    count: 0,
    style: style,
    time: '刚刚'
  });

  // 添加到列表
  const container = document.getElementById('collectionsList');
  container.insertBefore(newCollection, container.firstChild);

  // 更新统计
  updateStats();

  // 隐藏空状态
  document.getElementById('emptyState').classList.add('hidden');
  container.style.display = '';

  // 关闭弹窗
  closeCollectionModal();

  alert('字集创建成功！');
}

/**
 * 创建字集卡片元素
 */
function createCollectionCard(data) {
  const article = document.createElement('article');
  article.className = 'collection-card';

  const styleMap = {
    'kai': '楷书',
    'xing': '行书',
    'cao': '草书',
    'li': '隶书',
    'zhuan': '篆书',
    '': '不限'
  };

  article.innerHTML = `
    <div class="collection-header">
      <div class="collection-info">
        <h3 class="collection-name">${data.name}</h3>
        <p class="collection-meta">${data.count}个字 · ${styleMap[data.style]} · 更新于 ${data.time}</p>
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
      <button type="button" class="btn btn-secondary btn-small" data-collection="${Date.now()}">查看详情</button>
      <button type="button" class="btn btn-outline btn-small" data-collection="${Date.now()}">添加单字</button>
    </div>
  `;

  return article;
}

/**
 * 打开字集详情弹窗
 */
function openDetailModal(collectionId) {
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

  // 实际应用中应该加载对应字集的详细数据
  console.log('加载字集详情:', collectionId);

  // 尝试填充 detailCharGrid：从对应的 collection 卡片复制预览单字
  try {
    const grid = document.getElementById('detailCharGrid');
    if (grid) {
      grid.innerHTML = '';
      // 查找同 collectionId 的卡片
      const cardBtn = document.querySelector(`button[data-collection="${collectionId}"]`);
      const card = cardBtn ? cardBtn.closest('.collection-card') : null;
      if (card) {
        const chars = Array.from(card.querySelectorAll('.char-display')).map(el => el.textContent.trim());
        chars.forEach(ch => {
          const item = document.createElement('div');
          item.className = 'detail-char-item';
          item.dataset.char = ch;
          item.innerHTML = `
            <div class="char-card">
              <div class="char-image" aria-hidden="true"></div>
              <div class="char-label">${ch}</div>
              <div class="char-source">作者未知</div>
              <button type="button" class="char-remove" aria-label="移除" title="从字集中移除">×</button>
            </div>
          `;
          grid.appendChild(item);
        });
      }
    }
  } catch (e) {
    console.warn('填充 detailCharGrid 出错', e);
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

  // ========== 新增：单字点击跳转到读帖界面 ==========
  document.addEventListener('click', function(e) {
    const charItem = e.target.closest && e.target.closest('.detail-char-item');
    // 确保点击的是单字卡片，而不是移除按钮
    if (charItem && !e.target.closest('.char-remove')) {
      const char = charItem.dataset.char;
      const charLabel = charItem.querySelector('.char-label')?.textContent || char;
      const charSource = charItem.querySelector('.char-source')?.textContent || '';
      
      // 存储单字信息到 localStorage，供读帖页面使用
      try {
        localStorage.setItem('selectedChar', JSON.stringify({
          char: charLabel,
          source: charSource,
          timestamp: Date.now()
        }));
      } catch (err) {
        console.warn('localStorage write failed', err);
      }
      
      // 跳转到读帖页面
      window.location.href = '/read-post';
    }
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
function handleRemoveCharacter(charItem) {
  const char = charItem.dataset.char;

  if (confirm(`确定要从字集中移除"${char}"吗？`)) {
    charItem.style.animation = 'fadeOut 0.3s ease';

    setTimeout(() => {
      charItem.remove();
      alert('已移除');
    }, 300);
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