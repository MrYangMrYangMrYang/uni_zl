/**
 * 通用 Toggle 工厂函数
 * 封装 followMixin 和 collectMixin 共有的"缓存优先检查 + 乐观更新 + loading 防重"模式。
 *
 * 使用方式：
 *   const likeHelper = createToggleHelper({
 *     storeCacheKey: 'likeCache',       // Vuex state 中的缓存字段名
 *     cacheMutation: 'SET_LIKE_CACHE',   // 写入缓存的 mutation 名
 *     checkApi: '/like/check',           // 检查状态的 API
 *     addApi: '/like/add',               // 添加的 API
 *     delApi: '/like/del',               // 删除的 API
 *     idField: 'postid'                  // 缓存键字段名
 *   })
 *
 *   // 在组件 methods 中：
 *   ...likeHelper.methods
 */

/**
 * 创建一个带缓存优先策略的 toggle 操作集合
 * @param {Object} config
 * @param {string} config.storeCacheKey - Vuex state 中缓存对象的 key
 * @param {string} config.cacheMutation - Vuex mutation 名称
 * @param {string} config.checkApi - 检查状态的 API 路径
 * @param {string} config.addApi - 添加/关注的 API 路径
 * @param {string} config.delApi - 取消/删除的 API 路径
 * @param {string} config.idField - 用于缓存键的字段名（默认 'id'）
 * @returns {{ methods: Object }} 可展开到 Vue 组件的 methods 中
 */
export function createToggleHelper(config) {
	const { storeCacheKey, cacheMutation, checkApi, addApi, delApi, idField = 'id' } = config

	return {
		methods: {
			/**
			 * 检查状态（缓存优先）
			 * 组件需在 data 中定义：state（boolean）、stateLoaded（boolean）
			 * @param {string|number} targetId - 目标实体ID
			 */
			async checkState(targetId) {
				const busid = this.getCurrentUserId?.() || this.brid || 0
				if (!busid) {
					this.state = false
					this.stateLoaded = true
					return false
				}

				// 缓存优先：命中则直接使用
				const cache = this.$store.state[storeCacheKey][targetId]
				if (cache !== undefined) {
					this.state = cache
					this.stateLoaded = true
					return true
				}

				try {
					const result = await uni.$u.http.post(
						checkApi,
						{ [idField]: targetId, busid },
						{ custom: { toast: false } }
					)

					this.state = result.code !== 0
					this.stateLoaded = true
					this.$store.commit(cacheMutation, { [idField]: targetId, isActive: this.state })
				} catch (error) {
					console.error(`[toggle-helper] checkState error for ${storeCacheKey}:`, error)
					this.state = false
					this.stateLoaded = true
				}
			},

			/**
			 * 切换状态（乐观更新 + loading 防重）
			 * 组件需在 data 中定义：loading（boolean）
			 * @param {string|number} targetId - 目标实体ID
			 * @param {Object} [extraData={}] - 额外请求参数
			 */
			async toggleState(targetId, extraData = {}) {
				if (this.loading) return
				const busid = this.getCurrentUserId?.() || this.brid || 0
				if (!busid) {
					uni.$toast.error('请先登录')
					return false
				}

				this.loading = true
				try {
					const data = { [idField]: targetId, busid, ...extraData }
					const result = this.state
						? await uni.$u.http.post(delApi, data)
						: await uni.$u.http.post(addApi, data)

					if (result.code === 0) {
						uni.$toast.error(result.msg)
						return false
					}

					uni.$toast.success(result.msg)
					this.state = !this.state
					this.$store.commit(cacheMutation, { [idField]: targetId, isActive: this.state })

					// 钩子：子组件可覆写以执行额外逻辑（如同步计数）
					if (typeof this.onToggleSuccess === 'function') {
						this.onToggleSuccess(targetId, this.state)
					}
				} catch (error) {
					console.error(`[toggle-helper] toggleState error for ${storeCacheKey}:`, error)
					uni.$toast.error('操作失败，请稍后重试')
				} finally {
					this.loading = false
				}
			}
		}
	}
}

export default { createToggleHelper }
