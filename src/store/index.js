/**
 * Vuex 全局状态管理
 *
 * 职责：
 * - 管理用户登录状态和信息
 * - 缓存关注/收藏状态（避免重复请求）
 * - 提供登录/登出等全局操作
 *
 * 数据持久化：用户信息存储在 uni.storage 中
 */

import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

const store = new Vuex.Store({
	state: {
		userInfo: uni.getStorageSync('business') || {},  // 用户信息，从本地存储读取
		isLogin: !!uni.getStorageSync('business')?.id,   // 登录状态，根据ID是否存在判断
		followCache: {},   // 关注状态缓存，格式：{ userId: true/false }
		collectCache: {}   // 收藏状态缓存，格式：{ postId: true/false }
	},

	getters: {
		/** @returns {string} 当前用户的登录Token */
		token: state => state.userInfo.token || '',
		/** @returns {boolean} 是否有完整的用户信息 */
		hasUserInfo: state => !!state.userInfo.id
	},

	mutations: {
		/**
		 * 设置用户信息（登录成功后调用）
		 * @param {object} state - Vuex state
		 * @param {object} userInfo - 用户信息对象
		 */
		SET_USER_INFO(state, userInfo) {
			state.userInfo = userInfo                        // 更新state
			state.isLogin = !!userInfo?.id                   // 根据ID是否存在更新登录状态
			if (userInfo?.id) {
				uni.setStorageSync('business', userInfo)     // 有ID则持久化存储
			} else {
				uni.removeStorageSync('business')            // 无ID则清除（退出登录）
			}
		},

		/**
		 * 更新关注数（关注/取关操作后同步更新）
		 * @param {object} state - Vuex state
		 * @param {number} count - 新的关注数
		 */
		UPDATE_FOLLOW_COUNT(state, count) {
			state.userInfo = { ...state.userInfo, follow_count: count }  // 展开创建新对象触发响应式
			uni.setStorageSync('business', state.userInfo)               // 同步本地存储
		},

		/**
		 * 更新粉丝数（被关注/被取消关注时调用）
		 * @param {object} state - Vuex state
		 * @param {number} count - 新的粉丝数
		 */
		UPDATE_FANS_COUNT(state, count) {
			state.userInfo = { ...state.userInfo, fans_count: count }
			uni.setStorageSync('business', state.userInfo)
		},

		/**
		 * 设置某个用户的关注状态到缓存
		 * @param {object} state - Vuex state
		 * @param {{ userId: number, isFollow: boolean }} payload - 用户ID和关注状态
		 */
		SET_FOLLOW_CACHE(state, { userId, isFollow }) {
			Vue.set(state.followCache, userId, isFollow)  // Vue.set确保新增属性响应式
		},

		/** 清空所有关注缓存 */
		CLEAR_FOLLOW_CACHE(state) {
			state.followCache = {}
		},

		/**
		 * 设置某个帖子的收藏状态到缓存
		 * @param {object} state - Vuex state
		 * @param {{ postId: number, isCollect: boolean }} payload - 帖子ID和收藏状态
		 */
		SET_COLLECT_CACHE(state, { postId, isCollect }) {
			Vue.set(state.collectCache, postId, isCollect)
		},

		/** 清空所有收藏缓存 */
		CLEAR_COLLECT_CACHE(state) {
			state.collectCache = {}
		},

		/**
		 * 退出登录，清空所有状态和本地存储
		 * @param {object} state - Vuex state
		 */
		LOGOUT(state) {
			state.userInfo = {}           // 清空用户信息
			state.isLogin = false         // 重置登录状态
			state.followCache = {}        // 清空关注缓存
			state.collectCache = {}       // 清空收藏缓存
			uni.removeStorageSync('business')  // 移除本地存储
		}
	},

	actions: {
		/**
		 * 登录成功后的处理动作
		 * @param {{ commit: Function }} context - Vuex action上下文
		 * @param {object} userInfo - 用户信息对象
		 */
		loginSuccess({ commit }, userInfo) {
			commit('SET_USER_INFO', userInfo)  // 调用mutation设置用户信息并持久化
		},

		/**
		 * 退出登录的动作
		 * @param {{ commit: Function }} context - Vuex action上下文
		 */
		logout({ commit }) {
			commit('LOGOUT')  // 调用mutation清空所有状态
		}
	}
})

export default store
