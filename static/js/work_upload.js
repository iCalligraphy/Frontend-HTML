/**
 * 作品上传页面交互脚本
 * 包含图片上传、表单验证、单字分割、草稿保存等功能
 */

// 全局状态
const uploadState = {
  currentStep: 1,
  uploadedImage: null,
  imageFile: null, // 保存实际的文件对象
  imageRotation: 0,
  workData: {
    title: '',
    author: '',
    dynasty: '',
    style: '',
    source: '',
    description: '',
    tags: ''
  },
  charBoxes: [],
  isDraftSaved: false
};

// DOM 加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
  initStep1(); // 图片上传
  initStep2(); // 作品信息
  initStep3(); // 单字分割
  initStep4(); // 提交审核
  loadDraft(); // 加载草稿
});

/**
 * 步骤1: 图片上传
 */
function initStep1() {
  const uploadArea = document.getElementById('uploadArea');
  const imageInput = document.getElementById('imageInput');
  const selectImageBtn = document.getElementById('selectImageBtn');
  const uploadPrompt = document.getElementById('uploadPrompt');
  const imagePreview = document.getElementById('imagePreview');
  const previewImage = document.getElementById('previewImage');
  const step1Next = document.getElementById('step1Next');
  const rotateLeftBtn = document.getElementById('rotateLeftBtn');
  const rotateRightBtn = document.getElementById('rotateRightBtn');
  const removeImageBtn = document.getElementById('removeImageBtn');

  // 点击选择图片
  selectImageBtn.addEventListener('click', () => imageInput.click());
  uploadArea.addEventListener('click', (e) => {
    if ((e.target === uploadArea || e.target.closest('.upload-prompt')) && 
        !e.target.closest('#selectImageBtn')) {
      imageInput.click();
    }
  });

  // 拖拽上传
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadPrompt.classList.add('drag-over');
  });

  uploadArea.addEventListener('dragleave', () => {
    uploadPrompt.classList.remove('drag-over');
  });

  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadPrompt.classList.remove('drag-over');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleImageUpload(files[0]);
    }
  });

  // 文件选择
  imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      handleImageUpload(file);
    }
  });

  // 处理图片上传
  function handleImageUpload(file) {
    if (!file.type.match('image.*')) {
      alert('请选择图片文件！');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      uploadState.uploadedImage = e.target.result;
      uploadState.imageFile = file; // 保存实际文件对象
      previewImage.src = e.target.result;
      uploadPrompt.classList.add('hidden');
      imagePreview.classList.remove('hidden');
      step1Next.disabled = false;
      saveDraft();
    };
    reader.readAsDataURL(file);
  }

  // 旋转图片
  rotateLeftBtn.addEventListener('click', () => rotateImage(-90));
  rotateRightBtn.addEventListener('click', () => rotateImage(90));

  function rotateImage(degrees) {
    uploadState.imageRotation += degrees;
    previewImage.style.transform = `rotate(${uploadState.imageRotation}deg)`;
  }

  // 重新上传
  removeImageBtn.addEventListener('click', () => {
    uploadState.uploadedImage = null;
    uploadState.imageFile = null; // 清除文件对象
    uploadState.imageRotation = 0;
    imageInput.value = '';
    previewImage.src = '';
    previewImage.style.transform = '';
    uploadPrompt.classList.remove('hidden');
    imagePreview.classList.add('hidden');
    step1Next.disabled = true;
  });

  // 下一步
  step1Next.addEventListener('click', () => goToStep(2));
}

/**
 * 步骤2: 填写作品信息
 */
function initStep2() {
  const workDesc = document.getElementById('workDesc');
  const descCharCount = document.getElementById('descCharCount');
  const step2Prev = document.getElementById('step2Prev');
  const step2Next = document.getElementById('step2Next');

  // 字数统计
  workDesc.addEventListener('input', function() {
    const length = this.value.length;
    descCharCount.textContent = length;
    if (length > 450) {
      descCharCount.style.color = '#d32f2f';
    } else {
      descCharCount.style.color = '';
    }
    saveDraft();
  });

  // 监听所有表单字段变化
  const formInputs = document.querySelectorAll('#workInfoForm input, #workInfoForm select, #workInfoForm textarea');
  formInputs.forEach(input => {
    input.addEventListener('change', saveDraft);
  });

  // 上一步
  step2Prev.addEventListener('click', () => goToStep(1));

  // 下一步（验证表单）
  step2Next.addEventListener('click', () => {
    if (validateStep2()) {
      collectWorkData();
      goToStep(3);
    }
  });
}

/**
 * 验证步骤2表单
 */
function validateStep2() {
  const title = document.getElementById('workTitle').value.trim();
  const author = document.getElementById('workAuthor').value.trim();
  const style = document.getElementById('workStyle').value;
  const source = document.getElementById('workSource').value;

  if (!title) {
    alert('请输入作品标题');
    return false;
  }

  if (!author) {
    alert('请输入作者');
    return false;
  }

  if (!style) {
    alert('请选择书法风格');
    return false;
  }

  if (!source) {
    alert('请选择来源类型');
    return false;
  }

  return true;
}

/**
 * 收集作品数据
 */
function collectWorkData() {
  uploadState.workData = {
    title: document.getElementById('workTitle').value.trim(),
    author: document.getElementById('workAuthor').value.trim(),
    dynasty: document.getElementById('workDynasty').value,
    style: document.getElementById('workStyle').value,
    source: document.getElementById('workSource').value,
    description: document.getElementById('workDesc').value.trim(),
    tags: document.getElementById('workTags').value.trim()
  };
}

/**
 * 步骤3: 单字分割
 */
function initStep3() {
  const canvas = document.getElementById('splitCanvas');
  const ctx = canvas.getContext('2d');
  const charLabels = document.getElementById('charLabels');
  const boxCount = document.getElementById('boxCount');

  const autoSplitBtn = document.getElementById('autoSplitBtn');
  const addBoxBtn = document.getElementById('addBoxBtn');
  const clearBoxesBtn = document.getElementById('clearBoxesBtn');
  const step3Prev = document.getElementById('step3Prev');
  const step3Skip = document.getElementById('step3Skip');
  const step3Next = document.getElementById('step3Next');

  let isDrawing = false;
  let startX, startY;
  let currentBox = null;

  // 初始化画布
  function initCanvas() {
    if (!uploadState.uploadedImage) return;

    const img = new Image();
    img.onload = function() {
      canvas.width = Math.min(img.width, 800);
      canvas.height = (img.height / img.width) * canvas.width;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      redrawBoxes();
    };
    img.src = uploadState.uploadedImage;
  }

  // 智能识别（模拟）
	autoSplitBtn.addEventListener('click', async () => {
		if (!uploadState.uploadedImage) {
			alert('请先上传图片');
			return;
		}
		autoSplitBtn.disabled = true;
		autoSplitBtn.textContent = '识别中...';
		try {
			const resp = await fetch('/api/works/ocr', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					image: uploadState.uploadedImage, // dataURL
					det_mode: 'auto',
					version: 'v2',
					return_position: true
				})
			});
			const data = await resp.json();
			if (!resp.ok || data.message !== 'success') {
				throw new Error(data.info || '识别失败');
			}
			// 将返回的 boxes 按画布尺寸进行缩放并填充到 charBoxes
			applyOcrBoxesToCanvas(data, canvas);
			updateBoxCount();
			initCanvas();
			alert('智能识别完成！结果已临时保存到服务器。');
			// 可按需使用 data.temp_json_path
		} catch (e) {
			console.error(e);
			alert('智能识别失败，请稍后重试。');
		} finally {
			autoSplitBtn.disabled = false;
			autoSplitBtn.textContent = '智能识别';
		}
	});

	function applyOcrBoxesToCanvas(ocrResult, canvasEl) {
		const boxes = Array.isArray(ocrResult.boxes) ? ocrResult.boxes : [];
		if (boxes.length === 0) return;

		// 计算缩放比例：使用原图尺寸与当前画布尺寸
		let origW, origH;
		if (ocrResult.image_size && ocrResult.image_size.width && ocrResult.image_size.height) {
			origW = ocrResult.image_size.width;
			origH = ocrResult.image_size.height;
		} else {
			// 兜底：通过创建图片对象获取原图尺寸
			// 注意：这里是同步读取已有 dataURL 的 natural size
			const tmp = new Image();
			tmp.src = uploadState.uploadedImage;
			origW = tmp.naturalWidth || canvasEl.width;
			origH = tmp.naturalHeight || canvasEl.height;
		}
		const scaleX = canvasEl.width / origW;
		const scaleY = canvasEl.height / origH;

		// 清空原有标注
		uploadState.charBoxes = [];
		document.getElementById('charLabels').innerHTML = '';

		// 先按行、词顺序排序
		boxes.sort((a, b) => {
			const la = typeof a.line_index === 'number' ? a.line_index : 0;
			const lb = typeof b.line_index === 'number' ? b.line_index : 0;
			if (la !== lb) return la - lb;
			const wa = typeof a.word_index === 'number' ? a.word_index : 0;
			const wb = typeof b.word_index === 'number' ? b.word_index : 0;
			return wa - wb;
		});

		boxes.forEach((b) => {
			if (!b || !Array.isArray(b.position) || b.position.length < 4) return;
			const [x1, y1, x2, y2] = b.position;
			const x = x1 * scaleX;
			const y = y1 * scaleY;
			const w = (x2 - x1) * scaleX;
			const h = (y2 - y1) * scaleY;
			const box = { x, y, width: w, height: h, char: (b.text || '').slice(0, 1), lineIndex: b.line_index, wordIndex: b.word_index };
			uploadState.charBoxes.push(box);
			addCharLabel(box, uploadState.charBoxes.length - 1);
		});

		// 生成整段识别文本（按行聚合）
		try {
			const byLine = new Map();
			uploadState.charBoxes.forEach(b => {
				const lineKey = typeof b.lineIndex === 'number' ? b.lineIndex : 0;
				if (!byLine.has(lineKey)) byLine.set(lineKey, []);
				byLine.get(lineKey).push(b);
			});
			const lines = Array.from(byLine.keys()).sort((a, b) => a - b).map(k => {
				const arr = byLine.get(k);
				arr.sort((a, b) => {
					const wa = typeof a.wordIndex === 'number' ? a.wordIndex : 0;
					const wb = typeof b.wordIndex === 'number' ? b.wordIndex : 0;
					return wa - wb;
				});
				return arr.map(it => it.char || '').join('');
			});
			const fullText = lines.join('\n');
			const ocrTextEl = document.getElementById('ocrText');
			if (ocrTextEl) {
				ocrTextEl.value = fullText;
			}
		} catch (_) {}

		saveDraft();
	}

  // 手动添加
  addBoxBtn.addEventListener('click', () => {
    canvas.style.cursor = 'crosshair';
  });

  // 清除所有
  clearBoxesBtn.addEventListener('click', () => {
    if (uploadState.charBoxes.length === 0) return;
    if (confirm('确定要清除所有标记吗？')) {
      uploadState.charBoxes = [];
      charLabels.innerHTML = '';
      updateBoxCount();
      initCanvas();
    }
  });

  // 鼠标绘制框
  canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    startX = e.clientX - rect.left;
    startY = e.clientY - rect.top;
    isDrawing = true;
    currentBox = { x: startX, y: startY, width: 0, height: 0 };
  });

  canvas.addEventListener('mousemove', (e) => {
    if (!isDrawing) return;

    const rect = canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    currentBox.width = currentX - startX;
    currentBox.height = currentY - startY;

    // 重绘
    initCanvas();
    ctx.strokeStyle = 'rgba(139, 69, 19, 0.8)';
    ctx.lineWidth = 2;
    ctx.strokeRect(currentBox.x, currentBox.y, currentBox.width, currentBox.height);
  });

  canvas.addEventListener('mouseup', () => {
    if (!isDrawing) return;
    isDrawing = false;

    if (Math.abs(currentBox.width) > 20 && Math.abs(currentBox.height) > 20) {
      // 标准化坐标
      const box = {
        x: currentBox.width < 0 ? currentBox.x + currentBox.width : currentBox.x,
        y: currentBox.height < 0 ? currentBox.y + currentBox.height : currentBox.y,
        width: Math.abs(currentBox.width),
        height: Math.abs(currentBox.height),
        char: ''
      };

      uploadState.charBoxes.push(box);
      addCharLabel(box, uploadState.charBoxes.length - 1);
      updateBoxCount();
      initCanvas();
      saveDraft();
    }

    currentBox = null;
  });

  // 添加字符标注输入
  function addCharLabel(box, index) {
    const item = document.createElement('div');
    item.className = 'char-label-item';
    item.innerHTML = `
      <div class="char-label-preview"></div>
      <input type="text" class="char-label-input" placeholder="输入单字" maxlength="1" data-index="${index}" />
      <button type="button" class="btn btn-outline btn-small" onclick="removeCharBox(${index})">删除</button>
    `;

    const input = item.querySelector('.char-label-input');
    // 自动填入识别字符
    if (box && typeof box.char === 'string') {
      input.value = box.char;
    }
    input.addEventListener('input', function() {
      uploadState.charBoxes[index].char = this.value;
      saveDraft();
    });

    // 生成字符预览缩略图
    const previewHolder = item.querySelector('.char-label-preview');
    try {
      renderCharPreview(previewHolder, box);
    } catch (_) {}

    charLabels.appendChild(item);
  }

  // 更新计数
  function updateBoxCount() {
    boxCount.textContent = uploadState.charBoxes.length;
  }

  // 重绘所有框
  function redrawBoxes() {
    ctx.strokeStyle = 'rgba(139, 69, 19, 0.8)';
    ctx.lineWidth = 2;
    uploadState.charBoxes.forEach(box => {
      ctx.strokeRect(box.x, box.y, box.width, box.height);
    });
  }

  // 基于上传图片与标注框，绘制单字预览
  function renderCharPreview(containerEl, box) {
    if (!containerEl || !box || !uploadState.uploadedImage) return;

    // 目标预览尺寸
    const PREVIEW_SIZE = 120;
    const canvasThumb = document.createElement('canvas');
    canvasThumb.width = PREVIEW_SIZE;
    canvasThumb.height = PREVIEW_SIZE;
    const cctx = canvasThumb.getContext('2d');
    // 白底
    cctx.fillStyle = '#fff';
    cctx.fillRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);

    const img = new Image();
    img.onload = function() {
      // 将画布坐标映射回原图坐标
      // 已知：在 initCanvas 中 canvas 宽度为 min(img.width, 800)，高度按比例缩放
      // 因此：scaleX = canvas.width / img.width
      // 反推原图坐标：srcX = box.x / scaleX
      const scaleX = canvas.width / img.width;
      const scaleY = canvas.height / img.height;

      // 避免 0 值
      const safeScaleX = scaleX || 1;
      const safeScaleY = scaleY || 1;

      let srcX = box.x / safeScaleX;
      let srcY = box.y / safeScaleY;
      let srcW = box.width / safeScaleX;
      let srcH = box.height / safeScaleY;

      // 边界裁剪
      srcX = Math.max(0, Math.min(srcX, img.width));
      srcY = Math.max(0, Math.min(srcY, img.height));
      srcW = Math.max(1, Math.min(srcW, img.width - srcX));
      srcH = Math.max(1, Math.min(srcH, img.height - srcY));

      // 使预览保持内容比例，居中显示
      const boxAspect = srcW / srcH;
      let destW = PREVIEW_SIZE;
      let destH = PREVIEW_SIZE;
      let dx = 0;
      let dy = 0;
      if (boxAspect > 1) {
        // 宽图，横向贴满
        destH = Math.round(PREVIEW_SIZE / boxAspect);
        dy = Math.floor((PREVIEW_SIZE - destH) / 2);
      } else if (boxAspect < 1) {
        // 高图，纵向贴满
        destW = Math.round(PREVIEW_SIZE * boxAspect);
        dx = Math.floor((PREVIEW_SIZE - destW) / 2);
      }

      cctx.drawImage(img, srcX, srcY, srcW, srcH, dx, dy, destW, destH);

      // 将缩略图插入容器
      containerEl.innerHTML = '';
      containerEl.appendChild(canvasThumb);
    };
    img.src = uploadState.uploadedImage;
  }

  // 全局删除函数
  window.removeCharBox = function(index) {
    uploadState.charBoxes.splice(index, 1);
    charLabels.innerHTML = '';
    uploadState.charBoxes.forEach((box, i) => addCharLabel(box, i));
    updateBoxCount();
    initCanvas();
    saveDraft();
  };

  // 上一步
  step3Prev.addEventListener('click', () => goToStep(2));

  // 跳过
  step3Skip.addEventListener('click', () => goToStep(4));

  // 下一步
  step3Next.addEventListener('click', () => goToStep(4));

  // 当进入步骤3时初始化画布
  document.addEventListener('stepChanged', (e) => {
    if (e.detail.step === 3) {
      setTimeout(initCanvas, 100);
    }
  });
}

/**
 * 步骤4: 提交审核
 */
function initStep4() {
  const agreeTerms = document.getElementById('agreeTerms');
  const submitBtn = document.getElementById('submitBtn');
  const step4Prev = document.getElementById('step4Prev');
  const saveDraftBtn = document.getElementById('saveDraftBtn');

  // 勾选协议才能提交
  agreeTerms.addEventListener('change', function() {
    submitBtn.disabled = !this.checked;
  });

  // 上一步
  step4Prev.addEventListener('click', () => goToStep(3));

  // 手动保存草稿
  saveDraftBtn.addEventListener('click', () => {
    saveDraft();
    alert('草稿已保存！');
  });

  // 提交
  submitBtn.addEventListener('click', async () => {
    if (confirm('确定要提交审核吗？')) {
      try {
        // 构建FormData对象，包含文件和表单数据
        const formData = new FormData();
        
        // 添加图片文件
        if (uploadState.imageFile) {
          formData.append('image', uploadState.imageFile);
        } else {
          alert('请先上传图片');
          return;
        }
        
        // 添加作品信息
        formData.append('title', uploadState.workData.title);
        formData.append('description', uploadState.workData.description);
        formData.append('style', uploadState.workData.style);
        formData.append('author_name', uploadState.workData.author);
        formData.append('source_type', uploadState.workData.source);
        formData.append('tags', uploadState.workData.tags);
        
        // 添加单字分割结果
        if (uploadState.charBoxes.length > 0) {
          const characters = uploadState.charBoxes.map(box => ({
            text: box.char,
            position: [box.x, box.y, box.x + box.width, box.y + box.height],
            style: uploadState.workData.style
          }));
          formData.append('characters', JSON.stringify(characters));
        }
        
        // 发送POST请求到服务器
        const response = await fetch('/api/works/', {
          method: 'POST',
          credentials: 'include', // 包含cookie，用于JWT认证
          body: formData
        });
        
        if (!response.ok) {
          throw new Error('上传失败，服务器返回错误');
        }
        
        const result = await response.json();
        console.log('提交成功:', result);
        alert('提交成功！作品已进入审核队列。');
        
        // 清空草稿
        localStorage.removeItem('uploadDraft');
        
        // 跳转到首页
        // window.location.href = 'index.html';
      } catch (error) {
        console.error('上传失败:', error);
        alert('上传失败，请稍后重试。错误信息：' + error.message);
      }
    }
  });

  // 当进入步骤4时更新摘要
  document.addEventListener('stepChanged', (e) => {
    if (e.detail.step === 4) {
      updateSummary();
    }
  });
}

/**
 * 更新作品摘要
 */
function updateSummary() {
  const data = uploadState.workData;

  document.getElementById('summaryImage').src = uploadState.uploadedImage;
  document.getElementById('summaryTitle').textContent = data.title;
  document.getElementById('summaryAuthor').textContent = data.author || '未填写';
  document.getElementById('summaryDynasty').textContent = data.dynasty || '未选择';

  const styleMap = { 'kai': '楷书', 'xing': '行书', 'cao': '草书', 'li': '隶书', 'zhuan': '篆书' };
  document.getElementById('summaryStyle').textContent = styleMap[data.style] || '未选择';

  const sourceMap = { 'classic': '经典碑帖', 'original': '原创作品', 'copy': '临摹作品' };
  document.getElementById('summarySource').textContent = sourceMap[data.source] || '未选择';

  document.getElementById('summaryCharCount').textContent = uploadState.charBoxes.length || '0';

  const descElem = document.getElementById('summaryDesc');
  descElem.textContent = data.description || '暂无描述';

  const tagsElem = document.getElementById('summaryTags');
  if (data.tags) {
    const tags = data.tags.split(',').map(t => t.trim()).filter(t => t);
    tagsElem.innerHTML = tags.map(tag => `<span class="tag">${tag}</span>`).join('');
  } else {
    tagsElem.innerHTML = '<span class="tag">暂无标签</span>';
  }
}

/**
 * 步骤切换
 */
function goToStep(step) {
  // 隐藏当前步骤
  document.querySelectorAll('.upload-section').forEach(section => {
    section.classList.add('hidden');
  });

  // 显示目标步骤
  document.getElementById(`step${step}`).classList.remove('hidden');

  // 更新步骤指示器
  document.querySelectorAll('.step-item').forEach(item => {
    const itemStep = parseInt(item.dataset.step);
    item.classList.remove('active', 'completed');

    if (itemStep === step) {
      item.classList.add('active');
    } else if (itemStep < step) {
      item.classList.add('completed');
    }
  });

  uploadState.currentStep = step;

  // 滚动到顶部
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // 触发步骤切换事件
  document.dispatchEvent(new CustomEvent('stepChanged', { detail: { step } }));
}

/**
 * 草稿保存
 */
function saveDraft() {
  const draft = {
    image: uploadState.uploadedImage,
    rotation: uploadState.imageRotation,
    workData: uploadState.workData,
    charBoxes: uploadState.charBoxes,
    timestamp: Date.now()
  };

  localStorage.setItem('uploadDraft', JSON.stringify(draft));
  uploadState.isDraftSaved = true;
}

/**
 * 加载草稿
 */
function loadDraft() {
  const draftStr = localStorage.getItem('uploadDraft');
  if (!draftStr) return;

  const draft = JSON.parse(draftStr);

  // 检查是否是最近的草稿（7天内）
  const daysPassed = (Date.now() - draft.timestamp) / (1000 * 60 * 60 * 24);
  if (daysPassed > 7) {
    localStorage.removeItem('uploadDraft');
    return;
  }

  if (confirm('检测到未完成的草稿，是否继续编辑？')) {
    uploadState.uploadedImage = draft.image;
    uploadState.imageRotation = draft.rotation;
    uploadState.workData = draft.workData;
    uploadState.charBoxes = draft.charBoxes;

    // 恢复表单数据
    Object.keys(draft.workData).forEach(key => {
      const elem = document.getElementById(`work${key.charAt(0).toUpperCase() + key.slice(1)}`);
      if (elem) {
        elem.value = draft.workData[key];
      }
    });

    // 如果有图片，显示预览
    if (draft.image) {
      const previewImage = document.getElementById('previewImage');
      previewImage.src = draft.image;
      previewImage.style.transform = `rotate(${draft.rotation}deg)`;
      document.getElementById('uploadPrompt').classList.add('hidden');
      document.getElementById('imagePreview').classList.remove('hidden');
      document.getElementById('step1Next').disabled = false;
    }
  }
}
