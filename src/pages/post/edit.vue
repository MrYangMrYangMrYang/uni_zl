<template>
	<view>
		<!-- 信息录入 -->
		<view class="info">
		  <text class="title">修改提问</text>
	  
		  <text class="desc">
			您可以在本页录入您的提问信息，录入成功后将会出现在首页的悬赏大厅中，等待其他用户的回复。
		  </text>
		</view>
	  
		<!-- 表单 -->
		<view class="post">
			<u--form labelPosition="top" labelWidth="150" :model="post" :rules="rules" ref="post">
				<!-- 标题 -->
				<u-form-item
					label="提问标题："
					prop="title"
					ref="title"
				>
					<u--input v-model="post.title" placeholder="请输入提问标题"></u--input>
				</u-form-item>

				<!-- 描述 -->
				<u-form-item
					label="提问描述："
					prop="content"
					ref="content"
				>
					<u--textarea v-model="post.content" placeholder="请输入提问描述"></u--textarea>
				</u-form-item>

				<!-- 分类 -->
				<u-form-item
					label="提问分类："
					prop="cate"
					ref="cate"
					@click="CateShow = true"
				>
					<u--input v-model="post.cate" placeholder="请选择提问分类" readonly></u--input>
				</u-form-item>
				
				<u-picker :defaultIndex="CateDefault" :show="CateShow" :columns="CateData" keyName="name" @cancel="CateShow = false" @confirm="CateCheck"></u-picker>

				<!-- 积分 -->
				<u-form-item
					label="悬赏积分："
					prop="point"
					ref="point"
				>
					<u--input v-model="post.point" placeholder="请输入悬赏积分"></u--input>
				</u-form-item>

				<view class="btn">
					<u-button type="primary" text="提交修改" formType="submit" @click="submit"></u-button>
				</view>
			</u--form>
		</view>

		<!-- 提醒组件 -->
		<u-toast ref="notice"></u-toast>
	</view>
</template>

<script>
	export default {
		async onLoad(option)
		{
			//获取分类
			await this.CateList()

			//获取帖子id
			var postid = option.postid ? option.postid : 0;
			this.postid = postid
			//获取帖子数据
			await this.PostData()
			//获取缓存
			var business = uni.getStorageSync('business') ? uni.getStorageSync('business') : {}

			//空对象
			//覆盖data数据
			if(Object.getOwnPropertyNames(business).length <= 1)
			{
				this.$refs.notice.show({
					type: 'error',
					message: '请先登录',
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
			this.business = business
		},
		onReady() 
		{
			//onReady 为uni-app支持的生命周期之一
			//设置表单验证规则
			this.$refs.post.setRules(this.rules)
		},
		data()
		{
			return {
				postid: 0,
				business: {},
				CateShow: false,
				CateData:[[]],
				CateDefault:[0],
				post:{
					title: '',
					content: '',
					point: '',
					cateid: '',
					cate: ''
				},
				rules:{
					title: {
						type: 'string',
						required: true,
						message: '请填写提问标题',
						trigger: ['blur', 'change']
					},
					content: {
						type: 'string',
						required: true,
						message: '请描述一下问题的详细内容',
						trigger: ['blur', 'change']
					},
					point: {
						type: 'number',
						required: true,
						message: '请填写悬赏积分',
						trigger: ['blur', 'change']
					},
					cate: {
						type: 'string',
						required: true,
						message: '请选择提问分类',
						trigger: ['blur', 'change']
					},
				}
			}
		},
		methods:{
			async CateList()
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

				this.CateData = [result.data]
			},
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
				this.post.cate = result.data.post.category.name

				this.CateData[0].map((item, index) => {
					//找出当前所选的分类
					if(item.id == this.post.cateid)
					{
						this.CateDefault = [index]
					}
				})
			},
			CateCheck(e)
			{
				this.CateShow = false
				this.post.cate = e.value[0].name
				this.post.cateid = e.value[0].id
			},
			submit()
			{				
				//判断是否有通过表单验证
				this.$refs.post.validate()
				.then(async res => {

					//发起请求
					var result = await uni.$u.http.post('/post/edit', this.post)

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
						complete()
						{
							uni.$u.route({
								type: 'navigateTo',
								url: result.url,
								params: {
									postid: result.data.postid
								}
							})
						}
					})
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
	/* 信息录入 */
	.info {
		width: 100%;
		padding:40px;
		display: flex;
		flex-direction: column;
		align-items: left;
		background: linear-gradient(rgb(1,115,222), rgb(78,169,245));
		color:white;
	}

	.info .title{
		font-size:1.2em;
	}

	.info .desc{
		width: 85%;
		font-size:.9em;
	}

	/* 表单 */
	.post{
		width:95%;
		margin:10px auto;
	}

	.btn{
		width:60%;
		margin:0 auto;
		margin-top:10px;
	}
</style>