/**
 * 全局错误处理工具
 *
 * 职责：
 * - 注册 Vue 全局错误处理器（捕获组件渲染、生命周期、事件处理等错误）
 * - 注册未处理 Promise 拒绝监听（捕获异步未捕获异常）
 * - 注册全局 onerror 监听（捕获 JS 运行时错误）
 * - 提供统一的错误格式化、分类、日志记录、用户提示
 * - 提供安全执行包装器（safeExecute）和异步方法装饰器（createSafeAsync）
 *
 * 错误处理三层架构：
 * - 第1层：页面级 try/catch —— 每个异步方法内部自行捕获，提供精确提示
 * - 第2层：请求拦截器（request.js）—— HTTP 错误、401 过期、网络超时等统一处理
 * - 第3层：全局兜底（本模块）—— 捕获所有未被前两层处理的异常，防止白屏崩溃
 *
 * @module utils/error-handler
 *
 * @example 在 main.js 中注册全局错误处理器
 * import { setupVueErrorHandler, setupUnhandledRejectionHandler, setupGlobalOnError } from '@/utils/error-handler.js'
 * setupVueErrorHandler(Vue)
 * setupUnhandledRejectionHandler()
 * setupGlobalOnError()
 *
 * @example 使用 safeExecute 包装可能出错的操作
 * import { safeExecute } from '@/utils/error-handler.js'
 * safeExecute(() => someRiskyOperation(), '操作失败，请重试')
 *
 * @example 使用 createSafeAsync 装饰器包装异步方法
 * import { createSafeAsync } from '@/utils/error-handler.js'
 * const safeMethod = createSafeAsync('加载失败')(target, key, descriptor)
 */

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

/** 内存中的错误日志队列（最多保留 MAX_LOG_SIZE 条） */
let errorLogs = []

/** 错误日志最大保留条数，超出后先进先出 */
const MAX_LOG_SIZE = 50

/**
 * 对错误进行分类和定级
 * 根据错误消息中的关键字判断错误的类别和严重程度，
 * 用于决定是否向用户展示提示以及展示何种提示
 *
 * @param {Error|any} error - 错误对象（支持 Error 实例或其他类型）
 * @returns {{ level: string, category: string }} 错误分类结果
 *   - level: ERROR_LEVEL 中的值（LOW / MEDIUM / HIGH）
 *   - category: 错误类别（network / syntax / code / auth / unknown）
 *
 * @example
 * classifyError(new Error('Network request timeout'))
 * // => { level: 'medium', category: 'network' }
 *
 * classifyError(new TypeError('x is not defined'))
 * // => { level: 'high', category: 'code' }
 */
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

/**
 * 将错误对象格式化为标准化的错误记录
 * 提取错误的关键信息（时间戳、消息、堆栈、组件名等），
 * 便于后续统一记录日志和排查问题
 *
 * @param {Error|any} error - 原始错误对象
 * @param {Vue|null} vm - 发生错误的 Vue 组件实例（全局 onerror 场景下为 null）
 * @param {string} [info=''] - Vue 提供的错误上下文信息（如生命周期钩子名称）
 * @returns {{ timestamp: string, message: string, stack: string, componentName: string, info: string, type: string }} 标准化的错误记录对象
 *
 * @example
 * formatError(new Error('test'), vm, 'mounted')
 * // => { timestamp: '2026-05-02T...', message: 'test', stack: '...', componentName: 'MyComponent', info: 'mounted', type: 'runtime' }
 */
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

/**
 * 将错误记录写入内存日志队列
 * 日志队列采用先进先出策略，超过 MAX_LOG_SIZE 后自动移除最早的记录。
 * 开发环境下会同时在控制台输出详细的错误信息
 *
 * @param {object} errorRecord - 由 formatError 生成的标准化错误记录对象
 *
 * @example
 * const record = formatError(new Error('test'), null, '')
 * logError(record)
 * // 开发环境控制台输出：[GlobalError] 2026-05-02T... [runtime] test
 */
function logError(errorRecord) {
	errorLogs.push(errorRecord)
	if (errorLogs.length > MAX_LOG_SIZE) {
		errorLogs.shift()
	}

	if (process.env.NODE_ENV === 'development') {
		console.error(`[GlobalError] ${errorRecord.timestamp} [${errorRecord.type}] ${errorRecord.message}`)
		if (errorRecord.stack) {
			console.error(errorRecord.stack)
		}
		if (errorRecord.info) {
			console.error(`[Info] ${errorRecord.info}`)
		}
	}
}

/**
 * 根据错误分类结果向用户展示提示
 * HIGH 级别提示"程序出现异常"，MEDIUM 级别根据类别展示具体提示，
 * LOW 级别不主动提示（避免打扰用户）
 *
 * @param {Error|any} error - 原始错误对象
 *
 * @example
 * showErrorToast(new Error('Network timeout'))
 * // 用户看到："网络异常，请检查网络连接"
 *
 * showErrorToast(new SyntaxError('Unexpected token'))
 * // 用户看到："程序出现异常，请稍后重试"
 */
function showErrorToast(error) {
	const { level, category } = classifyError(error)

	if (level === ERROR_LEVEL.HIGH) {
		uni.$toast?.error('程序出现异常，请稍后重试')
	} else if (level === ERROR_LEVEL.MEDIUM) {
		if (category === 'network') {
			uni.$toast?.error('网络异常，请检查网络连接')
		} else if (category === 'auth') {
			uni.$toast?.error('权限不足，请重新登录')
		} else {
			uni.$toast?.error('操作失败，请稍后重试')
		}
	}
}

/**
 * 注册 Vue 全局错误处理器
 * 捕获以下场景中的错误：
 * - 组件渲染过程中的异常
 * - 生命周期钩子（created、mounted 等）中的异常
 * - 事件处理函数中的异常
 * - Vue 侦听器中的异常
 *
 * 同时注册 Vue 警告处理器，开发环境下输出组件警告信息
 *
 * @param {VueConstructor} Vue - Vue 构造函数
 * @returns {void}
 *
 * @example
 * import Vue from 'vue'
 * import { setupVueErrorHandler } from '@/utils/error-handler.js'
 * setupVueErrorHandler(Vue)
 */
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

/**
 * 注册未处理 Promise 拒绝监听器
 * 捕获所有未被 .catch() 处理的 Promise 拒绝（rejection），
 * 防止异步异常静默丢失导致难以排查的 Bug
 *
 * 仅在 window 对象存在时注册（H5 环境有效），
 * 小程序环境需依赖 Vue errorHandler 兜底
 *
 * @returns {void}
 *
 * @example
 * import { setupUnhandledRejectionHandler } from '@/utils/error-handler.js'
 * setupUnhandledRejectionHandler()
 *
 * // 以下代码抛出的拒绝会被本处理器捕获
 * Promise.reject('something went wrong')
 */
export function setupUnhandledRejectionHandler() {
	if (typeof window !== 'undefined') {
		window.addEventListener('unhandledrejection', (event) => {
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

/**
 * 注册全局 onerror 监听器
 * 捕获以下场景中的 JS 运行时错误：
 * - 未定义变量引用
 * - 函数调用错误
 * - 资源加载失败（部分浏览器）
 *
 * 保留已有的 onerror 处理器，避免覆盖其他库的监听
 *
 * 仅在 window 对象存在时注册（H5 环境有效），
 * 小程序环境需依赖 uni.onError 或 Vue errorHandler 兜底
 *
 * @returns {void}
 *
 * @example
 * import { setupGlobalOnError } from '@/utils/error-handler.js'
 * setupGlobalOnError()
 *
 * // 以下代码抛出的错误会被本处理器捕获
 * undefinedFunction()
 */
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

/**
 * 安全执行包装器
 * 同时支持同步函数和异步函数（返回 Promise 的函数），
 * 自动捕获异常并向用户展示提示，避免未捕获异常导致白屏
 *
 * 同步函数：捕获后返回 undefined
 * 异步函数：捕获后返回 Promise.reject(error)，调用方可选择继续处理或忽略
 *
 * @param {Function} fn - 需要安全执行的函数（同步或异步）
 * @param {string} [fallbackMessage='操作失败，请稍后重试'] - 捕获异常后向用户展示的提示文字
 * @returns {any|Promise} 同步函数返回执行结果或 undefined；异步函数返回 Promise
 *
 * @example 包装同步函数
 * const result = safeExecute(() => JSON.parse(str), '数据解析失败')
 *
 * @example 包装异步函数
 * const result = await safeExecute(() => uni.$u.http.post('/api/data'), '加载失败')
 */
export function safeExecute(fn, fallbackMessage = '操作失败，请稍后重试') {
	try {
		const result = fn()
		if (result && typeof result.catch === 'function') {
			return result.catch((error) => {
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

/**
 * 创建异步方法安全装饰器
 * 返回一个 ES6 装饰器函数，用于包装类的异步方法，
 * 自动添加 try/catch 错误处理，捕获异常后向用户展示提示
 *
 * 适用于 Vue 组件 methods 中的异步方法，防止未捕获的 Promise 拒绝
 *
 * @param {string} [fallbackMessage='操作失败，请稍后重试'] - 捕获异常后向用户展示的提示文字
 * @returns {Function} ES6 方法装饰器函数，接收 (target, key, descriptor) 参数
 *
 * @example 在 Vue 组件中使用
 * import { createSafeAsync } from '@/utils/error-handler.js'
 *
 * export default {
 *   methods: {
 *     @createSafeAsync('加载列表失败')
 *     async loadList() {
 *       const res = await uni.$u.http.post('/list')
 *       this.list = res.data
 *     }
 *   }
 * }
 */
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

/**
 * 获取内存中的错误日志副本
 * 返回当前累积的所有错误记录（最多 MAX_LOG_SIZE 条），
 * 可用于调试面板展示或批量上报到日志服务器
 *
 * @returns {Array<object>} 错误日志数组的浅拷贝
 *
 * @example
 * const logs = getErrorLogs()
 * console.log(`当前共 ${logs.length} 条错误记录`)
 */
export function getErrorLogs() {
	return [...errorLogs]
}

/**
 * 清空内存中的错误日志
 * 清除所有已记录的错误，通常在日志上报后调用
 *
 * @returns {void}
 *
 * @example
 * const logs = getErrorLogs()
 * uploadLogs(logs)
 * clearErrorLogs()
 */
export function clearErrorLogs() {
	errorLogs = []
}

/** 默认导出所有方法 */
export default {
	setupVueErrorHandler,
	setupUnhandledRejectionHandler,
	setupGlobalOnError,
	safeExecute,
	createSafeAsync,
	getErrorLogs,
	clearErrorLogs
}
