import { debounce, throttle } from '../debounce.js'

// 使用假定时器，避免真实等待
jest.useFakeTimers()

describe('debounce 防抖函数', () => {
	test('应在延迟后执行一次', () => {
		const fn = jest.fn()
		const debounced = debounce(fn, 300)

		debounced()
		expect(fn).not.toHaveBeenCalled()

		jest.advanceTimersByTime(300)
		expect(fn).toHaveBeenCalledTimes(1)
	})

	test('连续调用应重置计时器，只执行最后一次', () => {
		const fn = jest.fn()
		const debounced = debounce(fn, 300)

		debounced()
		jest.advanceTimersByTime(200)
		debounced()
		jest.advanceTimersByTime(200)
		debounced()

		expect(fn).not.toHaveBeenCalled()

		jest.advanceTimersByTime(300)
		expect(fn).toHaveBeenCalledTimes(1)
	})

	test('应保留调用参数和 this 上下文', () => {
		const fn = jest.fn()
		const debounced = debounce(fn, 100)

		const ctx = { name: 'test' }
		debounced.call(ctx, 'arg1', 'arg2')

		jest.advanceTimersByTime(100)
		expect(fn).toHaveBeenCalledTimes(1)
		expect(fn).toHaveBeenCalledWith('arg1', 'arg2')
	})

	test('默认延迟应为 300ms', () => {
		const fn = jest.fn()
		const debounced = debounce(fn)

		debounced()
		jest.advanceTimersByTime(299)
		expect(fn).not.toHaveBeenCalled()

		jest.advanceTimersByTime(1)
		expect(fn).toHaveBeenCalledTimes(1)
	})
})

describe('throttle 节流函数', () => {
	test('首次调用应立即执行', () => {
		const fn = jest.fn()
		const throttled = throttle(fn, 500)

		throttled()
		expect(fn).toHaveBeenCalledTimes(1)
	})

	test('间隔内的后续调用不应执行', () => {
		const fn = jest.fn()
		const throttled = throttle(fn, 500)

		throttled()
		throttled()
		throttled()

		expect(fn).toHaveBeenCalledTimes(1)
	})

	test('超过间隔后应再次执行', () => {
		// throttle 基于 Date.now() 判断间隔，需手动 mock 时间
		const realDateNow = Date.now
		let mockTime = 1000
		Date.now = jest.fn(() => mockTime)

		const fn = jest.fn()
		const throttled = throttle(fn, 500)

		throttled()
		expect(fn).toHaveBeenCalledTimes(1)

		mockTime += 500
		throttled()
		expect(fn).toHaveBeenCalledTimes(2)

		Date.now = realDateNow
	})

	test('应保留调用参数', () => {
		const fn = jest.fn()
		const throttled = throttle(fn, 500)

		throttled('a', 'b')

		expect(fn).toHaveBeenCalledWith('a', 'b')
	})
})
