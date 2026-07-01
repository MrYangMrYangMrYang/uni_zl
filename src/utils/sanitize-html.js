/**
 * 简易 HTML 净化器 — 白名单过滤用户生成的富文本内容
 * 防止 XSS 攻击（script 注入、事件处理器等）
 *
 * 用法：
 *   import { sanitizeHtml } from '@/utils/sanitize-html.js'
 *   const safeHtml = sanitizeHtml(userContent)
 */

// 允许的安全标签及其属性
const ALLOWED_TAGS = {
	b: [],
	i: [],
	em: [],
	strong: [],
	a: ['href', 'title', 'target'],
	p: [],
	br: [],
	img: ['src', 'alt', 'width', 'height'],
	ul: [],
	ol: [],
	li: [],
	code: [],
	pre: [],
	blockquote: [],
	h1: [],
	h2: [],
	h3: [],
	h4: [],
	h5: [],
	h6: [],
	span: [],
	div: [],
	table: [],
	thead: [],
	tbody: [],
	tr: [],
	td: [],
	th: [],
	hr: [],
	sup: [],
	sub: []
}

// 所有允许的标签名（预留扩展用）
// eslint-disable-next-line no-unused-vars
const TAG_NAMES = Object.keys(ALLOWED_TAGS)

/**
 * 移除危险属性和标签
 * @param {string} html - 原始 HTML 字符串
 * @returns {string} 净化后的安全 HTML
 */
export function sanitizeHtml(html) {
	if (!html || typeof html !== 'string') return ''

	let result = html

	// 1. 移除 <script> 标签及其内容
	result = result.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')

	// 2. 移除所有 on* 事件处理器属性
	result = result.replace(/\s+on\w+\s*=\s*(['"]).*?\1/gi, '')
	result = result.replace(/\s+on\w+\s*=\s*[^\s>]+/gi, '')

	// 3. 移除 javascript: 协议
	result = result.replace(/href\s*=\s*(['"])javascript:[^'"]*\1/gi, 'href=$1#$1')
	result = result.replace(/src\s*=\s*(['"])javascript:[^'"]*\1/gi, 'src=$1#$1')

	// 4. 移除 <iframe>、<object>、<embed> 等危险标签
	result = result.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
	result = result.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
	result = result.replace(/<embed\b[^>]*\/?>/gi, '')

	// 5. 移除 HTML 注释（可能包含条件语句或恶意代码）
	result = result.replace(/<!--[\s\S]*?-->/g, '')

	return result.trim()
}

export default { sanitizeHtml }
