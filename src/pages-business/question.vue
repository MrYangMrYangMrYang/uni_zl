<template>
	<view class="content">
		<view class="header">
			<view class="search">
				<u-search
					:showAction="false"
					placeholder="搜索你想了解的问题..."
					v-model="keywords"
					@search="search"
				></u-search>
			</view>
		</view>

		<view class="list">
			<u-skeleton v-if="isInitialLoading" rows="10" title loading animate></u-skeleton>

			<block v-else>
				<post-item v-for="(item, index) in list" :key="item.id || index" :item="item" />

				<u-empty v-if="list.length === 0" mode="list" text="暂无提问数据"></u-empty>

				<u-loadmore v-else :status="loadStatus" />
			</block>
		</view>

		<u-toast ref="notice"></u-toast>
	</view>
</template>

<script>
import { listMixin } from '@/mixins/listMixin'
import PostItem from '@/components/PostItem.vue'
import { mapState } from 'vuex'
import { debounce } from '@/utils/debounce.js'

export default {
	mixins: [listMixin],
	components: {
		PostItem
	},
	data() {
		return {
			keywords: '',
			isInitialLoading: true
		}
	},
	computed: {
		...mapState(['userInfo'])
	},
	onLoad() {
		this.getListData()
		// 创建防抖搜索函数，300ms 延迟避免频繁请求
		this.debouncedSearch = debounce(() => {
			this.refreshList()
		}, 300)
	},
	methods: {
		async getListData() {
			this.isLoading = true
			try {
				const res = await uni.$u.http.post('/user/question', {
					busid: this.userInfo.id,
					keywords: this.keywords,
					page: this.page
				})
				this.handleResponse(res)
			} catch (error) {
				console.error('getListData error:', error)
				uni.$toast.error('加载失败，请稍后重试')
			} finally {
				this.isInitialLoading = false
			}
		},
		search() {
			this.debouncedSearch()
		}
	}
}
</script>

<style lang="scss" scoped>
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

.list {
	padding: 20rpx;
}
</style>
