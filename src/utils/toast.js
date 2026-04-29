/**
 * 统一提示工具
 *
 * 职责：封装 uni.showToast/uni.showLoading，提供成功、错误、加载等多种提示类型
 *
 * @module utils/toast
 *
 * @example
 * uni.$toast.success('操作成功')
 * uni.$toast.error('操作失败')
 * uni.$toast.loading('加载中...')
 */

/** 提示持续时间配置（单位：毫秒） */
const TOAST_CONFIG = {
	SUCCESS_DURATION: 1200,   // 成功提示1.2秒
	ERROR_DURATION: 1500,     // 错误提示1.5秒（稍长让用户看清）
	DEFAULT_DURATION: 1000    // 默认提示时长
}

export default {

	/**
	 * 成功提示（绿色勾图标）
	 * @param {string} message - 提示文字
	 * @param {object} [options={}] - 可选配置
	 * @param {number} [options.duration] - 自定义显示时长
	 * @param {function} [options.complete] - 提示结束后的回调
	 */
	success(message, options = {}) {
		const duration = options.duration || TOAST_CONFIG.SUCCESS_DURATION
		uni.showToast({
			title: message,
			icon: 'success',  // 绿色勾图标
			duration
		})

		if (options.complete) {
			setTimeout(options.complete, duration)  // 提示结束后执行回调
		}
	},

	/**
	 * 错误提示（纯文字，无图标）
	 * @param {string} message - 提示文字
	 * @param {object} [options={}] - 可选配置
	 */
	error(message, options = {}) {
		const duration = options.duration || TOAST_CONFIG.ERROR_DURATION
		uni.showToast({
			title: message,
			icon: 'none',  // 无图标，避免红色图标过于刺眼
			duration
		})

		if (options.complete) {
			setTimeout(options.complete, duration)
		}
	},

	/**
	 * 加载中提示（需手动调用hideLoading关闭）
	 * @param {string} [message='加载中...'] - 提示文字
	 */
	loading(message = '加载中...') {
		uni.showLoading({
			title: message,
			mask: true  // 显示透明蒙层，阻止触摸穿透
		})
	},

	/** 关闭加载提示（通常在请求完成后调用） */
	hideLoading() {
		uni.hideLoading()
	},

	/**
	 * 成功提示后自动跳转页面
	 * @param {string} message - 成功提示文字
	 * @param {string} url - 目标页面路径（如 "/pages/post/info"）
	 * @param {boolean} [isTab=false] - 是否为TabBar页面（决定用switchTab还是navigateTo）
	 * @param {object} [params={}] - URL查询参数（如 { postid: 123 } 会拼接成 ?postid=123）
	 */
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

	/**
	 * 成功提示后自动返回上一页
	 * @param {string} message - 成功提示文字
	 * @param {number} [delta=1] - 返回层数，默认1（返回上一页）
	 */
	successAndBack(message, delta = 1) {
		const duration = TOAST_CONFIG.SUCCESS_DURATION
		uni.showToast({ title: message, icon: 'success', duration })

		setTimeout(() => {
			uni.navigateBack({ delta })
		}, duration)
	}
}
