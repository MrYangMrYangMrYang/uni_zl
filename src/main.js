/**
 * main.js - 应用入口文件
 *
 * 功能说明：
 * - 初始化 Vue 实例
 * - 注册全局插件（uView UI、Vuex 状态管理）
 * - 配置全局工具（Toast 提示、HTTP 请求）
 * - 挂载应用根组件
 */

import Vue from 'vue'
import App from './App'
import store from './store'

import uView from "uview-ui"
import toast from './utils/toast.js'

Vue.use(uView)

uni.$toast = toast

Vue.config.productionTip = false

App.mpType = 'app'

const app = new Vue({
  store,
  ...App
})

require('./services/request.js')(app)

app.$mount()
