/**
 * 知了论坛 PWA Service Worker
 * 策略：
 *   - 静态资源 (JS/CSS/字体/图片) → Cache First（优先缓存，快速加载）
 *   - API 请求 (/wc) → Network First（优先网络，保证数据实时）
 *   - HTML → Network First（保证最新版本）
 */

const CACHE_NAME = 'zhiliao-v2'

// 需要预缓存的静态资源路径模式
const STATIC_PATTERNS = [/\.(js|css)$/, /\.(png|jpg|jpeg|gif|svg|ico|webp)$/, /\.(woff|woff2|ttf|eot)$/, /^\/static\//]

// API 路径标识
const API_PATH = '/wc'

// 判断是否为静态资源
function isStatic(url) {
	return STATIC_PATTERNS.some(pattern => pattern.test(url))
}

// 判断是否为 API 请求
function isApi(url) {
	return url.includes(API_PATH)
}

// ====== 安装：预缓存基础页面 ======
self.addEventListener('install', event => {
	event.waitUntil(
		caches.open(CACHE_NAME).then(cache => {
			return cache.addAll(['/', '/index.html']).catch(() => {
				// 预缓存失败不阻塞安装
			})
		})
	)
	self.skipWaiting()
})

// ====== 激活：清理旧缓存 ======
self.addEventListener('activate', event => {
	event.waitUntil(
		caches.keys().then(keys => {
			return Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
		})
	)
	self.clients.claim()
})

// ====== 请求拦截 ======
self.addEventListener('fetch', event => {
	const { request } = event
	const url = request.url

	// 跳过非 GET 请求
	if (request.method !== 'GET') return

	// API 请求 → Network First
	if (isApi(url)) {
		event.respondWith(networkFirst(request))
		return
	}

	// HTML 导航请求 → Network First
	if (request.mode === 'navigate') {
		event.respondWith(networkFirst(request))
		return
	}

	// 静态资源 → Cache First
	if (isStatic(url)) {
		event.respondWith(cacheFirst(request))
		return
	}

	// 其余请求 → Network First
	event.respondWith(networkFirst(request))
})

// ====== 缓存策略 ======

/** Cache First：优先读缓存，缓存未命中时请求网络并缓存 */
async function cacheFirst(request) {
	const cached = await caches.match(request)
	if (cached) return cached

	try {
		const response = await fetch(request)
		if (response.ok) {
			const cache = await caches.open(CACHE_NAME)
			cache.put(request, response.clone())
		}
		return response
	} catch (error) {
		// 网络不可用时返回空响应
		return new Response('', { status: 408 })
	}
}

/** Network First：优先请求网络，失败时回退缓存 */
async function networkFirst(request) {
	try {
		const response = await fetch(request)
		if (response.ok) {
			const cache = await caches.open(CACHE_NAME)
			cache.put(request, response.clone())
		}
		return response
	} catch (error) {
		const cached = await caches.match(request)
		if (cached) return cached

		// 完全离线且无缓存时返回友好提示
		if (request.mode === 'navigate') {
			return new Response(
				`<!DOCTYPE html>
				<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
				<title>知了论坛 - 离线</title>
				<style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f8f8f8;color:#333;flex-direction:column;gap:16px}
				h1{font-size:24px;color:#0173de} p{color:#999}</style></head>
				<body><h1>📡 当前离线</h1><p>请检查网络连接后重试</p></body></html>`,
				{ headers: { 'Content-Type': 'text/html; charset=utf-8' } }
			)
		}

		return new Response('', { status: 408 })
	}
}
