<template>
	<view class="content">
		<!-- 顶部区域：搜索框 + 分类标签栏 -->
		<view class='header'>
			<view class='search'>
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
			
			<!-- 分类标签导航 -->
			<view class='nav'>
				<u-tabs 
					:list="cateList"
					@click="handleCateClick"
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
				>
				</u-tabs>
			</view>
		</view>

		<!-- 帖子列表区域 -->
		<view class="list">
			
			<!-- 骨架屏：首次加载时显示 -->
			<u-skeleton
				v-if="isInitialLoading"
				rows="10"
				title
				loading
				animate
			></u-skeleton>
			
			<!-- 分类切换加载遮罩 -->
			<view v-else-if="switchingCate" class="switching-overlay">
				<u-loading-icon mode="circle" size="40"></u-loading-icon>
				<view style="margin-top: 16rpx; color: #999; font-size: 26rpx;">切换中...</view>
			</view>

			<block v-else>
				<post-item v-for="(item, index) in list" :key="item.id || index" :item="item" />
				
				<u-empty v-if="list.length === 0" mode="list" text="暂无相关帖子"></u-empty>
				
				<u-loadmore v-else :status="loadStatus" />
			</block>
		</view>

		<u-toast ref="notice"></u-toast>
	</view>
</template>

<script>
/**
 * @page index
 * @description 首页（帖子列表）
 * 功能：帖子列表展示（分类筛选、关键词搜索）、下拉刷新 + 上拉加载更多、分类数据缓存、骨架屏加载
 * 使用混入：listMixin（分页加载逻辑）
 */
	import { listMixin } from '@/mixins/listMixin'
	import PostItem from '@/components/PostItem.vue'
	import { mapState } from 'vuex'

	export default {
		
		mixins: [listMixin],
		
		components: {
			PostItem
		},
		
		data() {
			return {
				cateList: [{ name: '全部', id: 0 }],  // 分类列表（默认含"全部"）
				cateid: 0,                            // 当前选中的分类ID
				keywords: '',                         // 搜索关键词
				isInitialLoading: true,                // 首次加载状态（控制骨架屏）
				cacheList: {},                        // 分类数据缓存 {cateid: [data]}
				switchingCate: false                  // 分类切换中状态
			}
		},
		
		computed: {
			...mapState(['userInfo'])
		},
		
		onLoad() {
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
		
		methods: {
			
			/**
			 * 获取帖子分类列表
			 * 从后端接口获取所有分类并添加默认的"全部"选项
			 * @returns {Promise<void>}
			 */
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
			
			/**
			 * 获取帖子列表数据（覆盖listMixin中的同名方法）
			 * 支持分类筛选、关键词搜索和分页加载
			 * @returns {Promise<void>}
			 */
			async getListData() {
				this.isLoading = true
				
				try {
					const res = await uni.$u.http.post('/post/index', {
						cateid: this.cateid,
						keywords: this.keywords,
						page: this.page
					})

					if (res.code === 1) {
						const newData = res.data || []
						
						if (this.page === 1) {
							// 第一页：直接替换
							this.list = newData
							this.cacheList[this.cateid] = newData
						} else {
							// 加载更多：合并数据
							this.list = [...(this.cacheList[this.cateid] || []), ...newData]
							this.cacheList[this.cateid] = this.list
						}

						this.total = res.total || (this.list.length + (newData.length < this.pagesize ? 0 : 1))
						
						if (this.list.length >= this.total || newData.length < this.pagesize) {
							this.loadStatus = 'nomore'
						} else {
							this.loadStatus = 'loadmore'
						}
					} else {
						this.loadStatus = 'loadmore'
					}
				} catch (error) {
					console.error('getListData error:', error)
					uni.$toast.error('加载失败，请稍后重试')
				} finally {
					this.isInitialLoading = false
					this.switchingCate = false
					this.isLoading = false
				}
			},
			
			/**
			 * 处理分类标签点击事件（带缓存优化）
			 * 有缓存直接使用，无缓存则请求接口
			 * @param {object} item - 点击的分类对象 {name, id}
			 */
			handleCateClick(item) {
				if (this.cateid === item.id) return
				
				this.cateid = item.id

				if (this.cacheList[item.id] && this.cacheList[item.id].length > 0) {
					// 有缓存：直接使用
					this.list = this.cacheList[item.id]
					this.page = Math.ceil(this.list.length / this.pagesize) + 1
					this.loadStatus = this.list.length >= (this.total || 10) ? 'nomore' : 'loadmore'
				} else {
					// 无缓存：请求接口
					this.switchingCate = true
					this.refreshList()
				}
			},
			
			/**
			 * 执行搜索操作
			 * 重置页码并重新加载数据
			 */
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

	/* 顶部固定区域 */
	.header {
		background-color: white;
		position: sticky;
		top: 0;
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

	/* 帖子列表 */
	.list {
		padding: 20rpx;
		position: relative;

		/* 分类切换加载遮罩 */
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

	/* 用户头像区域 */
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

	/* 帖子信息区域 */
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

			.createtime, .category {
				font-size: $uni-font-size-sm;
				color: $uni-text-color-grey;
			}
		}

		/* 底部附加信息 */
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
