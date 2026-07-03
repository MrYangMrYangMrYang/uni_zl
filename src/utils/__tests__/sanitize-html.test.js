/**
 * XSS 白名单过滤单元测试
 */
import { sanitizeHtml } from '../sanitize-html.js'

describe('sanitizeHtml', () => {
	test('应返回空字符串当输入为空/null/非字符串', () => {
		expect(sanitizeHtml('')).toBe('')
		expect(sanitizeHtml(null)).toBe('')
		expect(sanitizeHtml(undefined)).toBe('')
		expect(sanitizeHtml(123)).toBe('')
	})

	test('应移除 script 标签及其内容', () => {
		const result = sanitizeHtml('<p>safe</p><script>alert("xss")</script><p>also safe</p>')
		expect(result).not.toContain('script')
		expect(result).not.toContain('alert')
		expect(result).toContain('<p>safe</p>')
		expect(result).toContain('<p>also safe</p>')
	})

	test('应移除 on* 事件处理器（双引号）', () => {
		const result = sanitizeHtml('<div onclick="doBad()">text</div>')
		expect(result).not.toContain('onclick')
		expect(result).toContain('text</div>')
	})

	test('应移除 on* 事件处理器（单引号）', () => {
		const result = sanitizeHtml("<img src='x' onerror='doBad()'>")
		expect(result).not.toContain('onerror')
	})

	test('应移除 javascript: 协议（href）', () => {
		const result = sanitizeHtml('<a href="javascript:void(0)">link</a>')
		expect(result).not.toContain('javascript:')
	})

	test('应移除 javascript: 协议（src）', () => {
		const result = sanitizeHtml('<img src="javascript:alert(1)">')
		expect(result).not.toContain('javascript:')
	})

	test('应移除 iframe/object/embed 危险标签', () => {
		const result = sanitizeHtml('<p>text</p><iframe src="evil"></iframe><object data="x"></object><embed src="y">')
		expect(result).not.toContain('iframe')
		expect(result).not.toContain('object')
		expect(result).not.toContain('embed')
		expect(result).toContain('<p>text</p>')
	})

	test('应移除 HTML 注释', () => {
		const result = sanitizeHtml('<p>visible</p><!-- hidden comment -->')
		expect(result).not.toContain('<!--')
		expect(result).toContain('<p>visible</p>')
	})

	test('应保留安全标签（b/i/p/br/a/h1 等）', () => {
		const html = '<p>paragraph</p><b>bold</b><i>italic</i><br><a href="/safe">link</a><h1>title</h1>'
		const result = sanitizeHtml(html)
		expect(result).toContain('<p>')
		expect(result).toContain('<b>')
		expect(result).toContain('<i>')
		expect(result).toContain('<br>')
		expect(result).toContain('<a href="/safe">')
		expect(result).toContain('<h1>')
	})

	test('应移除无引号的 on* 事件处理器', () => {
		const result = sanitizeHtml('<div onload=doBad()>text</div>')
		expect(result).not.toContain('onload')
	})

	test('空字符串输入应返回空字符串', () => {
		const result = sanitizeHtml('   ')
		expect(result).toBe('')
	})
})
