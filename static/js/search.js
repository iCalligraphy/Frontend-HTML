document.addEventListener('DOMContentLoaded', () => {
  // 支持不同模板中搜索输入的 id：优先 globalSearchInput，回退到 'q'，再回退到 name="q"
  const input = document.getElementById('globalSearchInput') || document.getElementById('q') || document.querySelector('input[name="q"]');
  const btn = document.getElementById('searchBtn') || document.querySelector('#searchForm button[type=button]');
  const worksResults = document.getElementById('worksResults');
  const charsResults = document.getElementById('charsResults');

  // Modal elements
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

  function getDataSource() {
    // Prefer mockAPI if available
    if (window.mockAPI) {
      return {
        works: window.mockAPI.works || [],
        characters: window.mockAPI.characters || [],
        getCharacterDetail: (id) => window.mockAPI.getCharacterDetail(id)
      };
    }
    // Fallback: try global WORKS_DATABASE / WORKS
    return {
      works: window.WORKS_DATABASE ? Object.values(window.WORKS_DATABASE) : [],
      // fallback: no characters available in this environment
      characters: [],
      getCharacterDetail: (id) => Promise.resolve({ code:404 })
    };
  }

  const ds = getDataSource();

  function renderWorks(list) {
    worksResults.innerHTML = '';
    if (!list || list.length === 0) { worksResults.innerHTML = '<p>无结果</p>'; return; }
    list.forEach(w => {
      const card = document.createElement('div');
      card.className = 'result-work-card';

      const thumb = document.createElement('div');
      thumb.className = 'thumb';
      if (w.thumbnail || w.cover || w.image_url) {
        const img = document.createElement('img');
        img.src = w.thumbnail || w.cover || w.image_url;
        img.alt = w.title || 'thumbnail';
        thumb.appendChild(img);
      } else {
        thumb.textContent = '预览';
      }

      const info = document.createElement('div');
      info.className = 'info';
      const title = document.createElement('h3');
      title.textContent = w.title || ('作品 ' + (w.id || ''));
      const p = document.createElement('p');
      p.textContent = `${w.author_name || w.author || ''} · ${w.dynasty || ''} ${w.style || ''}`;
      info.appendChild(title);
      info.appendChild(p);

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
      info.appendChild(actions);

      card.appendChild(thumb);
      card.appendChild(info);
      worksResults.appendChild(card);
    });
  }

  function renderChars(list) {
    charsResults.innerHTML = '';
    if (!list || list.length === 0) { charsResults.innerHTML = '<p>无结果</p>'; return; }
    list.forEach(c => {
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

      // 优先用 imageData 显示 PNG
      let preview;
      if (c.imageData && c.imageData.startsWith('data:image')) {
        preview = document.createElement('img');
        preview.src = c.imageData;
        preview.alt = c.text || c.char || '?';
        preview.style.maxWidth = '80px';
        preview.style.maxHeight = '80px';
        preview.style.objectFit = 'contain';
      } else if (c.image_url) {
        preview = document.createElement('img');
        preview.src = c.image_url;
        preview.alt = c.text || c.char || '?';
        preview.style.maxWidth = '80px';
        preview.style.maxHeight = '80px';
        preview.style.objectFit = 'contain';
      } else {
        preview = document.createElement('canvas');
        preview.width = 80;
        preview.height = 80;
        const ctx = preview.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, 80, 80);
        ctx.fillStyle = '#8B4513';
        ctx.font = 'bold 48px KaiTi, STKaiti, serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(c.text || c.char || '?', 40, 40);
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
      readBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        // 跳转到读帖页面，带图片参数
        let imgSrc = '';
        if (c.imageData && c.imageData.startsWith('data:image')) {
          imgSrc = encodeURIComponent(c.imageData);
        } else if (c.image_url) {
          imgSrc = encodeURIComponent(c.image_url);
        }
        if (imgSrc) {
          window.open(`/read-post?img=${imgSrc}`, '_blank');
        } else {
          alert('没有可用图片');
        }
      });
      card.appendChild(readBtn);

      card.addEventListener('click', async (e) => {
        const id = card.dataset.id;
        // try to fetch detail
        if (ds.getCharacterDetail) {
          try {
            const res = await ds.getCharacterDetail(id);
            if (res && res.code === 200 && res.data && res.data.character) {
              openCharModalWithData(res.data.character);
              return;
            }
          } catch (err) { console.warn('getCharacterDetail err', err); }
        }
        // fallback: construct from list data
        openCharModalWithData(c);
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
    if (work.style) metaLines.push('<div><strong>书体：</strong>' + work.style + '</div>');
    if (work.description) metaLines.push('<div><strong>说明：</strong>' + work.description + '</div>');
    workModalMeta.innerHTML = metaLines.join('');

    workModalPreview.innerHTML = '';
    const imgSrc = work.thumbnail || work.cover || work.image_url;
    if (imgSrc) {
      const img = document.createElement('img'); img.src = imgSrc; img.style.maxWidth='100%'; img.style.maxHeight='100%'; img.style.objectFit='cover'; workModalPreview.appendChild(img);
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
    // works
    let works = ds.works || [];
    if (q) {
      works = works.filter(w => (w.title||'').toLowerCase().includes(q) || (w.author_name||w.author||'').toLowerCase().includes(q) || (w.style||'').toLowerCase().includes(q));
    }
    renderWorks(works);

    // chars
    let chars = ds.characters || [];
    if (q) {
      chars = chars.filter(c => (c.text||c.char||'').toLowerCase().includes(q));
    }
    // normalize chars to have work reference
    chars = chars.map(c => {
      if (!c.work && c.work_id) {
        const w = (ds.works||[]).find(x=>String(x.id)===String(c.work_id));
        return { ...c, work: w };
      }
      return c;
    });
    renderChars(chars);
  }

  if (btn) {
    btn.addEventListener('click', (e) => { e.preventDefault(); doSearch(); });
  }
  if (input) {
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') doSearch(); });
  }

  // initial render: show popular works and recent chars (only when targets exist)
  if (worksResults) renderWorks(ds.works || []);
  if (charsResults) renderChars(ds.characters || []);
});
