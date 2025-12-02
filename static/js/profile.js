document.addEventListener('DOMContentLoaded', async () => {
  const avatarInput = document.getElementById('avatarInput');
  const changeAvatarBtn = document.getElementById('changeAvatarBtn');
  const userAvatar = document.getElementById('userAvatar');

  // 更换头像
  changeAvatarBtn.addEventListener('click', () => avatarInput.click());
  avatarInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => userAvatar.src = reader.result;
      reader.readAsDataURL(file);
    }
  });

  // 获取用户信息
  const userRes = await fetch('/api/user/info');
  const userData = await userRes.json();
  document.getElementById('username').textContent = userData.username;
  document.getElementById('phone').querySelector('span').textContent = userData.phone || '未绑定';
  document.getElementById('role').textContent = `权限：${userData.role}`;

  // 获取作品
  const worksRes = await fetch('/api/user/works');
  const works = await worksRes.json();
  const worksList = document.getElementById('worksList');
  works.forEach(work => {
    const card = document.createElement('div');
    card.className = 'work-card';
    card.innerHTML = `
      <div class="thumb"><img src="${work.thumb}" alt="${work.title}"></div>
      <h4>${work.title}</h4>
      <p>状态：${work.status}</p>
    `;
    worksList.appendChild(card);
  });

  // TODO: 获取字集、草稿箱、互动数据
});
