import Vue from 'vue'
import App from './App'
// 导入 uni-app 的 Promise 适配器
// 作用：将 uni-app 的回调风格 API（如 uni.request()）转换为 Promise 风格，支持 async/await
import './uni.promisify.adaptor'

// 引入ui框架
import uView from "uview-ui";
// 通过 Vue.use() 安装 uView 插件
// 这会将 uView 的所有组件注册为全局组件，可以在任何页面直接使用
// 同时挂载 uni.$u 工具方法（包括 uni.$u.http）
Vue.use(uView);

// 关闭生产环境下的提示信息，让控制台更干净
Vue.config.productionTip = false

// 标明这个实例是应用级别的，这是 uni-app 内部使用的标识，用于区分是小程序页面还是应用
App.mpType = 'app'

const app = new Vue({
  ...App
})

// 引入请求的封装
// 使用 require 导入请求配置文件
// 关键点：立即执行导入的函数，并传入 app 实例
// 这行代码执行了你之前分析的 request.js 文件
// 传入 app 实例后，在 request.js 中就可以通过 vm 参数访问这个实例，进而访问 vm.$store（Vuex）
require('./services/request.js')(app)

app.$mount()
