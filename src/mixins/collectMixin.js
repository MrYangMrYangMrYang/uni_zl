import { getUserId } from '@/utils/auth.js'

export const collectMixin = {
	data() {
		return {
			collect: false,
			collectLoaded: false,
			collectLoading: false
		}
	},
	methods: {
		async checkCollectState(postid) {
			const busid = getUserId()
			if (!busid) {
				this.collect = false
				this.collectLoaded = true
				return false
			}

			// 缓存优先：命中则直接使用，避免重复请求检测接口
			const cache = this.$store.state.collectCache[postid]
			if (cache !== undefined) {
				this.collect = cache
				this.collectLoaded = true
				return true
			}

			try {
				const result = await uni.$u.http.post(
					'/collect/check',
					{
						postid: postid,
						busid: busid
					},
					{ custom: { toast: false } }
				)

				this.collect = result.code == 0 ? false : true
				this.collectLoaded = true
				this.$store.commit('SET_COLLECT_CACHE', { postId: postid, isCollect: this.collect })
			} catch (error) {
				console.error('checkCollectState error:', error)
				this.collect = false
				this.collectLoaded = true
			}
		},

		async toggleCollect(postid, followid, cateid) {
			if (this.collectLoading) return
			const busid = getUserId()
			if (!busid) {
				uni.$toast.error('请先登录')
				return false
			}

			this.collectLoading = true
			try {
				const data = { postid, busid, followid, cateid }
				const result = this.collect
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
			} finally {
				this.collectLoading = false
			}
		}
	}
}
