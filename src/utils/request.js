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

	// 构建域名候选列表：env 变量（支持逗号分隔多个域名）+ 硬编码兜底域名
	// 即使 env 配置错误，硬编码兜底仍能正常工作，避免图片全部挂掉
	function getDomainCandidates() {
		const candidates = []
		const envDomain = process.env.VUE_APP_DOMAIN
		if (envDomain) {
			// 支持逗号分隔多个域名
			candidates.push(
				...envDomain
					.split(',')
					.map(s => s.trim())
					.filter(Boolean)
			)
		}
		// 始终追加硬编码兜底域名（去重）
		if (!candidates.includes(DOMAIN)) {
			candidates.push(DOMAIN)
		}
		return candidates
	}

	const domainCandidates = getDomainCandidates()

	// 去除字符串中的域名前缀（尝试所有候选域名）
	function stripDomain(str) {
		for (let j = 0; j < domainCandidates.length; j++) {
			const d = domainCandidates[j]
			if (str.includes(d)) {
				return str.replace(d, '')
			}
		}
		return str
	}

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
				if (isImageField) {
					data[key] = stripDomain(value)
				} else if (key === 'content') {
					// content字段是富文本HTML，需对所有候选域名做全局替换
					let result = value
					for (let j = 0; j < domainCandidates.length; j++) {
						const d = domainCandidates[j]
						if (result.includes(d)) {
							// 转义域名中的正则特殊字符
							result = result.replace(new RegExp(d.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '')
						}
					}
					data[key] = result
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
