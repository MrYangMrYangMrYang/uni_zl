import { getUserId } from '@/utils/auth.js'

export const followMixin = {
	data() {
		return {
			attention: false,
			attentionLoaded: false,
			followLoading: false
		}
	},
	methods: {
		async checkFollowState(followId) {
			const busid = getUserId()
			if (!busid) {
				this.attention = false
				this.attentionLoaded = true
				return false
			}

			// 缓存优先：命中则直接使用，避免重复请求检测接口
			const cache = this.$store.state.followCache[followId]
			if (cache !== undefined) {
				this.attention = cache
				this.attentionLoaded = true
				return true
			}

			try {
				const result = await uni.$u.http.post(
					'/attention/check',
					{
						followid: followId,
						busid: busid
					},
					{ custom: { toast: false } }
				)

				this.attention = result.code == 0 ? false : true
				this.attentionLoaded = true
				this.$store.commit('SET_FOLLOW_CACHE', { userId: followId, isFollow: this.attention })
			} catch (error) {
				console.error('checkFollowState error:', error)
				this.attention = false
				this.attentionLoaded = true
			}
		},

		async toggleFollow(followId) {
			if (this.followLoading) return
			const busid = getUserId()
			if (!busid) {
				uni.$toast.error('请先登录')
				return false
			}

			this.followLoading = true
			try {
				const data = { followid: followId, busid: busid }
				const result = this.attention
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
			} finally {
				this.followLoading = false
			}
		}
	}
}
