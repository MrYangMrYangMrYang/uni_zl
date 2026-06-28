<template>
	<view class="post">
		<view class="info">
			<view class="header-section">
				<view class="tag-row">
					<view class="item">
						<u-tag :text="post.category.name" type="success" plain icon="tags-fill" size="mini"></u-tag>
					</view>
					<view class="item">
						<u-tag
							v-if="post.status == '1' && post.accept"
							text="已解决"
							type="success"
							plain
							icon="checkmark"
							size="mini"
						></u-tag>
						<u-tag v-else text="未解决" type="warning" plain icon="clock" size="mini"></u-tag>
					</view>
					<view class="item collect-btn" v-if="business.id != post.busid">
						<!-- 透明占位符防止布局抖动 -->
						<u-tag
							v-if="!collectLoaded"
							text=" "
							type="info"
							plain
							icon="star"
							size="mini"
							:customStyle="{ opacity: 0 }"
						></u-tag>
						<u-tag
							v-else-if="collect"
							@click="toggleCollect(postid, post.business.id, post.cateid)"
							text="已收藏"
							type="error"
							icon="star-fill"
							size="mini"
						></u-tag>
						<u-tag
							v-else
							@click="toggleCollect(postid, post.business.id, post.cateid)"
							text="收藏"
							type="info"
							plain
							icon="star"
							size="mini"
						></u-tag>
					</view>
				</view>

				<view class="title">{{ post.title }}</view>

				<view class="author-row">
					<navigator :url="`/pages-business/user?busid=${post.business.id}`" class="avatar-link">
						<image class="avatar" mode="aspectFill" :src="post.business.avatar_text"></image>
					</navigator>
					<view class="author-info">
						<view class="author-top">
							<text class="nickname">{{ post.business.nickname }}</text>
							<view class="follow-btn" v-if="business.id != post.busid">
								<u-tag
									v-if="!attentionLoaded"
									text=" "
									type="primary"
									plain
									size="mini"
									:customStyle="{ opacity: 0 }"
								></u-tag>
								<u-tag
									v-else-if="attention"
									@click="toggleFollow(post.business.id)"
									text="已关注"
									type="success"
									plain
									size="mini"
								></u-tag>
								<u-tag
									v-else
									@click="toggleFollow(post.business.id)"
									text="关注"
									type="primary"
									plain
									size="mini"
								></u-tag>
							</view>
						</view>
						<text class="createtime">{{ post.createtime_text }}</text>
					</view>
				</view>
			</view>

			<view class="content-section">
				<u-parse :content="post.content"></u-parse>
			</view>

			<view class="stats-section">
				<view class="stat-item">
					<view class="stat-icon">
						<u-icon name="star" size="20" color="#faa755"></u-icon>
					</view>
					<view class="stat-info">
						<text class="stat-label">收藏量</text>
						<text class="stat-value">{{ post.collect_count }}</text>
					</view>
				</view>
				<view class="stat-divider"></view>
				<view class="stat-item">
					<view class="stat-icon">
						<u-icon name="chat" size="20" color="#19be6b"></u-icon>
					</view>
					<view class="stat-info">
						<text class="stat-label">讨论数</text>
						<text class="stat-value">{{ post.comment_count }}</text>
					</view>
				</view>
				<view class="stat-divider"></view>
				<view class="stat-item">
					<view class="stat-icon">
						<u-icon name="red-packet" size="20" color="#ed4014"></u-icon>
					</view>
					<view class="stat-info">
						<text class="stat-label">悬赏积分</text>
						<text class="stat-value">{{ post.point }}</text>
					</view>
				</view>
			</view>

			<view class="action-section">
				<view
					class="action-btn-wrap"
					v-if="post.busid != business.id && post.status == '0'"
					@click="showAnswer"
				>
					<u-icon name="edit-pen" size="18" color="#fff"></u-icon>
					<text>我来回答</text>
				</view>
				<view class="action-btn-wrap" v-if="post.busid == business.id && post.status == '0'" @click="edit">
					<u-icon name="edit-pen-fill" size="18" color="#fff"></u-icon>
					<text>修改提问</text>
				</view>
			</view>
		</view>

		<view class="comment-section">
			<!-- 评论懒加载：点击展开/收起，优化首屏性能 -->
			<view v-if="!commentsLoaded" class="divider-section expand-trigger" @click="toggleComments()">
				<view class="expand-divider">
					<view class="expand-line"></view>
					<view class="expand-content">
						<u-icon name="chat" size="14" color="#909399"></u-icon>
						<text class="expand-text">全部评论 {{ post.comment_count || 0 }} · 点击展开</text>
						<u-icon name="arrow-down" size="12" color="#909399"></u-icon>
					</view>
					<view class="expand-line"></view>
				</view>
			</view>

			<view v-else class="divider-section expand-trigger collapse-trigger" @click="toggleComments()">
				<view class="expand-divider">
					<view class="expand-line"></view>
					<view class="expand-content">
						<u-icon name="chat" size="14" color="#909399"></u-icon>
						<text class="expand-text">全部评论 {{ post.comment_count || 0 }} · 点击收起</text>
						<u-icon name="arrow-up" size="12" color="#909399"></u-icon>
					</view>
					<view class="expand-line"></view>
				</view>
			</view>

			<template v-if="commentsLoaded">
				<view class="list" v-if="comlist.length > 0">
					<view class="item" v-for="(item, index) in comlist" :key="index">
						<view class="item-header">
							<navigator :url="`/pages-business/user?busid=${item.busid}`" class="avatar-link">
								<image class="avatar" mode="aspectFill" lazy-load :src="item.business.avatar_text"></image>
							</navigator>
							<view class="item-author">
								<view class="author-name-row">
									<text class="author-name">{{ item.business.nickname }}</text>
									<u-tag
										v-if="item.busid == post.busid"
										text="楼主"
										type="error"
										plain
										size="mini"
									></u-tag>
									<u-tag
										v-else-if="post.status == '1' && post.accept && item.status == '1'"
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

						<view class="item-content">{{ item.content }}</view>

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
									<u-icon name="chat" :color="item.show ? '#3cc51f' : '#999'" size="18"></u-icon>
									<text v-if="item.comment_count > 0">展开{{ item.comment_count }}条回复</text>
									<text v-else>暂无回复</text>
									<u-icon
										:name="item.show ? 'arrow-up' : 'arrow-down'"
										size="12"
										color="#999"
									></u-icon>
								</view>
							</view>
							<view class="footer-right">
								<view class="more-btn" @click="answer(item)">
									<u-icon name="more-dot-fill" size="22" color="#999"></u-icon>
								</view>
							</view>
						</view>

						<!-- 递归评论组件：渲染该评论下的二级回复 -->
						<comment
							v-if="item.comment_count > 0 && item.show"
							:postid="item.postid"
							:pid="item.id"
							:busid="item.busid"
							:brid="business.id"
							:ftrid="post.busid"
							:status="post.status"
							:cnrid="post.accept"
							class="sub-comment"
						></comment>
					</view>
				</view>

				<!-- 评论加载骨架屏：模拟评论项布局 -->
				<view class="comment-skeleton" v-else-if="loading">
					<view class="skeleton-item" v-for="n in 3" :key="n">
						<u-skeleton
							:loading="true"
							:animate="true"
							avatar
							:avatarSize="36"
							:rows="2"
							:rowsWidth="['50%', '80%']"
							:rowsHeight="['24rpx', '20rpx']"
							:title="false"
						></u-skeleton>
					</view>
				</view>

				<view class="empty-list" v-else>
					<u-empty text="暂无回答，来说两句吧" icon="chat"></u-empty>
				</view>
			</template>
		</view>

		<action-menu
			v-model="MenuShow"
			:showComment="showCommentBtn"
			:showAccept="showAcceptBtn"
			:showDelete="showDeleteBtn"
			@comment="AnswerShow = true"
			@accept="select"
			@delete="delcom"
		></action-menu>

		<u-popup mode="bottom" :show="AnswerShow" @close="AnswerShow = false" round="10">
			<view class="answer">
				<view class="answer-header">
					<text class="answer-title">{{ answerType === 'answer' ? '撰写回答' : '撰写评论' }}</text>
					<u-icon name="close" size="20" color="#999" @click="AnswerShow = false"></u-icon>
				</view>
				<u--form labelPosition="top" :model="comment" :rules="rules" ref="answer">
					<u-form-item prop="content" ref="content">
						<u--textarea
							v-model="comment.content"
							:placeholder="answerType === 'answer' ? '请输入您的回答...' : '请输入您的评论...'"
							count
							height="150"
						></u--textarea>
					</u-form-item>
					<u-button
						type="primary"
						shape="circle"
						@click="submit"
						:disabled="!comment.content"
						:customStyle="{ background: 'linear-gradient(135deg, #0173de, #4cd964)' }"
					>
						{{ answerType === 'answer' ? '提交回答' : '提交评论' }}
					</u-button>
				</u--form>
			</view>
		</u-popup>

		<u-toast ref="notice"></u-toast>
	</view>
</template>

<script>
import comment from '@/components/comment/comment.vue'
import ActionMenu from '@/components/comment/ActionMenu.vue'
import { getUserInfo } from '@/utils/auth.js'
import { followMixin } from '@/mixins/followMixin'
import { collectMixin } from '@/mixins/collectMixin'
import { authMixin } from '@/mixins/authMixin'

export default {
	mixins: [followMixin, collectMixin, authMixin],

	components: {
		comment,
		ActionMenu
	},

	onLoad(option) {
		const postid = option.postid ? option.postid : 0
		this.postid = postid

		this.business = getUserInfo()

		this.initPageData()
	},

	onShow() {
		if (this.postid) {
			this.PostData()
			this.CommentData()
		}
	},

	data() {
		return {
			show: false,
			postid: 0,
			pid: 0,
			comid: 0,
			accept: 0,
			status: '',
			business: {},
			post: {
				category: {},
				business: {}
			},
			MenuShow: false,
			AnswerShow: false,
			// 'answer'=回答帖子(pid=0)，'comment'=回复评论(pid=评论id)
			answerType: 'answer',
			comment: {
				content: ''
			},
			comlist: [],
			loading: true,
			commentsLoaded: false,
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

	computed: {
		// 当前用户非被采纳者时显示评论按钮
		showCommentBtn() {
			return this.business.id != this.accept
		},
		// 仅帖子作者可采纳，且帖子未解决时显示，不能采纳自己
		showAcceptBtn() {
			return this.post.busid == this.business.id && this.accept != this.post.busid && this.post.status != '1'
		},
		// 帖子作者或被采纳者可删除评论
		showDeleteBtn() {
			return this.post.busid == this.business.id || this.business.id == this.accept
		}
	},

	methods: {
		async initPageData() {
			await this.PostData()
			this.checkFollowState(this.post.business.id)
			this.checkCollectState(this.postid)
		},

		// 评论懒加载：切换展开/收起状态
		toggleComments() {
			if (this.commentsLoaded) {
				this.commentsLoaded = false
			} else {
				this.CommentData()
				this.commentsLoaded = true
			}
		},

		CommentToggle(index) {
			this.comlist[index].show = !this.comlist[index].show
		},

		async CommentData() {
			try {
				const data = {
					postid: this.postid,
					pid: 0,
					busid: this.business.id ? this.business.id : 0
				}

				const result = await uni.$u.http.post('/comment/index', data, {
					custom: { toast: false, retry: 2 }
				})

				this.comlist = result.data.length > 0 ? result.data : []

				// 使用 $set 确保新增的属性是响应式的
				this.comlist.map(item => {
					this.$set(item, 'show', false)
				})
			} catch (error) {
				console.error('CommentData error:', error)
				this.comlist = []
			} finally {
				this.loading = false
			}
		},

		async LikeToggle(comment) {
			if (this.likePending.has(comment.id)) return
			if (!this.requireLogin(false)) return false

			this.likePending.add(comment.id)
			try {
				const data = {
					comid: comment.id,
					postid: this.postid,
					busid: this.business.id
				}

				const result = await uni.$u.http.post('/comment/like', data)

				if (result.code == 0) {
					uni.$toast.error(result.msg)
					return false
				}

				uni.$toast.success(result.msg)

				comment.like_status = !comment.like_status
				comment.likes_count = comment.like_status ? ++comment.likes_count : --comment.likes_count
			} catch (error) {
				console.error('LikeToggle error:', error)
				uni.$toast.error('操作失败，请稍后重试')
			} finally {
				this.likePending.delete(comment.id)
			}
		},

		answer(comment) {
			if (!this.requireLogin(false)) return false

			// 点击评论的"更多"按钮，记录目标评论信息并打开操作菜单
			this.pid = comment.id
			this.comid = comment.id
			this.status = comment.status
			this.accept = comment.busid

			this.MenuShow = true
			this.answerType = 'comment'
			this.comment.content = ''
		},

		showAnswer() {
			if (!this.requireLogin(false)) return false

			// 直接回答帖子，pid=0 表示一级回答
			this.answerType = 'answer'
			this.pid = 0
			this.AnswerShow = true
		},

		showComment() {
			this.MenuShow = false
			this.answerType = 'comment'
			this.AnswerShow = true
		},

		async delcom() {
			if (!this.requireLogin(false)) return false

			try {
				const data = {
					postid: this.postid,
					busid: this.business.id,
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

				this.comlist = []
				this.CommentData()
			} catch (error) {
				console.error('delcom error:', error)
				uni.$toast.error('删除失败，请稍后重试')
			}
		},

		async PostData() {
			try {
				const result = await uni.$u.http.post(
					'/post/info',
					{ postid: this.postid },
					{
						custom: { toast: false, retry: 2 }
					}
				)

				if (result.code == 0) {
					uni.$toast.error(result.msg, {
						complete: () => {
							uni.$u.route({ type: 'navigateBack', delta: 1 })
						}
					})
					return false
				}

				this.post = result.data.post
			} catch (error) {
				console.error('PostData error:', error)
				uni.$toast.error('加载失败，请稍后重试')
			}
		},

		edit() {
			uni.$u.route({
				type: 'navigateTo',
				url: '/pages-post/edit',
				params: {
					postid: this.postid
				}
			})
		},

		async select() {
			if (!this.requireLogin(false)) return false

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

				this.comlist = []
				this.CommentData()
			} catch (error) {
				console.error('select error:', error)
				uni.$toast.error('操作失败，请稍后重试')
			}
		},

		submit() {
			if (!this.requireLogin(false)) return false

			this.$refs.answer
				.validate()
				.then(async () => {
					try {
						const data = {
							postid: this.postid,
							pid: this.pid,
							content: this.comment.content,
							busid: this.business.id
						}

						const result = await uni.$u.http.post('/post/answer', data)

						if (result.code == 0) {
							uni.$toast.error(result.msg)
							return false
						}

						uni.$toast.success(result.msg)

						this.MenuShow = false
						this.AnswerShow = false

						this.comlist = []
						this.CommentData()
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
/* ==================== SCSS变量定义 ==================== */
$primary-color: #3cc51f;
$text-color: #303133;
$text-grey: #909399;
$border-color: #f0f2f3;
$bg-color: #f4f6f8;
$white: #ffffff;

.post {
	background: $bg-color;
	min-height: 100vh;
	padding-bottom: 40rpx;
}

.info {
	width: 710rpx;
	margin: 20rpx auto 0;
	padding: 30rpx;
	background: $white;
	border-radius: 16rpx;
	box-sizing: border-box;
}

.header-section {
	margin-bottom: 24rpx;
}

.tag-row {
	display: flex;
	flex-direction: row;
	align-items: center;
	gap: 12rpx;
	margin-bottom: 20rpx;
	flex-wrap: wrap;
}

.tag-row .item {
	display: inline-flex;
	align-items: center;
}

.tag-row .collect-btn {
	min-width: 120rpx;
}

.title {
	font-size: 36rpx;
	font-weight: bold;
	color: $text-color;
	line-height: 1.4;
	margin-bottom: 24rpx;
	word-break: break-all;
}

.author-row {
	display: flex;
	flex-direction: row;
	align-items: center;
	gap: 16rpx;
}

.avatar-link {
	flex-shrink: 0;
}

.avatar {
	width: 80rpx;
	height: 80rpx;
	border-radius: 50%;
	border: 2rpx solid $border-color;
}

.author-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 6rpx;
}

.author-top {
	display: flex;
	flex-direction: row;
	align-items: center;
	gap: 12rpx;
}

.nickname {
	font-size: 28rpx;
	color: $text-color;
	font-weight: 500;
}

.follow-btn {
	margin-left: auto;
}

.createtime {
	font-size: 24rpx;
	color: $text-grey;
}

.content-section {
	margin-bottom: 24rpx;
	padding: 20rpx;
	background: $bg-color;
	border-radius: 12rpx;
	line-height: 1.8;
}

.stats-section {
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: space-around;
	padding: 24rpx 0;
	margin-bottom: 20rpx;
	border-top: 1rpx solid $border-color;
	border-bottom: 1rpx solid $border-color;
}

.stat-item {
	display: flex;
	flex-direction: row;
	align-items: center;
	gap: 12rpx;
}

.stat-icon {
	width: 48rpx;
	height: 48rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background: $bg-color;
	border-radius: 10rpx;
}

.stat-info {
	display: flex;
	flex-direction: column;
	gap: 4rpx;
}

.stat-label {
	font-size: 22rpx;
	color: $text-grey;
}

.stat-value {
	font-size: 30rpx;
	color: $text-color;
	font-weight: bold;
}

.stat-divider {
	width: 1rpx;
	height: 40rpx;
	background: $border-color;
}

.action-section {
	display: flex;
	flex-direction: row;
	justify-content: center;
	gap: 16rpx;
	margin-top: 20rpx;
}

.action-btn-wrap {
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: center;
	padding: 16rpx 32rpx;
	background: linear-gradient(135deg, #0173de, #4cd964);
	border-radius: 32rpx;
	gap: 8rpx;
}

.action-btn-wrap.warning {
	background: linear-gradient(135deg, #faa755, #ed4014);
}

.action-btn-wrap u-icon,
.action-btn-wrap text {
	color: $white;
	font-size: 26rpx;
}

.comment-section {
	margin-top: 20rpx;
}

.divider-section {
	padding: 20rpx 0;
}

.expand-trigger {
	cursor: pointer;
}

.expand-divider {
	display: flex;
	flex-direction: row;
	align-items: center;
	gap: 16rpx;
}

.expand-line {
	flex: 1;
	height: 1rpx;
	background: $border-color;
}

.expand-content {
	display: flex;
	flex-direction: row;
	align-items: center;
	gap: 8rpx;
}

.expand-text {
	font-size: 26rpx;
	color: $text-grey;
}

.list {
	padding: 0 10rpx;
}

.item {
	background: $white;
	padding: 24rpx;
	margin-bottom: 16rpx;
	border-radius: 12rpx;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.item-header {
	display: flex;
	flex-direction: row;
	align-items: flex-start;
	gap: 16rpx;
	margin-bottom: 16rpx;
}

.item-header .avatar {
	width: 64rpx;
	height: 64rpx;
	border-radius: 50%;
}

.item-author {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 6rpx;
}

.author-name-row {
	display: flex;
	flex-direction: row;
	align-items: center;
	gap: 10rpx;
	flex-wrap: wrap;
}

.author-name {
	font-size: 28rpx;
	color: $text-color;
	font-weight: 500;
}

.author-desc {
	font-size: 22rpx;
	color: $text-grey;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	max-width: 400rpx;
}

.item-time {
	font-size: 22rpx;
	color: $text-grey;
	margin-left: auto;
	white-space: nowrap;
	flex-shrink: 0;
}

.item-content {
	font-size: 28rpx;
	color: $text-color;
	line-height: 1.6;
	margin-bottom: 16rpx;
	word-break: break-word;
}

.item-footer {
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: space-between;
	padding-top: 16rpx;
	border-top: 1rpx solid $border-color;
}

.footer-left {
	display: flex;
	flex-direction: row;
	gap: 24rpx;
}

.action-btn {
	display: flex;
	flex-direction: row;
	align-items: center;
	gap: 6rpx;
	padding: 8rpx 16rpx;
	border-radius: 20rpx;
	transition: all 0.3s ease;
}

.action-btn text {
	font-size: 24rpx;
	color: $text-grey;
	transition: color 0.3s ease;
}

.action-btn text.active {
	color: $primary-color;
	font-weight: 500;
}

.footer-right {
	display: flex;
	align-items: center;
}

.more-btn {
	padding: 8rpx;
}

.sub-comment {
	margin-left: 40rpx;
	margin-top: 16rpx;
}

.loading-state {
	display: flex;
	justify-content: center;
	align-items: center;
	padding: 40rpx 0;
	gap: 12rpx;
}

.loading-state :deep(.u-loading-icon__text) {
	color: #999 !important;
}

.comment-skeleton {
	padding: 0 30rpx;

	.skeleton-item {
		background: #fff;
		padding: 30rpx;
		margin-bottom: 20rpx;
		border-radius: 16rpx;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
	}
}

.empty-list {
	padding: 60rpx 0;
}

.answer {
	padding: 30rpx;
}

.answer-header {
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 24rpx;
}

.answer-title {
	font-size: 32rpx;
	color: $text-color;
	font-weight: bold;
}

.answer .u-button {
	margin-top: 20rpx;
}
</style>
