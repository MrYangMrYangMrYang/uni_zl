/**
 * 统一登录认证 Mixin
 *
 * 职责：提供统一的登录状态检查、用户信息获取方法
 * 消除各页面中 if(!this.business.id) / if(!this.brid) / checkLogin() 等不一致的登录判断
 *
 * @module mixins/authMixin
 *
 * @example
 * import { authMixin } from '@/mixins/authMixin'
 * export default {
 *   mixins: [authMixin],
 *   methods: {
 *     async doSomething() {
 *       if (!this.requireLogin()) return  // 未登录自动提示+跳转
 *       const id = this.currentUserId     // 获取当前用户ID
 *     }
 *   }
 * }
 */

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
