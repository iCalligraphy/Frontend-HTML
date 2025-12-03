/**
 * 意见反馈页交互脚本
 */

class FeedbackManager {
  constructor() {
    this.feedbackData = {
      type: '',
      title: '',
      content: '',
      contact: '',
      attachments: []
    };
    this.init();
  }

  init() {
    // 初始化社区导航
    this.initCommunityNav();

    this.initTypeSelection();
    this.initFormValidation();
    this.initFileUpload();
    this.initSubmitButton();
    this.initCancelButton();
    this.loadDraft();

    // 检查本地存储中的通知徽章
    this.loadNotificationBadge();
  }

  /**
   * 初始化社区导航
   */
  initCommunityNav() {
    // 高亮当前页面 - 只高亮当前页面
    const navTabs = document.querySelectorAll('.feedback-page .nav-tab');
    navTabs.forEach(tab => {
      const href = tab.getAttribute('href');
      // 精确匹配当前页面路径
      if (href === '/community/feedback' && window.location.pathname === '/community/feedback') {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
  }

  /**
   * 加载通知徽章
   */
  loadNotificationBadge() {
    try {
      const notifications = JSON.parse(localStorage.getItem('userNotifications') || '[]');
      const unreadCount = notifications.filter(n => !n.read).length;
      const badge = document.getElementById('navNotificationBadge');
      
      if (badge && unreadCount > 0) {
        badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
        badge.style.display = 'flex';
      }
    } catch (error) {
      console.log('加载通知数据失败:', error);
    }
  }

  /**
   * 初始化反馈类型选择
   */
  initTypeSelection() {
    const typeBtns = document.querySelectorAll('.feedback-type-btn');
    
    typeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        // 移除其他按钮的active状态
        typeBtns.forEach(b => b.classList.remove('active'));
        // 添加当前按钮的active状态
        btn.classList.add('active');
        
        const type = btn.dataset.type;
        this.feedbackData.type = type;
        
        // 自动填充标题建议
        this.suggestTitle(type);
        
        // 保存草稿
        this.saveDraft();
      });
    });
  }

  /**
   * 根据类型建议标题
   */
  suggestTitle(type) {
    const titleInput = document.getElementById('feedbackTitle');
    if (!titleInput || titleInput.value.trim()) return;
    
    const suggestions = {
      'feature': '功能建议：',
      'bug': '问题反馈：',
      'content': '内容举报：',
      'other': '其他反馈：'
    };
    
    if (suggestions[type]) {
      titleInput.placeholder = suggestions[type];
      titleInput.focus();
    }
  }

  /**
   * 初始化表单验证
   */
  initFormValidation() {
    const titleInput = document.getElementById('feedbackTitle');
    const contentInput = document.getElementById('feedbackContent');
    const contactInput = document.getElementById('feedbackContact');
    
    if (titleInput) {
      titleInput.addEventListener('input', () => {
        this.feedbackData.title = titleInput.value.trim();
        this.saveDraft();
      });
    }
    
    if (contentInput) {
      contentInput.addEventListener('input', () => {
        this.feedbackData.content = contentInput.value.trim();
        this.saveDraft();
        
        // 更新字符计数
        const charCount = document.getElementById('charCount');
        if (charCount) {
          const length = contentInput.value.length;
          charCount.textContent = length;
          if (length > 490) {
            charCount.style.color = '#c84b31';
          } else {
            charCount.style.color = '';
          }
        }
      });
    }
    
    if (contactInput) {
      contactInput.addEventListener('input', () => {
        this.feedbackData.contact = contactInput.value.trim();
        this.saveDraft();
      });
    }
  }

  /**
   * 初始化文件上传 - 参考 work_upload.js 的实现
   */
  initFileUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('feedbackFiles');
    
    if (!uploadArea || !fileInput) return;
    
    // 点击选择图片 - 参考 work_upload.js 的实现
    uploadArea.addEventListener('click', (e) => {
      // 允许点击整个区域触发文件选择
      if (e.target === uploadArea || e.target.closest('.upload-icon') || 
          e.target.closest('.upload-text') || e.target.closest('.upload-hint')) {
        fileInput.click();
      }
    });
    
    // 拖拽上传
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = 'var(--theme-brown)';
      uploadArea.style.background = 'rgba(139, 69, 19, 0.05)';
    });
    
    uploadArea.addEventListener('dragleave', () => {
      uploadArea.style.borderColor = '';
      uploadArea.style.background = '';
    });
    
    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = '';
      uploadArea.style.background = '';
      
      const files = e.dataTransfer.files;
      this.handleFiles(files);
    });
    
    // 文件选择 - 参考 work_upload.js 的直接触发
    fileInput.addEventListener('change', (e) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        this.handleFiles(files);
      }
    });
  }

  /**
   * 处理上传文件
   */
  handleFiles(files) {
    if (!files || !files.length) return;
    
    const maxSize = 10 * 1024 * 1024; // 10MB
    const maxFiles = 5;
    
    // 检查文件数量
    if (this.feedbackData.attachments.length + files.length > maxFiles) {
      this.showToast(`最多只能上传 ${maxFiles} 个文件`, 'error');
      return;
    }
    
    const newFiles = [];
    
    Array.from(files).forEach(file => {
      // 检查文件大小
      if (file.size > maxSize) {
        this.showToast(`文件 ${file.name} 超过10MB限制`, 'error');
        return;
      }
      
      // 检查文件类型
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        this.showToast(`不支持的文件类型: ${file.type}`, 'error');
        return;
      }
      
      // 检查是否已存在相同文件
      const isDuplicate = this.feedbackData.attachments.some(
        attachment => attachment.name === file.name && attachment.size === this.formatFileSize(file.size)
      );
      
      if (isDuplicate) {
        this.showToast(`文件 ${file.name} 已存在`, 'warning');
        return;
      }
      
      // 添加到新文件列表
      newFiles.push({
        name: file.name,
        size: this.formatFileSize(file.size),
        type: file.type,
        file: file,
        id: Date.now() + Math.random() // 生成唯一ID
      });
    });
    
    if (newFiles.length > 0) {
      this.feedbackData.attachments.push(...newFiles);
      this.saveDraft();
      this.renderUploadedFiles();
      this.showToast(`成功添加 ${newFiles.length} 个文件`, 'success');
    }
  }

  /**
   * 渲染已上传文件列表
   */
  renderUploadedFiles() {
    const container = document.getElementById('uploadedFiles');
    if (!container) return;
    
    if (this.feedbackData.attachments.length === 0) {
      container.innerHTML = '<div class="no-files">暂无附件</div>';
      return;
    }
    
    container.innerHTML = this.feedbackData.attachments.map((file, index) => `
      <div class="uploaded-file" data-index="${index}">
        <span class="file-icon">${this.getFileIcon(file.type)}</span>
        <div class="file-info">
          <div class="file-name" title="${file.name}">${this.truncateFileName(file.name, 30)}</div>
          <div class="file-size">${file.size}</div>
        </div>
        <button type="button" class="file-remove" data-index="${index}" title="删除文件">×</button>
      </div>
    `).join('');
    
    // 绑定删除事件
    container.querySelectorAll('.file-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const index = parseInt(e.target.dataset.index);
        this.removeFile(index);
      });
    });
  }

  /**
   * 获取文件图标
   */
  getFileIcon(fileType) {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType === 'application/pdf') return '📄';
    return '📎';
  }

  /**
   * 截断文件名
   */
  truncateFileName(filename, maxLength) {
    if (filename.length <= maxLength) return filename;
    const extension = filename.split('.').pop();
    const nameWithoutExt = filename.slice(0, -(extension.length + 1));
    const truncatedName = nameWithoutExt.slice(0, maxLength - extension.length - 4) + '...';
    return `${truncatedName}.${extension}`;
  }

  /**
   * 删除文件
   */
  removeFile(index) {
    if (index >= 0 && index < this.feedbackData.attachments.length) {
      const fileName = this.feedbackData.attachments[index].name;
      this.feedbackData.attachments.splice(index, 1);
      this.saveDraft();
      this.renderUploadedFiles();
      this.showToast(`已删除文件: ${fileName}`, 'info');
    }
  }

  /**
   * 初始化提交按钮
   */
  initSubmitButton() {
    const submitBtn = document.getElementById('submitFeedback');
    if (!submitBtn) return;
    
    submitBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.validateAndSubmit();
    });
  }

  /**
   * 验证并提交表单
   */
  validateAndSubmit() {
    const missingFields = [];
    
    // 检查必填字段
    if (!this.feedbackData.type) {
      missingFields.push('反馈类型');
    }
    
    if (!this.feedbackData.title || this.feedbackData.title.trim() === '') {
      missingFields.push('反馈标题');
    }
    
    if (!this.feedbackData.content || this.feedbackData.content.trim() === '') {
      missingFields.push('详细描述');
    }
    
    // 如果有未填写的必填字段
    if (missingFields.length > 0) {
      const fieldNames = missingFields.join('、');
      this.showToast(`请填写${fieldNames}`, 'error');
      
      // 滚动到第一个缺失的字段
      if (!this.feedbackData.type) {
        const typeSelector = document.querySelector('.feedback-type-selector');
        if (typeSelector) {
          typeSelector.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else if (!this.feedbackData.title) {
        const titleInput = document.getElementById('feedbackTitle');
        if (titleInput) {
          titleInput.focus();
          titleInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else if (!this.feedbackData.content) {
        const contentInput = document.getElementById('feedbackContent');
        if (contentInput) {
          contentInput.focus();
          contentInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      
      return;
    }
    
    // 检查详细描述长度
    if (this.feedbackData.content.length < 10) {
      this.showToast('详细描述至少需要10个字符', 'error');
      const contentInput = document.getElementById('feedbackContent');
      if (contentInput) {
        contentInput.focus();
        contentInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
    // 显示加载状态
    const submitBtn = document.getElementById('submitFeedback');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = '提交中...';
    submitBtn.style.opacity = '0.7';
    
    // 模拟提交到服务器
    setTimeout(() => {
      this.showThankYouPage();
      
      // 清除草稿
      localStorage.removeItem('feedbackDraft');
      
      // 发送成功通知
      this.showToast('反馈提交成功！感谢您的宝贵意见。', 'success');
      
      // 记录用户活动
      this.recordFeedback();
      
      // 如果有社区管理器，记录活动
      if (window.communityManager) {
        window.communityManager.recordUserActivity('feedback_submitted');
      }
      
      // 恢复按钮状态
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
      submitBtn.style.opacity = '1';
    }, 1500);
  }

  /**
   * 初始化取消按钮
   */
  initCancelButton() {
    const cancelBtn = document.getElementById('cancelFeedback');
    if (!cancelBtn) return;
    
    cancelBtn.addEventListener('click', (e) => {
      e.preventDefault();
      
      // 检查是否有未保存的内容
      const hasUnsavedChanges = this.feedbackData.type || 
                                this.feedbackData.title || 
                                this.feedbackData.content || 
                                this.feedbackData.contact || 
                                this.feedbackData.attachments.length > 0;
      
      if (hasUnsavedChanges) {
        const confirmLeave = confirm('您有未提交的内容，确定要放弃并返回社区首页吗？');
        if (!confirmLeave) return;
      }
      
      // 清除草稿
      localStorage.removeItem('feedbackDraft');
      
      // 返回社区首页
      window.location.href = '/community';
    });
  }

  /**
   * 显示感谢页面
   */
  showThankYouPage() {
    const formCard = document.querySelector('.feedback-card');
    if (!formCard) return;
    
    // 动画效果
    formCard.style.opacity = '0';
    formCard.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
      formCard.innerHTML = `
        <div class="thank-you-page">
          <div class="thank-you-icon">✓</div>
          <h2>感谢您的反馈！</h2>
          <p>我们已经收到您的宝贵意见。我们的团队会认真阅读每一条反馈，并努力改进产品体验。</p>
          <div class="form-buttons">
            <button id="backToCommunity" class="btn-submit">返回社区</button>
            <button id="submitAnother" class="btn-cancel">提交另一个反馈</button>
          </div>
        </div>
      `;
      
      // 添加动画
      formCard.style.transition = 'all 0.5s ease';
      formCard.style.opacity = '1';
      formCard.style.transform = 'translateY(0)';
      
      // 绑定按钮事件
      document.getElementById('backToCommunity').addEventListener('click', () => {
        window.location.href = '/community';
      });
      
      document.getElementById('submitAnother').addEventListener('click', () => {
        window.location.reload();
      });
    }, 300);
  }

  /**
   * 保存草稿
   */
  saveDraft() {
    const draft = {
      ...this.feedbackData,
      timestamp: Date.now(),
      // 移除 file 对象，因为不能直接存储在 localStorage 中
      attachments: this.feedbackData.attachments.map(att => ({
        name: att.name,
        size: att.size,
        type: att.type,
        id: att.id
      }))
    };
    
    try {
      localStorage.setItem('feedbackDraft', JSON.stringify(draft));
    } catch (error) {
      console.log('保存草稿失败:', error);
    }
  }

  /**
   * 加载草稿
   */
  loadDraft() {
    try {
      const draftStr = localStorage.getItem('feedbackDraft');
      if (!draftStr) return;
      
      const draft = JSON.parse(draftStr);
      
      // 检查草稿是否过期（24小时）
      const hoursPassed = (Date.now() - draft.timestamp) / (1000 * 60 * 60);
      if (hoursPassed > 24) {
        localStorage.removeItem('feedbackDraft');
        return;
      }
      
      this.feedbackData = {
        ...draft,
        attachments: draft.attachments || []
      };
      
      // 恢复表单数据
      const titleInput = document.getElementById('feedbackTitle');
      const contentInput = document.getElementById('feedbackContent');
      const contactInput = document.getElementById('feedbackContact');
      
      if (titleInput) titleInput.value = draft.title || '';
      if (contentInput) contentInput.value = draft.content || '';
      if (contactInput) contactInput.value = draft.contact || '';
      
      // 恢复类型选择
      if (draft.type) {
        const typeBtn = document.querySelector(`.feedback-type-btn[data-type="${draft.type}"]`);
        if (typeBtn) {
          typeBtn.classList.add('active');
          this.suggestTitle(draft.type);
        }
      }
      
      this.renderUploadedFiles();
      
      // 恢复字符计数
      if (contentInput) {
        const charCount = document.getElementById('charCount');
        if (charCount) {
          charCount.textContent = contentInput.value.length;
        }
      }
      
    } catch (error) {
      console.log('加载草稿失败:', error);
      localStorage.removeItem('feedbackDraft');
    }
  }

  /**
   * 记录反馈活动
   */
  recordFeedback() {
    try {
      const feedbackLog = {
        type: this.feedbackData.type,
        title: this.feedbackData.title,
        contentLength: this.feedbackData.content.length,
        hasAttachments: this.feedbackData.attachments.length > 0,
        timestamp: new Date().toISOString()
      };
      
      // 保存到本地存储（实际应用中应该发送到服务器）
      const feedbackHistory = JSON.parse(localStorage.getItem('feedbackHistory') || '[]');
      feedbackHistory.unshift(feedbackLog);
      localStorage.setItem('feedbackHistory', JSON.stringify(feedbackHistory.slice(0, 50))); // 保留最近50条
      
      console.log('反馈记录:', feedbackLog);
    } catch (error) {
      console.log('记录反馈失败:', error);
    }
  }

  /**
   * 格式化文件大小
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 显示提示消息
   */
  showToast(message, type = 'info') {
    // 移除之前的toast
    const existingToast = document.getElementById('feedbackToast');
    if (existingToast) {
      existingToast.remove();
    }
    
    // 创建新的toast
    const toast = document.createElement('div');
    toast.id = 'feedbackToast';
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    // 添加样式
    Object.assign(toast.style, {
      position: 'fixed',
      top: '80px',
      right: '20px',
      background: type === 'error' ? '#c84b31' : 
                  type === 'success' ? '#4a7c59' : 
                  type === 'warning' ? '#f0ad4e' : 'var(--theme-brown)',
      color: '#fff',
      padding: '12px 24px',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500',
      zIndex: '10000',
      opacity: '0',
      transform: 'translateX(100%)',
      transition: 'all 0.3s ease',
      maxWidth: '300px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
    });
    
    document.body.appendChild(toast);
    
    // 显示动画
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(0)';
    });
    
    // 自动隐藏
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      
      setTimeout(() => {
        if (toast.parentNode) {
          toast.remove();
        }
      }, 300);
    }, 3000);
  }
}

// 初始化反馈管理器
document.addEventListener('DOMContentLoaded', () => {
  window.feedbackManager = new FeedbackManager();
});