<template>
	<view class="content">
		<view class='header'>
			<view class='person'>
				<!-- 基本资料 -->
				<view class="info">
					<view class="avatar">
						<!-- #ifdef H5 || APP-PLUS -->
							<image v-if="!business.hasOwnProperty('id')" src="/static/logo.png"></image>
							<image v-else :src="business.avatar_text">
						<!-- #endif -->
						
						<!-- #ifdef MP-WEIXIN -->
							<image v-if="business.hasOwnProperty('avatar') && business.avatar" :src="business.avatar_text">
							<open-data v-else type="userAvatarUrl"></open-data>
						<!-- #endif -->
					</view>

					<view class="base">
						<view class="nickname">{{business.nickname}}</view>
						<view class="desc" style="width: 150px;height: 30px;white-space: normal;">{{business.lable}}</view>
					</view>
					
					<!-- 关注 -->
					<view class="btnlist" v-if="business.id != ybusiness.id && ybusiness.hasOwnProperty('id')">
						<view class="btn">
							<u-button v-if="attention" @click="AttentionToggle" type="success" icon="man-add" text="取消关注"></u-button>
							<u-button v-else @click="AttentionToggle" type="warning" icon="man-add" text="关注"></u-button>
						</view>
						<!-- <view class="btn">
							<u-button type="success" icon="more-circle" text="发私信"></u-button>
						</view> -->
					</view>
				</view>

				<!-- 宫格布局 -->
				<view class="grid">
					<u-grid :border="true">
						<u-grid-item>
							<u--text color="#fff" text="提问" align="center"></u--text>
							<u--text color="#fff" :text="business.quest_count" align="center"></u--text>
						</u-grid-item>
						<u-grid-item>
							<u--text color="#fff" text="回答" align="center"></u--text>
							<u--text color="#fff" :text="business.answer_count" align="center"></u--text>
						</u-grid-item>
						<u-grid-item>
							<u--text color="#fff" text="收藏" align="center"></u--text>
							<u--text color="#fff" :text="business.collect_count" align="center"></u--text>
						</u-grid-item>
					</u-grid>
				</view>
			</view>
			
			<!-- 标签栏 -->
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
				  itemStyle="padding-left: 30px; padding-right: 30px; height: 50px;"
			  >
			  </u-tabs>
			</view>
		</view>

		<view class="list" v-if="questpost.length > 0">
			<u-swipe-action v-for="(item, index) in questpost" :key="index">
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
								<view class="point">￥{{item.point}}</view>
								<view class="count">{{item.comment_count}}人参与回复</view>
							</view>
						</view>
					</view>
				</view>
			</u-swipe-action>
		</view>
		
		<view class="list" v-if="answerpost.length > 0">
			<u-swipe-action v-for="(item, index) in answerpost" :key="index">
				<view class="swipe-action u-border-top u-border-bottom">
					<view class="item">
						<view class="business">
							<view class="avatar">
								<image mode="aspectFit" :src="item.business.avatar_text"></image>
							</view>
							<view class="author">{{item.business.nickname}}</view>
						</view>			
						<view class="info">
							<navigator :url="`/pages/post/info?postid=${item.postid}`" class="title">评论帖子：{{item.post.title}}</navigator>
							<view class="createtime">评论内容：{{item.content}}</view>			
							<view class="createtime">评论时间：{{item.createtime_text}}</view>									
							<view class="join">
								<view class="count">评论点赞数：{{item.likes_count}}</view>
							</view>
						</view>
					</view>
				</view>
			</u-swipe-action>
		</view>
		
		<view class="list" v-if="collectpost.length > 0">
			<u-swipe-action v-for="(item, index) in collectpost" :key="index">
				<view class="swipe-action u-border-top u-border-bottom">
					<view class="item">
						<view class="business">
							<view class="avatar">
								<image mode="aspectFit" :src="item.business.avatar_text"></image>
							</view>
							<view class="author">{{item.business.nickname}}</view>
						</view>
						
						<view class="info">
							<navigator :url="`/pages/post/info?postid=${item.post.id}`" class="title">{{item.post.title}}</navigator>
							<view class="createtime">发布时间：{{item.post.createtime_text}}</view>
							<view class="category">分类：{{item.category.name}}</view>						
							<view class="join">
								<view class="status">{{item.post.status == '1' && item.post.accept ? '已解决' : '未解决'}}</view>
								<view class="point">￥{{item.post.point}}</view>
								<view class="count">{{item.post.comment_count}}人参与回复</view>
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
		onLoad(option)
		{		
			var busid = option.busid ? option.busid : 0;		
			if(busid){
				//获取本地存储
				var business = uni.getStorageSync('business') ? uni.getStorageSync('business') : {}
						
				//覆盖data数据
				if(Object.getOwnPropertyNames(business).length > 0)
				{
					this.ybusiness = business
				}
				
				this.busid = busid
				
				this.UserData()
							
				//获取关注状态
				this.AttentionState()
			}
			else{
				//获取本地存储
				var business = uni.getStorageSync('business') ? uni.getStorageSync('business') : {}
						
				//覆盖data数据
				if(Object.getOwnPropertyNames(business).length > 0)
				{
					this.business = business
				}
				// console.log(this.business);
				
				this.QuestData()
			}
		},
		data()
		{
			return {
				busid : 0,
				ybusiness : {},
				business : {
					lable : '这家伙很懒，啥都没写'
				},
				cate: [
					{name: '我的提问', id: '0'},
					{name: '我的回答', id: '1'},
					{name: '我的收藏', id: '2'}
				],
				questpost : [],
				answerpost : [],
				collectpost : [],
				active : '',
				attention: false,
			}
		},
		methods:{
			//获取用户数据
			async UserData()
			{
				var result = await uni.$u.http.post('/user/info', {busid:this.busid})
			
				//获取用户信息失败
				if(result.code == 0)
				{
					this.$refs.notice.show({
						type: 'error',
						message: result.msg,
						complete()
						{
							//返回上一个界面
							uni.$u.route({
								type: 'navigateBack',
								delta: 1
							})
						}
					})
					return false
				}		
				this.business = result.data.business
				
				var result = await uni.$u.http.post('/user/question', {busid:this.business.id})
				
				this.questpost = result.data
			},
			async QuestData()
			{
				//组装数据
				var data = {
					busid : this.business.id
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
				this.questpost = result.data
				// console.log(this.questpost);
			},
			async AnswerData()
			{
				//组装数据
				var data = {
					busid : this.business.id
				}
			
				var result = await uni.$u.http.post('/user/answer', data)
				
				if(result.code == 0)
				{
					this.$refs.notice.show({
						type:"error",
						message:result.msg
					})
					return false
				}
				
				//覆盖值
				this.answerpost = result.data
				// console.log(this.answerpost);
			},
			//获取关注状态
			async AttentionState()
			{
				//判断是否有登录
				if(Object.getOwnPropertyNames(this.ybusiness).length <= 0)
				{
					this.attention = false
					return false
				}
			
				//组装数据
				var data = {
					followid: this.busid,
					busid: this.ybusiness.id
				}
			
				var result = await uni.$u.http.post('/attention/check', data)
				
				// console.log(result);
				
				this.attention = result.code == 0 ? false : true;
				
				// console.log(this.attention);
			},
			
			//更改关注状态
			async AttentionToggle()
			{
				//判断是否有登录
				if(Object.getOwnPropertyNames(this.ybusiness).length <= 0)
				{
					this.$refs.notice.show({
						type: 'error',
						message: '请先登录'
					})
					return false
				}
			
				//组装数据
				var data = {
					followid: this.busid,
					busid: this.ybusiness.id
				}
			
				//已关注，要取消关注
				if(this.attention)
				{
					var result = await uni.$u.http.post('/attention/del', data)
				}else
				{
					//没关注，想添加关注
					var result = await uni.$u.http.post('/attention/add', data)
				}
			
				if(result.code == 0)
				{
					this.$refs.notice.show({
						type: 'error',
						message: result.msg
					})
					return false
				}else
				{
					this.$refs.notice.show({
						type: 'success',
						message: result.msg,
						duration: 1000
					})
				
					//修改收藏的状态
					this.attention = !this.attention
				}
			},
			async CollectData()
			{
				//组装数据
				var data = {
					busid : this.business.id
				}
			
				var result = await uni.$u.http.post('/user/collect', data)
				
				if(result.code == 0)
				{
					this.$refs.notice.show({
						type:"error",
						message:result.msg
					})
					return false
				}
				
				//覆盖值
				this.collectpost = result.data
				// console.log(this.collectpost);
			},
			CateToggle(item)
			{
				this.active = item.id
				if(this.active == '0'){
					this.answerpost = []
					this.collectpost = []
					this.QuestData()
				}
				if(this.active =='1'){
					this.questpost = []
					this.collectpost = []
					this.AnswerData()
				}
				if(this.active == '2'){
					this.questpost = []
					this.answerpost = []
					this.CollectData()
				}
			},
		}
	}
</script>


<style>
	.avatar image{
		border-radius:10px;
	}
	.content{
		width:100%;
		overflow-x: hidden;
	}

	.person {
		background-image: url("/static/titlebg.png");
		background-repeat: no-repeat;
		background-size: 100% 100%;
		background-position: center;
		padding: 30px 30px 10px;
	}

	.person .info{
		display: flex;
		width:100%;
		margin-bottom:15px;
	}

	.person .info .avatar{
		width:4em;
		height:4em;
		overflow: hidden;
		border-radius: 100%;
		margin-right:1em;
		flex-shrink: 0;
	}

	.person .info .avatar image{
		width:100%;
		height:100%;
	}

	.person .info .base{
		color:#fff;
		font-size:1em;
	}

	.person .info .base .nickname{
		margin-bottom:7px;
	}

	.person .info .base .desc{
		font-size:.8em;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
		display: -webkit-box;
		/* 改成你需要的行数 */
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
	}

	.person .grid{
		margin-bottom:15px;
	}

	.person .btnlist{
		display: flex;
		width:100%;
		justify-content: center;
		align-items: center;
		align-content: center;
		flex-wrap: nowrap;
	}

	.person .btnlist .btn{
		margin-right:10px;
	}
	
	.nav[data-v-30b60411]{
		height: 50px;
	}
	
	.nav .nav-item[data-v-30b60411]{
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
		width: 50rpx;
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
	
	.info .createtime{
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
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
	.title{
		margin-top: 2px;
	}
	.createtime{
		margin-top: 10px;
	}
	.join{
		margin-top: 10px;
	}
</style>
