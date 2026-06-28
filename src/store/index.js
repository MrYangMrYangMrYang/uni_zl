import Vue from 'vue'
import Vuex from 'vuex'
import secureStorage from '@/utils/secure-storage.js'

Vue.use(Vuex)

// token 过期时间：7天（单位秒），到期后 secureStorage.get 会自动清理
const TOKEN_EXPIRE = 7 * 24 * 3600

const store = new Vuex.Store({
	state: {
		userInfo: secureStorage.get('business') || {},
		isLogin: !!secureStorage.get('business')?.id,
		// 关注状态缓存：{ [userId]: isFollow }，避免重复请求关注检测接口
		followCache: {},
		// 收藏状态缓存：{ [postId]: isCollect }，避免重复请求收藏检测接口
		collectCache: {}
	},

	getters: {
		token: state => state.userInfo.token || '',
		hasUserInfo: state => !!state.userInfo.id
	},

	mutations: {
		SET_USER_INFO(state, userInfo) {
			state.userInfo = userInfo
			state.isLogin = !!userInfo?.id
			if (userInfo?.id) {
				// 编码存储 + 过期校验，缓解 localStorage 明文泄露 token 的风险
				secureStorage.set('business', userInfo, TOKEN_EXPIRE)
			} else {
				secureStorage.remove('business')
			}
		},

		UPDATE_FOLLOW_COUNT(state, count) {
			state.userInfo = { ...state.userInfo, follow_count: count } // 展开新对象触发响应式
			secureStorage.set('business', state.userInfo, TOKEN_EXPIRE)
		},

		UPDATE_FANS_COUNT(state, count) {
			state.userInfo = { ...state.userInfo, fans_count: count }
			secureStorage.set('business', state.userInfo, TOKEN_EXPIRE)
		},

		SET_FOLLOW_CACHE(state, { userId, isFollow }) {
			Vue.set(state.followCache, userId, isFollow) // Vue.set确保新增属性响应式
		},

		CLEAR_FOLLOW_CACHE(state) {
			state.followCache = {}
		},

		SET_COLLECT_CACHE(state, { postId, isCollect }) {
			Vue.set(state.collectCache, postId, isCollect)
		},

		CLEAR_COLLECT_CACHE(state) {
			state.collectCache = {}
		},

		LOGOUT(state) {
			state.userInfo = {}
			state.isLogin = false
			state.followCache = {}
			state.collectCache = {}
			secureStorage.remove('business')
		}
	},

	actions: {
		loginSuccess({ commit }, userInfo) {
			commit('SET_USER_INFO', userInfo)
		},

		logout({ commit }) {
			commit('LOGOUT')
		}
	}
})

export default store
