import Vue from 'vue'
import Vuex from 'vuex'
import secureStorage from '@/utils/secure-storage.js'
import constants from '../constants'
const TOKEN_EXPIRE = constants.TOKEN_EXPIRE

Vue.use(Vuex)

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
				secureStorage.set('business', userInfo, TOKEN_EXPIRE)
			} else {
				secureStorage.remove('business')
			}
		},

		UPDATE_FOLLOW_COUNT(state, count) {
			state.userInfo = { ...state.userInfo, follow_count: count }
			secureStorage.set('business', state.userInfo, TOKEN_EXPIRE)
		},

		UPDATE_FANS_COUNT(state, count) {
			state.userInfo = { ...state.userInfo, fans_count: count }
			secureStorage.set('business', state.userInfo, TOKEN_EXPIRE)
		},

		SET_FOLLOW_CACHE(state, { userId, isFollow }) {
			Vue.set(state.followCache, userId, isFollow)
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
