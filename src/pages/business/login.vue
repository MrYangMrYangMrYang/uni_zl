<template>
	<view class="container">
		<view class="user">
			<view class="avatar">
				<!-- #ifdef H5 || APP-PLUS -->
					<img src="/static/logo.png"></img>
				<!-- #endif -->
	
				<!-- #ifdef MP-WEIXIN -->
					<open-data type="userAvatarUrl"></open-data>
				<!-- #endif -->
			</view>
		
			<text class="notice">请填写已有账号或新注册账号</text>
		</view>

		<view class="bind">
			<u-form
				labelPosition="left"
				labelWidth="70"
				:model="business"
				:rules="rules"
				ref="bind"
			>
				<u-form-item
					label="手机号"
					prop="mobile"
					borderBottom
					ref="mobile"
				>
					<u-input v-model="business.mobile" border="none" placeholder="请输入手机号码"></u-input>
				</u-form-item>

				<u-form-item
					label="密码"
					prop="password"
					borderBottom
					ref="password"
				>
					<u-input type="password" v-model="business.password" border="none" placeholder="请输入密码"></u-input>
				</u-form-item>

				<!-- #ifdef MP-WEIXIN -->
					<u-button type="primary" text="确认绑定" formType="submit" @click="submit"></u-button>
				<!-- #endif -->

				<!-- #ifdef H5 || APP-PLUS -->
					<u-button type="primary" text="登录" formType="submit" @click="submit"></u-button>
				<!-- #endif -->
			</u-form>
		</view>

		<!-- 提醒组件 -->
		<u-toast ref="notice"></u-toast>
	</view>
</template>

<script>
	export default{
		//监听页面加载，该钩子被调用时，响应式数据、计算属性、方法、侦听器、props、slots 已设置完成，其参数为上个页面传递的数据，参数类型为 Object（用于页面传参）
		onLoad(params)
		{
			var openid = params.openid ? params.openid : ''
			if(!openid)
			{
				this.$refs.notice.show({
					type:'error',
					message: 'openid参数不存在',
					complete()
					{
						//没有openid就返回上一级
						uni.$u.route({
							type: 'navigateBack',
							delta: 1, //后退一页
						})
						return false
					}
				})
			}else
			{
				//将openid的值覆盖到data中去
				this.openid = openid
			}
		},
		onReady() 
		{
			//onReady 为uni-app支持的生命周期之一:监听页面初次渲染完成，此时组件已挂载完成，DOM 树($el)已可用，注意如果渲染速度快，会在页面进入动画完成前触发
			//需要兼容微信小程序，并且校验规则中含有方法等，只能通过setRules方法设置规则
			this.$refs.bind.setRules(this.rules)
		},
		data()
		{
			return {
				openid: null,
				business:{
					mobile: '',
					password: ''
				},
				rules:{
					mobile: [
						{
							type: 'string',
							required: true,
							message: '请填写手机号码',
							trigger: ['blur', 'change']
						},
						{
							// 自定义验证函数
							validator: (rule, value, callback) => {
								// 上面有说，返回true表示校验通过，返回false表示不通过
								// uni.$u.test.mobile()就是返回true或者false的
								return uni.$u.test.mobile(value)
							},
							message: '手机号码不正确',
							// 触发器可以同时用blur和change
							trigger: ['change','blur'],
						}
					],
					password: {
						type: 'string',
						required: true,
						message: '请填写密码',
						trigger: ['blur', 'change']
					},
				}
			}
		},
		methods:{
			submit(){
				//判断是否通过表单验证
				this.$refs.bind.validate()
				.then(async res => {
					//组装数据
					var data = {
						openid : this.openid,
						mobile : this.business.mobile,
						password : this.business.password
					}
					
					//发起请求
					// #ifdef MP-WEIXIN
						var result = await uni.$u.http.post('/business/bind', data)
					// #endif
					
					// #ifdef H5 || APP-PLUS
						var result = await uni.$u.http.post('/business/signin', data)
					// #endif
					
					if(result.code == 0){
						this.$refs.notice.show({
							type:'error',
							message:result.msg
						})
						return false
					}
					
					//绑定或注册成功
					this.$refs.notice.show({
						type:'success',
						message:result.msg,
						complete(){
							//先存储用户信息（同步的）
							uni.setStorageSync('business', result.data)
							//返回用户中心
							uni.$u.route({
								type: 'navigateBack',
								delta: 1, //后退一页
							})
							return false
						}
					})				
				})
				.catch(error => {
					this.$refs.notice.show({
						type:'error',
						message:'校验失败'
					})
				})
			}
		}
	}
</script>

<style>
	/* 头部 */
	.user {
		width: 100%;
		padding:40rpx 0rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		background: linear-gradient(rgb(1,115,222), rgb(78,169,245));
		color:white;
	}

	.avatar {
		width: 200rpx;
		height: 200rpx;
		border-radius: 50%;
		overflow: hidden;
		margin-bottom:15px;
	}

	.avatar image{
		width:100%;
		height:100%;
	}

	.notice{
		display: block;
		text-align: center;
		color: #fff;
	}

	/* 表单 */
	.bind{
		width:90%;
		margin:0 auto;
	}
</style>