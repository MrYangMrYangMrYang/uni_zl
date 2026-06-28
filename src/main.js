import Vue from 'vue'
import App from './App'
import store from './store'
import { setupVueErrorHandler, setupUnhandledRejectionHandler, setupGlobalOnError } from './utils/error-handler.js'

setupVueErrorHandler(Vue)
setupUnhandledRejectionHandler()
setupGlobalOnError()

let uView = null

try {
	uView = require('uview-ui')
} catch (e) {
	console.warn('[main.js] uView 加载失败:', e.message)
}

if (uView && uView.install) {
	Vue.use(uView)
}

import toast from './utils/toast.js'

uni.$toast = toast

Vue.config.productionTip = false

App.mpType = 'app'

const app = new Vue({
	store,
	...App
})

require('./services/request.js')(app)

app.$mount()
