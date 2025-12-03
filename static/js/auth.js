/**
 * 认证页面交互逻辑
 */

document.addEventListener('DOMContentLoaded', () => {
  // 登录/注册标签切换
  initTabSwitch();

  // 登录模式切换（密码/验证码）
  initLoginModeSwitch();

  // 密码显示/隐藏切换
  initPasswordToggle();

  // 验证码发送
  initSendCode();

  // 表单提交
  initFormSubmit();
});

/**
 * 登录/注册标签切换
 */
function initTabSwitch() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;

      // 更新按钮状态
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // 切换表单显示
      if (tab === 'login') {
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
      } else {
        loginForm.classList.remove('active');
        registerForm.classList.add('active');
      }
    });
  });
}

/**
 * 登录模式切换（密码/验证码）
 */
function initLoginModeSwitch() {
  const modeBtns = document.querySelectorAll('.mode-btn');
  const passwordForm = document.getElementById('password-login-form');
  const smsForm = document.getElementById('sms-login-form');

  modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;

      // 更新按钮状态
      modeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // 切换表单显示
      if (mode === 'password') {
        passwordForm.classList.add('active');
        smsForm.classList.remove('active');
      } else {
        passwordForm.classList.remove('active');
        smsForm.classList.add('active');
      }
    });
  });
}

/**
 * 密码显示/隐藏切换
 */
function initPasswordToggle() {
  const toggleBtns = document.querySelectorAll('.toggle-password');

  toggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.parentElement.querySelector('input');
      const isPassword = input.type === 'password';

      // 切换输入框类型
      input.type = isPassword ? 'text' : 'password';

      // 更新图标
      btn.innerHTML = isPassword
        ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
             <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
             <circle cx="12" cy="12" r="3"></circle>
             <line x1="3" y1="3" x2="21" y2="21"></line>
           </svg>`
        : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
             <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
             <circle cx="12" cy="12" r="3"></circle>
           </svg>`;

      // 更新 aria-label
      btn.setAttribute('aria-label', isPassword ? '隐藏密码' : '显示密码');
    });
  });
}

/**
 * 验证码发送
 */
function initSendCode() {
  const sendCodeBtns = document.querySelectorAll('.btn-send-code');

  sendCodeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // 获取关联的手机号输入框
      const form = btn.closest('form');
      const phoneInput = form.querySelector('input[type="tel"]');
      const phone = phoneInput.value.trim();

      // 验证手机号
      if (!phone) {
        showMessage('请输入手机号', 'error');
        phoneInput.focus();
        return;
      }

      if (!/^1[3-9]\d{9}$/.test(phone)) {
        showMessage('请输入正确的手机号', 'error');
        phoneInput.focus();
        return;
      }

      // 发送验证码（这里模拟发送）
      sendVerificationCode(btn, phone);
    });
  });
}

/**
 * 发送验证码（模拟）
 */
function sendVerificationCode(btn, phone) {
  // 禁用按钮
  btn.disabled = true;

  // 模拟 API 调用
  setTimeout(() => {
    showMessage('验证码已发送至 ' + phone, 'success');

    // 倒计时
    let countdown = 60;
    btn.textContent = `${countdown}秒后重试`;

    const timer = setInterval(() => {
      countdown--;
      if (countdown > 0) {
        btn.textContent = `${countdown}秒后重试`;
      } else {
        clearInterval(timer);
        btn.textContent = '获取验证码';
        btn.disabled = false;
      }
    }, 1000);
  }, 500);

  // TODO: 实际项目中应该调用后端 API
  // fetch('/api/auth/send-code', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ phone })
  // })
  // .then(response => response.json())
  // .then(data => {
  //   if (data.success) {
  //     showMessage('验证码已发送', 'success');
  //     // 开始倒计时...
  //   } else {
  //     showMessage(data.message || '发送失败', 'error');
  //     btn.disabled = false;
  //   }
  // })
  // .catch(error => {
  //   showMessage('网络错误，请重试', 'error');
  //   btn.disabled = false;
  // });
}

/**
 * 表单提交
 */
function initFormSubmit() {
  const passwordLoginForm = document.getElementById('password-login-form');
  const smsLoginForm = document.getElementById('sms-login-form');
  const registerForm = document.querySelector('#register-form .auth-form');

  // 密码登录
  if (passwordLoginForm) {
    passwordLoginForm.addEventListener('submit', handlePasswordLogin);
  }

  // 验证码登录
  if (smsLoginForm) {
    smsLoginForm.addEventListener('submit', handleSmsLogin);
  }

  // 注册
  if (registerForm) {
    registerForm.addEventListener('submit', handleRegister);
  }
}

/**
 * 处理密码登录
 */
function handlePasswordLogin(e) {
  e.preventDefault();

  const formData = new FormData(e.target);
  const username = formData.get('username').trim();
  const password = formData.get('password');
  const remember = formData.get('remember') === 'on';

  // 表单验证
  if (!username) {
    showMessage('请输入用户名、手机号或邮箱', 'error');
    return;
  }

  if (!password) {
    showMessage('请输入密码', 'error');
    return;
  }

  // 模拟登录
  showMessage('登录中...', 'info');

  setTimeout(() => {
    // TODO: 实际项目中应该调用后端 API
    // 这里模拟登录成功
    showMessage('登录成功！', 'success');

    // 跳转到首页
    setTimeout(() => {
      window.location.href = '/';
    }, 1000);
  }, 1000);

  // TODO: 实际项目中的 API 调用
  // fetch('/api/auth/login', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ username, password, remember })
  // })
  // .then(response => response.json())
  // .then(data => {
  //   if (data.success) {
  //     showMessage('登录成功！', 'success');
  //     localStorage.setItem('token', data.token);
  //     localStorage.setItem('user', JSON.stringify(data.user));
  //     setTimeout(() => {
  //       window.location.href = '/';
  //     }, 1000);
  //   } else {
  //     showMessage(data.message || '登录失败', 'error');
  //   }
  // })
  // .catch(error => {
  //   showMessage('网络错误，请重试', 'error');
  // });
}

/**
 * 处理验证码登录
 */
function handleSmsLogin(e) {
  e.preventDefault();

  const formData = new FormData(e.target);
  const phone = formData.get('phone').trim();
  const code = formData.get('code').trim();

  // 表单验证
  if (!phone) {
    showMessage('请输入手机号', 'error');
    return;
  }

  if (!/^1[3-9]\d{9}$/.test(phone)) {
    showMessage('请输入正确的手机号', 'error');
    return;
  }

  if (!code) {
    showMessage('请输入验证码', 'error');
    return;
  }

  if (!/^\d{6}$/.test(code)) {
    showMessage('请输入6位验证码', 'error');
    return;
  }

  // 模拟登录
  showMessage('登录中...', 'info');

  setTimeout(() => {
    showMessage('登录成功！', 'success');
    setTimeout(() => {
      window.location.href = '/';
    }, 1000);
  }, 1000);

  // TODO: 实际 API 调用同上
}

/**
 * 处理注册
 */
function handleRegister(e) {
  e.preventDefault();

  const formData = new FormData(e.target);
  const username = formData.get('username').trim();
  const phone = formData.get('phone').trim();
  const code = formData.get('code').trim();
  const email = formData.get('email').trim();
  const password = formData.get('password');
  const passwordConfirm = formData.get('password_confirm');
  const agree = formData.get('agree') === 'on';

  // 表单验证
  if (!username) {
    showMessage('请输入用户名', 'error');
    return;
  }

  if (username.length < 3 || username.length > 20) {
    showMessage('用户名长度应在3-20个字符之间', 'error');
    return;
  }

  if (!phone) {
    showMessage('请输入手机号', 'error');
    return;
  }

  if (!/^1[3-9]\d{9}$/.test(phone)) {
    showMessage('请输入正确的手机号', 'error');
    return;
  }

  if (!code) {
    showMessage('请输入验证码', 'error');
    return;
  }

  if (!/^\d{6}$/.test(code)) {
    showMessage('请输入6位验证码', 'error');
    return;
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showMessage('请输入正确的邮箱地址', 'error');
    return;
  }

  if (!password) {
    showMessage('请输入密码', 'error');
    return;
  }

  if (password.length < 6) {
    showMessage('密码长度至少为6个字符', 'error');
    return;
  }

  if (password !== passwordConfirm) {
    showMessage('两次输入的密码不一致', 'error');
    return;
  }

  if (!agree) {
    showMessage('请阅读并同意用户协议和隐私政策', 'error');
    return;
  }

  // 模拟注册
  showMessage('注册中...', 'info');

  setTimeout(() => {
    showMessage('注册成功！即将跳转到登录页面...', 'success');

    // 切换到登录标签
    setTimeout(() => {
      const loginTab = document.querySelector('.tab-btn[data-tab="login"]');
      if (loginTab) {
        loginTab.click();
      }
    }, 1500);
  }, 1000);

  // TODO: 实际 API 调用
  // fetch('/api/auth/register', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ username, phone, code, email, password })
  // })
  // .then(response => response.json())
  // .then(data => {
  //   if (data.success) {
  //     showMessage('注册成功！', 'success');
  //     setTimeout(() => {
  //       // 切换到登录标签
  //       document.querySelector('.tab-btn[data-tab="login"]').click();
  //     }, 1500);
  //   } else {
  //     showMessage(data.message || '注册失败', 'error');
  //   }
  // })
  // .catch(error => {
  //   showMessage('网络错误，请重试', 'error');
  // });
}

/**
 * 显示提示消息
 */
function showMessage(message, type = 'info') {
  // 创建消息元素
  const messageEl = document.createElement('div');
  messageEl.className = `message message-${type}`;
  messageEl.textContent = message;

  // 添加样式
  Object.assign(messageEl.style, {
    position: 'fixed',
    top: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '12px 24px',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '600',
    zIndex: '9999',
    opacity: '0',
    transition: 'opacity 0.3s ease',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
  });

  // 根据类型设置背景色
  const colors = {
    success: '#52c41a',
    error: '#ff4d4f',
    warning: '#faad14',
    info: '#1890ff'
  };
  messageEl.style.background = colors[type] || colors.info;

  // 添加到页面
  document.body.appendChild(messageEl);

  // 显示动画
  setTimeout(() => {
    messageEl.style.opacity = '1';
  }, 10);

  // 自动隐藏
  setTimeout(() => {
    messageEl.style.opacity = '0';
    setTimeout(() => {
      document.body.removeChild(messageEl);
    }, 300);
  }, 3000);
}
