/**
 * 收藏状态 Mixin
 *
 * 职责：封装收藏状态检查与切换的通用逻辑
 * 消除 info.vue 中 CollectState + CollectToggle 的重复代码
 *
 * @module mixins/collectMixin
 *
 * @example
 * import { collectMixin } from '@/mixins/collectMixin'
 * export default {
 *   mixins: [collectMixin],
 *   methods: {
 *     async init() {
 *       await this.checkCollectState(postid)
 *     },
 *     async onCollectClick() {
 *       await this.toggleCollect(postid, authorId, cateId)
 *     }
 *   }
 * }
 */

import { getUserId } from '@/utils/auth.js'

export const collectMixin = {
	data() {
		return {
			collect: false,
			collectLoaded: false
		}
	},
	methods: {
		/**
		 * 检查收藏状态（优先读取 Vuex 缓存）
		 * @param {number} postid - 帖子ID
		 * @returns {Promise<boolean>} 是否已收藏
		 */
		async checkCollectState(postid) {
			const busid = getUserId()
			if (!busid) {
				this.collect = false
				this.collectLoaded = true
				return false
			}

			const cache = this.$store.state.collectCache[postid]
			if (cache !== undefined) {
				this.collect = cache
				this.collectLoaded = true
				return true
			}

			try {
				var result = await uni.$u.http.post('/collect/check', {
					postid: postid,
					busid: busid
				}, { custom: { toast: false } })

				this.collect = result.code == 0 ? false : true
				this.collectLoaded = true
				this.$store.commit('SET_COLLECT_CACHE', { postId: postid, isCollect: this.collect })
			} catch (error) {
				console.error('checkCollectState error:', error)
				this.collect = false
				this.collectLoaded = true
			}
		},

		/**
		 * 切换收藏状态（收藏/取消收藏）
		 * @param {number} postid - 帖子ID
		 * @param {number} followid - 帖子作者ID
		 * @param {number} cateid - 帖子分类ID
		 * @returns {Promise<boolean>} 操作是否成功
		 */
		async toggleCollect(postid, followid, cateid) {
			const busid = getUserId()
			if (!busid) {
				uni.$toast.error('请先登录')
				return false
			}

			try {
				var data = { postid, busid, followid, cateid }
				var result = this.collect
					? await uni.$u.http.post('/collect/del', data)
					: await uni.$u.http.post('/collect/add', data)

				if (result.code == 0) {
					uni.$toast.error(result.msg)
					return false
				}

				uni.$toast.success(result.msg)
				this.collect = !this.collect
				this.$store.commit('SET_COLLECT_CACHE', { postId: postid, isCollect: this.collect })
			} catch (error) {
				console.error('toggleCollect error:', error)
				uni.$toast.error('操作失败，请稍后重试')
			}
		}
	}
}
