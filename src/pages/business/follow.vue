<template>
	<view class="content">
		<view class='header'>
			<view class='search'>
				<u-search :showAction="false" placeholder="搜索你想知道的用户..." v-model="keywords" @search="search"></u-search>
			</view>
			<view class='nav'>
				<u-tabs 
					class="nav-item" 
					:list="cate"
					@click="CateToggle"
					lineWidth="75"
					:activeStyle="{
						color: '#303133',
						fontWeight: 'bold',
						transform: 'scale(1.05)'
					}"
					:inactiveStyle="{
						color: '#606266',
						transform: 'scale(1)'
					}"
					itemStyle="padding-left: 50px; padding-right: 50px; height: 50px;"
				>
				</u-tabs>
			</view>
		</view>

		<!-- 关注列表 -->
		<view class="list" v-if="attenlist.length > 0">
			<u-swipe-action v-for="(item, index) in attenlist" :key="index">
				<view class="swipe-action u-border-top u-border-bottom">
					<view class="item">
						<view class="business">
							<navigator :url="`/pages/business/user?busid=${item.business.id}`" class="avatar">
								<image mode="aspectFit" :src="item.business.avatar_text"></image>
							</navigator>
						</view>					
						<view class="info">
							<navigator url="" class="nickname">{{item.business.nickname}}</navigator>
							<view class="desc">{{item.business.lable}}</view>
						</view>
					</view>
				</view>
			</u-swipe-action>
			
		<!-- 粉丝列表 -->
		</view><view class="list" v-if="fanslist.length > 0">
			<u-swipe-action v-for="(item, index) in fanslist" :key="index">
				<view class="swipe-action u-border-top u-border-bottom">
					<view class="item">
						<view class="business">
							<navigator :url="`/pages/business/user?busid=${item.business.id}`" class="avatar">
								<image mode="aspectFit" :src="item.business.avatar_text"></image>
							</navigator>
						</view>
						
						<view class="info">
							<navigator url="" class="nickname">{{item.business.nickname}}</navigator>
							<view class="desc">{{item.business.lable}}</view>
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
			
			this.AttentionData()
		},
		data()
		{
			return {
				business : {
					lable : '这家伙很懒，啥也没写'
				},
				cate: [
					{name: '我的关注', id: '0'},
					{name: '我的粉丝', id: '1'},
				],
				active : '',
				attenlist : [],
				fanslist : [],
				keywords: ''
			}
		},
		methods:{
			async AttentionData()
			{
				//组装数据
				var data = {
					busid : this.business.id,
					keywords: this.keywords
				}
			
				var result = await uni.$u.http.post('/user/myattention', data)
				
				if(result.code == 0)
				{
					this.$refs.notice.show({
						type:"error",
						message:result.msg
					})
					return false
				}
				
				//覆盖值
				this.attenlist = result.data
				// console.log(this.attenlist);
			},
			async FansData()
			{
				//组装数据
				var data = {
					busid : this.business.id,
					keywords: this.keywords
				}
			
				var result = await uni.$u.http.post('/user/myfans', data)
				
				if(result.code == 0)
				{
					this.$refs.notice.show({
						type:"error",
						message:result.msg
					})
					return false
				}
				
				//覆盖值
				this.fanslist = result.data
				// console.log(this.fanslist);
			},
			CateToggle(item)
			{
				this.active = item.id
				if(this.active == '0'){
					this.fanslist = []
					this.AttentionData()
				}
				if(this.active == '1'){
					this.attenlist = []
					this.FansData()
				}
			},
			search()
			{
				if(this.active == '0'){
					//请除原来的数据
					this.attenlist = []
					//重新请求输入的数据
					this.AttentionData()
				}
				else if(this.active == '1'){
					//请除原来的数据
					this.fanslist = []
					//重新请求输入的数据
					this.FansData()
				}
			}
		}
	}
</script>

<style>
	.info .nickname[data-v-4281dd77]{
		margin-top: 10px;
	}
	.info .desc[data-v-4281dd77]{
		margin-top: 3px;
	}
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
	
	.nav[data-v-4281dd77]{
		height: 50px;
	}
	
	.nav .nav-item[data-v-4281dd77]{
		height: 50px;
		line-height: 0;
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
		width:95%;
		margin:10px auto;
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
	}

	.info{
		font-size:.9em;
		color:#999;
	}

	.info .nickname, .info .desc{
		margin-bottom:2px;
	}

	.info .nickname{
		font-size:1.1em;
		width:95%;
		/* overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis; */
		color:#000;
		font-weight: bold;
	}

	.info .desc{
		font-size:.8em;
		width:100%;
		overflow: hidden;
		text-overflow: ellipsis;
		display: -webkit-box;
		/* 改成你需要的行数 */
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
	}

</style>
