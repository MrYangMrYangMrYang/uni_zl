<template>
	<view class="post-item" @click="goDetail" role="article" :aria-label="item.title">
		<view class="business" v-if="item.business">
			<view class="avatar" @tap.stop="goUser">
				<image mode="aspectFit" lazy-load :src="item.business.avatar_text"></image>
			</view>
		</view>

		<view class="info">
			<view class="title">{{ item.title }}</view>

			<view class="meta-info">
				<view class="author-name" v-if="item.business">{{ item.business.nickname }}</view>
				<view class="createtime">{{ item.createtime_text }}</view>
				<view class="category" v-if="item.category">{{ item.category.name }}</view>
			</view>

			<view class="join">
				<view :class="['status', item.status == '1' && item.accept ? 'solved' : 'unsolved']">
					{{ item.status == '1' && item.accept ? '已解决' : '未解决' }}
				</view>
				<view class="point">￥{{ item.point }}积分</view>
				<view class="count">{{ item.comment_count }}人回复</view>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	name: 'PostItem',

	props: {
		item: {
			type: Object,
			default: () => ({})
		}
	},

	methods: {
		goDetail() {
			uni.navigateTo({
				url: `/pages-post/info?postid=${this.item.id}`
			})
		},

		// tap.stop 阻止事件冒泡，避免触发父级 goDetail
		goUser() {
			uni.navigateTo({
				url: `/pages-business/user?busid=${this.item.busid}`
			})
		}
	}
}
</script>

<style lang="scss" scoped>
.post-item {
	display: flex;
	background-color: white;
	padding: 24rpx;
	margin-bottom: 20rpx;
	border-radius: 16rpx;
	box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
	transition: all 0.3s;

	&:active {
		transform: scale(0.98);
		background-color: $uni-bg-color-hover;
	}

	.business {
		width: 100rpx;
		height: 100rpx;
		flex-shrink: 0;
		margin-right: 24rpx;

		.avatar {
			width: 100%;
			height: 100%;
			border-radius: 50%;
			overflow: hidden;
			background-color: $uni-bg-color-grey;

			image {
				width: 100%;
				height: 100%;
			}
		}
	}

	.info {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;

		.title {
			font-size: 32rpx;
			font-weight: bold;
			color: $uni-text-color;
			margin-bottom: 12rpx;
			line-height: 1.4;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}

		.meta-info {
			display: flex;
			flex-wrap: wrap;
			gap: 16rpx;
			margin-bottom: 16rpx;

			.author-name {
				font-size: 24rpx;
				color: $zl-primary;
				font-weight: 500;
			}

			.createtime,
			.category {
				font-size: 24rpx;
				color: $uni-text-color-grey;
			}
		}

		.join {
			display: flex;
			align-items: center;
			justify-content: space-between;
			margin-top: auto;
			padding-top: 16rpx;
			border-top: 1rpx solid #f5f5f5;

			.status {
				font-size: 22rpx;
				padding: 4rpx 12rpx;
				border-radius: 4rpx;
				background-color: #f0f9eb;
				color: #67c23a;

				&.unsolved {
					background-color: #fef0f0;
					color: #f56c6c;
				}
			}

			.point {
				font-size: 24rpx;
				color: #e6a23c;
				font-weight: bold;
			}

			.count {
				font-size: 22rpx;
				color: $uni-text-color-grey;
			}
		}
	}
}
</style>
