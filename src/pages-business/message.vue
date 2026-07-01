<template>
	<view class="content">
		<view class="header">
			<view class="search">
				<u-search
					:showAction="false"
					placeholder="搜索你想知道的用户..."
					v-model="keywords"
					@search="search"
				></u-search>
			</view>
		</view>

		<!-- 加载骨架屏 -->
		<view class="message-list" v-if="loading">
			<view class="skeleton-item" v-for="n in 3" :key="n">
				<u-skeleton :loading="true" :animate="true" avatar :rows="2" :title="false"></u-skeleton>
			</view>
		</view>

		<!-- 消息列表 -->
		<view class="message-list" v-else-if="messageList.length > 0">
			<view class="message-item" v-for="(item, index) in messageList" :key="index">
				<image class="msg-avatar" :src="item.avatar || '/static/logo.png'" mode="aspectFill"></image>
				<view class="msg-body">
					<view class="msg-header">
						<text class="msg-name">{{ item.nickname }}</text>
						<text class="msg-time">{{ item.time }}</text>
					</view>
					<text class="msg-preview">{{ item.content }}</text>
				</view>
			</view>
		</view>

		<!-- 空状态 -->
		<view class="message-list" v-else>
			<u-empty mode="message" text="暂无消息"></u-empty>
		</view>
	</view>
</template>

<script>
import { authMixin } from '@/mixins/authMixin'

export default {
	mixins: [authMixin],

	data() {
		return {
			keywords: '',
			loading: false,
			messageList: []
		}
	},

	onShow() {
		if (this.isLoggedIn) {
			// 消息功能暂未接入后端，预留加载逻辑
			// this.fetchMessages()
		}
	},

	methods: {
		search() {
			uni.$toast.info('搜索功能开发中')
		}

		// 预留：消息列表加载
		// async fetchMessages() {
		// 	this.loading = true
		// 	try {
		// 		const res = await uni.$u.http.post('/message/list', { busid: this.currentUserId })
		// 		this.messageList = res.data || []
		// 	} catch (error) {
		// 		console.error('fetchMessages error:', error)
		// 	} finally {
		// 		this.loading = false
		// 	}
		// }
	}
}
</script>

<style lang="scss">
.content {
	width: 100%;
	background-color: $zl-bg-color;
	min-height: 100vh;
}

.header {
	background-color: white;
	position: sticky;
	top: 0;
	z-index: 10;
	transform: translateZ(0);
	will-change: transform;
	backface-visibility: hidden;
	-webkit-backface-visibility: hidden;
}

.search {
	height: 240rpx;
	background-image: url('/static/titlebg.png');
	background-repeat: no-repeat;
	background-size: cover;
	background-position: center;
	padding: 0 40rpx;
	display: flex;
	align-items: center;
}

.message-list {
	padding: 40rpx;
}

.skeleton-item {
	background: #fff;
	padding: 30rpx;
	margin-bottom: 20rpx;
	border-radius: 16rpx;
	box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.message-item {
	display: flex;
	align-items: flex-start;
	background: #fff;
	padding: 28rpx;
	margin-bottom: 16rpx;
	border-radius: 16rpx;
	gap: 20rpx;

	.msg-avatar {
		width: 88rpx;
		height: 88rpx;
		border-radius: 50%;
		flex-shrink: 0;
		background-color: $zl-bg-color;
	}

	.msg-body {
		flex: 1;
		min-width: 0;
	}

	.msg-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 10rpx;
	}

	.msg-name {
		font-size: 28rpx;
		font-weight: 500;
		color: $uni-text-color;
	}

	.msg-time {
		font-size: 22rpx;
		color: $zl-info;
	}

	.msg-preview {
		font-size: 26rpx;
		color: $zl-text-secondary;
		display: -webkit-box;
		-webkit-line-clamp: 1;
		line-clamp: 1;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
}
</style>
