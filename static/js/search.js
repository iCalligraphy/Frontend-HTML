document.addEventListener('DOMContentLoaded', () => {
  // 书法风格英文到中文的映射
  const STYLE_MAP = {
    'kai': '楷书',
    'xing': '行书',
    'cao': '草书',
    'li': '隶书',
    'zhuan': '篆书',
    'unknown': '未知'
  };
  
  // 转换书法风格为中文
  function getStyleName(style) {
    if (!style) return '';
    return STYLE_MAP[style.toLowerCase()] || style;
  }

  // 支持不同模板中搜索输入的 id：优先 globalSearchInput，回退到 'q'，再回退到 name="q"
  const input = document.getElementById('globalSearchInput') || document.getElementById('q') || document.querySelector('input[name="q"]');
  const btn = document.getElementById('searchBtn') || document.querySelector('#searchForm button[type=button]');
  const worksResults = document.getElementById('worksResults');
  const charsResults = document.getElementById('charsResults');

  // 搜索候选下拉框元素
  const searchSuggestions = document.getElementById('searchSuggestions');
  const workSuggestionList = document.getElementById('workSuggestionList');
  const authorSuggestionList = document.getElementById('authorSuggestionList');
  const workSuggestionsGroup = document.getElementById('workSuggestions');
  const authorSuggestionsGroup = document.getElementById('authorSuggestions');

  // 缓存作品和作者数据用于候选搜索
  let cachedWorks = [];
  let cachedAuthors = [];
  let suggestionDataLoaded = false;

  // Modal elements
  const hotKeywordsSection = document.getElementById('hotKeywordsSection');
  const hotKeywordsList = document.getElementById('hotKeywordsList');

  const charModal = document.getElementById('charModal');
  const modalOverlay = document.getElementById('searchModalOverlay');
  const modalClose = document.getElementById('searchModalClose');
  const modalCharText = document.getElementById('modalCharText');
  const modalStyle = document.getElementById('modalStyle');
  const modalWork = document.getElementById('modalWork');
  const modalPreview = document.getElementById('modalPreview');
  const modalStrokeCount = document.getElementById('modalStrokeCount');
  const modalStrokeOrder = document.getElementById('modalStrokeOrder');
  const modalConfidence = document.getElementById('modalConfidence');
  const modalCollectedAt = document.getElementById('modalCollectedAt');
  const searchDownloadCharBtn = document.getElementById('searchDownloadCharBtn');
  // work modal elements
  const workModal = document.getElementById('workModal');
  const workModalOverlay = document.getElementById('workModalOverlay');
  const workModalClose = document.getElementById('workModalClose');
  const workModalTitle = document.getElementById('workModalTitle');
  const workModalPreview = document.getElementById('workModalPreview');
  const workModalMeta = document.getElementById('workModalMeta');
  const workModalOpenPage = document.getElementById('workModalOpenPage');

  // 全局搜索API地址
  const SEARCH_API = '/api/calligraphy/search';
  const HOT_KEYWORDS_API = '/api/calligraphy/hot-keywords';
  
  function getDataSource() {
    // 返回一个调用后端API的数据源对象
    return {
      // 搜索函数，调用后端API
      search: async (query) => {
        try {
          const response = await fetch(`${SEARCH_API}?q=${encodeURIComponent(query)}`);
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          const data = await response.json();
          if (data.code === 200) {
            return data.data;
          } else {
            throw new Error(data.message || 'Search failed');
          }
        } catch (error) {
          console.error('Search error:', error);
          // 返回空结果，确保页面不会崩溃
          return { works: [], characters: [], total: 0 };
        }
      },
      // 获取单字详情
      getCharacterDetail: async (id) => {
        try {
          const response = await fetch(`/api/works/characters/${id}`);
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return await response.json();
        } catch (error) {
          console.error('Get character detail error:', error);
          return { code: 404 };
        }
      }
    };
  }

  const ds = getDataSource();

  function renderWorks(list) {
    worksResults.innerHTML = '';
    if (!list || list.length === 0) { worksResults.innerHTML = '<p>无结果</p>'; return; }
    list.forEach(w => {
      const card = document.createElement('div');
      card.className = 'result-work-card';

      // 图片区域
      const thumb = document.createElement('div');
      thumb.className = 'thumb';
      if (w.thumbnail || w.cover || w.image_url) {
        const img = document.createElement('img');
        const imgUrl = w.thumbnail || w.cover || w.image_url;
        const fullImgUrl = imgUrl.startsWith('http') || imgUrl.startsWith('/') ? imgUrl : `/uploads/works/${imgUrl}`;
        img.src = fullImgUrl;
        img.alt = w.title || 'thumbnail';
        thumb.appendChild(img);
      } else {
        thumb.textContent = '预览';
      }
      card.appendChild(thumb);

      // 信息区域
      const info = document.createElement('div');
      info.className = 'info';
      
      const title = document.createElement('h3');
      title.textContent = w.title || ('作品 ' + (w.id || ''));
      info.appendChild(title);
      
      const meta = document.createElement('p');
      meta.className = 'work-meta';
      const authorText = w.author_name || w.author || '佚名';
      const styleText = getStyleName(w.style) || '';
      meta.textContent = `${authorText}${styleText ? ' · ' + styleText : ''}`;
      info.appendChild(meta);
      
      // 显示作品描述（如果有）
      if (w.description) {
        const desc = document.createElement('p');
        desc.className = 'work-description';
        desc.textContent = w.description;
        info.appendChild(desc);
      }
      
      card.appendChild(info);

      // 底部操作栏
      const footer = document.createElement('div');
      footer.className = 'card-footer';
      
      const footerMeta = document.createElement('span');
      footerMeta.className = 'meta';
      footerMeta.textContent = w.dynasty || '';
      footer.appendChild(footerMeta);
      
      const actions = document.createElement('div');
      actions.className = 'actions';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = '查看详情';
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        openWorkModalWithData(w);
      });
      actions.appendChild(btn);
      footer.appendChild(actions);
      
      card.appendChild(footer);
      worksResults.appendChild(card);
    });
  }

  // 生成单字图片的函数，借鉴作品详情页的实现
  function generateCharImage(charData) {
    return new Promise((resolve) => {
      if (charData.imageData && charData.imageData.startsWith('data:image')) {
        // 如果已经有imageData，直接返回
        resolve(charData.imageData);
        return;
      }
      
      if (charData.image_url) {
        // 如果已经有image_url，直接返回
        resolve(charData.image_url);
        return;
      }
      
      if (!charData.work_image_url || !charData.x || !charData.y || !charData.width || !charData.height) {
        // 没有足够的信息生成图片，返回空
        resolve('');
        return;
      }
      
      // 创建一个新的Image对象
      const workImg = new Image();
      workImg.crossOrigin = 'anonymous'; // 允许跨域访问
      workImg.src = charData.work_image_url;
      
      workImg.onload = function() {
        try {
          // 创建canvas，绘制单字区域
          const canvas = document.createElement('canvas');
          canvas.width = charData.width;
          canvas.height = charData.height;
          const ctx = canvas.getContext('2d');
          
          // 从作品图片中截取单字区域
          ctx.drawImage(
            workImg, 
            charData.x, charData.y, charData.width, charData.height, 
            0, 0, canvas.width, canvas.height
          );
          
          // 将canvas转换为dataURL
          const dataURL = canvas.toDataURL('image/png');
          resolve(dataURL);
        } catch (error) {
          console.error('生成单字图片失败:', error);
          resolve('');
        }
      };
      
      workImg.onerror = function() {
        // 图片加载失败，返回空
        resolve('');
      };
    });
  }

  function renderChars(list, works) {
    charsResults.innerHTML = '';
    if (!list || list.length === 0) { charsResults.innerHTML = '<p>无结果</p>'; return; }
    
    // 创建一个对象来存储作品图片，避免重复加载
    const workImages = {};
    
    // 加载作品图片
    async function loadWorkImage(workId, imageUrl) {
      if (workImages[workId]) {
        return workImages[workId];
      }
      
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = imageUrl;
        
        img.onload = () => {
          workImages[workId] = img;
          resolve(img);
        };
        
        img.onerror = () => {
          console.error('Failed to load work image:', imageUrl);
          workImages[workId] = null;
          resolve(null);
        };
      });
    }
    
    // 为每个字符生成图片
    list.forEach(async (c) => {
      const card = document.createElement('div');
      card.className = 'char-card';
      card.style.display = 'inline-flex';
      card.style.flexDirection = 'column';
      card.style.alignItems = 'center';
      card.style.justifyContent = 'center';
      card.style.width = '120px';
      card.style.height = '170px'; // 增高以容纳按钮
      card.style.margin = '6px';
      card.style.border = '1px solid #eee';
      card.style.borderRadius = '8px';
      card.style.cursor = 'pointer';
      card.dataset.id = c.id;
      
      const work = works.find(w => String(w.id) === String(c.work_id));
      // 优先使用字符自带的work_image_url，否则从work对象获取
      const workImageUrl = c.work_image_url || (work && work.image_url) || '';
      
      // 初始化预览元素
      let preview;
      let charImageData = '';
      
      // 先创建一个空的canvas作为占位符
      const placeholderCanvas = document.createElement('canvas');
      placeholderCanvas.width = 80;
      placeholderCanvas.height = 80;
      const placeholderCtx = placeholderCanvas.getContext('2d');
      placeholderCtx.fillStyle = '#fff';
      placeholderCtx.fillRect(0, 0, 80, 80);
      placeholderCtx.fillStyle = '#ccc';
      placeholderCtx.font = 'bold 24px KaiTi, STKaiti, serif';
      placeholderCtx.textAlign = 'center';
      placeholderCtx.textBaseline = 'middle';
      placeholderCtx.fillText('加载中...', 40, 40);
      
      // 设置初始预览为占位符
      preview = placeholderCanvas;
      
      // 如果有作品图片URL和坐标信息，尝试从作品图片中截取单字
      if (workImageUrl && c.x !== undefined && c.y !== undefined && c.width && c.height) {
        try {
          // 加载作品图片
          const workImg = await loadWorkImage(c.work_id, workImageUrl);
          
          if (workImg) {
            // 创建预览canvas
            const canvas = document.createElement('canvas');
            canvas.width = 80;
            canvas.height = 80;
            const canvasCtx = canvas.getContext('2d');
            canvasCtx.fillStyle = '#fff';
            canvasCtx.fillRect(0, 0, 80, 80);
            
            // 计算缩放比例，确保单字在预览中完整显示
            const scale = Math.min(80 / c.width, 80 / c.height);
            const scaledWidth = Math.round(c.width * scale);
            const scaledHeight = Math.round(c.height * scale);
            
            // 计算居中位置
            const xOffset = Math.floor((80 - scaledWidth) / 2);
            const yOffset = Math.floor((80 - scaledHeight) / 2);
            
            // 从作品图片中截取单字
            canvasCtx.drawImage(
              workImg, 
              c.x, c.y, c.width, c.height,  // 源区域：作品中的单字位置和大小
              xOffset, yOffset, scaledWidth, scaledHeight  // 目标区域：预览canvas中的位置和大小
            );
            
            // 生成图片数据
            charImageData = canvas.toDataURL('image/png');
            
            // 更新预览为实际截取的单字图片
            preview = canvas;
          }
        } catch (error) {
          // 输出详细的错误信息
          console.error('Error generating char image:', {
            charId: c.id,
            charText: c.text || c.char,
            workId: c.work_id,
            workTitle: work ? work.title : 'Unknown work',
            workImageUrl: workImageUrl || 'No image URL',
            charPosition: { x: c.x, y: c.y, width: c.width, height: c.height },
            errorMessage: error.message,
            errorStack: error.stack
          });
          
          // 如果生成图片失败，显示带有错误信息的canvas
          const errorCanvas = document.createElement('canvas');
          errorCanvas.width = 80;
          errorCanvas.height = 80;
          const errorCtx = errorCanvas.getContext('2d');
          errorCtx.fillStyle = '#fff';
          errorCtx.fillRect(0, 0, 80, 80);
          errorCtx.fillStyle = '#ff6b6b';
          errorCtx.font = 'bold 14px Arial, sans-serif';
          errorCtx.textAlign = 'center';
          errorCtx.textBaseline = 'middle';
          errorCtx.fillText('截图失败', 40, 30);
          errorCtx.fillStyle = '#8B4513';
          errorCtx.font = 'bold 24px KaiTi, STKaiti, serif';
          errorCtx.fillText(c.text || c.char || '?', 40, 55);
          preview = errorCanvas;
        }
      } else {
        // 如果没有足够的信息生成图片，显示文字
        const textCanvas = document.createElement('canvas');
        textCanvas.width = 80;
        textCanvas.height = 80;
        const textCtx = textCanvas.getContext('2d');
        textCtx.fillStyle = '#fff';
        textCtx.fillRect(0, 0, 80, 80);
        textCtx.fillStyle = '#8B4513';
        textCtx.font = 'bold 48px KaiTi, STKaiti, serif';
        textCtx.textAlign = 'center';
        textCtx.textBaseline = 'middle';
        textCtx.fillText(c.text || c.char || '?', 40, 40);
        preview = textCanvas;
      }
      
      card.appendChild(preview);

      const text = document.createElement('div');
      text.className = 'char-text';
      text.textContent = c.text || c.char || '?';
      text.style.fontSize = '24px';
      text.style.fontFamily = "KaiTi, STKaiti, serif";
      text.style.color = '#2e2e2e';
      text.style.marginTop = '4px';
      card.appendChild(text);

      const meta = document.createElement('div');
      meta.style.fontSize = '12px';
      meta.style.color = '#666';
      meta.style.marginTop = '2px';
      meta.textContent = c.work ? (c.work.title || c.work_title || '') : (c.work_title || '');
      card.appendChild(meta);

      // 读帖按钮
      const readBtn = document.createElement('button');
      readBtn.type = 'button';
      readBtn.textContent = '读帖';
      readBtn.style.marginTop = '8px';
      readBtn.style.fontSize = '13px';
      readBtn.style.padding = '2px 10px';
      readBtn.style.borderRadius = '12px';
      readBtn.style.border = '1px solid #ccc';
      readBtn.style.background = '#f7f7f7';
      readBtn.style.cursor = 'pointer';
      readBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        
        try {
          // 加载作品图片
          const workImg = await loadWorkImage(c.work_id, workImageUrl);
          
          if (workImg) {
            // 创建一个大尺寸的canvas，用于读帖
            const readCanvas = document.createElement('canvas');
            readCanvas.width = c.width;
            readCanvas.height = c.height;
            const readCtx = readCanvas.getContext('2d');
            
            // 绘制单字
            readCtx.drawImage(
              workImg, 
              c.x, c.y, c.width, c.height, 
              0, 0, readCanvas.width, readCanvas.height
            );
            
            // 生成图片数据
            const imgSrc = readCanvas.toDataURL('image/png');
            
            if (imgSrc) {
              window.open(`/read-post?img=${encodeURIComponent(imgSrc)}`, '_blank');
              return;
            }
          }
        } catch (error) {
          console.error('Error generating read post image:', error);
        }
        
        alert('没有可用图片');
      });
      card.appendChild(readBtn);

      // 存储生成的图片数据，以便点击卡片时使用
      card.dataset.imageData = charImageData;

      card.addEventListener('click', async (e) => {
        const id = card.dataset.id;
        const imageData = card.dataset.imageData;
        
        // try to fetch detail
        if (ds.getCharacterDetail) {
          try {
            const res = await ds.getCharacterDetail(id);
            if (res && res.code === 200 && res.data && res.data.character) {
              // 添加生成的图片数据
              const charDetail = res.data.character;
              charDetail.imageData = imageData;
              openCharModalWithData(charDetail);
              return;
            }
          } catch (err) { console.warn('getCharacterDetail err', err); }
        }
        // fallback: construct from list data
        // 添加生成的图片数据
        const charData = { ...c, imageData: imageData };
        openCharModalWithData(charData);
      });

      charsResults.appendChild(card);
    });
  }

  function openCharModalWithData(char) {
    modalCharText.textContent = char.text || char.char || '?';
    modalStyle.textContent = (char.work && (char.work.style || char.work_style)) || (char.work_style || '-');
    modalWork.textContent = (char.work && (char.work.title || char.work_title)) || (char.work_title || '-');
    modalStrokeCount.textContent = char.stroke_count || '-';
    modalStrokeOrder.textContent = char.stroke_order || '-';
    modalConfidence.textContent = (char.ocr_confidence)? Math.round(char.ocr_confidence*100) + '%' : '-';
    modalCollectedAt.textContent = char.collected_at ? new Date(char.collected_at).toLocaleString() : (char.created_at? new Date(char.created_at).toLocaleString() : '-');

    modalPreview.innerHTML = '';
    if (char.imageData && char.imageData.startsWith && char.imageData.startsWith('data:image')) {
      const img = document.createElement('img'); img.src = char.imageData; img.style.maxWidth='100%'; img.style.maxHeight='100%'; img.style.objectFit='contain'; modalPreview.appendChild(img);
    } else if (char.image_url) {
      const img = document.createElement('img'); img.src = char.image_url; img.style.maxWidth='100%'; img.style.maxHeight='100%'; img.style.objectFit='contain'; modalPreview.appendChild(img);
    } else {
      const canvas = document.createElement('canvas'); canvas.width = 340; canvas.height = 340; const ctx = canvas.getContext('2d'); ctx.fillStyle='#fff'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.fillStyle='#8B4513'; ctx.font='bold 200px KaiTi, STKaiti, serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(char.text || '?', canvas.width/2, canvas.height/2); modalPreview.appendChild(canvas);
    }

    // show modal
    charModal.style.display = 'flex';
    charModal.classList.add('show');
    charModal.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
  }

  function openWorkModalWithData(work) {
    if (!workModal) return;
    workModalTitle.textContent = work.title || ('作品 ' + (work.id || ''));
    workModalMeta.innerHTML = '';
    const metaLines = [];
    if (work.author_name || work.author) metaLines.push('<div><strong>作者：</strong>' + (work.author_name||work.author) + '</div>');
    if (work.dynasty) metaLines.push('<div><strong>朝代：</strong>' + work.dynasty + '</div>');
    if (work.style) metaLines.push('<div><strong>书体：</strong>' + getStyleName(work.style) + '</div>');
    if (work.description) metaLines.push('<div><strong>说明：</strong>' + work.description + '</div>');
    workModalMeta.innerHTML = metaLines.join('');

    workModalPreview.innerHTML = '';
    const imgSrc = work.thumbnail || work.cover || work.image_url;
    if (imgSrc) {
      // 确保图片URL正确，上传的图片应该通过/uploads/路径访问
      const fullImgUrl = imgSrc.startsWith('http') || imgSrc.startsWith('/') ? imgSrc : `/uploads/works/${imgSrc}`;
      const img = document.createElement('img'); img.src = fullImgUrl; img.style.maxWidth='100%'; img.style.maxHeight='100%'; img.style.objectFit='cover'; workModalPreview.appendChild(img);
    } else {
      workModalPreview.textContent = '无预览';
    }

    if (workModalOpenPage) {
      workModalOpenPage.href = `/work/${work.id}`;
    }

    workModal.style.display = 'flex';
    workModal.classList.add('show');
    workModal.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
  }

  function closeWorkModal() {
    if (!workModal) return;
    workModal.style.display = 'none';
    workModal.classList.remove('show');
    workModal.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
  }

  function closeModal() {
    if (!charModal) return;
    // 移除焦点，避免ARIA无障碍警告
    const focusableElements = charModal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    focusableElements.forEach(el => el.blur());
    
    charModal.style.display = 'none';
    charModal.classList.remove('show');
    charModal.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
  }

  modalClose && modalClose.addEventListener('click', closeModal);
  modalOverlay && modalOverlay.addEventListener('click', closeModal);
  workModalClose && workModalClose.addEventListener('click', closeWorkModal);
  workModalOverlay && workModalOverlay.addEventListener('click', closeWorkModal);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  // perform search
  async function doSearch() {
    const q = (input ? (input.value || '') : '').trim().toLowerCase();
    
    // 显示加载状态
    if (worksResults) {
      worksResults.innerHTML = '<p>加载中...</p>';
    }
    if (charsResults) {
      charsResults.innerHTML = '<p>加载中...</p>';
    }
    
    try {
      // 调用后端搜索接口
      const result = await ds.search(q);
      
      // 提取结果
      let works = result.works || [];
      let chars = result.characters || [];
      
      // 转换字符数据，使其与前端期望的格式一致
    chars = chars.map(c => {
        // 确保字符数据有正确的字段名
        const work = works.find(w => String(w.id) === String(c.work_id));
        
        return {
          id: c.id,
          text: c.recognition,  // 后端返回的是recognition，前端期望的是text或char
          char: c.recognition,  // 兼容旧格式
          work_id: c.work_id,
          style: c.style,
          work_title: c.source,  // 后端返回的是source，前端期望的是work_title
          stroke_count: c.strokes,
          stroke_order: c.stroke_order,
          collected_at: c.collected_at,
          // 添加作品信息
          work: work,
          // 添加作品图片URL，用于生成单字图片（优先使用后端返回的work_image_url）
          work_image_url: c.work_image_url || (work ? work.image_url : ''),
          // 添加单字在作品中的坐标信息
          x: c.x,
          y: c.y,
          width: c.width,
          height: c.height
        };
      });
      
      // 渲染结果
      renderWorks(works);
      renderChars(chars, works);
    } catch (error) {
      console.error('Search error:', error);
      // 显示错误信息
      if (worksResults) {
        worksResults.innerHTML = '<p>搜索失败，请稍后重试</p>';
      }
      if (charsResults) {
        charsResults.innerHTML = '<p>搜索失败，请稍后重试</p>';
      }
    }
  }

  if (btn) {
    btn.addEventListener('click', (e) => { e.preventDefault(); doSearch(); });
  }
  if (input) {
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') doSearch(); });
  }

  // initial render: show all works and chars when no search term is provided
  async function initialRender() {
    try {
      // 调用搜索接口，不提供关键词，获取所有结果
      const result = await ds.search('');
      
      // 提取结果
      let works = result.works || [];
      let chars = result.characters || [];
      
      // 转换字符数据，使其与前端期望的格式一致
      chars = chars.map(c => {
        const work = works.find(w => String(w.id) === String(c.work_id));
        return {
          id: c.id,
          text: c.recognition,
          char: c.recognition,
          work_id: c.work_id,
          style: c.style,
          work_title: c.source,
          stroke_count: c.strokes,
          stroke_order: c.stroke_order,
          collected_at: c.collected_at,
          work: work,
          work_image_url: c.work_image_url || (work ? work.image_url : ''),
          x: c.x,
          y: c.y,
          width: c.width,
          height: c.height
        };
      });
      
      // 渲染结果
      renderWorks(works);
      renderChars(chars, works);
    } catch (error) {
      console.error('Initial render error:', error);
      // 显示错误信息
      if (worksResults) {
        worksResults.innerHTML = '<p>加载失败，请稍后重试</p>';
      }
      if (charsResults) {
        charsResults.innerHTML = '<p>加载失败，请稍后重试</p>';
      }
    }
  }
  
  // 获取并渲染热门搜索词
  async function loadHotKeywords() {
    if (!hotKeywordsSection || !hotKeywordsList) return;
    
    try {
      const response = await fetch(`${HOT_KEYWORDS_API}?limit=8&days=7`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      
      if (data.code === 200 && data.data && data.data.keywords && data.data.keywords.length > 0) {
        // 清空现有内容
        hotKeywordsList.innerHTML = '';
        
        // 渲染热门搜索词标签
        data.data.keywords.forEach(item => {
          const tag = document.createElement('span');
          tag.className = 'hot-keyword-tag';
          tag.textContent = item.keyword;
          tag.style.cssText = 'display: inline-block; padding: 4px 12px; background: #f5f0e8; color: #8B4513; border-radius: 16px; font-size: 13px; cursor: pointer; transition: all 0.2s;';
          
          // 鼠标悬停效果
          tag.addEventListener('mouseenter', () => {
            tag.style.background = '#8B4513';
            tag.style.color = '#fff';
          });
          tag.addEventListener('mouseleave', () => {
            tag.style.background = '#f5f0e8';
            tag.style.color = '#8B4513';
          });
          
          // 点击事件：填入搜索框并搜索
          tag.addEventListener('click', () => {
            if (input) {
              input.value = item.keyword;
              doSearch();
            }
          });
          
          hotKeywordsList.appendChild(tag);
        });
        
        // 显示热门搜索区域
        hotKeywordsSection.style.display = 'block';
      } else {
        // 没有热门搜索词，隐藏区域
        hotKeywordsSection.style.display = 'none';
      }
    } catch (error) {
      console.error('Load hot keywords error:', error);
      // 加载失败，隐藏区域
      hotKeywordsSection.style.display = 'none';
    }
  }
  
  // 执行初始渲染
  initialRender();
  
  // 加载热门搜索词
  loadHotKeywords();

  // ========== 搜索候选下拉框功能 ==========
  
  // 加载候选数据（作品名和作者）
  async function loadSuggestionData() {
    if (suggestionDataLoaded) return;
    
    try {
      // 调用搜索接口获取所有作品数据
      const result = await ds.search('');
      const works = result.works || [];
      
      // 缓存作品数据
      cachedWorks = works.map(w => ({
        id: w.id,
        title: w.title || '',
        author: w.author_name || w.author || '',
        dynasty: w.dynasty || '',
        style: w.style || ''
      }));
      
      // 提取唯一的作者列表
      const authorSet = new Map();
      works.forEach(w => {
        const authorName = w.author_name || w.author;
        if (authorName && !authorSet.has(authorName)) {
          authorSet.set(authorName, {
            name: authorName,
            dynasty: w.dynasty || '',
            workCount: 1
          });
        } else if (authorName) {
          authorSet.get(authorName).workCount++;
        }
      });
      cachedAuthors = Array.from(authorSet.values());
      
      suggestionDataLoaded = true;
    } catch (error) {
      console.error('Load suggestion data error:', error);
    }
  }

  // 高亮匹配文本
  function highlightMatch(text, query) {
    if (!query || !text) return text;
    try {
      const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      return text.replace(regex, '<span class="highlight">$1</span>');
    } catch (e) {
      return text;
    }
  }

  // 正则匹配筛选作品
  function filterWorks(query) {
    if (!query) return [];
    try {
      const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      return cachedWorks
        .filter(w => regex.test(w.title))
        .slice(0, 8);
    } catch (e) {
      return [];
    }
  }

  // 正则匹配筛选作者
  function filterAuthors(query) {
    if (!query) return [];
    try {
      const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      return cachedAuthors
        .filter(a => regex.test(a.name))
        .slice(0, 8);
    } catch (e) {
      return [];
    }
  }

  // 渲染候选下拉框
  function renderSuggestions(query) {
    if (!searchSuggestions || !workSuggestionList || !authorSuggestionList) return;
    
    const matchedWorks = filterWorks(query);
    const matchedAuthors = filterAuthors(query);

    // 渲染作品候选
    workSuggestionList.innerHTML = '';
    if (matchedWorks.length > 0) {
      workSuggestionsGroup.style.display = 'block';
      matchedWorks.forEach(w => {
        const item = document.createElement('div');
        item.className = 'suggestion-item';
        item.innerHTML = `
          <div class="icon">📜</div>
          <div class="text">
            <div class="main-text">${highlightMatch(w.title, query)}</div>
            <div class="sub-text">${w.author || '佚名'} · ${w.dynasty || '未知朝代'} · ${getStyleName(w.style) || '未知书体'}</div>
          </div>
        `;
        item.addEventListener('click', () => {
          input.value = w.title;
          hideSuggestions();
          doSearch();
        });
        workSuggestionList.appendChild(item);
      });
    } else {
      workSuggestionsGroup.style.display = 'none';
    }

    // 渲染作者候选
    authorSuggestionList.innerHTML = '';
    if (matchedAuthors.length > 0) {
      authorSuggestionsGroup.style.display = 'block';
      matchedAuthors.forEach(a => {
        const item = document.createElement('div');
        item.className = 'suggestion-item';
        item.innerHTML = `
          <div class="icon">✍️</div>
          <div class="text">
            <div class="main-text">${highlightMatch(a.name, query)}</div>
            <div class="sub-text">${a.dynasty || '未知朝代'} · ${a.workCount} 部作品</div>
          </div>
        `;
        item.addEventListener('click', () => {
          input.value = a.name;
          hideSuggestions();
          doSearch();
        });
        authorSuggestionList.appendChild(item);
      });
    } else {
      authorSuggestionsGroup.style.display = 'none';
    }

    // 显示或隐藏下拉框
    if (matchedWorks.length > 0 || matchedAuthors.length > 0) {
      showSuggestions();
    } else {
      hideSuggestions();
    }
  }

  function showSuggestions() {
    if (searchSuggestions) {
      searchSuggestions.classList.add('active');
    }
  }

  function hideSuggestions() {
    if (searchSuggestions) {
      searchSuggestions.classList.remove('active');
    }
  }

  // 输入框事件监听
  if (input && searchSuggestions) {
    // 输入时触发候选
    let debounceTimer = null;
    input.addEventListener('input', async (e) => {
      const query = e.target.value.trim();
      
      // 防抖动处理
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        if (query.length > 0) {
          // 确保数据已加载
          await loadSuggestionData();
          renderSuggestions(query);
        } else {
          hideSuggestions();
        }
      }, 150);
    });

    // 获取焦点时显示候选（如果有内容）
    input.addEventListener('focus', async () => {
      const query = input.value.trim();
      if (query.length > 0) {
        await loadSuggestionData();
        renderSuggestions(query);
      }
    });

    // 点击外部关闭候选框
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-input-wrapper')) {
        hideSuggestions();
      }
    });

    // 键盘导航
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        hideSuggestions();
      }
    });
  }
});
