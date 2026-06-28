<template>
	<view class="comlist">
		<view class="list" v-if="comlist.length > 0">
			<view class="item" v-for="(item, index) in comlist" :key="index">
				<view class="item-header">
					<navigator :url="`/pages-business/user?busid=${item.busid}`" class="avatar-link">
						<image class="avatar" mode="aspectFill" lazy-load :src="item.business.avatar_text"></image>
					</navigator>
					<view class="item-author">
						<view class="author-name-row">
							<text class="author-name">{{ item.business.nickname }}</text>
							<u-tag v-if="item.busid == ftrid" text="楼主" type="error" plain size="mini"></u-tag>
							<u-tag
								v-else-if="status == '1' && cnrid && item.status == '1'"
								text="已采纳"
								type="success"
								plain
								size="mini"
							></u-tag>
						</view>
						<text class="author-desc">{{ item.business.lable || '暂无简介' }}</text>
					</view>
					<text class="item-time">{{ item.createtime_text }}</text>
				</view>

				<view class="item-content">
					<text v-if="item.parent_text" class="reply-to">@{{ item.parent_text }}：</text>
					{{ item.content }}
				</view>

				<view class="item-footer">
					<view class="footer-left">
						<view class="action-btn like-btn" @click="LikeToggle(item)">
							<u-icon
								:name="item.like_status ? 'thumb-up-fill' : 'thumb-up'"
								:color="item.like_status ? '#19be6b' : '#999'"
								size="18"
							></u-icon>
							<text :class="{ active: item.like_status }">
								{{ item.likes_count > 0 ? item.likes_count : '点赞' }}
							</text>
						</view>
						<view class="action-btn comment-btn" @click="CommentToggle(index)">
							<u-icon name="chat" :color="item.show ? '#19be6b' : '#999'" size="18"></u-icon>
							<text v-if="item.comment_count > 0">展开{{ item.comment_count }}条回复</text>
							<text v-else>暂无回复</text>
							<u-icon :name="item.show ? 'arrow-up' : 'arrow-down'" size="12" color="#999"></u-icon>
						</view>
					</view>
					<view class="footer-right">
						<view class="more-btn" @click="answers(item)">
							<u-icon name="more-dot-fill" size="22" color="#999"></u-icon>
						</view>
					</view>
				</view>

				<!-- 递归渲染子评论 -->
				<comment
					v-if="item.comment_count > 0 && item.show && depth < maxDepth"
					:postid="item.postid"
					:pid="item.id"
					:busid="item.busid"
					:brid="brid"
					:ftrid="ftrid"
					:status="status"
					:cnrid="cnrid"
					:depth="depth + 1"
				></comment>
				<!-- 层级过深时折叠提示，避免无限递归导致性能问题 -->
				<view v-else-if="item.comment_count > 0 && item.show && depth >= maxDepth" class="depth-limit-hint">
					<u-icon name="more-circle" size="14" color="#999"></u-icon>
					<text>回复层级较深，已折叠</text>
				</view>
			</view>
		</view>

		<action-menu
			v-model="MenuShow"
			:showComment="showCommentBtn"
			:showAccept="showAcceptBtn"
			:showDelete="showDeleteBtn"
			:acceptStatus="acceptStatusText"
			@comment="AnswerShow = true"
			@accept="select"
			@delete="delcom"
		></action-menu>

		<u-popup mode="bottom" :show="AnswerShow" @close="AnswerShow = false" round="10">
			<view class="answer">
				<view class="answer-header">
					<text class="answer-title">撰写评论</text>
					<u-icon name="close" size="20" color="#999" @click="AnswerShow = false"></u-icon>
				</view>
				<u--form labelPosition="top" :model="answer" :rules="rules" ref="answer">
					<u-form-item prop="content" ref="content">
						<u--textarea
							v-model="answer.content"
							placeholder="请输入您的评论..."
							count
							height="150"
						></u--textarea>
					</u-form-item>
					<u-button
						type="primary"
						shape="circle"
						@click="submit"
						:disabled="!answer.content"
						:customStyle="{ background: 'linear-gradient(135deg, #0173de, #4cd964)' }"
					>
						提交评论
					</u-button>
				</u--form>
			</view>
		</u-popup>

		<u-toast ref="notice"></u-toast>
	</view>
</template>

<script>
import Vue from 'vue'
import ActionMenu from './ActionMenu.vue'

export default {
	components: {
		// 异步加载自身实现递归渲染子评论，避免同步引用导致的循环依赖
		comment: () => import('./comment.vue'),
		ActionMenu
	},

	props: {
		show: {
			type: Boolean,
			default: false
		},
		postid: {
			type: Number,
			require: true,
			default: 0
		},
		// 父评论ID，用于拉取该评论下的回复
		pid: {
			type: Number,
			require: true,
			default: 0
		},
		// 评论作者ID
		busid: {
			type: Number,
			require: true,
			default: 0
		},
		// 当前登录用户ID（browser id），用于权限判断
		brid: {
			type: Number,
			require: true,
			default: 0
		},
		// 帖子作者ID（father id），楼主标识与采纳权限判断
		ftrid: {
			type: Number,
			require: true,
			default: 0
		},
		// 已采纳评论ID（caina id），null 表示未采纳
		cnrid: {
			type: Number,
			require: true,
			default: 0
		},
		// 帖子状态：'1' 已解决，'0' 未解决
		status: {
			type: String,
			require: true,
			default: '0'
		},
		// 当前递归深度，用于限制评论树无限嵌套
		depth: {
			type: Number,
			default: 0
		}
	},

	created() {
		this.CommentData()
	},

	data() {
		return {
			MenuShow: false,
			AnswerShow: false,
			comid: 0,
			accept: 0,
			comstatus: '',
			answer: {
				content: ''
			},
			comlist: [],
			// 正在点赞的评论ID集合，防止重复请求
			likePending: new Set(),
			// 评论树最大递归深度，防止过深嵌套影响渲染性能
			maxDepth: 6,
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

	computed: {
		// 当前用户非被采纳者时显示评论按钮
		showCommentBtn() {
			return this.brid != this.accept
		},
		// 仅帖子作者可采纳，且不能采纳自己的回答
		showAcceptBtn() {
			return this.brid == this.ftrid && this.accept != this.ftrid
		},
		// 帖子作者或被采纳者可删除评论
		showDeleteBtn() {
			return this.brid == this.ftrid || this.brid == this.accept
		},
		// 采纳状态文案：accepted=本条已采纳，resolved=帖子已解决（本条未被采纳）
		acceptStatusText() {
			if (this.status == '1' && this.cnrid && this.comstatus == '1') return 'accepted'
			if (this.status == '1' && this.cnrid) return 'resolved'
			return ''
		}
	},

	methods: {
		CommentToggle(index) {
			this.comlist[index].show = !this.comlist[index].show
		},

		async CommentData() {
			try {
				const data = {
					postid: this.postid,
					pid: this.pid,
					busid: this.busid ? this.busid : 0
				}

				const result = await uni.$u.http.post('/comment/index', data, {
					custom: { toast: false, retry: 2 }
				})

				this.comlist = result.data.length > 0 ? result.data : []

				// Vue.set 确保 show 属性是响应式的
				this.comlist.map(item => {
					Vue.set(item, 'show', false)
				})
			} catch (error) {
				console.error('CommentData error:', error)
			}
		},

		async LikeToggle(comment) {
			if (this.likePending.has(comment.id)) return
			if (!this.brid) {
				uni.$toast.error('请先登录')
				return false
			}

			this.likePending.add(comment.id)
			try {
				const data = {
					comid: comment.id,
					postid: this.postid,
					busid: this.brid
				}

				const result = await uni.$u.http.post('/comment/like', data)

				if (result.code == 0) {
					uni.$toast.error(result.msg)
					return false
				}

				uni.$toast.success(result.msg)

				// 乐观更新UI：立即切换点赞状态和计数
				comment.like_status = !comment.like_status
				comment.likes_count = comment.like_status ? ++comment.likes_count : --comment.likes_count
			} catch (error) {
				console.error('LikeToggle error:', error)
				uni.$toast.error('操作失败，请稍后重试')
			} finally {
				this.likePending.delete(comment.id)
			}
		},

		answers(comment) {
			if (!this.brid) {
				uni.$toast.error('请先登录')
				return false
			}

			// 记录当前操作评论的信息，供 ActionMenu 权限判断使用
			this.comid = comment.id
			this.accept = comment.busid
			this.comstatus = comment.status

			this.MenuShow = true
		},

		async delcom() {
			if (!this.brid) {
				uni.$toast.error('请先登录')
				return false
			}

			try {
				const data = {
					postid: this.postid,
					busid: this.brid,
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
			} catch (error) {
				console.error('delcom error:', error)
				uni.$toast.error('删除失败，请稍后重试')
			}
		},

		async select() {
			if (!this.brid) {
				uni.$toast.error('请先登录')
				return false
			}

			try {
				const data = {
					postid: this.postid,
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
			} catch (error) {
				console.error('select error:', error)
				uni.$toast.error('操作失败，请稍后重试')
			}
		},

		submit() {
			if (!this.brid) {
				uni.$toast.error('请先登录')
				return false
			}

			this.$refs.answer
				.validate()
				.then(async () => {
					try {
						const data = {
							postid: this.postid,
							pid: this.pid,
							content: this.answer.content,
							busid: this.busid
						}

						const result = await uni.$u.http.post('/post/answer', data)

						if (result.code == 0) {
							uni.$toast.error(result.msg)
							return false
						}

						uni.$toast.success(result.msg)

						this.MenuShow = false
						this.AnswerShow = false
					} catch (error) {
						console.error('submit error:', error)
						uni.$toast.error('提交失败，请稍后重试')
					}
				})
				.catch(error => {
					console.log(error)
					uni.$toast.error('内容不能为空')
				})
		}
	}
}
</script>

<style lang="scss">
.comlist {
	margin-top: 16rpx;
}

.depth-limit-hint {
	display: flex;
	align-items: center;
	gap: 8rpx;
	padding: 16rpx 30rpx;
	color: #999;
	font-size: 24rpx;
}

/* 嵌套的二级评论：补偿父级 padding，保持与一级评论相同宽度 */
.item > .comlist {
	margin-left: -30rpx;
	margin-right: -30rpx;
	padding-left: 30rpx;
	padding-right: 30rpx;
}

.list .item {
	margin-bottom: 20rpx;
	padding: 30rpx;
	background: #fff;
	border-radius: 16rpx;
	box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.item-header {
	display: flex;
	align-items: flex-start;

	.avatar-link {
		flex-shrink: 0;

		.avatar {
			width: 72rpx;
			height: 72rpx;
			border-radius: 50%;
			overflow: hidden;
			background-color: #f5f7fa;
		}
	}

	.item-author {
		flex: 1;
		margin-left: 20rpx;

		.author-name-row {
			display: flex;
			align-items: center;

			.author-name {
				font-size: 28rpx;
				font-weight: bold;
				color: #303133;
			}
		}

		.author-desc {
			font-size: 24rpx;
			color: #909399;
			margin-top: 8rpx;
			display: block;
		}
	}

	.item-time {
		font-size: 22rpx;
		color: #c0c4cc;
		flex-shrink: 0;
	}
}

.item-content {
	padding: 24rpx 0;
	font-size: 28rpx;
	color: #303133;
	line-height: 1.6;
	word-break: break-all;

	.reply-to {
		color: #3c9cff;
	}
}

.item-footer {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding-top: 20rpx;
	border-top: 1rpx solid #f5f5f5;

	.footer-left {
		display: flex;
		align-items: center;

		.action-btn {
			display: flex;
			align-items: center;
			padding: 10rpx 20rpx;
			border-radius: 8rpx;
			background: #f7f8fa;

			text {
				font-size: 24rpx;
				color: #909399;
				margin-left: 6rpx;

				&.active {
					color: #19be6b;
				}
			}
		}
	}

	.footer-right {
		.more-btn {
			width: 52rpx;
			height: 52rpx;
			display: flex;
			align-items: center;
			justify-content: center;
			border-radius: 50%;

			&:active {
				background: #f5f5f5;
			}
		}
	}
}

.answer {
	padding: 40rpx 30rpx;
}

.answer-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 30rpx;
}

.answer-title {
	font-size: 34rpx;
	font-weight: bold;
	color: #303133;
}

.answer :deep(.u-form) .u-button {
	margin-top: 40rpx;
}
</style>
