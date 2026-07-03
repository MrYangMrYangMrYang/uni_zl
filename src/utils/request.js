// API 默认地址（与 @/constants 保持同步，避免跨模块 require 导致 webpack 解析异常）
const API_H5 = '/wc'
const API_NATIVE = 'http://www.fastadmin.com/index.php/wc'
const DOMAIN = 'http://www.fastadmin.com'

module.exports = vm => {
	uni.$u.http.setConfig(config => {
		// H5环境使用相对路径（配合Nginx反向代理解决跨域）
		// #ifdef H5
		config.baseURL = process.env.VUE_APP_API_H5 || API_H5
		// #endif

		// #ifdef MP-WEIXIN || APP-PLUS
		config.baseURL = process.env.VUE_APP_API_NATIVE || API_NATIVE
		// #endif

		config.header = {
			'X-Requested-With': 'XMLHttpRequest'
		}

		return config
	})

	uni.$u.http.interceptors.request.use(
		config => {
			config.data = config.data || {}

			const token = vm.$store.getters.token
			if (token) {
				config.header.token = token
			}

			return config
		},
		config => {
			return Promise.reject(config)
		}
	)

	const imageFields = [
		'image',
		'images',
		'avatar',
		'thumb',
		'icon',
		'logo',
		'pic',
		'cover',
		'photo',
		'img',
		'headimg',
		'head_img',
		'avatar_text'
	]
	const domain = process.env.VUE_APP_DOMAIN || DOMAIN

	// 递归处理 H5 图片路径去除域名前缀
	function processImages(data) {
		if (!data || typeof data !== 'object') return data

		if (Array.isArray(data)) {
			for (let i = 0; i < data.length; i++) {
				data[i] = processImages(data[i])
			}
			return data
		}

		const keys = Object.keys(data)
		for (let i = 0; i < keys.length; i++) {
			const key = keys[i]
			const value = data[key]

			if (typeof value === 'string') {
				// 字段名匹配或正则匹配判断图片字段
				const isImageField = imageFields.includes(key) || /image|img|avatar/i.test(key)
				if (isImageField && value.includes(domain)) {
					data[key] = value.replace(domain, '')
				} else if (key === 'content' && value.includes(domain)) {
					// content字段是富文本HTML，需全局替换
					data[key] = value.replace(new RegExp(domain, 'g'), '')
				}
			} else if (value && typeof value === 'object') {
				data[key] = processImages(value)
			}
		}
		return data
	}

	uni.$u.http.interceptors.response.use(
		response => {
			const data = response.data

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
				vm.$store.dispatch('logout')
				uni.$u.toast('登录已过期，请重新登录')
				setTimeout(() => {
					uni.navigateTo({ url: '/pages-business/login' })
				}, 1500)
				// 返回永不resolve的Promise，阻止后续执行
				return new Promise(() => {})
			}

			return data
		},
		error => {
			const { config } = error
			const custom = config?.custom || {}

			// 网络错误自动重试：需显式开启 custom.retry（默认不重试，避免对写入类接口产生副作用）
			// 仅对网络/超时错误生效，业务错误（code=0）走 success 拦截器不会到这里
			if (custom.retry > 0) {
				custom.retry--
				config.custom = custom
				// 记录已重试次数，用于退避延迟计算
				config.__retryCount = (config.__retryCount || 0) + 1
				return new Promise(resolve => {
					// 退避延迟：第1次500ms，第2次1000ms...，避免雪崩
					const delay = config.__retryCount * 500
					setTimeout(() => {
						resolve(uni.$u.http.request(config))
					}, delay)
				})
			}

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
		}
	)
}
