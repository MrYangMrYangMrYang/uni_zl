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

		<!-- 功能开发中占位 -->
		<view class="placeholder-section">
			<view class="placeholder-card">
				<u-icon name="chat-fill" size="80" color="#c8d6e5"></u-icon>
				<text class="placeholder-title">私信功能开发中</text>
				<text class="placeholder-desc">我们正在努力完善消息系统，敬请期待</text>
				<view class="feature-preview">
					<view class="feature-item">
						<u-icon name="bell-fill" size="20" color="#0173de"></u-icon>
						<text>消息通知</text>
					</view>
					<view class="feature-item">
						<u-icon name="chat" size="20" color="#4cd964"></u-icon>
						<text>即时通讯</text>
					</view>
					<view class="feature-item">
						<u-icon name="file-text-fill" size="20" color="#f0ad4e"></u-icon>
						<text>系统推送</text>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			keywords: ''
		}
	},

	methods: {
		search() {
			uni.$toast.info('搜索功能开发中')
		}
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
	background-image: url('/static/images/titlebg.png');
	background-repeat: no-repeat;
	background-size: cover;
	background-position: center;
	padding: 0 40rpx;
	display: flex;
	align-items: center;
}

.placeholder-section {
	display: flex;
	justify-content: center;
	padding: 80rpx 40rpx 0;
}

.placeholder-card {
	display: flex;
	flex-direction: column;
	align-items: center;
	background: #fff;
	padding: 60rpx 40rpx;
	border-radius: 24rpx;
	box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
	width: 100%;
	max-width: 600rpx;
}

.placeholder-title {
	font-size: 32rpx;
	font-weight: bold;
	color: $uni-text-color;
	margin-top: 24rpx;
	margin-bottom: 12rpx;
}

.placeholder-desc {
	font-size: 26rpx;
	color: $zl-text-secondary;
	margin-bottom: 40rpx;
}

.feature-preview {
	display: flex;
	flex-direction: row;
	gap: 40rpx;
	padding: 30rpx;
	background: $zl-bg-color;
	border-radius: 16rpx;
	width: 100%;
	justify-content: center;
}

.feature-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8rpx;

	text {
		font-size: 22rpx;
		color: $zl-text-secondary;
	}
}
</style>
