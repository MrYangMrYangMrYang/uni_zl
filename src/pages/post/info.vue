<template>
	<view class="post">
		<view class="info">
			<view class="tag">
				<view class="item">
					<u-tag class="item" :text="post.category.name" type="success" plain icon="tags-fill"></u-tag>
				</view>

				<view class="item">
					<u-tag v-if="post.status == '1' && post.accept" class="item" text="已解决" type="success" plain icon="tags-fill"></u-tag>
					<u-tag v-else class="item" text="未解决" type="error" plain icon="tags-fill"></u-tag>
				</view>

				<!-- 收藏 -->
				<view class="item" v-if="business.id != post.busid">
					<u-tag v-if="collect" @click="CollectToggle" class="item" text="取消收藏" type="success" icon="star"></u-tag>
					<u-tag v-else @click="CollectToggle" class="item" text="收藏" type="warning" plain icon="star"></u-tag>
				</view>
			</view>

			<view class="title">{{post.title}}</view>

			<view class="author">
				<!-- 头像 -->
				<navigator :url="`/pages/business/user?busid=${post.business.id}`" class="avatar">
					<image mode="aspectFit" :src="post.business.avatar_text"></image>
				</navigator>

				<!-- 昵称 -->
				<view class="nickname" style="font-weight: bold;">{{post.business.nickname}}</view>

				<!-- 发布时间 -->
				<view class="createtime">发布于：{{post.createtime_text}}</view>

				<view class="follow" v-if="business.id != post.busid">
					<u-tag v-if="attention" @click="AttentionToggle" class="item" text="取消关注" type="success" plain icon="tags-fill" size="mini"></u-tag>
					<u-tag v-else @click="AttentionToggle"class="item" text="关注" type="warning" plain icon="tags-fill" size="mini"></u-tag>
				</view>
			</view>

			<!-- 正文内容 -->
			<view class="content">
				<u-parse :content="post.content"></u-parse>
			</view>

			<!-- 宫格布局 -->
			<view class="grid">
				<u-grid :border="true">
					<u-grid-item>
						<u--text type="warning" text="收藏人数" align="center"></u--text>
						<u--text type="warning" :text="`${post.collect_count}人`" align="center"></u--text>
					</u-grid-item>
					<u-grid-item>
						<u--text type="success" text="回答人数" align="center"></u--text>
						<u--text type="success" :text="`${post.comment_count}人`" align="center"></u--text>
					</u-grid-item>
					<u-grid-item>
						<u--text type="error" text="悬赏积分" align="center"></u--text>
						<u--text type="error" :text="`${post.point}分`" align="center"></u--text>
					</u-grid-item>
				</u-grid>
			</view>

			<u-divider text="分割线" :dot="true"></u-divider>

			<view class="bottom">
				<view class="btn" v-if="post.busid != business.id && post.status == '0'">
					<u-button type="primary" text="我来回答" @click="AnswerShow = true"></u-button>
				</view>
				<view class="btn" v-if="post.busid == business.id && post.status == '0'">
					<u-button type="warning" text="修改提问" @click="edit"></u-button>
				</view>
			</view>
		</view>
		
		<!-- 评论列表 -->
		<view class="list" v-if="comlist.length > 0">
			<view class="item" v-for="(item, index) in comlist">
				<!-- 基本信息 -->
				<view class="business">
					<!-- 头像 -->
					<navigator :url="`/pages/business/user?busid=${item.busid}`" class="avatar">
						<image mode="aspectFit" :src="item.business.avatar_text"></image>
					</navigator>
					<!-- 用户 -->
					<view class="base">
						<view class="name" style="justify-content: flex-start">
							<view class="nickname" style="font-size:1.2em;">{{item.business.nickname}}</view>
							
							<u-tag style="margin-top:-3.5px !important;margin-left:10px;" v-if="item.busid == post.busid" type="error" plain size="mini" text="楼主"></u-tag>
						
							<u-tag style="margin-top:-3.5px !important;margin-left:10px;" v-else-if="post.status == '1' && post.accept && item.status =='1'" plain size="mini" text="已采纳"></u-tag>
							
							<view class="createtime" style="margin-left:10px;">{{item.createtime_text}}</view>
						</view>
						<view class="desc" style="margin-top:6px;">{{item.business.lable}}</view>
					</view>
				</view>

				<!-- 详细内容 -->
				<view class="content">{{item.content}}</view>

				<!-- 操作 -->
				<view class="action">
					<view class="left">
						<view class="tag">
							<u-tag @click="LikeToggle(item)" v-if="item.like_status" :text="`取消 ${item.likes_count > 0 ? item.likes_count : ''}`" type="success" icon="thumb-up"></u-tag>
							<u-tag @click="LikeToggle(item)" v-else :text="`点赞 ${item.likes_count > 0 ? item.likes_count : ''}`" type="success" plain icon="thumb-up"></u-tag>
						</view>
						<view class="comment" @click="CommentToggle(index)">
							<u-icon name="chat" size="25"></u-icon>
							<view style="display:flex;" v-if="item.comment_count > 0 ">
								展开{{item.comment_count}}条回复
								<u-icon v-if="item.comment_count > 0 && item.show" name="arrow-up"></u-icon>
								<u-icon v-else name="arrow-down"></u-icon>
							</view>
							<view v-else>
								暂无更多
							</view>
						</view>
					</view>
					<view class="right">
						<view class="operation">
							<u-icon name="more-dot-fill" size="20" @click="answer(item)"></u-icon>
						</view>
					</view>
				</view>

				<!-- 子评论组件 -->
				<comment v-if="item.comment_count > 0 && item.show" :postid="item.postid" :pid="item.id" :busid="item.busid" :brid="business.id" :ftrid="post.busid" :status="post.status" :cnrid="post.accept" style="margin-left:5px;"></comment>
			</view>
		</view>

		<!-- 弹出层 -->
		<u-popup :show="MenuShow" @close="MenuShow = false">
			<view class="menu">
				<view class="grid" style="margin:15px auto;">
					<u-grid :border="true" style="justify-content: center;">
						<u-grid-item @click="AnswerShow = true" v-if="accept != post.busid">
							<u-icon name="edit-pen-fill" size="35"></u-icon>
							<u--text type="warning" text="评论" align="center"></u--text>
						</u-grid-item>
						<u-grid-item v-if="post.busid == business.id && accept != post.busid">
							<u-icon name="checkmark" size="35"></u-icon>
							<u--text v-if="post.status == '1' && post.accept && status == '1'" type="success" text="已采纳" align="center"></u--text>
							<u--text v-else-if="post.status == '1' && post.accept" type="success" text="已解决" align="center"></u--text>
							<u--text v-else  @click="select" type="success" text="采纳" align="center"></u--text>
						</u-grid-item>
						<u-grid-item v-if="post.busid == business.id" @click="delcom">
							<u-icon name="trash-fill" size="35"></u-icon>
							<u--text type="error" text="删除" align="center"></u--text>
						</u-grid-item>
					</u-grid>
				</view>
				<u-button class="btn" type="error" text="取消" @click="MenuShow = false"></u-button>
			</view>
		</u-popup>

		<!-- 回答弹出层 -->
		<u-popup :show="AnswerShow" @close="AnswerShow = false">
			<view class="answer">
				<u--form labelPosition="top" labelWidth="150" :model="comment" :rules="rules" ref="answer">
					<!-- 描述 -->
					<u-form-item
						label="回答描述："
						prop="content"
						ref="content"
					>
						<u--textarea v-model="comment.content" placeholder="请输入回答描述"></u--textarea>
					</u-form-item>
	
					<view class="btn">
						<u-button type="primary" text="提交答案" formType="submit" @click="submit"></u-button>
					</view>
				</u--form>
			</view>
		</u-popup>

		<!-- 提醒组件 -->
		<u-toast ref="notice"></u-toast>
	</view>
</template>

<script>
	// 引入自定义组件
	import comment from '@/components/comment/comment.vue'
	
	export default 
	{
		components:
		{
			comment
		},
		onLoad(option)
		{
			//帖子ID
			var postid = option.postid ? option.postid : 0;
			this.postid = postid

			//获取本地存储
			var business = uni.getStorageSync('business') ? uni.getStorageSync('business') : {}

			//覆盖data数据
			if(Object.getOwnPropertyNames(business).length > 0)
			{
				this.business = business
			}
			
			//请求帖子数据
			this.PostData()	
			
			//请求评论数据
			this.CommentData()
			
			//获取收藏状态
			this.CollectState()
			
			//获取关注状态
			this.AttentionState()
		},
		data()
		{
			return {
				show: false,
				postid: 0,
				pid: 0,
				comid: 0,
				accept: 0,
				status: '',
				business: {},
				post: {
					category:{},
					business:{}
				},
				collect: false,
				attention: false,
				MenuShow:false,
				AnswerShow: false,
				comment:{
					content: '',
				},
				comlist: [],
				rules:{
					content: {
						type: 'string',
						required: true,
						message: '请填写回答内容',
						trigger: ['blur', 'change']
					},
				}
			}
		},
		methods:{
			// 展示子评论显示
			CommentToggle(index)
			{
				this.comlist[index].show = !this.comlist[index].show
			},
			//获取评论数据
			async CommentData()
			{
				//组装数据
				var data = {
					postid: this.postid,
					pid: 0,
					busid: this.business.id ? this.business.id : 0
				}

				var result = await uni.$u.http.post('/comment/index', data)

				this.comlist = result.data.length > 0 ? result.data : []

				this.comlist.map((item) => {
					//item == js 对象 show js对象下属性 修改js对象
					//设置响应式数据 到 对象中
					this.$vm.$set(item, 'show', false)
				})
				// console.log(this.comlist);
			},
			//评论点赞状态切换
			async LikeToggle(comment)
			{
				//判断是否有登录
				if(Object.getOwnPropertyNames(this.business).length <= 0)
				{
					this.$refs.notice.show({
						type: 'error',
						message: '请先登录'
					})
					return false
				}
				
				//组装数据
				var data = {
					comid: comment.id,
					postid: this.postid,
					busid: this.business.id,
				}
				
				var result = await uni.$u.http.post('/comment/like', data)
				
				// return false
				
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
				
					//修改点赞的状态
					comment.like_status = !comment.like_status
					//修改点赞数
					comment.likes_count = comment.like_status ? ++comment.likes_count : --comment.likes_count
				}
			},
			// 进行二级操作
			answer(comment)
			{
				//判断是否有登录
				if(Object.getOwnPropertyNames(this.business).length <= 0)
				{
					this.$refs.notice.show({
						type: 'error',
						message: '请先登录'
					})
					return false
				}
				
				this.MenuShow = true
				
				// console.log(comment.pid);
				
				this.pid = comment.id
				this.comid = comment.id
				this.status = comment.status
				this.accept = comment.busid
			},
			//删除评论
			async delcom()
			{
				//判断是否有登录
				if(Object.getOwnPropertyNames(this.business).length <= 0)
				{
					this.$refs.notice.show({
						type: 'error',
						message: '请先登录'
					})
					return false
				}
				
				//组装数据
				var data = {
					postid: this.postid,
					busid: this.business.id,
					comid: this.comid,
				}
				
				var result = await uni.$u.http.post('/comment/del', data)
				
				if(result.code == 0)
				{
					this.$refs.notice.show({
						type: 'error',
						message: result.msg
					})
					return false
				}
				
				this.$refs.notice.show({
					type: 'success',
					message: result.msg,
					duration: 1000
				})
							
				this.MenuShow = false
				this.AnswerShow = false
				
				//清空数据
				this.comlist = []
				//重新发起请求
				this.CommentData()
			},
			//获取帖子数据
			async PostData()
			{
				var result = await uni.$u.http.post('/post/info', {postid:this.postid})

				//获取帖子信息失败
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

				this.post = result.data.post
				// console.log(this.post);
			},
			
			//获取收藏状态
			async CollectState()
			{
				//判断是否有登录
				if(Object.getOwnPropertyNames(this.business).length <= 0)
				{
					this.collect = false
					return false
				}

				//组装数据
				var data = {
					postid: this.postid,
					busid: this.business.id,
				}

				var result = await uni.$u.http.post('/collect/check', data)
				
				this.collect = result.code == 0 ? false : true;
			},
			
			//更改收藏状态
			async CollectToggle()
			{
				//判断是否有登录
				if(Object.getOwnPropertyNames(this.business).length <= 0)
				{
					this.$refs.notice.show({
						type: 'error',
						message: '请先登录'
					})
					return false
				}

				//组装数据
				var data = {
					postid: this.postid,
					busid: this.business.id,
					followid : this.post.business.id,
					cateid : this.post.cateid
				}

				//已收藏，要取消收藏
				if(this.collect)
				{
					var result = await uni.$u.http.post('/collect/del', data)
				}else
				{
					//没收藏，想添加收藏
					var result = await uni.$u.http.post('/collect/add', data)
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
					this.collect = !this.collect
				}
			},
			
			//获取关注状态
			async AttentionState()
			{
				//判断是否有登录
				if(Object.getOwnPropertyNames(this.business).length <= 0)
				{
					this.attention = false
					return false
				}
				
				var result = await uni.$u.http.post('/post/info', {postid:this.postid})
				
				this.post = result.data.post
			
				//组装数据
				var data = {
					followid: this.post.business.id,
					busid: this.business.id
				}
			
				var result = await uni.$u.http.post('/attention/check', data)
				
				this.attention = result.code == 0 ? false : true;
			},
			
			//更改关注状态
			async AttentionToggle()
			{
				//判断是否有登录
				if(Object.getOwnPropertyNames(this.business).length <= 0)
				{
					this.$refs.notice.show({
						type: 'error',
						message: '请先登录'
					})
					return false
				}
			
				//组装数据
				var data = {
					followid: this.post.business.id,
					busid: this.business.id
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
			
			//修改提问
			edit()
			{
				uni.$u.route({
					type: 'navigateTo',
					url: '/pages/post/edit',
					params: {
						postid: this.postid
					}
				})
			},
			
			//采纳回答
			async select()
			{
				//判断是否登录
				if(Object.getOwnPropertyNames(this.business).length <= 1)
				{
					this.$refs.notice.show({
						type: 'error',
						message: '请先登录'
					})
					return false
				}
				
				//组装数据
				var data = {
					postid: this.postid,
					comid: this.comid,
					accept: this.accept
				}
				
				var result = await uni.$u.http.post('/post/select',data)
				
				if(result.code == 0)
				{
					this.$refs.notice.show({
						type: 'error',
						message: result.msg
					})
					return false
				}
				
				this.$refs.notice.show({
					type: 'success',
					message: result.msg,
					duration: 1000
				})
			
				this.MenuShow = false
				this.AnswerShow = false
				
				//清空数据
				this.comlist = []
				//重新发起请求
				this.CommentData()
			},
			
			//提交回答
			submit()
			{
				//判断是否登录
				if(Object.getOwnPropertyNames(this.business).length <= 1)
				{
					this.$refs.notice.show({
						type: 'error',
						message: '请先登录'
					})
					return false
				}
				//判断是否有通过表单验证
				this.$refs.answer.validate()
				.then(async res => {
					
					//组装数据
					var data = {
						postid: this.postid,
						pid: this.pid,
						content:this.comment.content,
						busid: this.business.id,
					}

					//发起请求
					var result = await uni.$u.http.post('/post/answer',data)
					
					if(result.code == 0)
					{
						this.$refs.notice.show({
							type: 'error',
							message: result.msg
						})
					
						return false
					}
					
					this.$refs.notice.show({
						type: 'success',
						message: result.msg,
						duration: 1000
					})
					
					this.MenuShow = false
					this.AnswerShow = false
					
					//清空数据
					this.comlist = []
					//重新发起请求
					this.CommentData()
				})
				.catch(error => {
					console.log(error)
					this.$refs.notice.show({
						type: 'error',
						message: '效验失败'
					})
				})
			}
		}
	}
</script>

<style>
	.post{
		background:#f4f6f8;
	}
	
	.info{
		width: 95%;
		margin:0 auto;
		margin-bottom:10px;
		padding:15px;
		background:#fff;
		box-shadow: 0 0 3px 0 rgba(0,78,255,.1);
	}

	/* 标签 */
	.info .tag{
		display: flex;
		margin-bottom:10px;
	}

	.info .tag .item{
		margin-right:5px;
	}

	/* 标题 */
	.info .title{
		font-size:1.2em;
		font-weight: bold;
		margin-bottom:.5em;
	}

	/* 用户信息 */
	.author{
		display: flex;
		align-items: center;
		align-content: center;
		color:#999;
		font-size:0.8em;
	}

	.author .avatar{
		width:2em;
		height:2em;
		border-radius: 100%;
		overflow: hidden;
		margin-right:10px;
	}

	.author .avatar image{
		width: 100%;
		height: 100%;
	}

	.author .nickname,.author .createtime{
		margin-right:10px;
	}
	

	/* 详细内容 */
	.content{
		margin:10px 0px;
		overflow: hidden;
	}

	.content img{
		width:100%;
		height:100%;
	}

	.info .bottom{
		width:80%;
		margin:0 auto;
		display: flex;
		justify-content: center;
		align-items: center;
		align-content: center;
	}

	.info .bottom .btn{
		width:10em;
		margin-right:15px;
	}

	.info .bottom .btn:last-of-type{
		margin-right:0px;
	}

	/* 评论列表 */
	.list{
		width: 97%;
		margin:0 auto;
	}

	.list .item{
		width:91%;
		margin:0 auto;
		margin-bottom:5px;
		padding:15px;
		background:#fff;
		box-shadow: 0 0 3px 0 rgba(0,78,255,.1);
	}

	.list .item .business{
		width:100%;
		display: flex;
		justify-content: center;
		align-items: center;
		align-content: center;
	}

	.business .avatar{
		width:2.5em;
		height:2.5em;
		border-radius: 100%;
		overflow: hidden;
		margin-right:10px;
		flex-shrink: 0;
	}

	.business .avatar image{
		width: 100%;
		height: 100%;
	}

	.business .base{
		width:90%;
		padding:5px 10px;
		font-size:.8em;
	}

	.business .base .name{
		width:100%;
		display: flex;
		justify-content: space-between;
	}

	.business .base .name .nickname{
		font-weight: bold;
		color:#000;
	}

	.business .base .name .createtime{
		color:#999;
	}

	.business .base .desc{
		color:#999;
	}

	.item .content{
		font-size:.9em;
		color:#303133;
		margin-bottom:30px;
	}

	.item .action{
		display: flex;
		align-items: center;
		align-content: center;
		justify-content: space-between;
	}

	.item .action .left{
		display: flex;
	}

	.item .action .right{
		display: flex;
		align-items: flex-end;
		align-content: flex-end;
		margin-top:4px;
	}

	.item .action .tag{
		margin-right:10px;
	}

	.item .action .comment{
		display: flex;
		align-content: center;
		align-items: center;
	}

	/* 弹出菜单 */
	.menu .grid{
		margin:20px 0px;
	}

	.btn{
		border-radius: 0px;
	}

	/* 回答内容 */
	.answer{
		padding:20px;
	}
	
	.menu .u-grid-item.data-v-99a45d26:first-child{
		margin: auto;
		border-bottom: 0;
		border-right: 0;
	}
	.menu .u-grid-item.data-v-99a45d26:nth-child(2){
		border-left: 0.8px solid #dadbde;
		border-right: 0.8px solid #dadbde;
	}
	.business .base {
	    padding: 5px 0.5px;
	}
	/* 小程序端 */
	.u-tag--mini.data-v-1481d46d{
	    margin-top: -3px !important;
		margin-left: 10px !important;
	}
	.u-tag--success--plain.data-v-1481d46d {
	    margin-left: 0 !important;
	}
</style>