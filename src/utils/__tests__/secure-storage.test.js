// mock uni 全局，secure-storage 依赖 uni.getStorageSync/setStorageSync 等
const store = {}
global.uni = {
	getStorageSync: jest.fn(key => (key in store ? store[key] : '')),
	setStorageSync: jest.fn((key, value) => {
		store[key] = value
	}),
	removeStorageSync: jest.fn(key => {
		delete store[key]
	}),
	arrayBufferToBase64: jest.fn(buf => {
		// 简易 base64 编码，仅测试用
		const bytes = new Uint8Array(buf)
		let binary = ''
		for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
		return Buffer.from(binary, 'binary').toString('base64')
	}),
	base64ToArrayBuffer: jest.fn(str => {
		const binary = Buffer.from(str, 'base64').toString('binary')
		const bytes = new Uint8Array(binary.length)
		for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
		return bytes.buffer
	})
}

// btoa/atob 在 node 环境下用 Buffer 实现（H5 分支用）
global.btoa = str => Buffer.from(str, 'binary').toString('base64')
global.atob = str => Buffer.from(str, 'base64').toString('binary')

import secureStorage from '../secure-storage.js'

describe('secureStorage 安全存储', () => {
	beforeEach(() => {
		// 清空 mock 存储
		for (const key of Object.keys(store)) delete store[key]
	})

	test('set/get 应正确编解码数据', () => {
		const data = { id: 1, token: 'abc123', nickname: '知了' }
		secureStorage.set('user', data)

		// 存储的应是编码后的字符串，非明文
		expect(store['user']).toMatch(/^enc:/)
		expect(store['user']).not.toContain('abc123')

		// 读取应得到原始对象
		const result = secureStorage.get('user')
		expect(result).toEqual(data)
	})

	test('未设置过期时数据应持久存在', () => {
		secureStorage.set('user', { id: 1 })
		expect(secureStorage.get('user')).toEqual({ id: 1 })
	})

	test('过期后应自动清理并返回 null', () => {
		secureStorage.set('user', { id: 1 }, 1) // 1 秒过期

		// 模拟时间流逝
		const realNow = Date.now
		Date.now = jest.fn(() => realNow() + 2000)

		const result = secureStorage.get('user')

		Date.now = realNow

		expect(result).toBeNull()
		expect(global.uni.removeStorageSync).toHaveBeenCalledWith('user')
		expect(global.uni.removeStorageSync).toHaveBeenCalledWith('user_expire')
	})

	test('remove 应同时清理数据和过期标记', () => {
		secureStorage.set('user', { id: 1 }, 3600)
		expect(store['user']).toBeDefined()
		expect(store['user_expire']).toBeDefined()

		secureStorage.remove('user')
		expect(store['user']).toBeUndefined()
		expect(store['user_expire']).toBeUndefined()
	})

	test('兼容旧版明文存储：直接 JSON.parse', () => {
		// 模拟升级前存入的明文 JSON
		store['legacy'] = JSON.stringify({ id: 99, token: 'old' })

		const result = secureStorage.get('legacy')
		expect(result).toEqual({ id: 99, token: 'old' })
	})

	test('不存在的 key 应返回 null', () => {
		expect(secureStorage.get('not_exist')).toBeNull()
	})
})
