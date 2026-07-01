/**
 * Vuex Store 单元测试
 * 覆盖 mutations, actions, getters
 */

// Mock dependencies before importing
jest.mock('@/utils/secure-storage.js', () => ({
	get: jest.fn(() => ({ id: 1, nickname: 'test', token: 'abc123' })),
	set: jest.fn(),
	remove: jest.fn()
}))

// Mock Vue and Vuex
jest.mock('vue', () => {
	const actualVue = jest.requireActual('vue')
	return actualVue
})

jest.mock('vuex', () => {
	const actualVuex = jest.requireActual('vuex')
	return actualVuex
})

// We need to test the store in isolation
// Since store import has side effects (Vue.use), let's test the logic directly
const secureStorage = require('@/utils/secure-storage.js')

describe('Vuex Store', () => {
	let store

	beforeEach(() => {
		jest.clearAllMocks()
		secureStorage.get.mockReturnValue({ id: 1, nickname: 'test', token: 'abc123' })

		// Re-import store for fresh instance
		jest.isolateModules(() => {
			store = require('@/store/index.js').default
		})
	})

	describe('state', () => {
		it('should initialize userInfo from secureStorage', () => {
			expect(secureStorage.get).toHaveBeenCalledWith('business')
		})

		it('should initialize followCache and collectCache as empty objects', () => {
			expect(store.state.followCache).toEqual({})
			expect(store.state.collectCache).toEqual({})
		})
	})

	describe('getters', () => {
		it('token should return user token', () => {
			expect(store.getters.token).toBe('abc123')
		})

		it('token should return empty string when no userInfo', () => {
			secureStorage.get.mockReturnValue({})
			jest.isolateModules(() => {
				const emptyStore = require('@/store/index.js').default
				expect(emptyStore.getters.token).toBe('')
			})
		})

		it('hasUserInfo should return true when user has id', () => {
			expect(store.getters.hasUserInfo).toBe(true)
		})
	})

	describe('mutations', () => {
		it('SET_USER_INFO should update userInfo and persist', () => {
			const newUser = { id: 2, nickname: 'newUser', token: 'xyz' }
			store.commit('SET_USER_INFO', newUser)
			expect(store.state.userInfo.id).toBe(2)
			expect(store.state.isLogin).toBe(true)
			expect(secureStorage.set).toHaveBeenCalled()
		})

		it('SET_USER_INFO with empty object should clear state', () => {
			store.commit('SET_USER_INFO', {})
			expect(store.state.isLogin).toBe(false)
			expect(secureStorage.remove).toHaveBeenCalledWith('business')
		})

		it('LOGOUT should clear all state', () => {
			store.commit('SET_FOLLOW_CACHE', { userId: '1', isFollow: true })
			store.commit('LOGOUT')
			expect(store.state.userInfo).toEqual({})
			expect(store.state.isLogin).toBe(false)
			expect(store.state.followCache).toEqual({})
			expect(store.state.collectCache).toEqual({})
		})

		it('SET_FOLLOW_CACHE should cache follow state', () => {
			store.commit('SET_FOLLOW_CACHE', { userId: '123', isFollow: true })
			expect(store.state.followCache['123']).toBe(true)
		})

		it('SET_COLLECT_CACHE should cache collect state', () => {
			store.commit('SET_COLLECT_CACHE', { postId: '456', isCollect: true })
			expect(store.state.collectCache['456']).toBe(true)
		})

		it('UPDATE_FOLLOW_COUNT should update count and persist', () => {
			store.commit('UPDATE_FOLLOW_COUNT', 5)
			expect(store.state.userInfo.follow_count).toBe(5)
			expect(secureStorage.set).toHaveBeenCalled()
		})

		it('UPDATE_FANS_COUNT should update count and persist', () => {
			store.commit('UPDATE_FANS_COUNT', 3)
			expect(store.state.userInfo.fans_count).toBe(3)
			expect(secureStorage.set).toHaveBeenCalled()
		})
	})

	describe('actions', () => {
		it('loginSuccess should commit SET_USER_INFO', () => {
			const user = { id: 3, token: 'token3' }
			store.dispatch('loginSuccess', user)
			expect(store.state.userInfo.id).toBe(3)
			expect(store.state.isLogin).toBe(true)
		})

		it('logout should commit LOGOUT', () => {
			store.dispatch('logout')
			expect(store.state.isLogin).toBe(false)
		})
	})
})
