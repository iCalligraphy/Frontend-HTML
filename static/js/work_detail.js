/**
 * 作品详情页面交互脚本
 * 包含图片缩放、拖拽、单字悬停、评论等功能
 */

// API配置
const API_BASE = 'http://10.234.242.47:5000';

// 全局状态
const viewerState = {
  canvas: null,
  ctx: null,
  image: null,
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  isDragging: false,
  dragStartX: 0,
  dragStartY: 0,
  showCharBoxes: true,
  charBoxes: [] // 示例单字框数据
};

// API请求函数
async function fetchWorkData(workId) {
  try {
    const response = await fetch(`${API_BASE}/api/works/${workId}`);
    if (!response.ok) {
      throw new Error(`作品获取失败: ${response.status}`);
    }
    const data = await response.json();
    return data.work;
  } catch (error) {
    console.error('API请求失败:', error);
    throw error;
  }
}

async function fetchWorksList() {
  try {
    const response = await fetch(`${API_BASE}/api/works/`);
    if (!response.ok) {
      throw new Error(`作品列表获取失败: ${response.status}`);
    }
    const data = await response.json();
    return data.works;
  } catch (error) {
    console.error('API请求失败:', error);
    throw error;
  }
}

// DOM 加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  // 从URL路径中提取作品ID，支持 /work/2 格式
  const pathParts = window.location.pathname.split('/');
  let currentWorkId = pathParts[pathParts.length - 1];
  
  // 验证作品ID是否为数字
  if (!currentWorkId || isNaN(currentWorkId)) {
    // 从查询参数中获取，支持 /work?id=2 格式
    const urlParams = new URLSearchParams(window.location.search);
    currentWorkId = urlParams.get('id');
  }

  let currentWork = null;
  let boxes = [];

  // 保存单字到后端
  async function saveCharacterToBackend(box) {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('未登录，无法保存单字');
      }
      
      if (!currentWork) {
        throw new Error('作品数据未加载完成');
      }
      
      const workId = currentWork.id;
      
      const characterData = {
        recognition: box.char,
        style: box.style,
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
        strokes: 0, // 默认值，后续可以通过AI识别获取
        stroke_order: '', // 默认值，后续可以通过AI识别获取
        keypoints: [] // 默认值，后续可以通过AI识别获取
      };
      
      const response = await fetch(`${API_BASE}/api/works/${workId}/characters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(characterData)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`保存单字失败: ${response.status} ${errorData.error || ''}`);
      }
      
      const result = await response.json();
      // 更新本地单字的ID为后端返回的ID
      const localBox = boxes.find(b => b.id === box.id);
      if (localBox) {
        localBox.id = result.character.id;
      }
      
      console.log('单字保存成功:', result.character);
      return result.character;
    } catch (error) {
      console.error('保存单字到后端失败:', error);
      throw error;
    }
  }

  // 删除单字到后端
  async function deleteCharacterFromBackend(characterId) {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('未登录，无法删除单字');
      }
      
      const response = await fetch(`${API_BASE}/api/works/characters/${characterId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`删除单字失败: ${response.status} ${errorData.error || ''}`);
      }
      
      const result = await response.json();
      console.log('单字删除成功:', result);
      return result;
    } catch (error) {
      console.error('删除单字到后端失败:', error);
      throw error;
    }
  }

  // 修改单字到后端
  async function updateCharacterToBackend(characterId, updateData) {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('未登录，无法修改单字');
      }
      
      const response = await fetch(`${API_BASE}/api/works/characters/${characterId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`修改单字失败: ${response.status} ${errorData.error || ''}`);
      }
      
      const result = await response.json();
      console.log('单字修改成功:', result);
      return result;
    } catch (error) {
      console.error('修改单字到后端失败:', error);
      throw error;
    }
  }

  const workSelect = document.getElementById('workSelect');
  const workTitle = document.getElementById('workTitle');
  const workAuthor = document.getElementById('workAuthor');
  const workDynasty = document.getElementById('workDynasty');
  const workStyle = document.getElementById('workStyle');
  const headerCharCountEl = document.getElementById('headerCharCount');

  const viewerCanvas = document.getElementById('viewerCanvas');
  const viewerCtx = viewerCanvas.getContext('2d');
  const viewerContainer = document.getElementById('viewerContainer');
  const boxesOverlay = document.getElementById('boxesOverlay');
  const loadingOverlay = document.getElementById('loadingOverlay');

  const charsGrid = document.getElementById('charsGrid');
  const charCountEl = document.getElementById('charCount');
  const charSearch = document.getElementById('charSearch');
  const sortSelect = document.getElementById('sortSelect');
  const emptyState = document.getElementById('emptyState');

  const zoomInBtn = document.getElementById('zoomInBtn');
  const zoomOutBtn = document.getElementById('zoomOutBtn');
  const fitBtn = document.getElementById('fitBtn');
  const resetBtn = document.getElementById('resetBtn');
  const zoomLevelEl = document.getElementById('zoomLevel');
  const showBoxesToggle = document.getElementById('showBoxesToggle');
  const showLabelsToggle = document.getElementById('showLabelsToggle');
  const downloadBtn = document.getElementById('downloadBtn');
  const exportBtn = document.getElementById('exportBtn');

  const addBoxBtn = document.getElementById('addBoxBtn');
  const cancelDrawBtn = document.getElementById('cancelDrawBtn');
  const toolbarHint = document.getElementById('toolbarHint');

  const charModal = document.getElementById('charModal');
  const modalClose = document.getElementById('modalClose');
  const modalOverlay = document.getElementById('modalOverlay');
  const modalPreview = document.getElementById('modalPreview');
  const modalCharText = document.getElementById('modalCharText');
  const modalWorkTitle = document.getElementById('modalWorkTitle');
  const modalCharIndex = document.getElementById('modalCharIndex');
  const modalCharPosition = document.getElementById('modalCharPosition');
  const downloadCharBtn = document.getElementById('downloadCharBtn');
  const copyCharBtn = document.getElementById('copyCharBtn');

  let image = null;
  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let showBoxes = true;
  let showLabels = true;
  let filteredBoxes = [];
  let selectedCharId = null;

  let isDrawMode = false;
  let isDrawing = false;
  let drawStartX = 0;
  let drawStartY = 0;
  let drawTempBox = null;

  async function initialize() {
    await initWorkSelector();
    await loadWork(currentWorkId);
    bindGlobalEvents();
  }

  async function initWorkSelector() {
    try {
      // 从API获取作品列表
      const works = await fetchWorksList();
      workSelect.innerHTML = '';
      works.forEach(work => {
        const option = document.createElement('option');
        option.value = work.id;
        option.textContent = `${work.title} - ${work.author_name || work.author || ''}`;
        if (String(work.id) === String(currentWorkId)) option.selected = true;
        workSelect.appendChild(option);
      });
      workSelect.addEventListener('change', (e) => {
        currentWorkId = e.target.value;
        loadWork(currentWorkId);
        // 更新URL为 /work/2 格式
        window.history.pushState({}, '', `/work/${currentWorkId}`);
      });
    } catch (error) {
      console.error('加载作品列表失败:', error);
      // 显示错误信息
      workSelect.innerHTML = '<option value="">作品列表加载失败</option>';
    }
  }

  async function loadWork(workId) {
    showLoading(true);
    
    try {
      // 确保workId是数字
      const workIdNum = parseInt(workId);
      if (isNaN(workIdNum)) {
        throw new Error('无效的作品ID');
      }
      
      // 从API获取作品数据
      currentWork = await fetchWorkData(workIdNum);
      if (!currentWork) {
        throw new Error('作品数据不存在');
      }
      
      // 更新作品信息
      updateWorkInfo();
      
      // 从API获取单字列表
      const response = await fetch(`${API_BASE}/api/works/${workIdNum}/characters`);
      const charactersData = await response.json();
      
      // 转换单字数据为单字框
      boxes = [];
      if (charactersData.characters && charactersData.characters.length > 0) {
        // 创建一个Image对象来获取原图尺寸
        const img = new Image();
        const imgUrl = currentWork.image_url.startsWith('http') 
          ? currentWork.image_url 
          : `${API_BASE}/uploads/works/${currentWork.image_url}`;
        img.src = imgUrl;
        
        // 等待图片加载完成后直接使用API返回的坐标，不再进行缩放
        await new Promise((resolve) => {
          img.onload = function() {
            charactersData.characters.forEach((char, index) => {
              // 直接使用API返回的坐标，不进行任何缩放
              const x = char.x || 0;
              const y = char.y || 0;
              const width = char.width || 100;
              const height = char.height || 100;
              
              boxes.push({
                id: char.id || index,
                x: x,
                y: y,
                width: width,
                height: height,
                char: char.recognition || '?',
                style: char.style || 'kai'
              });
            });
            resolve();
          };
          
          // 如果图片加载失败，使用默认坐标
          img.onerror = function() {
            charactersData.characters.forEach((char, index) => {
              boxes.push({
                id: char.id || index,
                x: char.x || 0,
                y: char.y || 0,
                width: char.width || 100,
                height: char.height || 100,
                char: char.recognition || '?',
                style: char.style || 'kai'
              });
            });
            resolve();
          };
        });
      } else {
        // 转换OCR数据为单字框（兼容旧数据）
        boxes = convertOcrToBoxes(currentWork.ocrData || currentWork.tags || {});
      }
      
      filteredBoxes = [...boxes];
      
      // 加载作品图片
      const imageUrl = currentWork.image_url.startsWith('http') 
        ? currentWork.image_url 
        : `${API_BASE}/uploads/works/${currentWork.image_url}`;
      
      loadImage(imageUrl, (err, img) => {
        if (err) {
          console.error('图片加载失败:', err);
          showLoading(false);
          return;
        }
        
        fitToContainer();
        renderBoxes();
        renderCharCards();
        render();
        showLoading(false);
      });
    } catch (error) {
      console.error('加载作品失败:', error);
      showLoading(false);
      
      // 显示错误信息
      const errorContainer = document.createElement('div');
      errorContainer.className = 'error-container';
      errorContainer.innerHTML = `
        <h2>作品加载失败</h2>
        <p>${error.message}</p>
        <button class="btn btn-primary" onclick="location.reload()">刷新页面</button>
        <button class="btn btn-outline" onclick="history.back()">返回上一页</button>
      `;
      
      // 替换内容区域
      const mainContainer = document.querySelector('.main-container');
      if (mainContainer) {
        mainContainer.innerHTML = '';
        mainContainer.appendChild(errorContainer);
      }
    }
  }

  function updateWorkInfo() {
    workTitle.textContent = currentWork.title || '未命名作品';
    workAuthor.textContent = currentWork.author_name || '未知';
    workDynasty.textContent = currentWork.dynasty || '-';
    workStyle.textContent = currentWork.style || '-';
    headerCharCountEl.textContent = boxes.length;
    charCountEl.textContent = `${boxes.length} 个字`;
  }

  function showLoading(show) { loadingOverlay.style.display = show ? 'flex' : 'none'; }

  function loadImage(src, callback) {
    src = src || '';
    if (!src) { const err = new Error('图片路径为空'); if (typeof callback === 'function') callback(err); return; }
    
    // 如果是完整URL，直接尝试加载，不使用候选路径
    if (src.startsWith('http')) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        image = img;
        try {
          // 与上传时保持一致，canvas宽度固定为min(img.width, 800)，高度按比例缩放
          viewerCanvas.width = Math.min(img.naturalWidth, 800);
          viewerCanvas.height = (img.naturalHeight / img.naturalWidth) * viewerCanvas.width;
          viewerCanvas.style.width = `${viewerCanvas.width}px`;
          viewerCanvas.style.height = `${viewerCanvas.height}px`;
        } catch (e) { console.warn('设置 canvas 尺寸失败：', e); }
        if (typeof callback === 'function') callback(null, img);
      };
      img.onerror = () => {
        showLoading(false); 
        const err = new Error('Image not found: ' + src); 
        if (typeof callback === 'function') callback(err); 
      };
      img.src = src;
      return;
    }
    
    // 处理相对路径的情况
    const basename = src.split('/').pop();
    const cleaned = src.replace(/^\/+/, '');
    const candidates = [
      `/static/images/${basename}`,
      `/static/${basename}`,
      `../static/images/${basename}`,
      cleaned,
      src
    ];
    const uniqCandidates = Array.from(new Set(candidates.filter(Boolean)));
    let i = 0;
    function tryNext() {
      if (i >= uniqCandidates.length) { showLoading(false); const err = new Error('Image not found: ' + src + ' (tried: ' + uniqCandidates.join(', ') + ')'); if (typeof callback === 'function') callback(err); return; }
      const candidate = uniqCandidates[i++];
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        image = img;
        try {
          viewerCanvas.width = img.naturalWidth || (currentWork && currentWork.imageWidth) || viewerContainer.clientWidth;
          viewerCanvas.height = img.naturalHeight || (currentWork && currentWork.imageHeight) || viewerContainer.clientHeight;
          viewerCanvas.style.width = `${viewerCanvas.width}px`;
          viewerCanvas.style.height = `${viewerCanvas.height}px`;
        } catch (e) { console.warn('设置 canvas 尺寸失败：', e); }
        if (typeof callback === 'function') callback(null, img);
      };
      img.onerror = () => tryNext();
      img.src = candidate;
    }
    tryNext();
  }

  function fitToContainer() {
    const containerWidth = viewerContainer.clientWidth;
    const containerHeight = viewerContainer.clientHeight;
    const imgW = currentWork.imageWidth || image?.naturalWidth || viewerCanvas.width;
    const imgH = currentWork.imageHeight || image?.naturalHeight || viewerCanvas.height;
    const scaleX = containerWidth / imgW;
    const scaleY = containerHeight / imgH;
    scale = Math.min(scaleX, scaleY) * 0.9;
    offsetX = (containerWidth - imgW * scale) / 2;
    offsetY = (containerHeight - imgH * scale) / 2;
    updateZoomDisplay();
  }

  function resetView() { fitToContainer(); render(); }

  function render() {
    if (!image || !image.complete || image.naturalWidth === 0) return;
    viewerCtx.clearRect(0, 0, viewerCanvas.width, viewerCanvas.height);
    viewerCtx.drawImage(image, 0, 0);
    viewerCanvas.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
    viewerCanvas.style.transformOrigin = '0 0';
    renderBoxes();
  }

  function renderBoxes() {
    boxesOverlay.innerHTML = '';
    if (!showBoxes) return;
    filteredBoxes.forEach((box, index) => {
      const boxEl = document.createElement('div');
      boxEl.className = 'detail-box';
      boxEl.dataset.id = box.id !== undefined ? box.id : index;
      boxEl.style.left = `${offsetX + box.x * scale}px`;
      boxEl.style.top = `${offsetY + box.y * scale}px`;
      boxEl.style.width = `${box.width * scale}px`;
      boxEl.style.height = `${box.height * scale}px`;

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete-box-btn';
      deleteBtn.innerHTML = '×';
      deleteBtn.title = '删除此字';
      deleteBtn.onclick = (e) => { e.stopPropagation(); deleteBox(box.id !== undefined ? box.id : index); };
      boxEl.appendChild(deleteBtn);

      if (showLabels && box.char) {
        const label = document.createElement('div');
        label.className = 'box-label';
        label.textContent = box.char;
        boxEl.appendChild(label);
      }

      boxEl.addEventListener('click', (e) => { e.stopPropagation(); const charId = box.id !== undefined ? box.id : index; highlightChar(charId); showCharDetail(box, index); });

      boxesOverlay.appendChild(boxEl);
    });
  }

  function deleteBox(id) {
    if (!confirm('确定删除这个单字吗？')) return;
    
    // 查找要删除的单字
    const boxToDelete = boxes.find(box => (box.id !== undefined ? box.id : boxes.indexOf(box)) === id);
    if (!boxToDelete) {
      alert('未找到要删除的单字');
      return;
    }
    
    // 从本地移除
    boxes = boxes.filter(box => (box.id !== undefined ? box.id : boxes.indexOf(box)) !== id);
    filteredBoxes = filteredBoxes.filter(box => (box.id !== undefined ? box.id : filteredBoxes.indexOf(box)) !== id);
    renderBoxes(); renderCharCards(); updateWorkInfo();
    
    // 如果有后端ID，发送删除请求
    if (boxToDelete.id && boxToDelete.id !== Date.now()) {
      try {
        deleteCharacterFromBackend(boxToDelete.id);
        alert('单字已成功删除！');
      } catch (error) {
        console.error('删除单字失败:', error);
        alert(`单字已从本地删除，但删除服务器数据失败：${error.message}`);
      }
    } else {
      alert('单字已成功删除！');
    }
  }

  function saveToLocalStorage() {
    try {
      const savedData = { workId: currentWorkId, boxes: boxes, timestamp: new Date().toISOString() };
      localStorage.setItem(`work_boxes_${currentWorkId}`, JSON.stringify(savedData));
    } catch (e) { console.error('保存失败:', e); }
  }

  function loadFromLocalStorage() {
    try {
      const savedData = localStorage.getItem(`work_boxes_${currentWorkId}`);
      if (savedData) {
        const data = JSON.parse(savedData);
        if (data.boxes && data.boxes.length > 0) { boxes = data.boxes; filteredBoxes = [...boxes]; return true; }
      }
    } catch (e) { console.error('加载失败:', e); }
    return false;
  }

  function enterDrawMode() {
    isDrawMode = true;
    viewerContainer.style.cursor = 'crosshair';
    viewerContainer.classList.add('draw-mode');
    addBoxBtn.style.display = 'none';
    cancelDrawBtn.style.display = 'block';
    toolbarHint.innerHTML = '📝 在图片上拖动鼠标绘制单字框';
    isDragging = false;
  }

  function exitDrawMode() {
    isDrawMode = false;
    isDrawing = false;
    viewerContainer.style.cursor = 'grab';
    viewerContainer.classList.remove('draw-mode');
    addBoxBtn.style.display = 'block';
    cancelDrawBtn.style.display = 'none';
    toolbarHint.innerHTML = '💡 拖拽移动 · 滚轮缩放 · 点击单字查看详情';
    if (drawTempBox) { drawTempBox.remove(); drawTempBox = null; }
  }

  function renderCharCards() {
    charsGrid.innerHTML = '';
    console.debug && console.debug('renderCharCards: filteredBoxes length=', filteredBoxes.length);
    charCountEl.textContent = `${filteredBoxes.length} 个字`;
    if (filteredBoxes.length === 0) { emptyState.style.display = 'block'; return; }
    emptyState.style.display = 'none';
    filteredBoxes.forEach((box, index) => {
      const card = document.createElement('div');
      card.className = 'char-card';
      card.dataset.id = box.id !== undefined ? box.id : index;

      const cardActions = document.createElement('div');
      cardActions.className = 'char-card-actions';

      const editCardBtn = document.createElement('button');
      editCardBtn.className = 'char-card-btn char-card-btn-edit';
      editCardBtn.innerHTML = '✎';
      editCardBtn.title = '编辑';
      editCardBtn.onclick = (e) => { e.stopPropagation(); editBoxChar(box, index); };

      const deleteCardBtn = document.createElement('button');
      deleteCardBtn.className = 'char-card-btn char-card-btn-delete';
      deleteCardBtn.innerHTML = '×';
      deleteCardBtn.title = '删除';
      deleteCardBtn.onclick = (e) => { e.stopPropagation(); deleteBox(box.id !== undefined ? box.id : index); };

      cardActions.appendChild(editCardBtn);
      cardActions.appendChild(deleteCardBtn);

      const previewContainer = document.createElement('div');
      previewContainer.className = 'char-card-preview';
      const previewCanvas = createCharPreview(box);
      previewContainer.appendChild(previewCanvas);

      const textEl = document.createElement('div');
      textEl.className = 'char-card-text';
      textEl.textContent = box.char || '?';

      card.appendChild(cardActions);
      card.appendChild(previewContainer);
      card.appendChild(textEl);

      card.addEventListener('click', () => { console.debug && console.debug('char card click', box, index); const charId = box.id !== undefined ? box.id : index; highlightChar(charId); showCharDetail(box, index); });

      charsGrid.appendChild(card);
    });
  }

  function createCharPreview(box) {
    const PREVIEW_SIZE = 100;
    const canvas = document.createElement('canvas');
    canvas.width = PREVIEW_SIZE;
    canvas.height = PREVIEW_SIZE;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0,0,PREVIEW_SIZE,PREVIEW_SIZE);
    if (image && image.complete) {
      const { x, y, width, height } = box;
      const aspect = width / height;
      let destW = PREVIEW_SIZE; let destH = PREVIEW_SIZE; let dx = 0; let dy = 0;
      if (aspect > 1) { destH = Math.round(PREVIEW_SIZE / aspect); dy = Math.floor((PREVIEW_SIZE - destH)/2); }
      else if (aspect < 1) { destW = Math.round(PREVIEW_SIZE * aspect); dx = Math.floor((PREVIEW_SIZE - destW)/2); }
      ctx.drawImage(image, x, y, width, height, dx, dy, destW, destH);
    }
    return canvas;
  }

  function editBoxChar(box, index) {
    const currentChar = box.char || '';
    const newChar = prompt(`编辑单字内容：\n\n当前内容：${currentChar}`, currentChar);
    if (newChar === null) return;
    const trimmed = newChar.trim();
    if (trimmed === '') { alert('单字内容不能为空！'); return; }
    box.char = trimmed;
    let updated = false;
    if (box.id !== undefined) {
      const i = boxes.findIndex(b => b.id === box.id);
      if (i !== -1) { boxes[i].char = trimmed; updated = true; }
    }
    if (!updated) {
      const i = boxes.findIndex(b => b.x === box.x && b.y === box.y && b.width === box.width && b.height === box.height);
      if (i !== -1) { boxes[i].char = trimmed; updated = true; }
    }
    renderBoxes(); renderCharCards();
    const boxId = box.id !== undefined ? box.id : index;
    if (selectedCharId === boxId && charModal.style.display === 'flex') modalCharText.textContent = trimmed;
    
    // 如果有后端ID，发送更新请求
    if (box.id && box.id !== Date.now()) {
      try {
        updateCharacterToBackend(box.id, { recognition: trimmed });
        alert('单字已成功修改！');
      } catch (error) {
        console.error('修改单字失败:', error);
        alert(`单字已从本地修改，但修改服务器数据失败：${error.message}`);
      }
    } else {
      alert('单字已成功修改！');
    }
  }

  function highlightChar(id) {
    selectedCharId = id;
    document.querySelectorAll('.detail-box.highlighted, .char-card.highlighted').forEach(el => el.classList.remove('highlighted'));
    const box = document.querySelector(`.detail-box[data-id="${id}"]`);
    const card = document.querySelector(`.char-card[data-id="${id}"]`);
    if (box) box.classList.add('highlighted');
    if (card) { card.classList.add('highlighted'); card.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
  }

  function showCharDetail(box, index) {
    console.debug && console.debug('showCharDetail called', box, index, 'charModal=', charModal);
    modalCharText.textContent = box.char || '?';
    modalWorkTitle.textContent = currentWork.title || '';
    modalCharIndex.textContent = index + 1;
    modalCharPosition.textContent = `x: ${Math.round(box.x)}, y: ${Math.round(box.y)}`;

    modalPreview.innerHTML = '';
    const largePreview = createLargeCharPreview(box);
    modalPreview.appendChild(largePreview);

    const prevCollectBtn = document.getElementById('collectCharBtn');
    if (prevCollectBtn) prevCollectBtn.remove();

    const collectBtn = document.createElement('button');
    collectBtn.type = 'button';
    collectBtn.className = 'btn btn-primary';
    collectBtn.id = 'collectCharBtn';
    collectBtn.innerHTML = '⭐ 收藏';

    const charIdForCollect = Number(box.id !== undefined ? box.id : index);

    function captureCharImage(box) {
      return new Promise((resolve) => {
        const srcImg = window.image || document.getElementById('viewerImage') || viewerCanvas;
        if (!srcImg) { resolve(null); return; }
        const proceedDraw = () => {
          try {
            const captureCanvas = document.createElement('canvas');
            const captureSize = 200;
            captureCanvas.width = captureSize; captureCanvas.height = captureSize;
            const ctx = captureCanvas.getContext('2d');
            ctx.fillStyle = '#fff'; ctx.fillRect(0,0,captureSize,captureSize);
            const x = box.x || 0; const y = box.y || 0;
            const width = box.width || (box.x2 ? box.x2 - box.x : 100);
            const height = box.height || (box.y2 ? box.y2 - box.y : 100);
            const aspect = width / Math.max(1, height);
            let destW = captureSize; let destH = captureSize; let dx = 0; let dy = 0;
            if (aspect > 1) { destH = Math.round(captureSize / aspect); dy = Math.floor((captureSize - destH)/2); }
            else if (aspect < 1) { destW = Math.round(captureSize * aspect); dx = Math.floor((captureSize - destW)/2); }
            if (srcImg instanceof HTMLCanvasElement) ctx.drawImage(srcImg, x, y, width, height, dx, dy, destW, destH);
            else ctx.drawImage(srcImg, x, y, width, height, dx, dy, destW, destH);
            const imageData = captureCanvas.toDataURL('image/png');
            resolve(imageData);
          } catch (err) { console.error('截取图片失败:', err); resolve(null); }
        };
        if (srcImg instanceof HTMLImageElement) {
          if (!srcImg.complete) { srcImg.addEventListener('load', proceedDraw, { once: true }); srcImg.addEventListener('error', () => resolve(null), { once: true }); }
          else proceedDraw();
        } else proceedDraw();
      });
    }

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
      } catch (e) { console.error('检查收藏状态失败:', e); }
    }).catch(err => console.error('加载 mockAPI 失败:', err));

    collectBtn.onclick = async (e) => {
      e.stopPropagation();
      if (collectBtn.disabled) return;
      collectBtn.disabled = true;
      collectBtn.innerHTML = '⏳ 处理中...';
      try {
        const api = await ensureMockAPI();
        collectBtn.innerHTML = '📸 截取图片...';
        const imageData = await captureCharImage(box);
        collectBtn.innerHTML = '💾 保存中...';
        const charData = {
          character_id: charIdForCollect,
          text: box.char || '',
          work_id: currentWork?.id || currentWorkId,
          work_title: currentWork?.title || '',
          work_style: currentWork?.style || '',
          position: [box.x||0, box.y||0, (box.x||0)+(box.width||0), (box.y||0)+(box.height||0)],
          imageData: imageData || null,
          collected_at: new Date().toISOString()
        };
        let res;
        if (typeof api.collectCharacterWithData === 'function') res = await api.collectCharacterWithData(charData);
        else if (typeof api.collectCharacter === 'function') res = await api.collectCharacter(Number(charIdForCollect));
        else throw new Error('收藏接口不可用');
        if (res && res.code === 201) {
          collectBtn.innerHTML = '✅ 已收藏';
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

    // 添加“读帖”按钮（localStorage 方案）
    const prevReadPostBtn = document.getElementById('readPostBtn');
    if (prevReadPostBtn) prevReadPostBtn.remove();
    const readPostBtn = document.createElement('button');
    readPostBtn.type = 'button';
    readPostBtn.className = 'btn btn-outline';
    readPostBtn.id = 'readPostBtn';
    readPostBtn.innerHTML = '📝 读帖';

    readPostBtn.onclick = async (e) => {
      e.stopPropagation();
      readPostBtn.disabled = true;
      readPostBtn.innerHTML = '⏳ 处理中...';
      try {
        const imageData = await captureCharImage(box);
        if (!imageData) throw new Error('图片截取失败');
        // 存入 localStorage
        localStorage.setItem('readPostImage', imageData);
        window.location.href = '/read-post';
      } catch (err) {
        alert('读帖失败：' + (err.message || '未知错误'));
        readPostBtn.disabled = false;
        readPostBtn.innerHTML = '📝 读帖';
      }
    };

    // 插入到弹窗按钮区
    const modalActions = charModal.querySelector('.char-actions') || (() => {
      const el = document.createElement('div'); el.className='char-actions'; charModal.querySelector('.modal-body').appendChild(el); return el;
    })();
    modalActions.insertBefore(readPostBtn, modalActions.firstChild);
    modalActions.insertBefore(collectBtn, modalActions.firstChild);

    charModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    if (downloadCharBtn) downloadCharBtn.onclick = () => downloadSingleChar(box, index);
    if (copyCharBtn) copyCharBtn.onclick = () => copyCharText(box.char);
  }

  function createLargeCharPreview(box) {
    const LARGE_SIZE = 180;
    const canvas = document.createElement('canvas');
    canvas.width = LARGE_SIZE; canvas.height = LARGE_SIZE;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0,0,LARGE_SIZE,LARGE_SIZE);
    if (image && image.complete) {
      const { x, y, width, height } = box;
      const aspect = width / height;
      let destW = LARGE_SIZE; let destH = LARGE_SIZE; let dx = 0; let dy = 0;
      if (aspect > 1) { destH = Math.round(LARGE_SIZE / aspect); dy = Math.floor((LARGE_SIZE - destH)/2); }
      else if (aspect < 1) { destW = Math.round(LARGE_SIZE * aspect); dx = Math.floor((LARGE_SIZE - destW)/2); }
      ctx.drawImage(image, x, y, width, height, dx, dy, destW, destH);
    }
    return canvas;
  }

  function closeModal() { charModal.style.display = 'none'; document.body.style.overflow = ''; }
  function downloadSingleChar(box, index) { const canvas = createLargeCharPreview(box); const link = document.createElement('a'); link.download = `${currentWork.title}_${box.char || index+1}.png`; link.href = canvas.toDataURL(); link.click(); }
  function copyCharText(char) { if (navigator.clipboard && char) navigator.clipboard.writeText(char).then(()=>alert(`已复制：${char}`)); else alert(`文字：${char || '?'}`); }

  function zoom(factor) {
    const newScale = scale * factor;
    if (newScale < 0.1 || newScale > 5) return;
    const centerX = viewerContainer.clientWidth / 2;
    const centerY = viewerContainer.clientHeight / 2;
    offsetX = centerX - (centerX - offsetX) * factor;
    offsetY = centerY - (centerY - offsetY) * factor;
    scale = newScale;
    updateZoomDisplay();
    render();
  }

  function updateZoomDisplay() { zoomLevelEl.textContent = `${Math.round(scale * 100)}%`; }

  function filterChars(keyword) {
    if (!keyword) filteredBoxes = [...boxes];
    else filteredBoxes = boxes.filter(box => box.char && box.char.includes(keyword));
    renderCharCards(); render();
  }

  function sortChars(sortType) {
    switch (sortType) {
      case 'position':
        filteredBoxes.sort((a,b)=>{ const aCenterX=a.x+a.width/2; const bCenterX=b.x+b.width/2; if (Math.abs(bCenterX-aCenterX)<50) return a.y-b.y; return bCenterX-aCenterX; });
        break;
      default: filteredBoxes = [...boxes]; break;
    }
    renderCharCards();
  }

  function exportAllChars() {
    if (filteredBoxes.length===0) { alert('没有可导出的单字'); return; }
    if (!confirm(`确定要导出 ${filteredBoxes.length} 个单字吗？`)) return;
    filteredBoxes.forEach((box, i)=> setTimeout(()=> downloadSingleChar(box,i), i*300));
    alert(`开始导出 ${filteredBoxes.length} 个单字，请稍候...`);
  }

  function bindGlobalEvents() {
    zoomInBtn.addEventListener('click', ()=>zoom(1.2));
    zoomOutBtn.addEventListener('click', ()=>zoom(0.8));
    fitBtn.addEventListener('click', ()=>{ fitToContainer(); render(); });
    resetBtn.addEventListener('click', resetView);
    addBoxBtn.addEventListener('click', enterDrawMode);
    cancelDrawBtn.addEventListener('click', exitDrawMode);
    showBoxesToggle.addEventListener('change', e => { showBoxes = e.target.checked; renderBoxes(); });
    showLabelsToggle.addEventListener('change', e => { showLabels = e.target.checked; renderBoxes(); });
    viewerContainer.addEventListener('mousedown', (e) => {
      if (isDrawMode) {
        if (e.target === viewerCanvas || e.target === viewerContainer || e.target === boxesOverlay) {
          isDrawing = true;
          const rect = viewerContainer.getBoundingClientRect();
          drawStartX = (e.clientX - rect.left - offsetX) / scale;
          drawStartY = (e.clientY - rect.top - offsetY) / scale;
          drawTempBox = document.createElement('div');
          drawTempBox.className = 'draw-temp-box';
          boxesOverlay.appendChild(drawTempBox);
        }
      } else if (e.target === viewerCanvas || e.target === viewerContainer) {
        isDragging = true;
        dragStartX = e.clientX - offsetX;
        dragStartY = e.clientY - offsetY;
      }
    });

    document.addEventListener('mousemove', (e) => {
      if (isDrawing && drawTempBox) {
        const rect = viewerContainer.getBoundingClientRect();
        const currentX = (e.clientX - rect.left - offsetX) / scale;
        const currentY = (e.clientY - rect.top - offsetY) / scale;
        const x = Math.min(drawStartX, currentX);
        const y = Math.min(drawStartY, currentY);
        const width = Math.abs(currentX - drawStartX);
        const height = Math.abs(currentY - drawStartY);
        drawTempBox.style.left = `${offsetX + x * scale}px`;
        drawTempBox.style.top = `${offsetY + y * scale}px`;
        drawTempBox.style.width = `${width * scale}px`;
        drawTempBox.style.height = `${height * scale}px`;
      } else if (isDragging && !isDrawMode) {
        offsetX = e.clientX - dragStartX;
        offsetY = e.clientY - dragStartY;
        render();
      }
    });

    document.addEventListener('mouseup', async (e) => {
      if (isDrawing && drawTempBox) {
        isDrawing = false;
        const rect = viewerContainer.getBoundingClientRect();
        const endX = (e.clientX - rect.left - offsetX) / scale;
        const endY = (e.clientY - rect.top - offsetY) / scale;
        const x = Math.min(drawStartX, endX);
        const y = Math.min(drawStartY, endY);
        const width = Math.abs(endX - drawStartX);
        const height = Math.abs(endY - drawStartY);
        if (width < 10 || height < 10) { 
          alert('绘制的框太小了，请重新绘制'); 
          drawTempBox.remove(); 
          drawTempBox = null; 
          return; 
        }
        const char = prompt('请输入这个单字的内容：');
        if (char && char.trim()) {
          const newBox = { 
            id: Date.now(), 
            x: Math.round(x), 
            y: Math.round(y), 
            width: Math.round(width), 
            height: Math.round(height), 
            char: char.trim(),
            style: currentWork.style || 'kai' // 使用作品的风格作为单字风格
          };
          
          // 添加到页面
          boxes.push(newBox); 
          filteredBoxes = [...boxes];
          renderBoxes(); 
          renderCharCards(); 
          updateWorkInfo();
          
          try {
            // 保存到后端
            const savedCharacter = await saveCharacterToBackend(newBox);
            // 更新本地单字的ID为后端返回的ID
            newBox.id = savedCharacter.id;
            alert(`单字"${char}"已添加成功！`);
          } catch (error) {
            console.error('保存单字失败:', error);
            alert(`单字"${char}"已添加到本地，但保存到服务器失败：${error.message}`);
          }
          
        }
        drawTempBox.remove(); 
        drawTempBox = null; 
        exitDrawMode();
      }
      isDragging = false;
    });

    viewerContainer.addEventListener('wheel', (e) => { e.preventDefault(); const factor = e.deltaY > 0 ? 0.9 : 1.1; zoom(factor); }, { passive: false });

    charSearch.addEventListener('input', (e) => filterChars(e.target.value.trim()));
    sortSelect.addEventListener('change', (e) => sortChars(e.target.value));
    downloadBtn.addEventListener('click', () => { const link = document.createElement('a'); link.href = image.src; link.download = `${currentWork.title}_原图.png`; link.click(); });
    exportBtn.addEventListener('click', exportAllChars);

    if (modalClose) modalClose.addEventListener('click', closeModal);
    else console.warn('modalClose element not found');
    if (modalOverlay) modalOverlay.addEventListener('click', closeModal);
    else console.warn('modalOverlay element not found');

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (charModal.style.display === 'flex') closeModal();
        else if (isDrawMode) exitDrawMode();
      }
    });

    // 事件委托：确保点击右侧的 char-card 也能打开详情弹窗
    document.addEventListener('click', function(e) {
      // 忽略工具按钮、删除按钮等
      if (e.target.closest('.char-card-btn') || e.target.closest('.delete-box-btn') || e.target.closest('.char-remove')) return;
      const card = e.target.closest('.char-card');
      if (!card) return;
      const id = card.dataset.id;
      if (id === undefined) return;
      // 找到对应 box
      const boxIndex = filteredBoxes.findIndex(b => (b.id !== undefined ? String(b.id) : String(filteredBoxes.indexOf(b))) === String(id));
      let box = null;
      let index = null;
      if (boxIndex !== -1) {
        box = filteredBoxes[boxIndex]; index = boxIndex;
      } else {
        // fallback: try to match by char label
        const ch = card.querySelector('.char-card-text') ? card.querySelector('.char-card-text').textContent.trim() : (card.dataset.char || '');
        const found = filteredBoxes.findIndex(b => (b.char||'') === ch);
        if (found !== -1) { box = filteredBoxes[found]; index = found; }
      }
      if (box) {
        highlightChar(box.id !== undefined ? box.id : index);
        showCharDetail(box, index);
      }
    });

    window.addEventListener('resize', () => { fitToContainer(); render(); });
  }

  initialize();
});

// 转换OCR数据为单字框（兼容旧数据）
function convertOcrToBoxes(ocrData) {
  // 旧数据格式兼容处理
  if (!ocrData || typeof ocrData !== 'object') return [];
  
  // 如果是新格式，直接返回
  if (Array.isArray(ocrData)) return ocrData;
  
  // 尝试从不同字段获取单字框数据
  const boxes = ocrData.boxes || ocrData.charBoxes || ocrData.words || [];
  
  // 如果已经是数组，直接返回
  if (Array.isArray(boxes)) return boxes;
  
  // 否则返回空数组
  return [];
}