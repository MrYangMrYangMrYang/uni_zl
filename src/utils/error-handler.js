import constants from '../constants'
const MAX_ERROR_LOG_SIZE = constants.MAX_ERROR_LOG_SIZE
// 错误处理三层架构：页面try/catch → 请求拦截器 → 全局兜底（本模块）

/** 错误严重程度枚举 */
const ERROR_LEVEL = {
	/** 低级别 —— 未知错误，不主动提示用户 */
	LOW: 'low',
	/** 中级别 —— 网络/权限错误，提示用户可恢复的操作 */
	MEDIUM: 'medium',
	/** 高级别 —— 代码/语法错误，提示用户程序异常 */
	HIGH: 'high'
}

/** 错误来源类型枚举 */
const ERROR_TYPE = {
	/** 来自 Vue 组件（渲染、生命周期、事件处理等） */
	VUE: 'vue',
	/** 来自未捕获的 Promise 拒绝 */
	PROMISE: 'promise',
	/** 来自全局 onerror（JS 运行时错误） */
	RUNTIME: 'runtime'
}

/** 内存中的错误日志队列（最多保留 MAX_ERROR_LOG_SIZE 条） */
let errorLogs = []

/** 错误日志最大保留条数，超出后先进先出 */

function classifyError(error) {
	const message = (error?.message || String(error)).toLowerCase()

	if (message.includes('network') || message.includes('timeout') || message.includes('request')) {
		return { level: ERROR_LEVEL.MEDIUM, category: 'network' }
	}
	if (message.includes('syntax') || message.includes('parse')) {
		return { level: ERROR_LEVEL.HIGH, category: 'syntax' }
	}
	if (message.includes('type') || message.includes('reference') || message.includes('is not defined')) {
		return { level: ERROR_LEVEL.HIGH, category: 'code' }
	}
	if (message.includes('permission') || message.includes('auth')) {
		return { level: ERROR_LEVEL.MEDIUM, category: 'auth' }
	}

	return { level: ERROR_LEVEL.LOW, category: 'unknown' }
}

function formatError(error, vm, info) {
	const timestamp = new Date().toISOString()
	const componentName = vm?.$options?.name || vm?.$options?._componentTag || 'Anonymous'

	return {
		timestamp,
		message: error?.message || String(error),
		stack: error?.stack || '',
		componentName,
		info: info || '',
		type: ERROR_TYPE.RUNTIME
	}
}

function logError(errorRecord) {
	// 对错误进行分级分类，便于后续按级别过滤上报
	const { level, category } = classifyError(errorRecord)
	errorRecord.level = level
	errorRecord.category = category

	errorLogs.push(errorRecord)
	if (errorLogs.length > MAX_ERROR_LOG_SIZE) {
		errorLogs.shift()
	}

	if (process.env.NODE_ENV === 'development') {
		console.error(
			`[GlobalError] ${errorRecord.timestamp} [${errorRecord.type}][${level}/${category}] ${errorRecord.message}`
		)
		if (errorRecord.stack) {
			console.error(errorRecord.stack)
		}
		if (errorRecord.info) {
			console.error(`[Info] ${errorRecord.info}`)
		}
	}
}

export function setupVueErrorHandler(Vue) {
	Vue.config.errorHandler = (error, vm, info) => {
		const errorRecord = formatError(error, vm, info)
		errorRecord.type = ERROR_TYPE.VUE
		logError(errorRecord)

		if (process.env.NODE_ENV === 'development') {
			console.error(`[Vue Error] Component: ${errorRecord.componentName}, Info: ${info}`)
		}
	}

	Vue.config.warnHandler = (msg, vm, trace) => {
		if (process.env.NODE_ENV === 'development') {
			console.warn(`[Vue Warn] ${msg}\nComponent: <${vm?.$options?.name || 'Anonymous'}>\nTrace: ${trace}`)
		}
	}
}

export function setupUnhandledRejectionHandler() {
	if (typeof window !== 'undefined') {
		window.addEventListener('unhandledrejection', event => {
			const error = event.reason
			const errorRecord = formatError(error, null, 'unhandledrejection')
			errorRecord.type = ERROR_TYPE.PROMISE
			logError(errorRecord)

			event.preventDefault()

			if (process.env.NODE_ENV === 'development') {
				console.error('[Unhandled Promise Rejection]', error)
			}
		})
	}
}

export function setupGlobalOnError() {
	if (typeof window !== 'undefined') {
		const originalOnError = window.onerror

		window.onerror = (message, source, lineno, colno, error) => {
			const errorRecord = {
				timestamp: new Date().toISOString(),
				message: String(message),
				stack: error?.stack || '',
				source: source || '',
				lineno: lineno || 0,
				colno: colno || 0,
				type: ERROR_TYPE.RUNTIME
			}
			logError(errorRecord)

			if (typeof originalOnError === 'function') {
				return originalOnError(message, source, lineno, colno, error)
			}

			return false
		}
	}
}

export function safeExecute(fn, fallbackMessage = '操作失败，请稍后重试') {
	try {
		const result = fn()
		if (result && typeof result.catch === 'function') {
			return result.catch(error => {
				console.error('[safeExecute async]', error)
				uni.$toast?.error(fallbackMessage)
				return Promise.reject(error)
			})
		}
		return result
	} catch (error) {
		console.error('[safeExecute sync]', error)
		uni.$toast?.error(fallbackMessage)
		return undefined
	}
}

export function createSafeAsync(fallbackMessage = '操作失败，请稍后重试') {
	return function (target, key, descriptor) {
		const originalMethod = descriptor.value

		descriptor.value = async function (...args) {
			try {
				return await originalMethod.apply(this, args)
			} catch (error) {
				console.error(`[SafeAsync] ${target.constructor?.name || ''}.${key}:`, error)
				uni.$toast?.error(fallbackMessage)
			}
		}

		return descriptor
	}
}

export function getErrorLogs() {
	return [...errorLogs]
}

export function clearErrorLogs() {
	errorLogs = []
}

export default {
	setupVueErrorHandler,
	setupUnhandledRejectionHandler,
	setupGlobalOnError,
	safeExecute,
	createSafeAsync,
	getErrorLogs,
	clearErrorLogs
}
