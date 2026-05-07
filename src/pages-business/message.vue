<template>
	<view class="content">
		<view class='header'>
			<view class='search'>
				<u-search :showAction="false" placeholder="搜索你想知道的用户..." v-model="keywords" @search="search"></u-search>
			</view>
		</view>

		<view class="message-list">
			<u-empty mode="message" text="暂无消息"></u-empty>
		</view>
	</view>
</template>

<script>
/**
 * business/message.vue - 我的私信
 *
 * 功能说明：
 * - 私信列表展示（搜索功能）
 * - 点击私信进入聊天详情
 * - 功能开发中（占位页面）
 */
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
		background-image: url("/static/titlebg.png");
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
</style>
