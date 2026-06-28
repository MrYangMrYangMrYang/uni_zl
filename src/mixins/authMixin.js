import { checkLogin, getUserInfo, getUserId } from '@/utils/auth.js'

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
