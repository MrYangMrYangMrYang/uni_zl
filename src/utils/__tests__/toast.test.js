/**
 * Toast 工具测试
 */

describe('Toast Utils', () => {
	let toast

	beforeEach(() => {
		jest.clearAllMocks()
		// Mock uni global
		global.uni = {
			showToast: jest.fn(),
			showLoading: jest.fn(),
			hideLoading: jest.fn(),
			navigateTo: jest.fn(),
			navigateBack: jest.fn(),
			switchTab: jest.fn()
		}
		jest.useFakeTimers()
		toast = require('@/utils/toast.js').default
	})

	afterEach(() => {
		jest.useRealTimers()
	})

	describe('success', () => {
		it('should call uni.showToast with success icon', () => {
			toast.success('操作成功')
			expect(uni.showToast).toHaveBeenCalledWith({
				title: '操作成功',
				icon: 'success',
				duration: 1200
			})
		})

		it('should support custom duration', () => {
			toast.success('OK', { duration: 2000 })
			expect(uni.showToast).toHaveBeenCalledWith(expect.objectContaining({ duration: 2000 }))
		})

		it('should call complete callback after duration', () => {
			const complete = jest.fn()
			toast.success('OK', { complete })
			jest.advanceTimersByTime(1200)
			expect(complete).toHaveBeenCalled()
		})
	})

	describe('error', () => {
		it('should call uni.showToast with none icon', () => {
			toast.error('操作失败')
			expect(uni.showToast).toHaveBeenCalledWith({
				title: '操作失败',
				icon: 'none',
				duration: 1500
			})
		})
	})

	describe('info', () => {
		it('should call uni.showToast with none icon and default duration', () => {
			toast.info('提示信息')
			expect(uni.showToast).toHaveBeenCalledWith({
				title: '提示信息',
				icon: 'none',
				duration: 2000
			})
		})
	})

	describe('loading', () => {
		it('should call uni.showLoading with mask', () => {
			toast.loading('加载中...')
			expect(uni.showLoading).toHaveBeenCalledWith({
				title: '加载中...',
				mask: true
			})
		})

		it('should use default message', () => {
			toast.loading()
			expect(uni.showLoading).toHaveBeenCalledWith(expect.objectContaining({ title: '加载中...' }))
		})
	})

	describe('hideLoading', () => {
		it('should call uni.hideLoading', () => {
			toast.hideLoading()
			expect(uni.hideLoading).toHaveBeenCalled()
		})
	})

	describe('successAndNavigate', () => {
		it('should navigate after success toast', () => {
			toast.successAndNavigate('成功', '/pages/index')
			expect(uni.showToast).toHaveBeenCalled()
			jest.advanceTimersByTime(1200)
			expect(uni.navigateTo).toHaveBeenCalledWith({ url: '/pages/index' })
		})

		it('should support query params', () => {
			toast.successAndNavigate('OK', '/pages/info', false, { id: 1, type: 'post' })
			jest.advanceTimersByTime(1200)
			expect(uni.navigateTo).toHaveBeenCalledWith({ url: '/pages/info?id=1&type=post' })
		})

		it('should use switchTab when isTab is true', () => {
			toast.successAndNavigate('OK', '/pages/index', true)
			jest.advanceTimersByTime(1200)
			expect(uni.switchTab).toHaveBeenCalled()
		})
	})

	describe('successAndBack', () => {
		it('should navigate back after success toast', () => {
			toast.successAndBack('修改成功')
			expect(uni.showToast).toHaveBeenCalled()
			jest.advanceTimersByTime(1200)
			expect(uni.navigateBack).toHaveBeenCalledWith({ delta: 1 })
		})

		it('should support custom delta', () => {
			toast.successAndBack('成功', 2)
			jest.advanceTimersByTime(1200)
			expect(uni.navigateBack).toHaveBeenCalledWith({ delta: 2 })
		})
	})
})
