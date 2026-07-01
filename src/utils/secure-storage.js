// 安全存储工具：对敏感数据做编码存储 + 过期校验
// 缓解 localStorage 被直接读取时看到明文 token 的问题，并支持过期自动清理
// 注意：前端方案无法完全防御 XSS，真正的防护需 HttpOnly Cookie（需后端配合）

const EXPIRE_KEY_SUFFIX = '_expire'
const PREFIX = 'enc:'

// UTF-8 安全的 base64 编码：encodeURIComponent 先把非 ASCII 转 %XX 序列，再编码
function encode(value) {
	try {
		const json = JSON.stringify(value)
		const encoded = encodeURIComponent(json)
		/* eslint-disable no-unreachable */
		// #ifdef H5
		return PREFIX + btoa(encoded)
		// #endif
		// #ifndef H5
		// 小程序/App 端：将字符串转 ArrayBuffer 再 base64 编码
		const buf = new ArrayBuffer(encoded.length)
		const bufView = new Uint8Array(buf)
		for (let i = 0; i < encoded.length; i++) {
			bufView[i] = encoded.charCodeAt(i)
		}
		return PREFIX + uni.arrayBufferToBase64(buf)
		// #endif
		/* eslint-enable no-unreachable */
	} catch (e) {
		return value
	}
}

function decode(raw) {
	if (typeof raw !== 'string') return raw
	// 兼容旧版明文存储：尝试直接 JSON.parse，成功说明是升级前的明文数据
	if (!raw.startsWith(PREFIX)) {
		try {
			return JSON.parse(raw)
		} catch (e) {
			return raw
		}
	}
	try {
		const payload = raw.slice(PREFIX.length)
		let encoded
		// #ifdef H5
		encoded = atob(payload)
		// #endif
		// #ifndef H5
		const buf = uni.base64ToArrayBuffer(payload)
		encoded = String.fromCharCode.apply(null, new Uint8Array(buf))
		// #endif
		return JSON.parse(decodeURIComponent(encoded))
	} catch (e) {
		return null
	}
}

export const secureStorage = {
	set(key, value, expireIn = 0) {
		try {
			uni.setStorageSync(key, encode(value))
			// expireIn 为秒数，0 表示不限期（如用户主动登录的场景）
			if (expireIn > 0) {
				const expireAt = Date.now() + expireIn * 1000
				uni.setStorageSync(key + EXPIRE_KEY_SUFFIX, expireAt)
			} else {
				uni.removeStorageSync(key + EXPIRE_KEY_SUFFIX)
			}
		} catch (e) {
			console.warn('[secureStorage] set failed:', key)
		}
	},

	get(key) {
		try {
			// 过期校验：到期则清理并返回空
			const expireAt = uni.getStorageSync(key + EXPIRE_KEY_SUFFIX)
			if (expireAt && Date.now() > expireAt) {
				this.remove(key)
				return null
			}
			const raw = uni.getStorageSync(key)
			if (raw === '' || raw === null || raw === undefined) return null
			return decode(raw)
		} catch (e) {
			return null
		}
	},

	remove(key) {
		uni.removeStorageSync(key)
		uni.removeStorageSync(key + EXPIRE_KEY_SUFFIX)
	}
}

export default secureStorage
