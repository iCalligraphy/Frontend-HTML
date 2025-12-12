# iCalligraphy 前端项目

使用基础 HTML + CSS + JavaScript 制作的 iCalligraphy 前端页面

## 项目结构

```
Frontend-HTML/
├── templates/          # HTML 模板文件
│   ├── auth.html           # 登录/注册页
│   ├── base.html           # 基础模板
│   ├── community.html      # 社区页面
│   ├── index.html          # 首页
│   ├── my_collections.html # 我的字集
│   ├── profile.html        # 个人中心
│   ├── read_post.html      # 帖子阅读页
│   ├── review_center.html  # 审核中心
│   ├── search.html         # 检索页面
│   ├── work_detail.html    # 作品详情
│   └── work_upload.html    # 作品上传页
│
├── static/             # 静态资源
│   ├── css/               # 样式文件
│   │   ├── main.css
│   │   ├── auth.css
│   │   ├── community.css
│   │   ├── my_collections.css
│   │   ├── work_upload.css
│   │   └── work_detail.css
│   │
│   └── js/                # JavaScript 文件
│       ├── api.js            # API请求封装
│       ├── auth.js           # 认证逻辑
│       ├── community.js      # 社区功能
│       ├── main.js           # 主页交互
│       ├── my_collections.js # 字集管理
│       ├── posts.js          # 帖子相关功能
│       ├── work_detail.js    # 作品详情
│       └── work_upload.js    # 作品上传
│
└── Docs/               # 前端文档
```

## 当前状态说明

### ✅ 开发完成状态

本项目目前处于**前后端整合阶段**，主要特点：

1. **完整界面实现**
   - 所有页面 UI 已按设计稿完成开发
   - 交互逻辑已实现，包括表单验证、页面跳转和数据展示
   - 使用 LocalStorage 存储用户会话信息

2. **后端 API 接入准备**
   - JavaScript 中已预留 API 调用接口（见 `static/js/api.js`）
   - 与后端 API 接口规范已对齐（详见 `../Backend/README.md`）
   - 认证机制已实现，支持 JWT Token 存储和传递

3. **运行方式**
   - 通过后端 Flask 应用渲染模板（推荐）：运行后端后访问 http://localhost:5000
   - 静态页面预览：直接打开 `templates/index.html` 文件

## 开发指南

### API 集成状态

所有前端页面已完成与后端 API 的集成，主要接口包括：

- **认证相关**：登录、注册、个人信息管理
- **作品相关**：上传、查询、点赞、收藏
- **帖子相关**：发布、阅读、评论
- **社区互动**：评论、点赞、关注

API 请求统一通过 `static/js/api.js` 处理，已实现 Token 管理、错误处理和请求拦截。

### 如何运行项目

1. 首先启动后端服务（详见 `../Backend/README.md`）
2. 后端服务会自动提供前端页面
3. 访问 http://localhost:5000 即可使用系统

### 测试账号

- 管理员: `admin` / `admin123`
- 普通用户: `testuser` / `test123`

## 文档链接

- [代码规范](Docs/代码规范.md)
- [页面规划](Docs/新项目规划前端页面与功能.md)

后端提供以下 API 端点（详见 `../Backend/README.md`）：

```
/api/auth          # 用户认证（登录、注册）
/api/works         # 作品管理（上传、查询、审核）
/api/users         # 用户管理（个人信息、关注）
/api/comments      # 评论管理
/api/collections   # 字集管理
```



}

// 使用示例
const data = await apiRequest('/api/works', {
  method: 'POST',
  body: JSON.stringify({ title: '新作品' })
});
```

### 第四步：替换静态数据

将 HTML 中的硬编码数据移除，改为动态加载：

**修改前（`templates/index.html`）：**
```html
<div class="works-grid">
  <article class="work-card">
    <div class="thumb"></div>
    <div class="work-info">
      <h4>兰亭集序</h4>
      <p class="meta">作者：王羲之 · 风格：行书 · 字数：324</p>
    </div>
  </article>
  <!-- 更多硬编码的作品卡片... -->
</div>
```

**修改后：**
```html
<div class="works-grid">
  <!-- 动态加载的内容将插入这里 -->
</div>

<script>
  // 页面加载时获取数据
  document.addEventListener('DOMContentLoaded', () => {
    loadWorks();
  });
</script>
```

### 第五步：测试接口联调

1. 启动后端服务：
```bash
cd Backend
python app.py
```

2. 访问前端页面：
```
http://localhost:5000
```

3. 检查浏览器控制台的网络请求是否正常

4. 确认数据是否正确显示

## 需要接入 API 的文件清单

以下文件包含被注释的 API 调用代码，需要逐一启用：

| 文件 | 功能 | 需要接入的 API |
|------|------|---------------|
| `static/js/auth.js` | 登录/注册 | `/api/auth/login`<br>`/api/auth/register`<br>`/api/auth/send-code` |
| `static/js/main.js` | 作品列表 | `/api/works` (GET) |
| `static/js/work_detail.js` | 作品详情 | `/api/works/{id}`<br>`/api/comments` |
| `static/js/work_upload.js` | 作品上传 | `/api/works` (POST) |
| `static/js/my_collections.js` | 字集管理 | `/api/collections` |
| `static/js/community.js` | 社区功能 | `/api/posts`（需后端新增） |

## 常见问题

### Q1: 跨域问题（CORS）
后端已配置 CORS，默认允许所有来源。生产环境需要在 `Backend/config.py` 中修改：

```python
CORS_ORIGINS = ['http://localhost:5000']  # 仅允许特定域名
```

### Q2: 文件上传
文件上传需要使用 `FormData`：

```javascript
const formData = new FormData();
formData.append('image', fileInput.files[0]);
formData.append('title', '作品标题');

fetch('/api/works', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData  // 不要设置 Content-Type，浏览器会自动处理
});
```

### Q3: Token 过期处理
后端 Token 默认有效期为 24 小时，过期后需要重新登录。建议添加全局错误处理。

## 开发建议

1. **先接入认证模块**：登录/注册是其他功能的基础
2. **逐步接入功能**：建议按页面顺序逐个接入，便于调试
3. **添加加载状态**：API 请求时显示加载动画，提升用户体验
4. **错误处理**：完善错误提示，处理网络异常和业务错误
5. **数据验证**：前端也要做基本的数据验证，减轻后端压力

## 相关文档

- [后端 API 文档](../Backend/README.md)
- [前端页面规划](Docs/新项目规划前端页面与功能.md)
- [代码规范](Docs/代码规范.md)

## 技术栈

- **无框架**：使用原生 HTML/CSS/JavaScript
- **模板引擎**：Flask Jinja2（后端渲染 HTML）
- **HTTP 请求**：Fetch API
- **数据存储**：LocalStorage（临时存储 Token 和用户信息）

## License

MIT