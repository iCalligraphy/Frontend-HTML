document.addEventListener('DOMContentLoaded', () => {
  const gridBtn = document.getElementById('gridViewBtn');
  const listBtn = document.getElementById('listViewBtn');
  const grid = document.getElementById('worksGrid');
  const list = document.getElementById('worksList');
  const gridContainer = grid ? grid.querySelector('.works-grid') : null;
  const listContainer = list ? list.querySelector('.list-wrapper') : null;
  const typeButtons = document.querySelectorAll('.type-btn');
  const chips = document.querySelectorAll('.chip');
  const searchInput = document.getElementById('globalSearchInput');
  const searchBtn = document.getElementById('searchBtn');
  const authorInput = document.getElementById('authorInput');
  const sourceSelect = document.getElementById('sourceSelect');
  
  let currentPage = 1;
  let totalPages = 0;
  let worksData = [];

  // 添加加载状态元素
  const loadingIndicator = document.createElement('div');
  loadingIndicator.className = 'loading-indicator';
  loadingIndicator.innerHTML = '<div class="spinner"></div><p>加载中...</p>';
  loadingIndicator.style.display = 'none';
  if (gridContainer) {
    gridContainer.parentNode.insertBefore(loadingIndicator, gridContainer);
  }

  // API配置
  const API_BASE_URL = '/api';

  // 获取作品列表
  async function fetchWorks(page = 1) {
    try {
      // 显示加载状态
      loadingIndicator.style.display = 'flex';
      
      // 构建查询参数
      const params = new URLSearchParams({
        page: page,
        per_page: 6
      });
      
      // 添加筛选条件
      const selectedStyle = Array.from(chips)
        .filter(chip => chip.classList.contains('selected'))
        .map(chip => chip.dataset.style)
        .join(',');
      
      if (selectedStyle) {
        params.append('style', selectedStyle);
      }
      
      if (authorInput && authorInput.value.trim()) {
        params.append('author', authorInput.value.trim());
      }
      
      if (sourceSelect && sourceSelect.value !== 'all') {
        params.append('source_type', sourceSelect.value);
      }
      
      if (searchInput && searchInput.value.trim()) {
        params.append('search', searchInput.value.trim());
      }
      
      // 调用API
      const response = await fetch(`${API_BASE_URL}/works/?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('网络请求失败');
      }
      
      const data = await response.json();
      worksData = data.works || [];
      totalPages = data.pages || 0;
      currentPage = data.page || 1;
      
      // 更新分页信息
      updatePagination();
      
      // 渲染作品列表
      renderWorks();
      
    } catch (error) {
      console.error('获取作品失败:', error);
      alert('获取作品失败，请稍后重试');
    } finally {
      // 隐藏加载状态
      loadingIndicator.style.display = 'none';
    }
  }

  // 渲染作品列表
  function renderWorks() {
    if (grid && grid.classList.contains('hidden')) {
      renderWorksList();
    } else {
      renderWorksGrid();
    }
  }

  // 渲染网格视图
  function renderWorksGrid() {
    if (!gridContainer) return;
    
    if (worksData.length === 0) {
      gridContainer.innerHTML = '<div class="no-results">暂无作品</div>';
      return;
    }
    
    gridContainer.innerHTML = worksData.map(work => `
      <article class="work-card" data-work-id="${work.id}">
        <div class="thumb" ${work.image_url ? `style="background-image: url(${work.image_url})"` : ''}></div>
        <div class="work-info">
          <h4>${work.title || '未知作品'}</h4>
          <p class="meta">作者：${work.author_name || '未知作者'} · 风格：${work.style || '未知风格'} · 字数：${work.characters_count || 0}</p>
        </div>
      </article>
    `).join('');
    
    // 添加点击事件
    addWorkCardClickListeners();
  }

  // 渲染列表视图
  function renderWorksList() {
    if (!listContainer) return;
    
    if (worksData.length === 0) {
      listContainer.innerHTML = '<div class="no-results">暂无作品</div>';
      return;
    }
    
    listContainer.innerHTML = worksData.map(work => `
      <div class="list-row" data-work-id="${work.id}">
        <span class="list-title">${work.title || '未知作品'}</span>
        <span class="list-meta">${work.author_name || '未知作者'} · ${work.style || '未知风格'} · ${work.characters_count || 0}字</span>
      </div>
    `).join('');
    
    // 添加点击事件
    addWorkCardClickListeners();
  }

  // 更新分页信息
  function updatePagination() {
    const paginationElements = document.querySelectorAll('.pagination');
    paginationElements.forEach(pagination => {
      const pageInfo = pagination.querySelector('.page-info');
      const prevBtn = pagination.querySelector('.page-btn:first-child');
      const nextBtn = pagination.querySelector('.page-btn:last-child');
      
      if (pageInfo) {
        pageInfo.textContent = `第 ${currentPage} 页 · 共 ${totalPages} 页`;
      }
      
      if (prevBtn) {
        prevBtn.disabled = currentPage <= 1;
        prevBtn.onclick = () => {
          if (currentPage > 1) {
            fetchWorks(currentPage - 1);
          }
        };
      }
      
      if (nextBtn) {
        nextBtn.disabled = currentPage >= totalPages;
        nextBtn.onclick = () => {
          if (currentPage < totalPages) {
            fetchWorks(currentPage + 1);
          }
        };
      }
    });
  }

  // 为作品卡片添加点击事件
  function addWorkCardClickListeners() {
    const workItems = document.querySelectorAll('.work-card, .list-row');
    workItems.forEach(item => {
      item.addEventListener('click', () => {
        const workId = item.dataset.workId;
        if (workId) {
          window.location.href = `/work/${workId}`;
        }
      });
    });
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
      renderWorks(); // 切换视图后重新渲染
    });
    listBtn.addEventListener('click', () => {
      listBtn.classList.add('active');
      gridBtn.classList.remove('active');
      list.classList.remove('hidden');
      grid.classList.add('hidden');
      listBtn.setAttribute('aria-pressed', 'true');
      gridBtn.setAttribute('aria-pressed', 'false');
      renderWorks(); // 切换视图后重新渲染
    });
  }

  // 检索类型切换
  typeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      typeButtons.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
    });
  });

  // 风格筛选 chips
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chip.classList.toggle('selected');
      fetchWorks(1); // 筛选条件变化时重新获取数据
    });
  });

  // 搜索按钮
  if (searchBtn && searchInput) {
    searchBtn.addEventListener('click', () => {
      const keyword = searchInput.value.trim();
      if (!keyword) {
        alert('请输入搜索关键词');
        return;
      }
      fetchWorks(1); // 搜索时重新获取数据
    });
    
    // 回车键搜索
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        searchBtn.click();
      }
    });
  }

  // 作者输入框变化
  if (authorInput) {
    authorInput.addEventListener('change', () => {
      fetchWorks(1);
    });
  }

  // 来源选择变化
  if (sourceSelect) {
    sourceSelect.addEventListener('change', () => {
      fetchWorks(1);
    });
  }

  // 初始加载作品数据
  fetchWorks();
});