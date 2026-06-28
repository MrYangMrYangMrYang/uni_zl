import secureStorage from '@/utils/secure-storage.js'

export function isLogin() {
	const userInfo = secureStorage.get('business') || {}
	return !!userInfo.id
}

export function getUserInfo() {
	return secureStorage.get('business') || {}
}

export function checkLogin(autoRedirect = true) {
	if (isLogin()) {
		return true
	}

	uni.$toast.error('请先登录')

	if (autoRedirect) {
		setTimeout(() => {
			uni.$u.route({
				url: '/pages-business/login',
				params: { openid: 'h5' }
			})
		}, 1200)
	}

	return false
}

export function getUserId() {
	const userInfo = getUserInfo()
	return userInfo.id || 0
}

export default {
	isLogin,
	getUserInfo,
	checkLogin,
	getUserId
}
