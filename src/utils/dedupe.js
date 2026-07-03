/**
 * 通用列表去重工具
 * 按指定字段/嵌套属性对数组元素进行去重
 *
 * 用法：
 *   import { dedupeById } from '@/utils/dedupe'
 *   const unique = dedupeById(list, item => item.business?.id || item.busid || item.id)
 */

/**
 * 对数组按 key 函数返回的值去重（保留首次出现的元素）
 * @param {Array} list - 原始数组
 * @param {Function} keyFn - 从元素提取唯一键的函数
 * @returns {Array} 去重后的新数组
 */
export function dedupeBy(list, keyFn) {
	if (!list || list.length === 0) return []
	const seen = new Map()
	return list.filter(item => {
		const key = keyFn(item)
		if (seen.has(key)) return false
		seen.set(key, true)
		return true
	})
}

/**
 * 对列表按 ID 去重（兼容多种 ID 字段格式）
 * @param {Array} list
 * @returns {Array}
 */
export function dedupeById(list) {
	return dedupeBy(list, item => item.business?.id || item.busid || item.id)
}

export default { dedupeBy, dedupeById }
