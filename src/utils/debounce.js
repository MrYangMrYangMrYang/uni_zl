// 防抖：延迟执行，重复调用会重置计时器（适用于搜索输入）
export function debounce(fn, delay = 300) {
	let timer = null
	return function (...args) {
		if (timer) clearTimeout(timer)
		timer = setTimeout(() => {
			fn.apply(this, args)
			timer = null
		}, delay)
	}
}

// 节流：立即执行首次，限制后续频率（适用于按钮防重复点击）
export function throttle(fn, interval = 500) {
	let lastTime = 0
	return function (...args) {
		const now = Date.now()
		if (now - lastTime >= interval) {
			fn.apply(this, args)
			lastTime = now
		}
	}
}
