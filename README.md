<p align="center">
  <img src="src/static/zl.png" alt="知了论坛 Logo" width="120" height="120">
</p>

<h1 align="center">知了论坛</h1>
<p align="center">基于 Uni-App + uView UI 的跨平台社区问答应用</p>

<p align="center">
  <a href="#功能特性">功能特性</a> •
  <a href="#快速开始">快速开始</a> •
  <a href="#项目结构">项目结构</a> •
  <a href="#部署指南">部署指南</a> •
  <a href="#常见问题">常见问题</a>
</p>

---

## 技术栈

| 技术 | 版本 | 说明 |
|:----:|:----:|------|
| Vue.js | 2.6.x | 核心框架 |
| Uni-App | 2.0.2 | 跨平台开发框架 |
| uView UI | 2.0.36 | UI 组件库 |
| Vuex | 3.2.x | 状态管理 |
| flyio | 0.6.x | HTTP 请求库 |
| SCSS | - | CSS 预处理器 |

**支持平台：** H5 · 微信小程序 · APP (Android/iOS)

---

## 功能特性

### 用户体系
- 手机号 + 密码登录
- 微信小程序授权绑定
- 个人资料编辑（头像上传、昵称、简介等）
- 关注 / 取关用户
- 粉丝列表查看
- 私信消息中心

### 帖子模块
- 发布提问（标题、描述、分类选择、悬赏积分）
- 编辑已有帖子
- 帖子详情展示（作者信息、分类标签、解决状态）
- 评论系统（支持一级/二级嵌套评论）
- **评论懒加载**：默认不加载，点击展开后按需渲染
- 点赞评论、采纳最佳回答
- 收藏帖子

### 互动功能
- 每日签到打卡
- 积分充值与余额管理
- 关注动态流

### 性能优化
- 列表分页混入（`listMixin`）统一上拉加载逻辑
- Tab 切换数据缓存，避免重复请求
- 关注/粉丝列表前端去重
- H5 图片路径自动补全

---

## 环境要求

| 工具 | 最低版本 | 说明 |
|:----:|:-------:|------|
| Node.js | >= 14.0 | JavaScript 运行环境 |
| npm | >= 6.0 | 包管理器 |
| HBuilderX | >= 3.6 | 可选，推荐 IDE |
| 微信开发者工具 | 最新版 | 小程序调试 |

---

## 快速开始

```bash
# 1. 克隆仓库
git clone <repository-url>
cd uni-app_wc

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev:h5          # H5 模式
npm run dev:mp-weixin   # 微信小程序模式

# 4. 生产构建
npm run build:h5        # H5 构建
npm run build:mp-weixin # 小程序构建
```

### 可用脚本

| 命令 | 说明 |
|:-----|:-----|
| `npm run dev:h5` | H5 开发模式 |
| `npm run dev:mp-weixin` | 微信小程序开发 |
| `npm run dev:app-plus` | APP 开发 |
| `npm run dev:mp-alipay` | 支付宝小程序开发 |
| `npm run build:h5` | H5 生产构建 |
| `npm run build:mp-weixin` | 小程序生产构建 |

---

## 项目结构

```
uni-app_wc/
├── public/
│   ├── index.html              # H5 入口模板
│   └── .htaccess               # Apache URL 重写规则
├── src/
│   ├── components/             # 公共组件
│   │   ├── comment/comment.vue # 评论组件（递归嵌套）
│   │   ├── calendar/j-calendar.vue    # 日历签到组件
│   │   ├── pick-regions/       # 地区选择器
│   │   └── PostItem.vue        # 帖子卡片组件
│   ├── pages/
│   │   ├── index/index.vue     # 首页（帖子列表 + 分类Tab）
│   │   ├── post/
│   │   │   ├── add.vue         # 发布提问
│   │   │   ├── edit.vue        # 编辑提问
│   │   │   └── info.vue        # 帖子详情
│   │   └── business/
│   │       ├── index.vue       # 会员中心
│   │       ├── login.vue       # 登录页
│   │       ├── profile.vue     # 个人资料编辑
│   │       ├── user.vue        # 个人主页
│   │       ├── follow.vue      # 关注/粉丝列表
│   │       ├── message.vue     # 私信消息
│   │       ├── pay.vue         # 积分充值
│   │       ├── checkin.vue     # 每日签到
│   │       └── question.vue    # 我的提问
│   ├── services/request.js     # HTTP 封装（拦截器/Token/图片处理）
│   ├── store/index.js          # Vuex 状态管理
│   ├── utils/
│   │   ├── auth.js             # 认证工具（登录检查/用户信息）
│   │   └── toast.js            # 全局提示工具
│   ├── mixins/listMixin.js     # 列表分页混入
│   ├── App.vue                 # 根组件
│   ├── main.js                 # 应用入口
│   ├── pages.json              # 路由配置 & tabBar
│   ├── manifest.json           # 应用原生配置
│   └── uni.scss                # 全局 SCSS 变量（主题色）
├── templateH5.html             # H5 构建模板
├── vue.config.js               # Vue CLI 配置
├── package.json
├── .gitignore
└── README.md
```

---

## 页面路由

| 路径 | 页面 | 类型 |
|:-----|:-----|:----:|
| `pages/index/index` | 首页 | tabBar |
| `pages/business/index` | 我的 | tabBar |
| `pages/post/add` | 发布提问 | 子页面 |
| `pages/post/edit` | 编辑提问 | 子页面 |
| `pages/post/info` | 帖子详情 | 子页面 |
| `pages/business/login` | 登录 | 子页面 |
| `pages/business/profile` | 资料编辑 | 子页面 |
| `pages/business/user` | 个人主页 | 子页面 |
| `pages/business/follow` | 关注/粉丝 | 子页面 |
| `pages/business/message` | 私信 | 子页面 |
| `pages/business/pay` | 充值 | 子页面 |
| `pages/business/checkin` | 签到 | 子页面 |
| `pages/business/question` | 我的提问 | 子页面 |

---

## 主题系统

项目采用蓝绿渐变主题，通过 [uni.scss](src/uni.scss) 统一管理：

```scss
// 主题色变量定义
$zl-primary: #0173de;           // 主色调：知了蓝
$zl-primary-light: #4cd964;    // 辅助色：活力绿
$zl-gradient: linear-gradient(135deg, $zl-primary, $zl-primary-light);
```

修改这两个变量即可全局替换所有使用主题色的组件。

---

## 后端接口

### 接口基础地址

| 平台 | 基础地址 |
|:----:|----------|
| H5 | `/wc`（Nginx 反向代理） |
| 微信小程序 | `http://www.fastadmin.com/index.php/wc` |
| APP | `http://www.fastadmin.com/index.php/wc` |

### 关键接口清单

| 接口路径 | 方法 | 功能 |
|:---------|:----:|:-----|
| `/business/login` | POST | 用户登录 |
| `/post/cate` | GET | 分类列表 |
| `/post/index` | GET | 帖子列表 |
| `/post/add` | POST | 发布帖子 |
| `/post/edit` | POST | 编辑帖子 |
| `/post/info` | POST | 帖子详情 |
| `/comment/index` | GET | 评论列表 |
| `/comment/add` | POST | 发表评论 |
| `/business/follow` | POST | 关注/取关 |
| `/business/profile` | POST | 更新资料 |
| `/business/pay` | POST | 积分充值 |
| `/checkin/index` | POST | 每日签到 |

### 认证方式

```
Header: { token: "用户Token" }
```
Token 过期时后端返回 code=401，前端自动清除状态并跳转登录页。

---

## 部署指南

### H5 部署

```bash
npm run build:h5
# 构建产物 → dist/build/h5/
```

#### Nginx 配置

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /path/to/dist/build/h5;
    index index.html;

    # API 反向代理
    location /wc {
        proxy_pass http://your-backend-api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # SPA 路由回退
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 微信小程序部署

```bash
npm run build:mp-weixin
# 用微信开发者工具打开 dist/dev/mp-weixin
# 上传 → 提交审核 → 发布
```

> ⚠️ 小程序后台需将 `http://www.fastadmin.com` 加入 request 合法域名白名单。

### APP 打包

1. HBuilderX 打开项目 → 发行 → 原生 App 云打包
2. 配置签名证书和包名
3. 生成 APK/IPA 安装包

---

## 常见问题

<details>
<summary><b>H5 模式下图片不显示？</b></summary>

Nginx 未正确配置 `/wc` 反向代理。H5 下接口返回相对路径图片地址，需通过代理拼接完整域名。参考上方 Nginx 配置示例。

</details>

<details>
<summary><b>小程序请求报网络错误？</b></summary>

在微信公众平台 → 开发管理 → 开发设置 → 服务器域名中添加合法域名：
- request 合法域名：`http://www.fastadmin.com`

</details>

<details>
<summary><b>如何修改主题颜色？</b></summary>

编辑 `src/uni.scss` 文件中的 `$zl-primary` 和 `$zl-primary-light` 变量即可全局生效。

</details>

<details>
<summary><b>评论懒加载是如何实现的？</b></summary>

帖子详情页初始加载时不请求评论接口，用户点击「全部评论」分割线后才触发加载，同时支持收起功能避免重复请求，有效提升首屏渲染速度。

</details>

<details>
<summary><b>关注列表出现重复数据？</b></summary>

当前已在前端实现去重（Map 追踪已见 ID）。建议后端在数据库层增加唯一约束防止重复记录写入。

</details>

---

## 许可证

[MIT License](https://opensource.org/licenses/MIT)
