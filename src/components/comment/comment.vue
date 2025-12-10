<template>
	<view class="comlist">
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
							
							<u-tag style="margin-top:-3.5px !important;margin-left:10px;" v-if="item.busid == ftrid" type="error" plain size="mini" text="楼主"></u-tag>
						
							<u-tag style="margin-top:-3.5px !important;margin-left:10px;" v-else-if="status == '1' && cnrid && item.status =='1'" plain size="mini" text="已采纳"></u-tag>
							
							<view style="margin-left:10px;" class="createtime">{{item.createtime_text}}</view>
						</view>
						<view class="desc" style="margin-top:6px;">{{item.business.lable}}</view>
					</view>
				</view>

				<!-- 详细内容 -->
				<view class="content">@{{item.parent_text}}：{{item.content}}</view>

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
							<u-icon name="more-dot-fill" size="20" @click="answers(item)"></u-icon>
						</view>
					</view>
				</view>

				<!-- 子评论组件 -->
				<comment v-if="item.comment_count > 0 && item.show" :postid="item.postid" :pid="item.id" :busid="item.busid" :brid="brid" :ftrid="ftrid" :status="status" :cnrid="cnrid"></comment>
			</view>
		</view>

		<!-- 弹出层 -->
		<u-popup :show="MenuShow" @close="MenuShow = false">
			<view class="menu">
				<view class="grid" style="margin:15px auto;">
					<u-grid :border="true" style="justify-content: center;">
						<u-grid-item @click="AnswerShow = true" v-if="accept != ftrid">
							<u-icon name="edit-pen-fill" size="35"></u-icon>
							<u--text type="warning" text="评论" align="center"></u--text>
						</u-grid-item>
						<u-grid-item v-if="brid == ftrid && accept != ftrid">
							<u-icon name="checkmark" size="35"></u-icon>
							<u--text v-if="status == '1' && cnrid && comstatus =='1'" type="success" text="已采纳" align="center"></u--text>
							<u--text v-else-if="status == '1' && cnrid" type="success" text="已解决" align="center"></u--text>
							<u--text v-else  @click="select" type="success" text="采纳" align="center"></u--text>
						</u-grid-item>
						<u-grid-item v-if="brid == ftrid"  @click="delcom">
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
				<u--form labelPosition="top" labelWidth="150" :model="answer" :rules="rules" ref="answer">
					<!-- 描述 -->
					<u-form-item
						label="回答描述："
						prop="content"
						ref="content"
					>
						<u--textarea v-model="answer.content" placeholder="请输入回答描述"></u--textarea>
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
	import Vue from 'vue'

	export default {
		components: {
			comment: () => import('@/components/comment/comment.vue')
		},
		props: {
			show: {
				type: Boolean,
				default: false
			},
			postid: {
				type: Number,
				require: true,
				default: 0,
			},
			pid: {
				type: Number,
				require: true,
				default: 0,
			},
			// 评论人id
			busid: {
				type: Number,
				require: true,
				default: 0,
			},
			//用户本人id
			brid: {
				type: Number,
				require: true,
				default: 0,
			},
			//发帖人id
			ftrid: {
				type: Number,
				require: true,
				default: 0,
			},
			//采纳人id
			cnrid: {
				type: Number,
				require: true,
				default: 0,
			},
			//帖子状态
			status: {
				type: String,
				require: true,
				default: 0,
			},
		},
		created()
		{
			this.CommentData()
		},
		data()
		{
			return {
				MenuShow:false,
				AnswerShow: false,
				comid: 0,
				accept: 0,
				//评论状态
				comstatus: '',
				answer:{
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
					pid: this.pid,
					busid: this.busid ? this.busid : 0
				}

				var result = await uni.$u.http.post('/comment/index', data)

				this.comlist = result.data.length > 0 ? result.data : []

				this.comlist.map((item) => {
					//item == js 对象 show js对象下属性 修改js对象
					//设置响应式数据 到 对象中
					Vue.set(item, 'show', false)
				})
			},
			//评论点赞状态切换
			async LikeToggle(comment)
			{	
				//判断是否登录
				if(!this.brid)
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
					busid: this.brid
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
						duration: 500
					})
				
					//修改点赞的状态
					comment.like_status = !comment.like_status
					//修改点赞数
					comment.likes_count = comment.like_status ? ++comment.likes_count : --comment.likes_count
				}
			},
			// 进行二级操作
			answers(comment)
			{
				//判断是否有登录
				if(!this.brid)
				{
					this.$refs.notice.show({
						type: 'error',
						message: '请先登录'
					})
					return false
				}
				
				this.MenuShow = true		
				this.comid = comment.id
				this.accept = comment.busid
				this.comstatus = comment.status
			},
			//删除评论
			async delcom()
			{
				//判断是否登录
				if(!this.brid)
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
					busid: this.brid,
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
			},
			//采纳回答
			async select()
			{
				//判断是否登录
				if(!this.brid)
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
				
				// location.reload()
			},
			submit()
			{
				//判断是否登录
				if(!this.brid)
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
						content:this.answer.content,
						busid: this.busid
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
					
					// location.reload()
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
	.comlist{
		margin-top:15px;
		/* background:#e8e8e8; */
	}

	/* 评论列表 */
	.list{
		width: 100%;
		margin:0 auto;
	}

	.list .item{
		width:100%;
		margin:0 auto;
		margin-bottom:5px;
		padding:0px;
		/* background:#e8e8e8; */
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
	.business .base:fir {
	    padding: 5px 0.5px;
	}
	/* 小程序端 */
	.u-tag--mini.data-v-1481d46d {
	    margin-top: -3px !important;
		margin-left: 10px !important;
	}
	.u-tag--success--plain.data-v-1481d46d {
	    margin-left: 0 !important;
	}
</style>