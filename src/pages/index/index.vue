<template>
	<view class="content">
		<view class='header'>
			<view class='search'>
			  <view class='slogan'>知了IT社区-你想了解的这里都有</view>
			  <u-search :showAction="false" placeholder="搜索你想了解的问题..." v-model="keywords" @search="search"></u-search>
			</view>
			<view class='nav'>
				<u-tabs 
					:list="cate" 
					@click="CateToggle" 
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

		<view class="list" v-if="post.length > 0">
			<view class="item" v-for="(item, index) in post" :key="index">
				<view class="business">
					<navigator :url="`/pages/business/user?busid=${item.busid}`" class="avatar">
						<image mode="aspectFit" :src="item.business.avatar_text"></image>
					</navigator>
					<view class="author">{{item.business.nickname}}</view>
				</view>
				
				<view class="info">
					<navigator :url="`/pages/post/info?postid=${item.id}`" class="title">{{item.title}}</navigator>
					<view class="createtime">发布时间：{{item.createtime_text}}</view>
					<view class="category">分类：{{item.category.name}}</view>
					
					<view class="join">
						<view class="status">{{item.status == '1' && item.accept ? '已解决' : '未解决'}}</view>
						<view class="point">￥{{item.point}}积分</view>
						<view class="count">{{item.comment_count}}人参与回复</view>
					</view>
				</view>
			</view>
			<u-loadmore :status="loadStatus" />
		</view>

		<!-- 提醒组件 -->
		<u-toast ref="notice"></u-toast>
	</view>
</template>

<script>
	export default {
		onLoad()
		{
			//获取本地存储
			var business = uni.getStorageSync('business') ? uni.getStorageSync('business') : {}
					
			//覆盖data数据
			if(Object.getOwnPropertyNames(business).length > 0)
			{
				this.business = business
			}
			
			//获取数据
			this.CateData()
			this.PostData()
		},
		data()
		{
			return {
				business:{},
				post: [],
				cate: [
					{name: '全部', id: 0}
				],
				cateid: 0,
				keywords: '',
				//加载状态
				loadStatus: 'loadmore',
				//请求页数
				page: 1,
				//请求数据总数
				total: 0,
				//每页请求数据数
				pagesize: 10,
				//加载是否完成状态
				isloading: false,
			}
		},
		methods:{
			//下拉刷新
			onPullDownRefresh()
			{
				// 回复默认数据
				this.page = 1
				this.total = 0
				this.isloading = false
				//清空数据
				this.post = []
				//重新发起请求
				this.PostData(() => uni.stopPullDownRefresh())
			},
			//上拉加载
			onReachBottom()
			{
				//判断数据是否请完
				if (this.page * this.pagesize > this.total){
					this.$refs.notice.show({
						type:"default",
						message:'暂无更多数据'
					})
					this.loadStatus = 'nomore'
					return false
				} 
				//判断加载是否完成
				if (this.isloading==true){
					return false
				} 
				//页面自增
				this.page++	
				// //获取数据
				this.PostData()			
			},
			//获取分类数据
			async CateData()
			{				
				//组装数据
				var data = {}

				var result = await uni.$u.http.post('/post/cate', data)

				if(result.code == 0)
				{
					this.$refs.notice.show({
						type:"error",
						message:result.msg
					})
					return false
				}

				this.cate.push(...result.data)
			},
			//获取帖子数据
			async PostData(cb)
			{	
				this.isloading = true
				
				//组装数据
				var data = {
					cateid: this.cateid,
					keywords: this.keywords,
					page: this.page
				}

				var result = await uni.$u.http.post('/post/index', data)
				
				this.isloading = false
				
				if(result.code == 0)
				{
					this.$refs.notice.show({
						type:"error",
						message:result.msg
					})
					return false
				}
				
				// 只要数据请求完毕，就立即按需调用 cb 回调函数
				if(cb){
					cb()
				}			
				//每一次请求都把请求到的新的数据，和上一次的数据做一次合并
				this.post = [...this.post, ...result.data]
				this.total = this.post.length				
			},
			//分类切换
			CateToggle(item)
			{			
				this.cateid = item.id
				
				// 回复默认数据
				this.page = 1
				this.total = 0
				this.isloading = false
				
				//清空数据
				this.post = []
				
				//重新发起请求
				this.PostData(() => uni.stopPullDownRefresh())
			},
			//搜索
			search()
			{
				//清楚原来的数据
				this.post = []
				//请求输入的数据
				this.PostData()
			},
		}

	}
</script>


<style>
	.content{
		width:100%;
		overflow-x: hidden;
	}
	.search {
		height: 220rpx;
		background-image: url("/static/titlebg.png");
		background-repeat: no-repeat;
		background-size: 100% 100%;
		background-position: center;
		padding: 0 28rpx;	
	}

	.slogan {
		font-size: 46rpx;
		color: #fff;
		padding-top: 30rpx;
		padding-bottom: 30rpx;
		padding-left: 15rpx;
	}

	.search-area {
		width: 100%;
		height: 88rpx;
		background-color: #fff;
		background-image: url("/static/search.png");
		background-repeat: no-repeat;
		background-size: 30rpx 30rpx;
		background-position: 35rpx 30rpx;
		border-radius: 11rpx;
		line-height: 88rpx;
		text-indent: 78rpx;
		color: #2f2e2e;
		font-size: 30rpx;
	}

	.nav {
		display: block;
		background-color: #f1f6f9;
		position: relative;
	}

	.nav .nav-item {
		width: 25%;
		height: 110rpx;
		line-height: 110rpx;
		text-align: center;
		color: #666;
		font-size: 30rpx;
	}

	.nav .active {
		color: #000;
		font-weight: 600;
	}

	.nav .active-line {
		background-color: #038fff;
		width: 35rpx;
		height: 4rpx;
		position: absolute;
		top: 86rpx;
		transition: left 0.2s;
	}

	.list .item{
		display: flex;
		width:100%;
		padding:10px;
		margin:0 auto;
		border-bottom:1px solid #e9e6e6;
		flex-direction: row;
	}

	.business{
		width:20%;
		flex-shrink: 0;
		overflow: hidden;
		border-radius: 10px;
		margin-right:10px;
	}

	.avatar{
		width:100%;
		height:5em;
	}

	.avatar image{
		width:100%;
		height:100%;
		border-radius: 10%;
	}

	.author{
		text-align: center;
		font-size:.8em;
		color:#999;
		width:100%;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	.info{
		font-size:.9em;
		color:#999;
	}

	.info .title, .info .createtime, .info .category, .info .status, .info .join{
		margin-bottom:2px;
	}

	.info .title{
		font-size:1.1em;
		width:95%;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
		color:#000;
		text-decoration: underline;
		font-weight: bold;
	}

	.info .status{
		background:#fff8e5;
		color:#fa3534;
		padding:1px 2px;
		border:1px solid #fa3534;
		border-radius: 3px;
		margin-right:5px;
	}

	.info .join{
		display: flex;
		align-items: center;
		align-content: center;
		color:#fa3534;
	}

	.count{
		margin-right:10px;
	}

	.info .point{
		width:4.5em;
		text-align: center;
		background:#fff8e5;
		color:#f19049;
		padding:2px;
		margin-right:10px;
	}
</style>
