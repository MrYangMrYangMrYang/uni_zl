/**
 * HTTP 请求封装
 *
 * 职责：
 * - 基于 uView HTTP 模块二次封装
 * - 统一配置请求基础地址（H5/小程序条件编译）
 * - 请求拦截：自动携带 Token
 * - 响应拦截：统一错误处理、登录过期处理、H5图片路径处理
 *
 * @module services/request
 */

module.exports = (vm) => {

	// ==================== 请求配置 ====================
	uni.$u.http.setConfig((config) => {
		// H5环境使用相对路径（配合Nginx反向代理解决跨域）
		// #ifdef H5
		config.baseURL = '/wc'
		// #endif

		// 小程序或APP环境使用完整域名
		// #ifdef MP-WEIXIN || APP-PLUS
		config.baseURL = 'http://www.fastadmin.com/index.php/wc'
		// #endif

		config.header = {
			'X-Requested-With': 'XMLHttpRequest'  // 标识AJAX请求
		}

		return config
	})

	// ==================== 请求拦截器 ====================
	uni.$u.http.interceptors.request.use((config) => {
		config.data = config.data || {}  // 确保data存在

		const token = vm.$store.getters.token  // 从Vuex获取Token
		if (token) {
			config.header.token = token  // 添加到请求头
		}

		return config
	}, config => {
		return Promise.reject(config)  // 请求错误时拒绝Promise
	})

	// ==================== 图片路径处理工具 ====================

	/** 常见的图片字段名列表 */
	const imageFields = ['image', 'images', 'avatar', 'thumb', 'icon', 'logo', 'pic', 'cover', 'photo', 'img', 'headimg', 'head_img', 'avatar_text']
	const domain = 'http://www.fastadmin.com'  // 需要被替换的域名

	/**
	 * 递归处理数据中的图片路径（H5环境下去除域名前缀）
	 * @param {any} data - 需要处理的数据（支持对象、数组）
	 * @returns {any} 处理后的数据
	 */
	function processImages(data) {
		if (!data || typeof data !== 'object') return data  // 非对象直接返回

		if (Array.isArray(data)) {
			for (let i = 0; i < data.length; i++) {
				data[i] = processImages(data[i])  // 递归处理数组元素
			}
			return data
		}

		// 遍历对象的所有字段
		const keys = Object.keys(data)
		for (let i = 0; i < keys.length; i++) {
			const key = keys[i]
			const value = data[key]

			if (typeof value === 'string') {
				// 判断是否为图片字段（字段名匹配或正则匹配）
				const isImageField = imageFields.includes(key) || /image|img|avatar/i.test(key)
				if (isImageField && value.includes(domain)) {
					data[key] = value.replace(domain, '')  // 去掉域名前缀
				} else if (key === 'content' && value.includes(domain)) {
					// content字段是富文本HTML，需全局替换
					data[key] = value.replace(new RegExp(domain, 'g'), '')
				}
			} else if (value && typeof value === 'object') {
				data[key] = processImages(value)  // 递归处理嵌套对象
			}
		}
		return data
	}

	// ==================== 响应拦截器 ====================
	uni.$u.http.interceptors.response.use((response) => {
		const data = response.data

		// H5环境下处理图片路径
		// #ifdef H5
		if (data && data.data) {
			data.data = processImages(data.data)
		}
		// #endif

		const custom = response.config?.custom || {}

		// 业务失败（code=0）且未禁用提示时显示错误
		if (data.code === 0 && custom.toast !== false) {
			uni.$u.toast(data.msg || '操作失败')
		}

		// 登录过期（code=401）
		if (data.code === 401) {
			vm.$store.dispatch('logout')  // 清空用户状态
			uni.$u.toast('登录已过期，请重新登录')
			setTimeout(() => {
				uni.navigateTo({ url: '/pages-business/login' })
			}, 1500)
			return new Promise(() => {})  // 返回永不resolve的Promise，阻止后续执行
		}

		return data
	}, (error) => {
		const { config } = error
		const custom = config?.custom || {}

		// 根据错误类型显示不同提示
		if (custom.toast !== false) {
			if (error.errMsg && error.errMsg.includes('timeout')) {
				uni.$u.toast('请求超时，请稍后重试')
			} else if (error.errMsg && error.errMsg.includes('fail')) {
				uni.$u.toast('网络连接失败，请检查网络')
			} else {
				uni.$u.toast('网络错误，请稍后再试')
			}
		}

		return Promise.reject(error)
	})
}
