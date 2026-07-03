/**
 * 评论交互 Mixin
 * 封装 info.vue（一级评论）和 comment.vue（子评论）中重复的点赞、删除、采纳、提交逻辑。
 *
 * 使用此 mixin 的组件需提供：
 *   getCurrentUserId()  — 返回当前登录用户ID，用于登录态校验（0 表示未登录）
 *   refreshAfterAction() — 操作成功后刷新评论列表（可选，默认只关闭弹窗）
 *   getPostId()          — 返回当前帖子ID
 */

export const commentMixin = {
	data() {
		return {
			MenuShow: false,
			AnswerShow: false,
			comid: 0,
			accept: 0,
			commentForm: {
				content: ''
			},
			// 正在点赞的评论ID集合，防止重复请求
			likePending: new Set(),
			rules: {
				content: {
					type: 'string',
					required: true,
					message: '内容不能为空',
					trigger: ['blur', 'change']
				}
			}
		}
	},

	methods: {
		/**
		 * 点赞/取消点赞（乐观更新 + 防重复点击）
		 * @param {Object} comment - 评论对象，需含 id, like_status, likes_count 字段
		 */
		async LikeToggle(comment) {
			if (this.likePending.has(comment.id)) return
			if (!this.getCurrentUserId()) {
				uni.$toast.error('请先登录')
				return false
			}

			this.likePending.add(comment.id)
			try {
				const data = {
					comid: comment.id,
					postid: this.getPostId(),
					busid: this.getCurrentUserId()
				}

				const result = await uni.$u.http.post('/comment/like', data)

				if (result.code == 0) {
					uni.$toast.error(result.msg)
					return false
				}

				uni.$toast.success(result.msg)

				// 乐观更新UI
				comment.like_status = !comment.like_status
				comment.likes_count = comment.like_status ? ++comment.likes_count : --comment.likes_count
			} catch (error) {
				console.error('LikeToggle error:', error)
				uni.$toast.error('操作失败，请稍后重试')
			} finally {
				this.likePending.delete(comment.id)
			}
		},

		/**
		 * 打开评论操作菜单（"更多"按钮点击）
		 * @param {Object} comment - 目标评论对象
		 */
		openActionMenu(comment) {
			if (!this.getCurrentUserId()) {
				uni.$toast.error('请先登录')
				return false
			}

			this.comid = comment.id
			this.accept = comment.busid

			// 供子组件覆盖：记录额外状态（如采纳状态）
			if (typeof this.onBeforeMenuOpen === 'function') {
				this.onBeforeMenuOpen(comment)
			}

			this.MenuShow = true
		},

		/**
		 * 删除评论
		 */
		async delcom() {
			if (!this.getCurrentUserId()) {
				uni.$toast.error('请先登录')
				return false
			}

			try {
				const data = {
					postid: this.getPostId(),
					busid: this.getCurrentUserId(),
					comid: this.comid
				}

				const result = await uni.$u.http.post('/comment/del', data)

				if (result.code == 0) {
					uni.$toast.error(result.msg)
					return false
				}

				uni.$toast.success(result.msg)

				this.MenuShow = false
				this.AnswerShow = false

				this.refreshAfterAction()
			} catch (error) {
				console.error('delcom error:', error)
				uni.$toast.error('删除失败，请稍后重试')
			}
		},

		/**
		 * 采纳答案
		 */
		async select() {
			if (!this.getCurrentUserId()) {
				uni.$toast.error('请先登录')
				return false
			}

			try {
				const data = {
					postid: this.getPostId(),
					comid: this.comid,
					accept: this.accept
				}

				const result = await uni.$u.http.post('/post/select', data)

				if (result.code == 0) {
					uni.$toast.error(result.msg)
					return false
				}

				uni.$toast.success(result.msg)

				this.MenuShow = false
				this.AnswerShow = false

				this.refreshAfterAction()
			} catch (error) {
				console.error('select error:', error)
				uni.$toast.error('操作失败，请稍后重试')
			}
		},

		/**
		 * 提交评论/回答
		 * 子组件需在调用前设置 this.comid（被回复的评论ID/pid）和 this.accept（被回复者ID）
		 * @param {number} pid - 父评论ID（0=一级回答）
		 */
		async submitComment(pid = 0) {
			if (!this.getCurrentUserId()) {
				uni.$toast.error('请先登录')
				return false
			}

			if (!this.$refs.answer) return false

			this.$refs.answer
				.validate()
				.then(async () => {
					try {
						const data = {
							postid: this.getPostId(),
							pid: pid,
							content: this.commentForm.content,
							busid: this.getCurrentUserId()
						}

						const result = await uni.$u.http.post('/post/answer', data)

						if (result.code == 0) {
							uni.$toast.error(result.msg)
							return false
						}

						uni.$toast.success(result.msg)

						this.MenuShow = false
						this.AnswerShow = false
						this.commentForm.content = ''

						this.refreshAfterAction()
					} catch (error) {
						console.error('submitComment error:', error)
						uni.$toast.error('提交失败，请稍后重试')
					}
				})
				.catch(error => {
					console.error('validate error:', error)
					uni.$toast.error('内容不能为空')
				})
		},

		/**
		 * 操作成功后刷新评论列表（默认只关闭弹窗，子组件可覆盖以刷新数据）
		 */
		refreshAfterAction() {
			// 默认空实现，子组件覆盖
		}
	}
}
