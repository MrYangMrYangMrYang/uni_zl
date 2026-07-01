/** 提示持续时间配置（单位：毫秒） */
const TOAST_CONFIG = {
	SUCCESS_DURATION: 1200, // 成功提示1.2秒
	ERROR_DURATION: 1500, // 错误提示1.5秒（稍长让用户看清）
	DEFAULT_DURATION: 1000 // 默认提示时长
}

export default {
	success(message, options = {}) {
		const duration = options.duration || TOAST_CONFIG.SUCCESS_DURATION
		uni.showToast({
			title: message,
			icon: 'success',
			duration
		})

		if (options.complete) {
			setTimeout(options.complete, duration)
		}
	},

	error(message, options = {}) {
		const duration = options.duration || TOAST_CONFIG.ERROR_DURATION
		uni.showToast({
			title: message,
			icon: 'none', // 无图标，避免红色图标刺眼
			duration
		})

		if (options.complete) {
			setTimeout(options.complete, duration)
		}
	},

	info(message, options = {}) {
		const duration = options.duration || 2000
		uni.showToast({
			title: message,
			icon: 'none',
			duration
		})

		if (options.complete) {
			setTimeout(options.complete, duration)
		}
	},

	loading(message = '加载中...') {
		uni.showLoading({
			title: message,
			mask: true // 显示蒙层阻止触摸穿透
		})
	},

	hideLoading() {
		uni.hideLoading()
	},

	successAndNavigate(message, url, isTab = false, params = {}) {
		const duration = TOAST_CONFIG.SUCCESS_DURATION
		uni.showToast({ title: message, icon: 'success', duration })

		setTimeout(() => {
			let finalUrl = url

			if (Object.keys(params).length > 0) {
				const queryString = Object.keys(params)
					.map(key => `${key}=${params[key]}`)
					.join('&')
				finalUrl = `${url}?${queryString}`
			}

			if (isTab) {
				uni.switchTab({ url: finalUrl })
			} else {
				uni.navigateTo({ url: finalUrl })
			}
		}, duration)
	},

	successAndBack(message, delta = 1) {
		const duration = TOAST_CONFIG.SUCCESS_DURATION
		uni.showToast({ title: message, icon: 'success', duration })

		setTimeout(() => {
			uni.navigateBack({ delta })
		}, duration)
	}
}
