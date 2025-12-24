# iCalligraphy 前端项目

使用原生 HTML + CSS + JavaScript 制作的 iCalligraphy 书法学习平台前端

## 项目结构

```
Frontend-HTML/
├── templates/              # HTML 模板文件
│   ├── base.html               # 基础模板（公共头部、导航）
│   ├── index.html              # 首页
│   ├── auth.html               # 登录/注册页
│   ├── profile.html            # 个人中心
│   ├── search.html             # 书法检索页
│   ├── work_detail.html        # 作品详情页
│   ├── work_upload.html        # 作品上传页
│   ├── read_post.html          # 读帖功能页
│   ├── my_collections.html     # 我的字集
│   ├── community.html          # 社区动态
│   ├── follow.html             # 关注/粉丝列表
│   ├── notifications.html      # 消息通知
│   ├── topics.html             # 话题页面
│   └── review_center.html      # 审核中心
│
├── static/                 # 静态资源
│   ├── css/                    # 样式文件
│   │   ├── main.css                # 全局样式
│   │   ├── auth.css                # 登录注册样式
│   │   ├── profile.css             # 个人中心样式
│   │   ├── search.css              # 检索页基础样式
│   │   ├── search-layout.css       # 检索页布局
│   │   ├── search-cards.css        # 检索页卡片样式
│   │   ├── search-modal.css        # 检索页弹窗样式
│   │   ├── work_detail.css         # 作品详情样式
│   │   ├── work_detail_page.css    # 作品详情页面样式
│   │   ├── work_upload.css         # 作品上传样式
│   │   ├── read_post.css           # 读帖页面样式
│   │   ├── my_collections.css      # 字集页面样式
│   │   ├── community.css           # 社区样式
│   │   ├── follow.css              # 关注页面样式
│   │   ├── notifications.css       # 通知页面样式
│   │   └── topics.css              # 话题页面样式
│   │
│   ├── js/                     # JavaScript 文件
│   │   ├── main.js                 # 首页交互逻辑
│   │   ├── auth.js                 # 登录注册逻辑
│   │   ├── profile.js              # 个人中心逻辑
│   │   ├── search.js               # 书法检索（含热门搜索、搜索候选）
│   │   ├── work_detail.js          # 作品详情（含评论、点赞）
│   │   ├── work_upload.js          # 作品上传逻辑
│   │   ├── read_post.js            # 读帖功能逻辑
│   │   ├── my_collections.js       # 字集管理逻辑
│   │   ├── community.js            # 社区功能（帖子、评论、删除）
│   │   ├── follow.js               # 关注/粉丝逻辑
│   │   ├── notifications.js        # 通知消息逻辑
│   │   ├── topics.js               # 话题功能逻辑
│   │   ├── api_mock.js             # API 模拟数据
│   │   └── work_data.js            # 作品数据处理
│   │
│   └── images/                 # 图片资源
│
└── Docs/                   # 前端文档
    ├── 代码规范.md
    └── 新项目规划前端页面与功能.md
```

## 功能模块

### ✅ 已完成功能

| 模块 | 功能 | 说明 |
|------|------|------|
| **用户认证** | 登录/注册 | 支持邮箱验证码，JWT Token 认证 |
| **首页** | 作品展示 | 动态加载书法作品列表 |
| **书法检索** | 搜索功能 | 支持作品名/作者搜索、热门搜索词、搜索候选 |
| **作品详情** | 详情展示 | 作品介绍、风格中文显示、单字列表、评论系统 |
| **读帖功能** | 智能分析 | 单字读帖、AI智能分析 |
| **作品上传** | 上传作品 | 上传成功后自动跳转 |
| **字集管理** | 收藏管理 | 创建字集、添加/删除单字、批量操作 |
| **个人中心** | 用户信息 | 查看个人作品、粉丝/关注列表 |
| **社区** | 帖子互动 | 发帖、评论、点赞、删除帖子/评论 |
| **通知系统** | 消息提醒 | 系统通知、互动消息 |

### 近期修复内容

根据 `problem.md` 记录，近期主要修复和优化：

- **作品上传**：上传成功后自动跳转
- **读帖功能**：优化智能分析提示
- **注册流程**：优化验证码提示
- **个人中心**：清理多余按钮（设置、退出登录）
- **粉丝列表**：修复API响应字段不匹配问题
- **字集管理**：创建后自动刷新、单字删除功能
- **社区功能**：帖子/评论删除功能、点赞修复
- **作品详情**：添加作品介绍、风格中文显示、图片加载优化
- **检索功能**：单字图片显示修复、热门搜索、搜索候选、样式美化

## 运行方式

### 推荐方式（通过后端启动）

```bash
# 1. 进入后端目录
cd Backend

# 2. 激活 conda 环境
conda activate calli

# 3. 启动后端服务
python app.py

# 4. 访问前端页面
# http://localhost:5000
```

### 静态预览（仅查看页面）

直接用浏览器打开 `templates/index.html`（功能受限，无法与后端交互）

## API 端点

前端对接的后端 API（详见 `../Backend/README.md`）：

| 端点 | 功能 |
|------|------|
| `/api/auth` | 用户认证（登录、注册） |
| `/api/works` | 作品管理（上传、查询、详情） |
| `/api/users` | 用户管理（个人信息、关注） |
| `/api/comments` | 作品评论管理 |
| `/api/post-comments` | 帖子评论管理 |
| `/api/collections` | 字集管理 |
| `/api/posts` | 社区帖子管理 |
| `/api/calligraphy/search` | 书法检索 |
| `/api/calligraphy/hot-keywords` | 热门搜索词 |

## 技术栈

- **HTML/CSS/JavaScript**：原生实现，无前端框架
- **模板引擎**：Flask Jinja2（后端渲染）
- **HTTP 请求**：Fetch API
- **数据存储**：LocalStorage（Token 和用户信息）
- **认证方式**：JWT Token

## 相关文档

- [后端 README](../Backend/README.md)
- [代码规范](Docs/代码规范.md)
- [页面规划](Docs/新项目规划前端页面与功能.md)

## License

MIT