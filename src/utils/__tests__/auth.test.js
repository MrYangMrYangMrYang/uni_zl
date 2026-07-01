/**
 * Auth 工具测试
 */

// Mock dependencies
const mockStorageGet = jest.fn(() => ({ id: 1, nickname: 'test' }))
jest.mock('@/utils/secure-storage.js', () => ({
	get: mockStorageGet,
	set: jest.fn(),
	remove: jest.fn()
}))

describe('Auth Utils', () => {
	let auth

	beforeEach(() => {
		jest.clearAllMocks()
		global.uni = {
			showToast: jest.fn(),
			navigateTo: jest.fn(),
			$toast: {
				error: jest.fn(),
				success: jest.fn()
			}
		}
		mockStorageGet.mockReturnValue({ id: 1, nickname: 'test' })
		auth = require('@/utils/auth.js')
	})

	describe('getUserInfo', () => {
		it('should return user info from secureStorage', () => {
			const info = auth.getUserInfo()
			expect(info).toEqual({ id: 1, nickname: 'test' })
		})

		it('should return empty object when no user stored', () => {
			mockStorageGet.mockReturnValueOnce(null)
			const info = auth.getUserInfo()
			expect(info).toEqual({})
		})
	})

	describe('isLogin', () => {
		it('should return true when user has id', () => {
			expect(auth.isLogin()).toBe(true)
		})

		it('should return false when no user', () => {
			mockStorageGet.mockReturnValueOnce(null)
			expect(auth.isLogin()).toBe(false)
		})
	})

	describe('getUserId', () => {
		it('should return user id', () => {
			expect(auth.getUserId()).toBe(1)
		})

		it('should return 0 when no user', () => {
			mockStorageGet.mockReturnValueOnce(null)
			expect(auth.getUserId()).toBe(0)
		})
	})

	describe('checkLogin', () => {
		it('should return true when logged in', () => {
			expect(auth.checkLogin()).toBe(true)
		})

		it('should show toast and redirect when not logged in', () => {
			mockStorageGet.mockReturnValueOnce(null)
			const result = auth.checkLogin()
			expect(result).toBe(false)
			expect(uni.$toast.error).toHaveBeenCalledWith('请先登录')
		})
	})
})
