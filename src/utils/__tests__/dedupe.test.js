/**
 * dedupe 去重工具单元测试
 */
import { dedupeBy, dedupeById } from '../dedupe.js'

describe('dedupeBy', () => {
	test('应移除重复元素（保留首次出现）', () => {
		const input = [
			{ id: 1, name: 'A' },
			{ id: 2, name: 'B' },
			{ id: 1, name: 'A-duplicate' }
		]
		const result = dedupeBy(input, item => item.id)
		expect(result).toHaveLength(2)
		expect(result[0].name).toBe('A')
		expect(result[1].name).toBe('B')
	})

	test('空数组应返回空数组', () => {
		expect(dedupeBy([], item => item)).toEqual([])
	})

	test('null/undefined 应返回空数组', () => {
		expect(dedupeBy(null, item => item)).toEqual([])
		expect(dedupeBy(undefined, item => item)).toEqual([])
	})

	test('无重复时应返回原数组副本', () => {
		const input = [{ id: 1 }, { id: 2 }, { id: 3 }]
		const result = dedupeBy(input, item => item.id)
		expect(result).toHaveLength(3)
	})
})

describe('dedupeById', () => {
	test('应按 business.id 去重', () => {
		const input = [
			{ business: { id: 1 }, busid: 10 },
			{ business: { id: 2 }, busid: 20 },
			{ business: { id: 1 }, busid: 30 }
		]
		expect(dedupeById(input)).toHaveLength(2)
	})

	test('应回退到 busid 字段', () => {
		const input = [{ busid: 1 }, { busid: 2 }, { busid: 1 }]
		expect(dedupeById(input)).toHaveLength(2)
	})

	test('应回退到 id 字段', () => {
		const input = [{ id: 'a' }, { id: 'b' }, { id: 'a' }]
		expect(dedupeById(input)).toHaveLength(2)
	})
})
