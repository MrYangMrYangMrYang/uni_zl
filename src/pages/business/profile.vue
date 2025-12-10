<template>
	<view>
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
		</view>
	  
		<!-- 表单 -->
		<u--form
			labelPosition="left"
			labelWidth="70"
			:model="business"
			:rules="rules"
			ref="profile"
		>
			<!-- 手机号 -->
			<u-form-item
				label="手机号:"
				prop="mobile"
				borderBottom
				ref="mobile"
				style="padding-left: 5px;"
			>
				<u--input v-model="business.mobile" border="none" placeholder="请输入手机号码" disabled></u--input>
			</u-form-item>

			<!-- 昵称 -->
			<u-form-item
				label="昵称:"
				prop="nickname"
				borderBottom
				ref="nickname"
				style="padding-left: 5px;"
			>
				<u--input v-model="business.nickname" border="none" placeholder="请输入昵称"></u--input>
			</u-form-item>

			<!-- 邮箱 -->
			<u-form-item
				label="邮箱:"
				prop="email"
				borderBottom
				ref="email"
				style="padding-left: 5px;"
			>
				<u--input v-model="business.email" border="none" placeholder="请输入邮箱"></u--input>
			</u-form-item>

			<!-- 密码 -->
			<u-form-item
				label="密码:"
				prop="password"
				borderBottom
				ref="password"
				style="padding-left: 5px;"
			>
				<u--input type="password" v-model="business.password"  border="none" placeholder="请输入密码"></u--input>
			</u-form-item>
			
			<!-- 性别 -->
			<u-form-item
				label="性别:"
				prop="sex_text"
				borderBottom
				ref="sex_text"
				style="padding-left: 5px;"
				@click="ShowGender = true"
			>
				<u--input v-model="business.sex_text" readonly border="none" placeholder="请选择性别"></u--input>
				<u-icon slot="right" name="arrow-right" style="margin-right: 20px;"></u-icon>
			</u-form-item>

			<!-- 性别弹出菜单 -->
			<u-action-sheet
				:show="ShowGender"
				:actions="GenderList"
				title="请选择性别"
				@close="ShowGender = false"
				@select="GenderSelect"
			>
			</u-action-sheet>
			
			<!-- 地区 -->
			<pick-regions :defaultRegion="business.region_code" @getRegion="handleGetRegion">
				<u-form-item
				label="地区:"
				prop="region_text"
				borderBottom
				ref="region_text"
				style="padding-left: 5px;"
				>
					<u--input v-model="business.region_text" readonly border="none" placeholder="请选择地区"></u--input>
					<u-icon slot="right" name="arrow-right" style="margin-right: 20px;"></u-icon>
				</u-form-item>
			</pick-regions>
			
			<!-- 个性签名 -->
			<u-form-item
				label="签名:"
				prop="lable"
				ref="lable"
				style="padding-left: 5px;"
				borderBottom
			>
				<u--textarea v-model="business.lable" placeholder="请输入您的个性签名" style="margin-right: 5px;height: 50px;margin-left: -10px;"></u--textarea>
			</u-form-item>

			<!-- 头像 -->
			<u-form-item label="头像:" borderBottom style="padding-left: 5px;">
				<u-upload :fileList="avatar" name="avatar" :maxCount="1" :previewFullImage="true" @afterRead="Read" @delete="Del"></u-upload>
			</u-form-item>
			
			<u-button type="primary" text="确认修改" formType="submit" @click="show = true"></u-button>
		</u--form>
		
		<!-- 提醒组件 -->
		<u-toast ref="notice"></u-toast>
		
		<!-- 弹框组件 -->
		<u-modal style="text-align: center;" :show="show" :title="'修改提醒'" :content="'是否确认修改'" showCancelButton :closeOnClickOverlay="true" @cancel="show = false" @close="show = false" @confirm="submit"></u-modal>
	</view>
</template>

<script>
	//需要引入城市地区组件
	import pickRegions from '@/components/pick-regions/pick-regions.vue'
		
	export default{
		components:{ pickRegions },
		onReady() 
		{
			//设置表单验证规则
			this.$refs.profile.setRules(this.rules)
			
			//获取本地存储
			var business = uni.getStorageSync('business') ? uni.getStorageSync('business') : {}
			
			//覆盖data数据
			if(Object.getOwnPropertyNames(business).length > 0)
			{
				this.business = business
			}
			
			console.log(this.business);
			
			//覆盖头像预览
			this.avatar = [{
				url: this.business.avatar_text
			}]
		},
		data()
		{
			return {
				region:[],
				avatar:[],
				business: {
					nickname: '临时用户',
					lable: '这家伙很懒，啥都没写',
				},
				ShowGender: false,
				show: false,
				GenderList: [
					{name: '保密', value: '0'},
					{name: '男', value: '1'},
					{name: '女', value: '2'},
				],
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
								return uni.$u.test.mobile(value);
							},
							message: '手机号码不正确',
							// 触发器可以同时用blur和change
							trigger: ['change','blur'],
						}
					],
					nickname: {
						type: 'string',
						required: true,
						message: '请填写昵称',
						trigger: ['blur', 'change']
					},
					email: [
						{
							type: 'string',
							required: true,
							message: '请填写邮箱',
							trigger: ['blur', 'change']
						},
						{
							// 自定义验证函数
							validator: (rule, value, callback) => {
								// 上面有说，返回true表示校验通过，返回false表示不通过
								// uni.$u.test.mobile()就是返回true或者false的
								return uni.$u.test.email(value);
							},
							message: '邮箱不正确',
							// 触发器可以同时用blur和change
							trigger: ['change','blur'],
						}
					],
				}
			}
		},
		methods:{
			//更改性别
			GenderSelect(e){
				console.log(e)
				this.business.gender = e.value
				this.business.sex_text = e.name
			},
			//更改地区
			handleGetRegion(region)
			{
				console.log(region)
				this.business.region_code = region[2]['code']
				this.business.region_text = region.map(item=>item.name).join('/')				
			},
			//删除图片
			Del()
			{
				this.avatar = []
			},
			// 读取图片
			Read(event)
			{
				// console.log(event)
				this.avatar = [{
					url: event.file.thumb
				}]
			},
			//表单提交
			submit()
			{
				//关闭模态框
				this.show = false
				//判断是否有通过表单验证
				this.$refs.profile.validate()
				.then(async res => {
					var data = {}
					var result = {}
					//有图片上传的情况
					if(this.avatar.length > 0 && this.avatar[0].url != this.business.avatar_text){
						//组装数据发起请求
						data = {
							name: 'avatar',
							formData: {
								id: this.business.id,
								mobile: this.business.mobile,
								nickname: this.business.nickname,
								email: this.business.email,
								gender: this.business.gender,
								region: this.business.region_code,
								lable: this.business.lable,
							}						
						}

						//如果有输入新密码在提交
						if(this.business.hasOwnProperty('password'))
						{
							data.formData.password = this.business.password
						}
						
                        //替换图片
						data.filePath = this.avatar[0].url

						//发起请求
						result = await uni.$u.http.upload('/business/profile', data)
					}
					//没有图片上传的情况
					else
					{
						data = {
							id: this.business.id,
							mobile: this.business.mobile,
							nickname: this.business.nickname,
							email: this.business.email,
							gender: this.business.gender,
							region: this.business.region_code,
							lable: this.business.lable,
						}

						//如果有输入新密码在提交
						if(this.business.hasOwnProperty('password'))
						{
							data.password = this.business.password
						}

						//发起请求
						result = await uni.$u.http.post('/business/profile', data)
					}
					
					if(result.code == 0)
					{
						this.$refs.notice.show({
							type:"error",
							message:result.msg
						})
						return false
					}

					//成功
					this.$refs.notice.show({
						type: 'success',
						message: result.msg,
						complete()
						{
							//存储用户信息(同步)
							uni.setStorageSync('business', result.data)
							
							//跳转
							uni.$u.route({
								type: 'navigateBack',
								delta: 1, //后退一页
							})
							return false
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

	/* 表单 */
	.items{
		display: flex;
		flex-direction: row;
		align-items: center;
		height: auto;
		width: 650rpx;
		padding: 20rpx 50rpx;
		border-bottom: 20rpx solid rgb(234,234,234);
		font-size: 30rpx;
		box-shadow: 0 0 10px #DDD;
	}

	.items text{
		display: block;
		width: 135rpx;
		text-align: right;
	}

	radio{
		margin-right: 20rpx;
	}

	.but{
		margin-top: 50rpx;
	}

	button{
		width:400rpx;
		background-color: #0173DE;
		color:white;
		opacity: 0.9;
		box-shadow: 0 0 10px #DDD;
		font-size:34rpx;
	}
	
	.u-button--square[data-v-3bf2dba7]{
		width: 60%;
		margin-top: 36rpx;
	}
	
	.u-form-item__body__right__content__slot.data-v-5e7216f1 {
	    margin-right: 10px;
	}
	
	.u-modal__content__text.data-v-713d0fd3 {
	    flex: none !important; 
	}
</style>