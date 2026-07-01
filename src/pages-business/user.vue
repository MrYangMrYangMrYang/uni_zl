<template>
	<view class="content">
		<view class="header" v-if="business">
			<view class="person">
				<view class="info">
					<view class="avatar-wrapper">
						<view class="avatar">
							<!-- #ifdef H5 || APP-PLUS -->
							<image :src="business.avatar_text || '/static/logo.png'" mode="aspectFill"></image>
							<!-- #endif -->

							<!-- #ifdef MP-WEIXIN -->
							<image
								:src="business.avatar ? business.avatar_text : '/static/logo.png'"
								mode="aspectFill"
							></image>
							<!-- #endif -->
						</view>
					</view>

					<view class="base">
						<view class="nickname">{{ business.nickname || '用户' }}</view>
						<view class="desc">{{ business.lable || '这家伙很懒，啥都没写' }}</view>
					</view>

					<view class="btnlist" v-if="business.id != ybusiness.id && ybusiness.hasOwnProperty('id')">
						<u-button
							v-if="attention"
							@click="toggleFollow(busid)"
							type="success"
							icon="man-add"
							text="取消关注"
							size="small"
							:customStyle="{ height: '60rpx', borderRadius: '30rpx', fontSize: '24rpx' }"
						></u-button>
						<u-button
							v-else
							@click="toggleFollow(busid)"
							type="warning"
							icon="man-add"
							text="关注"
							size="small"
							:customStyle="{ height: '60rpx', borderRadius: '30rpx', fontSize: '24rpx' }"
						></u-button>
					</view>
				</view>

				<view class="stats-card">
					<view class="stat-item" @click="$emit('tab-change', 0)">
						<view class="stat-value">{{ business.quest_count || 0 }}</view>
						<view class="stat-label">提问</view>
					</view>
					<view class="stat-divider"></view>
					<view class="stat-item" @click="$emit('tab-change', 1)">
						<view class="stat-value">{{ business.answer_count || 0 }}</view>
						<view class="stat-label">回答</view>
					</view>
					<view class="stat-divider"></view>
					<view class="stat-item" @click="$emit('tab-change', 2)">
						<view class="stat-value">{{ business.collect_count || 0 }}</view>
						<view class="stat-label">收藏</view>
					</view>
				</view>
			</view>

			<view class="nav" v-if="business">
				<u-tabs
					class="nav-item"
					:list="cate"
					@click="handleTabSwitch"
					lineWidth="75"
					:is-scroll="false"
					:activeStyle="{
						color: '#303133',
						fontWeight: 'bold',
						transform: 'scale(1.05)'
					}"
					:inactiveStyle="{
						color: '#606266',
						transform: 'scale(1)'
					}"
					itemStyle="flex: 1; height: 50px;"
				></u-tabs>
			</view>
		</view>

		<view v-if="switchingTab && business" class="tab-loading-overlay">
			<u-loading-icon mode="circle" size="40"></u-loading-icon>
			<view style="margin-top: 16rpx; color: #999; font-size: 26rpx">切换中...</view>
		</view>

		<view class="list-container" v-if="(active == '0' || active == '') && business && !switchingTab">
			<view class="post-card" v-for="(item, index) in questpost" :key="index">
				<navigator :url="`/pages-post/info?postid=${item.id}`" class="card-content">
					<view class="card-header">
						<view class="author-info">
							<image
								class="author-avatar"
								lazy-load
								:src="item.business.avatar_text || '/static/logo.png'"
								mode="aspectFill"
							></image>
							<text class="author-name">{{ item.business.nickname }}</text>
						</view>
						<view class="post-time">{{ item.createtime_text }}</view>
					</view>
					<view class="card-body">
						<view class="post-title">{{ item.title }}</view>
						<view class="post-category">{{ item.category.name }}</view>
					</view>
					<view class="card-footer">
						<view class="status-tag" :class="{ solved: item.status == '1' && item.accept }">
							{{ item.status == '1' && item.accept ? '已解决' : '未解决' }}
						</view>
						<view class="reward">
							<text class="reward-icon">￥</text>
							<text class="reward-value">{{ item.point }}</text>
						</view>
						<view class="reply-count">
							<text>{{ item.comment_count }}人回复</text>
						</view>
					</view>
				</navigator>
			</view>
			<u-empty v-if="questpost.length === 0" mode="list" text="暂无提问"></u-empty>
			<view class="list-count" v-if="questpost.length > 0">没有更多数据了</view>
		</view>

		<view class="list-container" v-if="active == '1' && business && !switchingTab">
			<view class="post-card" v-for="(item, index) in answerpost" :key="index">
				<navigator :url="`/pages-post/info?postid=${item.postid}`" class="card-content">
					<view class="card-header">
						<view class="author-info">
							<image
								class="author-avatar"
								lazy-load
								:src="item.business.avatar_text || '/static/logo.png'"
								mode="aspectFill"
							></image>
							<text class="author-name">{{ item.business.nickname }}</text>
						</view>
						<view class="post-time">{{ item.createtime_text }}</view>
					</view>
					<view class="card-body answer-body">
						<view class="post-title">评论帖子：{{ item.post.title }}</view>
						<view class="answer-preview">{{ item.content }}</view>
					</view>
					<view class="card-footer">
						<view class="like-count">
							<u-icon name="thumb-up" size="28" color="#999"></u-icon>
							<text>{{ item.likes_count }}</text>
						</view>
					</view>
				</navigator>
			</view>
			<u-empty v-if="answerpost.length === 0" mode="list" text="暂无回答"></u-empty>
			<view class="list-count" v-if="answerpost.length > 0">没有更多数据了</view>
		</view>

		<view class="list-container" v-if="active == '2' && business && !switchingTab">
			<view class="post-card" v-for="(item, index) in collectpost" :key="index">
				<navigator :url="`/pages-post/info?postid=${item.post.id}`" class="card-content">
					<view class="card-header">
						<view class="author-info">
							<image
								class="author-avatar"
								lazy-load
								:src="item.business.avatar_text || '/static/logo.png'"
								mode="aspectFill"
							></image>
							<text class="author-name">{{ item.business.nickname }}</text>
						</view>
						<!-- 使用帖子的创建时间 -->
						<view class="post-time">{{ item.post.createtime_text }}</view>
					</view>
					<view class="card-body">
						<view class="post-title">{{ item.post.title }}</view>
						<view class="post-category">{{ item.category.name }}</view>
					</view>
					<view class="card-footer">
						<!-- 使用帖子的状态字段 -->
						<view class="status-tag" :class="{ solved: item.post.status == '1' && item.post.accept }">
							{{ item.post.status == '1' && item.post.accept ? '已解决' : '未解决' }}
						</view>
						<!-- 使用帖子的积分字段 -->
						<view class="reward">
							<text class="reward-icon">￥</text>
							<text class="reward-value">{{ item.post.point }}</text>
						</view>
						<!-- 使用帖子的评论数字段 -->
						<view class="reply-count">
							<text>{{ item.post.comment_count }}人回复</text>
						</view>
					</view>
				</navigator>
			</view>
			<u-empty v-if="collectpost.length === 0" mode="list" text="暂无收藏"></u-empty>
			<view class="list-count" v-if="collectpost.length > 0">没有更多数据了</view>
		</view>

		<u-toast ref="notice"></u-toast>
	</view>
</template>

<script>
import { getUserInfo, checkLogin } from '@/utils/auth.js'
import { followMixin } from '@/mixins/followMixin'
import { tabCacheMixin } from '@/mixins/tabCacheMixin'

export default {
	mixins: [followMixin, tabCacheMixin],
	onLoad(option) {
		const busid = option.busid ? option.busid : 0

		this.initTabCache(['0', '1', '2'])

		if (busid) {
			// 他人主页模式：记录当前登录用户(ybusiness)，拉取目标用户信息
			this.ybusiness = getUserInfo()
			this.busid = busid
			this.UserData()
			this.checkFollowState(busid)
		} else {
			// 本人主页模式：直接使用本地存储的登录用户信息
			if (!checkLogin()) return
			this.business = getUserInfo()
			this.QuestData()
		}
	},

	data() {
		return {
			busid: 0,
			// 当前登录用户信息（仅在他人主页模式下用于权限判断）
			ybusiness: {},
			// 目标用户信息（本人或他人）
			business: null,
			cate: [
				{ name: '我的提问', id: '0' },
				{ name: '我的回答', id: '1' },
				{ name: '我的收藏', id: '2' }
			],
			questpost: [],
			answerpost: [],
			collectpost: []
		}
	},

	methods: {
		async UserData() {
			try {
				let result = await uni.$u.http.post('/user/info', { busid: this.busid })

				if (result.code == 0) {
					uni.$toast.error(result.msg, {
						complete: () => {
							uni.$u.route({ type: 'navigateBack', delta: 1 })
						}
					})
					return false
				}

				this.business = result.data.business

				result = await uni.$u.http.post(
					'/user/question',
					{ busid: this.business.id },
					{ custom: { toast: false } }
				)

				this.questpost = result.data || []
				this.tabCache['0'] = this.questpost
			} catch (error) {
				console.error('UserData error:', error)
				this.questpost = []
				this.tabCache['0'] = []
			}
		},

		async QuestData() {
			try {
				const data = { busid: this.business.id }
				const result = await uni.$u.http.post('/user/question', data, { custom: { toast: false } })

				if (result.code == 0) {
					this.questpost = []
					this.tabCache['0'] = []
					return false
				}

				this.questpost = result.data || []
				this.tabCache['0'] = this.questpost
			} catch (error) {
				console.error('QuestData error:', error)
				this.questpost = []
				this.tabCache['0'] = []
			} finally {
				this.switchingTab = false
			}
		},

		async AnswerData() {
			try {
				const data = { busid: this.business.id }
				const result = await uni.$u.http.post('/user/answer', data, { custom: { toast: false } })

				if (result.code == 0) {
					this.answerpost = []
					this.tabCache['1'] = []
					return false
				}

				this.answerpost = result.data || []
				this.tabCache['1'] = this.answerpost
			} catch (error) {
				console.error('AnswerData error:', error)
				this.answerpost = []
				this.tabCache['1'] = []
			} finally {
				this.switchingTab = false
			}
		},

		// eslint-disable-next-line no-unused-vars
		onTabCacheHit(tabId) {
			this.questpost = this.tabCache['0'] || []
			this.answerpost = this.tabCache['1'] || []
			this.collectpost = this.tabCache['2'] || []
		},

		async loadTabData(tabId) {
			if (tabId == '0') this.QuestData()
			if (tabId == '1') this.AnswerData()
			if (tabId == '2') this.CollectData()
		},

		async CollectData() {
			try {
				const data = { busid: this.business.id }
				const result = await uni.$u.http.post('/user/collect', data, { custom: { toast: false } })

				if (result.code == 0) {
					this.collectpost = []
					this.tabCache['2'] = []
					return false
				}

				this.collectpost = result.data || []
				this.tabCache['2'] = this.collectpost
			} catch (error) {
				console.error('CollectData error:', error)
				this.collectpost = []
				this.tabCache['2'] = []
			} finally {
				this.switchingTab = false
			}
		}
	}
}
</script>

<style lang="scss">
.content {
	width: 100%;
	background-color: #f5f7fa;
	min-height: 100vh;
}

.header {
	position: relative;
}

.person {
	padding: 80rpx 36rpx 60rpx;
	background: $zl-gradient;
	color: white;
	position: relative;
	overflow: hidden;

	&::before {
		content: '';
		position: absolute;
		top: -50%;
		right: -20%;
		width: 300rpx;
		height: 300rpx;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.08);
	}

	&::after {
		content: '';
		position: absolute;
		bottom: -30%;
		left: -10%;
		width: 200rpx;
		height: 200rpx;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.05);
	}

	.info {
		display: flex;
		align-items: center;
		margin-bottom: 48rpx;
		position: relative;
		z-index: 1;

		.avatar-wrapper {
			margin-right: 28rpx;

			.avatar {
				width: 130rpx;
				height: 130rpx;
				border-radius: 50%;
				overflow: hidden;
				border: 4rpx solid rgba(255, 255, 255, 0.35);
				box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.15);
				background-color: #fff;

				image {
					width: 100%;
					height: 100%;
				}
			}
		}

		.base {
			flex: 1;
			min-width: 0;

			.nickname {
				font-size: 38rpx;
				font-weight: bold;
				margin-bottom: 10rpx;
				line-height: 1.3;
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
			}

			.desc {
				font-size: 24rpx;
				opacity: 0.85;
				line-height: 1.4;
				display: -webkit-box;
				-webkit-line-clamp: 2;
				line-clamp: 2;
				-webkit-box-orient: vertical;
				overflow: hidden;
				text-overflow: ellipsis;
			}
		}
	}
}

.stats-card {
	display: flex;
	align-items: center;
	justify-content: space-around;
	background: rgba(255, 255, 255, 0.15);
	border-radius: 20rpx;
	padding: 28rpx 16rpx;
	backdrop-filter: blur(12rpx);
	position: relative;
	z-index: 1;

	.stat-item {
		flex: 1;
		text-align: center;
		padding: 8rpx 0;

		.stat-value {
			font-size: 42rpx;
			font-weight: bold;
			color: #fff;
			line-height: 1.2;
			margin-bottom: 6rpx;
		}

		.stat-label {
			font-size: 23rpx;
			color: rgba(255, 255, 255, 0.8);
			letter-spacing: 2rpx;
		}
	}

	.stat-divider {
		width: 1rpx;
		height: 46rpx;
		background: rgba(255, 255, 255, 0.25);
	}
}

.nav {
	background-color: white;
	border-bottom: 1rpx solid #eee;
	position: sticky;
	top: 0;
	z-index: 10;
	transform: translateZ(0);
	will-change: transform;
	backface-visibility: hidden;
	-webkit-backface-visibility: hidden;

	::v-deep .u-tabs {
		.u-tabs__wrapper__nav {
			display: flex !important;
			width: 100% !important;
		}

		.u-tabs__wrapper__nav__item {
			flex: 1 !important;
			display: flex !important;
			justify-content: center !important;
			align-items: center !important;
		}
	}
}

.tab-loading-overlay {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 120rpx 0;
	background-color: rgba(255, 255, 255, 0.95);
	position: relative;
	z-index: 5;
}

.list-container {
	padding: 20rpx 24rpx;
}

.list-count {
	text-align: center;
	color: #999;
	font-size: 26rpx;
	padding: 30rpx 0 20rpx;
}

.post-card {
	background: white;
	border-radius: 20rpx;
	margin-bottom: 20rpx;
	overflow: hidden;
	box-shadow: 0 2rpx 16rpx rgba(0, 0, 0, 0.06);
	transition: all 0.2s ease;

	&:active {
		transform: scale(0.98);
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
	}

	.card-content {
		display: block;
		padding: 28rpx;
	}

	.card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 18rpx;

		.author-info {
			display: flex;
			align-items: center;

			.author-avatar {
				width: 56rpx;
				height: 56rpx;
				border-radius: 50%;
				margin-right: 14rpx;
				background-color: #f5f7fa;
			}

			.author-name {
				font-size: 26rpx;
				color: #0173de;
				font-weight: 500;
			}
		}

		.post-time {
			font-size: 22rpx;
			color: #b0b0b0;
		}
	}

	.card-body {
		margin-bottom: 18rpx;

		.post-title {
			font-size: 30rpx;
			color: #303133;
			font-weight: 600;
			line-height: 1.5;
			margin-bottom: 10rpx;
			display: -webkit-box;
			-webkit-line-clamp: 2;
			line-clamp: 2;
			-webkit-box-orient: vertical;
			overflow: hidden;
		}

		.post-category {
			display: inline-block;
			font-size: 22rpx;
			color: #909399;
			background: #f5f7fa;
			padding: 4rpx 14rpx;
			border-radius: 6rpx;
		}

		&.answer-body {
			.post-title {
				font-size: 27rpx;
				color: #606266;
				margin-bottom: 12rpx;
			}

			.answer-preview {
				font-size: 25rpx;
				color: #909399;
				line-height: 1.6;
				display: -webkit-box;
				-webkit-line-clamp: 2;
				line-clamp: 2;
				-webkit-box-orient: vertical;
				overflow: hidden;
			}
		}
	}

	.card-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-top: 18rpx;
		border-top: 1rpx solid #f5f5f5;

		.status-tag {
			font-size: 22rpx;
			padding: 6rpx 16rpx;
			border-radius: 8rpx;
			background: #fef0f0;
			color: #f56c6c;

			&.solved {
				background: #f0f9eb;
				color: #67c23a;
			}
		}

		.reward {
			display: flex;
			align-items: baseline;

			.reward-icon {
				font-size: 22rpx;
				color: #e6a23c;
				font-weight: 600;
			}

			.reward-value {
				font-size: 28rpx;
				color: #e6a23c;
				font-weight: bold;
			}
		}

		.reply-count {
			font-size: 22rpx;
			color: #b0b0b0;
		}

		.like-count {
			display: flex;
			align-items: center;
			gap: 8rpx;
			font-size: 24rpx;
			color: #909399;
		}
	}
}
</style>
