# 🌟 论坛社区 (Forum Community) - Uni-App 移动端项目

![Vue](https://img.shields.io/badge/Vue-2.6.14-4fc08d?style=flat-square&logo=vue.js)
![uni-app](https://img.shields.io/badge/uni--app-2.0.2-2b9939?style=flat-square)
![uView](https://img.shields.io/badge/uView--UI-2.0.36-007aff?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)

> 🚀 一个基于 Uni-App 和 uView UI 构建的多端跨平台论坛社区应用。支持 H5、微信小程序、App 等多个平台。提供发帖、互动、签到、个人中心等完整的社区功能。

## 📖 项目简介

本项目是一个功能丰富的移动端社区论坛平台。旨在提供一个便捷的在线交流空间，用户可以浏览帖子、发布问题、进行关注互动、管理个人信息等。界面设计现代化，交互体验流畅。

## ✨ 主要功能

- **🏠 社区首页**：帖子列表展示、下拉刷新、上拉加载更多。
- **📝 内容发布**：支持发布提问、编辑帖子，图文并茂展示帖子详情。
- **💬 互动交流**：关注用户、发送私信、评论互动。
- **👤 个人中心**：
  - 用户登录与注册（含邮箱认证）
  - 基本资料修改与个人主页展示
  - 我的提问、我的关注、我的私信管理
- **🎁 增值服务**：每日签到打卡、余额充值。

## 🛠️ 技术栈

* **核心框架**: [Uni-App](https://uniapp.dcloud.io/) (基于 Vue.js 2.x)
* **UI 组件库**: [uView UI](https://www.uviewui.com/) (优秀的 uni-app 生态组件库)
* **状态管理**: Vuex
* **网络请求**: flyio
* **图表组件**: u-charts / qiun-data-charts
* **样式处理**: SCSS

## 📂 目录结构

```text
├── src
│   ├── components      # 全局复用组件 (包含图表、日历、评论、地区选择等)
│   ├── pages           # 页面目录
│   │   ├── index       # 首页模块
│   │   ├── post        # 帖子模块 (发布、编辑、详情)
│   │   └── business    # 业务模块 (个人中心、登录、私信、签到、充值等)
│   ├── services        # 网络请求及 API 封装 (request.js)
│   ├── static          # 静态资源 (图片、图标等)
│   ├── App.vue         # 根组件，配置 App 全局样式和生命周期
│   ├── main.js         # 入口文件，初始化 Vue 实例和引入插件
│   ├── manifest.json   # 跨端配置文件
│   ├── pages.json      # 页面路由及全局外观配置
│   └── uni.scss        # 全局 SCSS 变量文件
├── package.json        # 项目依赖和运行脚本
└── vue.config.js       # Vue 构建配置
```

## 🚀 快速开始

### 1. 环境准备
确保您的计算机上已安装 [Node.js](https://nodejs.org/) 和 [HBuilderX](https://www.dcloud.io/hbuilderx.html) (推荐) 或者 VS Code。

### 2. 克隆项目与安装依赖

```bash
# 进入项目目录
cd uni-app_wc

# 安装依赖
npm install
```

### 3. 运行与编译

本项目基于 Vue CLI 创建，您可以通过命令行运行或编译项目，也可以使用 HBuilderX 导入项目运行。

**使用命令行:**

```bash
# 运行 H5 平台进行开发调试
npm run dev:h5
# 或者
npm run serve

# 运行微信小程序进行开发调试
npm run dev:mp-weixin

# 构建 H5 生产环境
npm run build:h5
# 或者
npm run build
```

*更多平台运行指令请参考 `package.json` 中的 `scripts` 配置。*

## 📄 许可证

[MIT](https://opensource.org/licenses/MIT)

---
*Generated with ❤️ by Trae*
