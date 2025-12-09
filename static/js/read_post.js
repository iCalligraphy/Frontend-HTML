// 读帖页面交互脚本
class ReadPostApp {
  constructor() {
    console.log('ReadPostApp 初始化开始');
    
    this.uploadArea = document.getElementById('uploadArea');
    this.uploadPlaceholder = document.getElementById('uploadPlaceholder');
    this.imageDisplay = document.getElementById('imageDisplay');
    this.imageCanvas = document.getElementById('imageCanvas');
    this.imageWrapper = document.getElementById('imageWrapper');
    this.fileInput = document.getElementById('fileInput');
    this.selectFileBtn = document.getElementById('selectFileBtn');
    this.analyzeBtn = document.getElementById('analyzeBtn');
    this.addAnnotationBtn = document.getElementById('addAnnotationBtn');
    this.saveBtn = document.getElementById('saveBtn');
    this.annotationsList = document.getElementById('annotationsList');
    this.annotationCount = document.getElementById('annotationCount');
    this.loadingOverlay = document.getElementById('loadingOverlay');
    this.toast = document.getElementById('toast');

    // 检查关键元素是否存在
    if (!this.imageCanvas) {
      console.error('错误: imageCanvas 元素未找到');
      return;
    }
    if (!this.imageWrapper) {
      console.error('错误: imageWrapper 元素未找到');
      return;
    }

    this.ctx = this.imageCanvas.getContext('2d');
    this.currentImage = null;
    this.imageData = null;
    this.annotations = [];
    this.keypoints = [];
    this.isDragging = false;
    this.draggedPoint = null;
    this.nextAnnotationId = 1;

    console.log('ReadPostApp 初始化成功');
    this.init();
    this.updateActionButtons();
  }

  init() {
    // 绑定事件
    this.bindEvents();
  }

  bindEvents() {
    // 文件选择
    this.selectFileBtn.addEventListener('click', () => this.fileInput.click());
    this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

    // 拖拽上传
    this.uploadPlaceholder.addEventListener('dragover', (e) => this.handleDragOver(e));
    this.uploadPlaceholder.addEventListener('dragleave', (e) => this.handleDragLeave(e));
    this.uploadPlaceholder.addEventListener('drop', (e) => this.handleDrop(e));

    // 按钮点击
    this.analyzeBtn.addEventListener('click', () => this.analyzeCharacter());
    this.saveBtn.addEventListener('click', () => this.saveAnnotations());
    this.addAnnotationBtn.addEventListener('click', () => this.addAnnotation());

    // Canvas 交互
    this.imageCanvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.imageCanvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.imageCanvas.addEventListener('mouseup', () => this.handleMouseUp());
    this.imageCanvas.addEventListener('mouseleave', () => this.handleMouseUp());
  }

  // 处理文件选择
  handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
      this.loadImage(file);
    }
  }

  // 处理拖拽
  handleDragOver(e) {
    e.preventDefault();
    this.uploadPlaceholder.classList.add('dragover');
  }

  handleDragLeave(e) {
    e.preventDefault();
    this.uploadPlaceholder.classList.remove('dragover');
  }

  handleDrop(e) {
    e.preventDefault();
    this.uploadPlaceholder.classList.remove('dragover');
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      this.loadImage(file);
    } else {
      this.showToast('请上传图片文件', 'error');
    }
  }

  // 加载图片
  loadImage(file) {
    console.log('开始加载图片:', file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      console.log('文件读取完成');
      const img = new Image();
      img.onload = () => {
        console.log('图片加载完成，尺寸:', img.width, 'x', img.height);
        this.currentImage = img;
        this.imageData = file;
        this.annotations = [];
        this.nextAnnotationId = 1;
        this.renderAnnotations();

        // 先显示容器，再绘制图片
        this.uploadPlaceholder.style.display = 'none';
        this.imageDisplay.style.display = 'block';
        
        // 使用setTimeout确保DOM更新后再绘制
        setTimeout(() => {
          this.displayImage();
          this.analyzeBtn.disabled = false;
          this.updateActionButtons();
          this.showToast('图片上传成功', 'success');
        }, 50);
      };
      img.onerror = (err) => {
        console.error('图片加载失败:', err);
        this.showToast('图片加载失败', 'error');
      };
      img.src = e.target.result;
    };
    reader.onerror = (err) => {
      console.error('文件读取失败:', err);
      this.showToast('文件读取失败', 'error');
    };
    reader.readAsDataURL(file);
  }

  // 显示图片（自动适配并占满容器）
  displayImage() {
    const container = this.imageWrapper;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    if (containerWidth === 0 || containerHeight === 0) {
      console.error('容器尺寸为0，无法显示图片');
      return;
    }
    
    const imgWidth = this.currentImage.width;
    const imgHeight = this.currentImage.height;
    
    // 计算缩放比例，使图片适配容器（保持宽高比）
    const scaleX = containerWidth / imgWidth;
    const scaleY = containerHeight / imgHeight;
    // 使用Math.min确保图片完全在容器内，或使用Math.max让图片填满容器
    const scale = Math.min(scaleX, scaleY);
    
    const displayWidth = imgWidth * scale;
    const displayHeight = imgHeight * scale;
    
    // 设置canvas的实际尺寸（用于绘制）
    this.imageCanvas.width = displayWidth;
    this.imageCanvas.height = displayHeight;
    
    // 设置canvas的CSS显示尺寸（与实际尺寸相同，避免拉伸）
    this.imageCanvas.style.width = displayWidth + 'px';
    this.imageCanvas.style.height = displayHeight + 'px';
    
    // 清除canvas
    this.ctx.clearRect(0, 0, displayWidth, displayHeight);
    
    // 绘制图片
    this.ctx.drawImage(this.currentImage, 0, 0, displayWidth, displayHeight);
    
    // 保存缩放信息
    this.scale = scale;
    this.displayWidth = displayWidth;
    this.displayHeight = displayHeight;
    
    console.log('图片已显示:', {
      containerWidth,
      containerHeight,
      imgWidth,
      imgHeight,
      scale,
      displayWidth,
      displayHeight
    });
  }

  // 调用AI分析
  async analyzeCharacter() {
    if (!this.imageData) {
      this.showToast('请先上传图片', 'error');
      return;
    }

    this.showLoading(true);
    
    const formData = new FormData();
    formData.append('image', this.imageData);

    try {
      const response = await fetch('/api/calligraphy/analyze', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (response.ok) {
        this.annotations = data.keypoints || [];
        this.nextAnnotationId = this.getNextAnnotationId();
        this.renderAnnotations();
        this.drawKeypoints();
        this.updateActionButtons();
        this.showToast('分析完成！', 'success');
      } else {
        throw new Error(data.error || '分析失败');
      }
    } catch (error) {
      console.error('分析错误:', error);
      this.showToast('分析失败: ' + error.message, 'error');
    } finally {
      this.showLoading(false);
    }
  }

  // 渲染注释列表
  renderAnnotations() {
    if (this.annotations.length === 0) {
      this.annotationsList.innerHTML = `
        <div class="empty-state">
          <p>暂无注释</p>
          <p class="hint">上传字帖图片后，点击"智能解读"按钮自动生成临摹要点</p>
        </div>
      `;
      this.annotationCount.textContent = '0 个要点';
      return;
    }

    this.annotationCount.textContent = `${this.annotations.length} 个要点`;
    
    this.annotationsList.innerHTML = this.annotations.map((anno, index) => `
      <div class="annotation-item" data-id="${anno.id}">
        <div class="annotation-header">
          <div class="annotation-number">${index + 1}</div>
          <div class="annotation-title">${anno.description || `要点 ${index + 1}`}</div>
          <button type="button" class="annotation-remove-btn" data-id="${anno.id}" title="删除要点">
            <span class="annotation-remove-icon" aria-hidden="true">❌</span>
          </button>
        </div>
        <div class="annotation-content">
          <textarea 
            class="annotation-input" 
            data-id="${anno.id}"
            placeholder="在此编辑临摹要点..."
          >${anno.tips || ''}</textarea>
          <div class="annotation-coords">
            <div class="coord-item">
              <span class="coord-label">X:</span>
              <span>${(anno.x * 100).toFixed(1)}%</span>
            </div>
            <div class="coord-item">
              <span class="coord-label">Y:</span>
              <span>${(anno.y * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>
    `).join('');

    // 绑定输入事件
    const textareas = this.annotationsList.querySelectorAll('.annotation-input');
    textareas.forEach(textarea => {
      textarea.addEventListener('input', (e) => {
        const id = parseInt(e.target.dataset.id);
        const anno = this.annotations.find(a => a.id === id);
        if (anno) {
          anno.tips = e.target.value;
        }
        this.autoResizeTextarea(e.target);
      });
      this.autoResizeTextarea(textarea);
    });

    const removeButtons = this.annotationsList.querySelectorAll('.annotation-remove-btn');
    removeButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = parseInt(button.dataset.id);
        this.removeAnnotation(id);
      });
    });

    // 绑定点击事件（高亮对应的坐标点）
    const items = this.annotationsList.querySelectorAll('.annotation-item');
    items.forEach(item => {
      item.addEventListener('click', () => {
        items.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
      });
    });
  }

  // 绘制关键点
  drawKeypoints() {
    if (!this.currentImage || !this.displayWidth || !this.displayHeight) {
      console.error('图片数据不完整，无法绘制');
      return;
    }
    
    // 清除canvas
    this.ctx.clearRect(0, 0, this.imageCanvas.width, this.imageCanvas.height);
    
    // 重绘图片
    this.ctx.drawImage(this.currentImage, 0, 0, this.displayWidth, this.displayHeight);
    
    // 绘制所有关键点
    this.annotations.forEach(anno => {
      const x = anno.x * this.displayWidth;
      const y = anno.y * this.displayHeight;
      
      // 绘制点
      this.ctx.save();
      this.ctx.fillStyle = '#8b4513';
      this.ctx.strokeStyle = '#fff';
      this.ctx.lineWidth = 2;
      
      this.ctx.beginPath();
      this.ctx.arc(x, y, 6, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();
      
      // 绘制编号
      this.ctx.fillStyle = '#8b4513';
      this.ctx.font = 'bold 12px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      
      // 绘制编号背景圆圈
      this.ctx.beginPath();
      this.ctx.arc(x, y - 20, 10, 0, Math.PI * 2);
      this.ctx.fill();
      
      // 绘制编号文字
      this.ctx.fillStyle = '#fff';
      this.ctx.fillText(anno.id.toString(), x, y - 20);
      
      this.ctx.restore();
    });
  }

  // 清除关键点
  clearKeypoints() {
    const existingPoints = this.imageWrapper.querySelectorAll('.keypoint');
    existingPoints.forEach(point => point.remove());
  }

  // 处理鼠标按下
  handleMouseDown(e) {
    const rect = this.imageCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // 检查是否点击到某个关键点
    for (const anno of this.annotations) {
      const px = anno.x * this.displayWidth;
      const py = anno.y * this.displayHeight;
      const distance = Math.sqrt((x - px) ** 2 + (y - py) ** 2);
      
      if (distance < 10) {
        this.isDragging = true;
        this.draggedPoint = anno;
        this.imageCanvas.style.cursor = 'grabbing';
        break;
      }
    }
  }

  // 处理鼠标移动
  handleMouseMove(e) {
    if (!this.isDragging || !this.draggedPoint) {
      // 检查是否悬停在关键点上
      const rect = this.imageCanvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      let onPoint = false;
      for (const anno of this.annotations) {
        const px = anno.x * this.displayWidth;
        const py = anno.y * this.displayHeight;
        const distance = Math.sqrt((x - px) ** 2 + (y - py) ** 2);
        
        if (distance < 10) {
          onPoint = true;
          break;
        }
      }
      
      this.imageCanvas.style.cursor = onPoint ? 'grab' : 'crosshair';
      return;
    }
    
    // 拖拽更新坐标
    const rect = this.imageCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    this.draggedPoint.x = Math.max(0, Math.min(1, x / this.displayWidth));
    this.draggedPoint.y = Math.max(0, Math.min(1, y / this.displayHeight));
    
    // 重绘
    this.drawKeypoints();
    this.renderAnnotations();
  }

  // 处理鼠标释放
  handleMouseUp() {
    this.isDragging = false;
    this.draggedPoint = null;
    this.imageCanvas.style.cursor = 'crosshair';
  }

  getNextAnnotationId() {
    if (this.annotations.length === 0) {
      return 1;
    }
    return Math.max(...this.annotations.map(anno => Number(anno.id) || 0)) + 1;
  }

  addAnnotation() {
    if (!this.currentImage) {
      this.showToast('请先上传图片', 'error');
      return;
    }

    const newAnnotation = {
      id: this.nextAnnotationId++,
      description: `要点 ${this.annotations.length + 1}`,
      tips: '',
      x: 0.5,
      y: 0.5
    };

    this.annotations.push(newAnnotation);
    this.renderAnnotations();
    this.drawKeypoints();
    this.updateActionButtons();
  }

  removeAnnotation(id) {
    this.annotations = this.annotations.filter(anno => anno.id !== id);
    this.renderAnnotations();
    this.drawKeypoints();
    this.updateActionButtons();
  }

  autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }

  updateActionButtons() {
    if (this.saveBtn) {
      this.saveBtn.disabled = this.annotations.length === 0;
    }
    if (this.addAnnotationBtn) {
      this.addAnnotationBtn.disabled = !this.currentImage;
    }
  }

  // 保存注释
  async saveAnnotations() {
    if (this.annotations.length === 0) {
      this.showToast('没有可保存的注释', 'error');
      return;
    }

    this.showLoading(true);

    try {
      // 准备保存数据
      const saveData = {
        character: '单字',
        keypoints: this.annotations,
        timestamp: new Date().toISOString()
      };

      const response = await fetch('/api/calligraphy/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(saveData)
      });

      const data = await response.json();
      
      if (response.ok) {
        this.showToast('保存成功！', 'success');
      } else {
        throw new Error(data.error || '保存失败');
      }
    } catch (error) {
      console.error('保存错误:', error);
      this.showToast('保存失败: ' + error.message, 'error');
    } finally {
      this.showLoading(false);
    }
  }

  // 显示/隐藏加载提示
  showLoading(show) {
    this.loadingOverlay.style.display = show ? 'flex' : 'none';
  }

  // 显示提示消息
  showToast(message, type = 'info') {
    this.toast.textContent = message;
    this.toast.className = `toast ${type} show`;
    
    setTimeout(() => {
      this.toast.classList.remove('show');
    }, 3000);
  }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
  const app = new ReadPostApp();

  // 自动识别 img 参数并加载图片
  const params = new URLSearchParams(window.location.search);
  const imgParam = params.get('img');
  if (imgParam) {
    // 支持 base64 或图片 URL
    const src = decodeURIComponent(imgParam);
    // 判断是否为 base64
    if (src.startsWith('data:image/')) {
      // base64 -> File（带文件名和类型）
      const arr = src.split(',');
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      // File 构造，文件名为 image.png
      const file = new File([u8arr], 'image.png', { type: mime });
      app.loadImage(file);
    } else {
      // 普通 URL，fetch 后转 File
      fetch(src)
        .then(res => res.blob())
        .then(blob => {
          // 尝试获取 MIME 类型
          const mime = blob.type || 'image/png';
          // File 构造，文件名为 image.png
          const file = new File([blob], 'image.png', { type: mime });
          app.loadImage(file);
        })
        .catch(() => {
          app.showToast('图片加载失败', 'error');
        });
    }
  }
});
