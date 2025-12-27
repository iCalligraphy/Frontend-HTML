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
    const params = new URLSearchParams();
    params.set('page', page);
    params.set('per_page', 6);

    // 只在有实际输入时加入查询词，避免出现 search=1 之类的标志参数
    const q = searchInput && searchInput.value ? searchInput.value.trim() : '';
    if (q) params.set('q', q);

    const author = authorInput && authorInput.value ? authorInput.value.trim() : '';
    if (author) params.set('author', author);

    if (sourceSelect && sourceSelect.value && sourceSelect.value !== 'all') {
      params.set('source', sourceSelect.value);
    }

    // 可按需加入 style 等其它筛选
    // if (selectedStyle) params.set('style', selectedStyle);

    loadingIndicator.style.display = '';
    try {
      const res = await fetch(`${API_BASE_URL}/works?${params.toString()}`);
      if (!res.ok) throw new Error('Fetch failed: ' + res.status);
      const data = await res.json();
      worksData = data.items || [];
      totalPages = data.total_pages || 0;
      currentPage = page;
      renderWorks();
      updatePagination();
    } catch (err) {
      console.error(err);
    } finally {
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

  // 搜索按钮（区分导航栏搜索表单与页面内搜索）
  if (searchBtn && searchInput) {
    searchBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const v = searchInput.value.trim();

      // 导航栏搜索使用 navSearchForm（如果存在则跳转到 /search?q=...）
      const navForm = document.getElementById('navSearchForm');
      if (navForm && (navForm.contains(searchBtn) || navForm.contains(searchInput))) {
        if (v) window.location.href = '/search?q=' + encodeURIComponent(v);
        return;
      }

      // 页面内搜索：刷新作品列表（仅在需要时传 q）
      currentPage = 1;
      fetchWorks(1);
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