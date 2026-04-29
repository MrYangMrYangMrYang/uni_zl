/**
 * 统一登录认证工具
 *
 * 职责：检查登录状态、获取用户信息、登录拦截与自动跳转
 *
 * @module utils/auth
 */

/**
 * 检查用户是否已登录
 * @returns {boolean} 是否已登录（根据用户ID判断）
 */
export function isLogin() {
	const userInfo = uni.getStorageSync('business') || {}  // 从本地存储读取用户信息
	return !!userInfo.id  // 双重取反将ID转为布尔值
}

/**
 * 获取当前登录用户信息
 * @returns {object} 用户信息对象（包含id、nickname、avatar等字段），未登录返回空对象
 */
export function getUserInfo() {
	return uni.getStorageSync('business') || {}  // 未登录时返回空对象避免报错
}

/**
 * 检查登录状态，未登录时自动提示并跳转
 * @param {boolean} [autoRedirect=true] - 是否自动跳转登录页
 * @returns {boolean} 是否已登录
 */
export function checkLogin(autoRedirect = true) {
	if (isLogin()) {
		return true  // 已登录直接返回true
	}

	uni.$toast.error('请先登录')  // 未登录提示

	if (autoRedirect) {
		setTimeout(() => {
			uni.$u.route({
				url: '/pages-business/login',  // 登录页路径
				params: { openid: 'h5' }       // 传递openid标识H5环境
			})
		}, 1200)  // 延迟1.2秒跳转，让用户先看到提示
	}

	return false  // 返回false，调用方可据此终止后续操作
}

/**
 * 获取用户ID
 * @returns {number|string} 用户ID，未登录返回 0
 */
export function getUserId() {
	const userInfo = getUserInfo()
	return userInfo.id || 0  // 未登录时返回0作为默认值
}

/** 默认导出所有方法 */
export default {
	isLogin,
	getUserInfo,
	checkLogin,
	getUserId
}
