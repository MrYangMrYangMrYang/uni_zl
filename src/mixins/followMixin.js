/**
 * 关注状态 Mixin
 *
 * 职责：封装关注状态检查与切换的通用逻辑
 * 消除 info.vue / user.vue 中 AttentionState + AttentionToggle 的重复代码
 *
 * @module mixins/followMixin
 *
 * @example
 * import { followMixin } from '@/mixins/followMixin'
 * export default {
 *   mixins: [followMixin],
 *   methods: {
 *     async init() {
 *       await this.checkFollowState(targetUserId)
 *     },
 *     async onFollowClick() {
 *       await this.toggleFollow(targetUserId)
 *     }
 *   }
 * }
 */

import { getUserId } from '@/utils/auth.js'

export const followMixin = {
	data() {
		return {
			attention: false,
			attentionLoaded: false
		}
	},
	methods: {
		/**
		 * 检查关注状态（优先读取 Vuex 缓存）
		 * @param {number} followId - 被查看的用户ID
		 * @returns {Promise<boolean>} 是否已关注
		 */
		async checkFollowState(followId) {
			const busid = getUserId()
			if (!busid) {
				this.attention = false
				this.attentionLoaded = true
				return false
			}

			const cache = this.$store.state.followCache[followId]
			if (cache !== undefined) {
				this.attention = cache
				this.attentionLoaded = true
				return true
			}

			try {
				var result = await uni.$u.http.post('/attention/check', {
					followid: followId,
					busid: busid
				}, { custom: { toast: false } })

				this.attention = result.code == 0 ? false : true
				this.attentionLoaded = true
				this.$store.commit('SET_FOLLOW_CACHE', { userId: followId, isFollow: this.attention })
			} catch (error) {
				console.error('checkFollowState error:', error)
				this.attention = false
				this.attentionLoaded = true
			}
		},

		/**
		 * 切换关注状态（关注/取消关注）
		 * @param {number} followId - 被关注的用户ID
		 * @returns {Promise<boolean>} 操作是否成功
		 */
		async toggleFollow(followId) {
			const busid = getUserId()
			if (!busid) {
				uni.$toast.error('请先登录')
				return false
			}

			try {
				var data = { followid: followId, busid: busid }
				var result = this.attention
					? await uni.$u.http.post('/attention/del', data)
					: await uni.$u.http.post('/attention/add', data)

				if (result.code == 0) {
					uni.$toast.error(result.msg)
					return false
				}

				uni.$toast.success(result.msg)
				this.attention = !this.attention
				this.$store.commit('SET_FOLLOW_CACHE', { userId: followId, isFollow: this.attention })

				const newCount = this.attention
					? (this.$store.state.userInfo.follow_count || 0) + 1
					: Math.max(0, (this.$store.state.userInfo.follow_count || 0) - 1)
				this.$store.commit('UPDATE_FOLLOW_COUNT', newCount)
			} catch (error) {
				console.error('toggleFollow error:', error)
				uni.$toast.error('操作失败，请稍后重试')
			}
		}
	}
}
