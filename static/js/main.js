document.addEventListener('DOMContentLoaded', () => {
  const gridBtn = document.getElementById('gridViewBtn');
  const listBtn = document.getElementById('listViewBtn');
  const grid = document.getElementById('worksGrid');
  const list = document.getElementById('worksList');
  const typeButtons = document.querySelectorAll('.type-btn');
  const chips = document.querySelectorAll('.chip');
  const searchInput = document.getElementById('globalSearchInput');
  const searchBtn = document.getElementById('searchBtn');

  // 视图切换
  if (gridBtn && listBtn && grid && list) {
    gridBtn.addEventListener('click', () => {
      gridBtn.classList.add('active');
      listBtn.classList.remove('active');
      grid.classList.remove('hidden');
      list.classList.add('hidden');
      gridBtn.setAttribute('aria-pressed', 'true');
      listBtn.setAttribute('aria-pressed', 'false');
    });
    listBtn.addEventListener('click', () => {
      listBtn.classList.add('active');
      gridBtn.classList.remove('active');
      list.classList.remove('hidden');
      grid.classList.add('hidden');
      listBtn.setAttribute('aria-pressed', 'true');
      gridBtn.setAttribute('aria-pressed', 'false');
    });
  }

  // 检索类型切换（示例）
  typeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      typeButtons.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
    });
  });

  // 风格筛选 chips（示例）
  chips.forEach(chip => {
    chip.addEventListener('click', () => chip.classList.toggle('selected'));
  });

  // 搜索按钮（示例）
  if (searchBtn && searchInput) {
    searchBtn.addEventListener('click', () => {
      const keyword = searchInput.value.trim();
      if (!keyword) {
        alert('请输入搜索关键词');
        return;
      }
      // 示例：仅提示，后续接入真实检索逻辑
      console.log('搜索：', keyword);
    });
  }
});