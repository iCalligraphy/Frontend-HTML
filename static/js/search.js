document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  const resultsContainer = document.getElementById('searchResults');
  const viewBtns = document.querySelectorAll('.view-btn');

  let currentView = 'grid';
  let searchType = 'works';

  document.querySelectorAll('.type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      searchType = btn.dataset.type;
    });
  });

  viewBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      viewBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentView = btn.dataset.view;
      resultsContainer.className = currentView === 'grid' ? 'works-grid' : 'list-view';
    });
  });

  async function fetchResults() {
    const keyword = searchInput.value.trim();
    const style = document.getElementById('styleFilter').value;
    const author = document.getElementById('authorFilter').value;
    const res = await fetch(`/api/search?type=${searchType}&keyword=${keyword}&style=${style}&author=${author}`);
    const data = await res.json();
    renderResults(data);
  }

  function renderResults(items) {
    resultsContainer.innerHTML = '';
    if (items.length === 0) {
      resultsContainer.innerHTML = '<p>暂无匹配结果</p>';
      return;
    }
    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'work-card';
      card.innerHTML = `<div class="thumb"><img src="${item.thumb}" alt="${item.title}"></div>
                        <h4>${item.title}</h4>
                        <p>${item.author || ''}</p>`;
      resultsContainer.appendChild(card);
    });
  }

  searchBtn.addEventListener('click', fetchResults);
});
