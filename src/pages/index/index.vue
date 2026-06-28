<template>
	<view class="content">
		<view class="header" :class="{ 'header-fixed': headerFixed }">
			<view class="search">
				<u-search
					:showAction="false"
					placeholder="知了IT社区，你想了解的这里都有..."
					v-model="keywords"
					@search="search"
					shape="round"
					bgColor="rgba(255,255,255,0.95)"
					borderColor="transparent"
				></u-search>
			</view>

			<view class="nav">
				<u-tabs
					:list="cateList"
					@click="handleTabSwitch"
					scrollable
					lineWidth="45"
					:activeStyle="{
						color: '#303133',
						fontWeight: 'bold',
						transform: 'scale(1.05)'
					}"
					:inactiveStyle="{
						color: '#606266',
						transform: 'scale(1)'
					}"
				></u-tabs>
			</view>
		</view>
		<view class="header-placeholder" v-if="headerFixed" :style="{ height: headerHeight + 'px' }"></view>

		<view class="list">
			<!-- 骨架屏：首次加载时显示 -->
			<u-skeleton v-if="isInitialLoading" rows="10" title loading animate></u-skeleton>

			<!-- 分类切换加载遮罩 -->
			<view v-else-if="switchingTab" class="switching-overlay">
				<u-loading-icon mode="circle" size="40"></u-loading-icon>
				<view style="margin-top: 16rpx; color: #999; font-size: 26rpx">切换中...</view>
			</view>

			<block v-else>
				<post-item v-for="(item, index) in list" :key="item.id || index" :item="item" />

				<u-empty v-if="list.length === 0" mode="list" text="暂无相关帖子"></u-empty>

				<u-loadmore v-else :status="loadStatus" />
			</block>
		</view>

		<u-toast ref="notice"></u-toast>
		<u-back-top
			:scrollTop="scrollTop"
			:duration="300"
			icon="arrow-up"
			:bottom="120"
			:right="30"
			:top="400"
			:customStyle="{ background: 'linear-gradient(135deg, #0173de, #4cd964)' }"
			:iconStyle="{ color: '#fff', fontSize: '20px' }"
		></u-back-top>
	</view>
</template>

<script>
import { listMixin } from '@/mixins/listMixin'
import { tabCacheMixin } from '@/mixins/tabCacheMixin'
import PostItem from '@/components/PostItem.vue'
import { mapState } from 'vuex'

export default {
	mixins: [listMixin, tabCacheMixin],

	components: {
		PostItem
	},

	data() {
		return {
			cateList: [{ name: '全部', id: 0 }],
			keywords: '',
			isInitialLoading: true,
			scrollTop: 0,
			headerFixed: false,
			headerTop: 0,
			headerHeight: 0
		}
	},

	computed: {
		...mapState(['userInfo'])
	},

	onLoad() {
		this.initTabCache([0])
		this.active = 0
		this.fetchCategories()
		this.getListData()
	},

	onShow() {
		if (getApp().globalData.needRefreshHome) {
			this.page = 1
			this.getListData()
			getApp().globalData.needRefreshHome = false
		}
	},

	onReady() {
		const query = uni.createSelectorQuery().in(this)
		query
			.select('.header')
			.boundingClientRect(data => {
				if (data) {
					this.headerTop = data.top
					this.headerHeight = data.height
				}
			})
			.exec()
	},

	onPageScroll(e) {
		this.scrollTop = e.scrollTop
		this.headerFixed = e.scrollTop >= this.headerTop
	},

	methods: {
		async fetchCategories() {
			try {
				const res = await uni.$u.http.post('/post/cate')
				if (res.code === 1) {
					this.cateList = [{ name: '全部', id: 0 }, ...res.data]
				}
			} catch (error) {
				console.error('fetchCategories error:', error)
			}
		},

		async getListData() {
			this.isLoading = true

			try {
				const res = await uni.$u.http.post(
					'/post/index',
					{
						cateid: this.active,
						keywords: this.keywords,
						page: this.page
					},
					{ custom: { toast: false } }
				)

				if (res.code === 1) {
					const newData = res.data || []

					if (this.page === 1) {
						this.list = newData
						this.tabCache[this.active] = newData
					} else {
						this.list = [...(this.tabCache[this.active] || []), ...newData]
						this.tabCache[this.active] = this.list
					}

					this.total = res.total || this.list.length + (newData.length < this.pagesize ? 0 : 1)

					if (this.list.length >= this.total || newData.length < this.pagesize) {
						this.loadStatus = 'nomore'
					} else {
						this.loadStatus = 'loadmore'
					}
				} else {
					if (this.page > 1) {
						this.page--
						this.loadStatus = 'nomore'
					} else {
						this.loadStatus = 'loadmore'
					}
				}
			} catch (error) {
				console.error('getListData error:', error)
				if (this.page > 1) {
					this.page--
					this.loadStatus = 'nomore'
				} else {
					this.loadStatus = 'loadmore'
				}
			} finally {
				this.isInitialLoading = false
				this.switchingTab = false
				this.isLoading = false
			}
		},

		onTabCacheHit(tabId) {
			this.list = this.tabCache[tabId] || []
			this.page = Math.ceil(this.list.length / this.pagesize) + 1
			this.loadStatus = this.list.length >= (this.total || 10) ? 'nomore' : 'loadmore'
		},

		// eslint-disable-next-line no-unused-vars
		async loadTabData(tabId) {
			this.refreshList()
		},

		search() {
			this.refreshList()
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
}

.header-fixed {
	position: fixed;
	top: 44px;
	left: 0;
	right: 0;
	z-index: 10;
}

.search {
	height: 120rpx;
	background: $zl-gradient;
	padding: 0 40rpx;
	display: flex;
	align-items: center;
	box-shadow: 0 4rpx 12rpx rgba(60, 156, 255, 0.3);
}

.nav {
	background-color: white;
	border-bottom: 1rpx solid $zl-border-color;
}

.list {
	padding: 20rpx;
	position: relative;

	.switching-overlay {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 100rpx 0;
		background-color: rgba(255, 255, 255, 0.8);
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 5;
		border-radius: 16rpx;
	}

	.item {
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
	}
}

.business {
	width: 100rpx;
	height: 100rpx;
	flex-shrink: 0;
	margin-right: 24rpx;

	.avatar {
		width: 100%;
		height: 100%;
		border-radius: $uni-border-radius-circle;
		overflow: hidden;
		background-color: $uni-bg-color-grey;

		image {
			width: 100%;
			height: 100%;
		}
	}

	.author {
		display: none;
	}
}

.info {
	flex: 1;
	display: flex;
	flex-direction: column;

	.title {
		font-size: $uni-font-size-lg;
		font-weight: bold;
		color: $uni-text-color;
		margin-bottom: 12rpx;
		line-height: 1.4;
	}

	.meta-info {
		display: flex;
		flex-wrap: wrap;
		gap: 16rpx;
		margin-bottom: 16rpx;

		.author-name {
			font-size: $uni-font-size-sm;
			color: $zl-primary;
			font-weight: 500;
		}

		.createtime,
		.category {
			font-size: $uni-font-size-sm;
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
			font-size: $uni-font-size-sm;
			color: #e6a23c;
			font-weight: bold;
		}

		.count {
			font-size: 22rpx;
			color: $uni-text-color-grey;
		}
	}
}
</style>
