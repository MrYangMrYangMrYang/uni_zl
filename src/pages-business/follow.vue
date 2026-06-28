<template>
	<view class="content">
		<view class="header">
			<view class="search">
				<u-search
					:showAction="false"
					placeholder="搜索你想知道的用户..."
					v-model="keywords"
					@search="search"
					shape="round"
					bgColor="rgba(255,255,255,0.95)"
					borderColor="transparent"
				></u-search>
			</view>

			<view class="nav">
				<u-tabs
					class="nav-item"
					:list="cate"
					@click="handleTabSwitch"
					lineWidth="75"
					:is-scroll="false"
					:current="active === '1' ? 1 : 0"
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

		<view v-if="switchingTab" class="tab-loading-overlay">
			<u-loading-icon mode="circle" size="40"></u-loading-icon>
			<view style="margin-top: 16rpx; color: #999; font-size: 26rpx">切换中...</view>
		</view>

		<!-- 首次进入骨架屏：模拟列表项布局，避免空白闪烁 -->
		<view v-if="pageLoading" class="skeleton-list">
			<view class="skeleton-item" v-for="n in 5" :key="n">
				<u-skeleton
					:loading="true"
					:animate="true"
					avatar
					:avatarSize="40"
					:rows="2"
					:rowsWidth="['60%', '40%']"
					:rowsHeight="['24rpx', '20rpx']"
					:title="false"
				></u-skeleton>
			</view>
		</view>

		<view class="list" v-if="(active === '0' || active === '') && !switchingTab && !pageLoading">
			<template v-if="attenlist.length > 0">
			<view
				v-for="(item, index) in attenlist"
				:key="index"
				class="swipe-action u-border-top u-border-bottom"
			>
				<view class="item">
					<view class="business">
						<navigator :url="`/pages-business/user?busid=${item.business.id}`" class="avatar">
							<image mode="aspectFit" lazy-load :src="item.business.avatar_text"></image>
						</navigator>
					</view>
					<view class="info">
						<navigator :url="`/pages-business/user?busid=${item.business.id}`" class="name">
							{{ item.business.nickname }}
						</navigator>
						<view class="desc" v-if="item.business.lable">{{ item.business.lable }}</view>
					</view>
				</view>
			</view>
		</template>

			<u-empty v-if="attenlist.length === 0" mode="list" text="暂无关注"></u-empty>
			<view class="list-count" v-if="attenlist.length > 0">没有更多数据了</view>
		</view>

		<view class="list" v-if="active === '1' && !switchingTab && !pageLoading">
			<template v-if="fanslist.length > 0">
			<view
				v-for="(item, index) in fanslist"
				:key="index"
				class="swipe-action u-border-top u-border-bottom"
			>
				<view class="item">
					<view class="business">
						<navigator :url="`/pages-business/user?busid=${item.business.id}`" class="avatar">
							<image mode="aspectFit" lazy-load :src="item.business.avatar_text"></image>
						</navigator>
					</view>
					<view class="info">
						<navigator :url="`/pages-business/user?busid=${item.business.id}`" class="name">
							{{ item.business.nickname }}
						</navigator>
						<view class="desc" v-if="item.business.lable">{{ item.business.lable }}</view>
					</view>
				</view>
			</view>
		</template>

			<u-empty v-if="fanslist.length === 0" mode="list" text="暂无粉丝"></u-empty>
			<view class="list-count" v-if="fanslist.length > 0">没有更多数据了</view>
		</view>

		<u-toast ref="notice"></u-toast>
	</view>
</template>

<script>
import { tabCacheMixin } from '@/mixins/tabCacheMixin'
import { authMixin } from '@/mixins/authMixin'

export default {
	mixins: [tabCacheMixin, authMixin],
	onLoad() {
		if (!this.requireLogin()) return

		this.busid = this.currentUserId
		this.initTabCache(['0', '1'])

		// 通过 getCurrentPages 读取路由参数，支持从"我的粉丝"入口直达粉丝Tab
		const pages = getCurrentPages()
		const currentPage = pages[pages.length - 1]
		const options = currentPage.options || {}

		if (options.tab === 'fans') {
			this.active = '1'
			this.FansData()
		} else {
			this.active = '0'
			this.AttentionData()
		}
	},

	data() {
		return {
			busid: 0,
			cate: [
				{ name: '我的关注', id: '0' },
				{ name: '我的粉丝', id: '1' }
			],
			attenlist: [],
			fanslist: [],
			keywords: '',
			pageLoading: true
		}
	},

	methods: {
		async fetchFollowData(api, listField, cacheKey, errorLabel) {
			try {
				const data = {
					busid: this.busid,
					keywords: this.keywords
				}

				const result = await uni.$u.http.post(api, data, { custom: { toast: false, retry: 2 } })

				if (result.code == 0) {
					this[listField] = []
					this.tabCache[cacheKey] = []
					return false
				}

				this[listField] = this.deduplicateList(result.data || [])
				this.tabCache[cacheKey] = this[listField]
			} catch (error) {
				console.error(errorLabel + ' error:', error)
				this[listField] = []
				this.tabCache[cacheKey] = []
			} finally {
				this.switchingTab = false
				this.pageLoading = false
			}
		},

		async AttentionData() {
			await this.fetchFollowData('/user/myattention', 'attenlist', '0', 'AttentionData')
		},

		async FansData() {
			await this.fetchFollowData('/user/myfans', 'fanslist', '1', 'FansData')
		},

		// eslint-disable-next-line no-unused-vars
		onTabCacheHit(tabId) {
			this.attenlist = this.tabCache['0'] || []
			this.fanslist = this.tabCache['1'] || []
		},

		async loadTabData(tabId) {
			if (tabId == '0') this.AttentionData()
			if (tabId == '1') this.FansData()
		},

		search() {
			if (this.active == '0') {
				this.attenlist = []
				this.AttentionData()
			} else if (this.active == '1') {
				this.fanslist = []
				this.FansData()
			}
		},

		// 数据去重：后端可能返回重复记录，按用户ID去重
		deduplicateList(list) {
			if (!list || list.length === 0) return []

			const seen = new Map()

			return list.filter(item => {
				const key = item.business?.id || item.busid || item.id

				if (seen.has(key)) {
					return false
				}

				seen.set(key, true)
				return true
			})
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

.skeleton-list {
	padding: 20rpx;

	.skeleton-item {
		background-color: white;
		padding: 24rpx;
		margin-bottom: 20rpx;
		border-radius: 16rpx;
		box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
	}
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

	.item {
		display: flex;
		align-items: center;
		background-color: white;
		padding: 24rpx;
		margin-bottom: 20rpx;
		border-radius: 16rpx;
		box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
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
}

.info {
	flex: 1;
	display: flex;
	flex-direction: column;
	justify-content: center;

	.nickname {
		font-size: $uni-font-size-base;
		font-weight: bold;
		color: $uni-text-color;
		margin-bottom: 8rpx;
	}

	.desc {
		font-size: 24rpx;
		color: $uni-text-color-grey;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}
}

.list-count {
	text-align: center;
	font-size: 24rpx;
	color: $uni-text-color-grey;
	padding: 20rpx 0;
}

.nav {
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
</style>
