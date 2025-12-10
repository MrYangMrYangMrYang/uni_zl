<template>
	<view class="content">
		<view class='header'>
			<view class='search'>
			  <u-search :showAction="false" placeholder="搜索你想了解的问题..." v-model="keywords" @search="search"></u-search>
			</view>
		</view>

		<view class="list">
			<u-swipe-action v-for="(item, index) in post" :key="index">
				<view class="swipe-action u-border-top u-border-bottom">
					<view class="item">
						<view class="business">
							<view class="avatar">
								<image mode="aspectFit" :src="item.business.avatar_text"></image>
							</view>
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
				</view>
			</u-swipe-action>
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
			
			this.QuestData()
		},
		data()
		{
			return {
				business : {},
				post : [],
				keywords: ''
			}
		},
		methods:{
			async QuestData()
			{
				//组装数据
				var data = {
					busid : this.business.id,
					keywords: this.keywords
				}
			
				var result = await uni.$u.http.post('/user/question', data)
				
				if(result.code == 0)
				{
					this.$refs.notice.show({
						type:"error",
						message:result.msg
					})
					return false
				}
				
				//覆盖值
				this.post = result.data
				console.log(this.post);
			},
			search()
			{
				//请除原来的数据
				this.post = []
				//请求输入的数据
				this.QuestData()
			}
		}
	}
</script>


<style>
	.content{
		width:100%;
		overflow-x: hidden;
	}
	.search {
		height: 238rpx;
		background-image: url("/static/titlebg.png");
		background-repeat: no-repeat;
		background-size: 100% 100%;
		background-position: center;
		padding: 0 28rpx;
		display: flex;
		align-items: center;
		align-content: center;
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
		display: flex;
		background-color: #f1f6f9;
		position: relative;
		justify-content: space-around;
		align-items: center;
		align-content: center;
	}

	.nav .nav-item {
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
		border-radius:10px;
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
		width:4em;
		text-align: center;
		background:#fff8e5;
		color:#f19049;
		padding:2px;
		margin-right:10px;
	}
</style>
