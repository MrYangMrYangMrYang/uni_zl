<template>
	<view class="content">
		<u-notice-bar :text="message"></u-notice-bar>
		<!-- 表单 -->
		<view class="pay">
			<u--form
				labelPosition="top"
				labelWidth="120"
				:model="pay"
				:rules="rules"
				ref="pay"
			>
				<!-- 充值余额 -->
				<u-form-item
					label="当前余额(元)"
					borderBottom
				>
					<u--input prefixIcon="rmb" v-model="pay.current" placeholder="当前余额" readonly></u--input>
				</u-form-item>

				<!-- 充值余额 -->
				<u-form-item
					label="充值余额(元)"
					prop="money"
					borderBottom
					ref="money"
				>
					<u--input prefixIcon="rmb" v-model="pay.money" placeholder="请输入充值余额"></u--input>
				</u-form-item>

				<!-- 支付方式 -->
				<u-form-item
					label="支付方式"
					prop="type_text"
					ref="type_text"
					@click="ShowType = true"
				>
					<u--input prefixIcon="list-dot" v-model="pay.type_text" readonly placeholder="请选择支付方式"></u--input>
				</u-form-item>

				<!-- 支付方式弹出菜单 -->
				<u-action-sheet
					:show="ShowType"
					:actions="TypeList"
					title="请选择支付方式"
					@close="ShowType = false"
					@select="TypeSelect"
				>
				</u-action-sheet>

				<view class="btn">
					<u-button type="primary" text="立即充值" formType="submit" @click="submit"></u-button>
				</view>
				
			</u--form>
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
		},
		onReady() 
		{
			//onReady 为uni-app支持的生命周期之一
			//设置表单验证规则
			this.$refs.pay.setRules(this.rules)
		},
		data()
		{
			return {
				business: {},
				message: '余额可用于购买商品或用于商城消费或用于悬赏提问，平台提供各种充值优惠',
				ShowType: false,
				TypeList: [
					{name: '微信支付', value: 'wx'},
					{name: '支付宝支付', value: 'zfb'}
				],
				pay:{
					current:10,
					money: '',
					type: 'wx',
					type_text: '微信支付'
				},
				rules:{
					money: {
						type: 'number',
						required: true,
						message: '请填写充值金额',
						trigger: ['blur', 'change']
					},
				}
			}
		},
		methods:{
			TypeSelect(e)
			{
				this.pay.type = e.value
				this.pay.type_text = e.name
			},
			// 提交表单
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
				this.$refs.pay.validate()
				.then(async res => {
					
					//组装数据
					var data = {
						busid: this.business.id,
						money: this.pay.money,
						paytype: this.pay.type
					}
					
					// console.log(data);
					// return false;
									
					//发起请求
					var result = await uni.$u.http.post('/pay/pay',data)
					
					// console.log(result);
					
					if(result.code == 0)
					{
						this.$refs.notice.show({
							type: 'error',
							message: result.msg,
						})					
						return false
					}
					
					this.$refs.notice.show({
						type: 'success',
						message: result.msg,
						duration: 1000
					})
					
					//渲染支付界面
					const newWindow = window.open("", "_self");
					newWindow.document.write(result.data);
					newWindow.focus();
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
	.pay{
		width:90%;
		margin:0 auto;
	}

	.pay .btn{
		margin-top:1em;
	}
</style>
