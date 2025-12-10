<template>
	<view class="container">
		<!-- 用户信息 -->
		<view class="user">
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
	  
			<view class="nickname">{{business.nickname}}</view>
		
			<!-- #ifdef H5 || APP-PLUS -->
				<button v-if="!business.hasOwnProperty('id')" class="login" @click="signin">登录</button>
			<!-- #endif -->

			<!-- #ifdef MP-WEIXIN -->
				<button v-if="!business.hasOwnProperty('id')" class="login" @click="login">授权登录</button>
			<!-- #endif -->
		</view>
	  
		<!-- 有登录的菜单 -->
		<view class="menulist" v-if="business.hasOwnProperty('id')">
		  <navigator url="/pages/business/user" class="item">
			<text>个人主页</text>
			<image src='/static/row.png'></image>
		  </navigator>
		  <navigator url="/pages/business/profile" class="item">
			<text>基本资料</text>
			<image src='/static/row.png'></image>
		  </navigator>
		  <!-- <navigator url="/pages/business/email" class="item">
			<text>邮箱验证</text>
			<image src='/static/row.png'></image>
		  </navigator> -->
		  <navigator url="/pages/business/question" class="item">
			<text>我的提问</text>
			<image src='/static/row.png'></image>
		  </navigator>
		  <navigator url="/pages/business/follow" class="item">
			<text>我的关注</text>
			<image src='/static/row.png'></image>
		  </navigator>
		 <!-- <navigator url="/pages/business/message" class="item">
			<text>我的私信</text>
			<image src='/static/row.png'></image>
		  </navigator> -->
		  <navigator url="/pages/business/pay" class="item">
			<text>余额充值</text>
			<image src='/static/row.png'></image>
		  </navigator>
		  <navigator url="/pages/business/checkin" class="item">
			<text>每日签到</text>
			<image src='/static/row.png'></image>
		  </navigator>
		  <view class="item" @click="show = true">
			<text>退出登录</text>
			<image src='/static/row.png'></image>
		  </view>
		</view>
		
		<!-- 没有登录的菜单 -->
		<view class="menulist" v-else @click="toast">
			<view class="item">
			  <text>个人主页</text>
			  <image src='/static/row.png'></image>
			</view>
			<view class="item">
			  <text>基本资料</text>
			  <image src='/static/row.png'></image>
			</view>
			<view class="item">
			  <text>我的提问</text>
			  <image src='/static/row.png'></image>
			</view>
			<view class="item">
			  <text>我的关注</text>
			  <image src='/static/row.png'></image>
			</view>
			<!-- <view class="item">
			  <text>我的私信</text>
			  <image src='/static/row.png'></image>
			</view> -->
			<view class="item">
			  <text>余额充值</text>
			  <image src='/static/row.png'></image>
			</view>
			<view class="item">
			  <text>每日签到</text>
			  <image src='/static/row.png'></image>
			</view>			
		</view>
		
		<!-- 提醒组件 -->
		<u-toast ref="notice"></u-toast>
		
		<!-- 弹框组件 -->
		<u-modal style="text-align: center;" :show="show" :title="'退出提醒'" :content="'是否确认退出'" showCancelButton :closeOnClickOverlay="true" @cancel="show = false" @close="show = false" @confirm="logout"></u-modal>
	</view>
</template>

<script>
	export default {
		onShow()
		{
			//获取本地存储
			var business = uni.getStorageSync('business') ? uni.getStorageSync('business') : {}

			//覆盖data数据
			if(Object.getOwnPropertyNames(business).length > 0)
			{
				this.business = business
			}
		},
		data()
		{
			return {
				show: false,
				business: {
					nickname: '临时用户',
				}
			}
		},
		 methods:{
			 signin()
				{
					uni.$u.route({
						url: 'pages/business/login',
						params: {openid: 'h5'}
					})
				},
			 login(){
				//微信小程序登录
				uni.login({
					provider: 'weixin', //使用微信登录
					success: async res =>{
						
						//先获取code凭证
						var code = res.code ? res.code : ''
						
						if(!code){
							this.$refs.notice.show({
								type: 'error',
								message: '获取登录临时凭证失败'
							})
						}
							
						//有code就发送请求
						var result = await uni.$u.http.post('/business/login',{code})
						
						if(result.code == 0){
							this.$refs.notice.show({
								type: 'error',
								message: result.msg
							})
							
							return false
						}
						
						var openid = result.data.Openid ? result.data.Openid : ''
						
						if(openid){		
							//提醒跳转
							this.$refs.notice.show({
								type:'success',
								message:result.msg,
								complete(){
									//授权成功，但没找到人
									uni.$u.route({
										url:result.url,
										params:{
											openid:openid
										}
									})
								}
							})						
						}
						else{
							//本地存储
							//如果返回客户信息，就说明是直接找到这个人
							uni.setStorageSync('business', result.data)
							this.business = result.data

							//提醒
							this.$refs.notice.show({
								type: 'success',
								message: result.msg
							})
						}
					},
					fail: res =>{
						//登陆失败
						console.log('登录失败')
						console.log(res)
					}
				})
			},
			logout()
			{
				//删除本地存储
				uni.removeStorageSync('business')
				//清除本地还渲染的数据，这样就不用刷新界面
				this.business = {}
				//关闭模态框
				this.show = false
			},
			toast()
			{
				this.$refs.notice.show({
					type:'error',
					message: '请先登录访问'
				})
			}
		}
	}
</script>

<style>
	/* 用户信息 */
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
	}

	.avatar image{
		width:100%;
		height:100%;
	}

	.nickname{
		font-size: 30rpx;
		font-weight: bold;
		margin: 10rpx 0;
	}

	.login{
		width: 120px!important;
		color: #fff;
		background-color: #4ea9f5;
		margin-top: 20rpx;
		font-size: 30rpx;
		padding:.5em .2em;
	}

	/* 菜单 */
	.menulist{
		width: 100%;
	}

	.item{
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		height: auto;
		width: auto;
		padding: 20rpx 50rpx;
		border-bottom: 20rpx solid rgb(234,234,234);
		font-size: 26rpx;
		box-shadow: 0 0 10px #DDD;
	}

	.item image{
		height: 36rpx;
		width: 36rpx;
	}
	
	.u-modal__content__text.data-v-713d0fd3 {
	    flex: initial !important;
	}
</style>