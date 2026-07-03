import { checkLogin, getUserInfo, getUserId } from '@/utils/auth.js'

// ====== Options API Mixin ======
export const authMixin = {
	computed: {
		currentUserId() {
			return getUserId()
		},
		isLoggedIn() {
			return !!getUserId()
		},
		currentUser() {
			return getUserInfo()
		}
	},
	methods: {
		requireLogin(autoRedirect = true) {
			return checkLogin(autoRedirect)
		}
	}
}

// ====== Composition API (useAuth) ======
// 演示：同一套逻辑同时以 Options API（mixin）和 Composition API（composable）提供
// 用法（在 setup() 中）：
//   import { useAuth } from '@/mixins/authMixin'
//   const { currentUserId, isLoggedIn, currentUser, requireLogin } = useAuth()

/**
 * 认证逻辑组合式函数，为 Vue 2 @vue/composition-api 或 Vue 3 设计
 * @returns {{ currentUserId: number, isLoggedIn: boolean, currentUser: object, requireLogin: Function }}
 */
export function useAuth() {
	const currentUserId = getUserId()
	const isLoggedIn = !!currentUserId
	const currentUser = getUserInfo()

	const requireLogin = (autoRedirect = true) => {
		return checkLogin(autoRedirect)
	}

	return {
		currentUserId,
		isLoggedIn,
		currentUser,
		requireLogin
	}
}

export default { authMixin, useAuth }
