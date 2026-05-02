<template>
	<view class="profile-container">
			<!-- 加载状态：数据未就绪时显示 -->
			<view class="loading-wrapper" v-if="loading">
				<u-loading-icon mode="circle" size="40"></u-loading-icon>
				<view style="margin-top: 20rpx; color: #999; font-size: 26rpx;">加载中...</view>
			</view>

			<block v-else>
			<!-- 头像区域：渐变背景 + 可点击更换头像 -->
			<view class="user-header">
			<view class="avatar-wrapper" @click="chooseAvatar">
				<!-- 相机图标：提示可更换头像 -->
				<view class="avatar-edit-icon">
					<u-icon name="camera" color="#fff" size="28"></u-icon>
				</view>
			  <!-- 条件编译：H5/APP环境 -->
			  <!-- #ifdef H5 || APP-PLUS -->
				  <image class="avatar" :src="business.avatar_text || '/static/logo.png'" mode="aspectFill"></image>
			  <!-- #endif -->

			  <!-- 条件编译：微信小程序环境（处理空值） -->
			  <!-- #ifdef MP-WEIXIN -->
				  <image v-if="business.hasOwnProperty('avatar') && business.avatar" class="avatar" :src="business.avatar_text" mode="aspectFill"></image>
				  <image v-else class="avatar" src="/static/logo.png" mode="aspectFill"></image>
			  <!-- #endif -->
			</view>
		</view>
	  
		<!-- 表单区域 -->
		<view class="form-section">
			<!-- 手机号（只读展示，脱敏处理） -->
			<view class="custom-form-item">
				<view class="custom-form-item__label">手机:</view>
				<view class="custom-form-item__value">{{maskedMobile}}</view>
			</view>
			
			<u--form
				labelPosition="left"
				labelWidth="75"
				:model="business"
				:rules="rules"
				ref="profile"
			>
				<!-- 昵称输入项 -->
				<u-form-item label="昵称:" prop="nickname">
					<u--input v-model="business.nickname" border="none" placeholder="请输入昵称"></u--input>
				</u-form-item>

				<!-- 邮箱输入项 -->
				<u-form-item label="邮箱:" prop="email">
					<u--input v-model="business.email" border="none" placeholder="请输入邮箱"></u--input>
				</u-form-item>

				<!-- 密码输入项：支持明文/密文切换 -->
				<u-form-item label="密码:" prop="password">
					<u--input :type="showPassword ? 'text' : 'password'" v-model="business.password" border="none" placeholder="不修改则留空" :customStyle="{fontSize: '26rpx'}">
						<u-icon slot="suffix" :name="showPassword ? 'eye-fill' : 'eye'" color="#c0c4cc" size="22" @click="showPassword = !showPassword"></u-icon>
					</u--input>
				</u-form-item>
				
				<!-- 性别选择项：点击弹出选择面板 -->
				<u-form-item label="性别:" prop="sex_text" @click="ShowGender = true">
					<u--input v-model="business.sex_text" readonly border="none" placeholder="请选择性别"></u--input>
					<u-icon slot="right" name="arrow-right" color="#c0c4cc" size="22"></u-icon>
				</u-form-item>

				<!-- 性别选择弹出面板 -->
				<u-action-sheet
					:show="ShowGender"
					:actions="GenderList"
					title="请选择性别"
					@close="ShowGender = false"
					@select="GenderSelect"
				></u-action-sheet>
				
				<!-- 地区选择项：使用省市区三级联动组件 -->
				<pick-regions :defaultRegion="defaultRegion" @getRegion="handleGetRegion">
					<u-form-item label="地区:" prop="region_text">
						<u--input v-model="business.region_text" readonly border="none" placeholder="请选择地区"></u--input>
						<u-icon slot="right" name="arrow-right" color="#c0c4cc" size="22"></u-icon>
					</u-form-item>
				</pick-regions>
				
				<!-- 个性签名输入项：多行文本域 -->
				<u-form-item label="签名:" prop="lable">
					<u--textarea 
						v-model="business.lable" 
						placeholder="请输入您的个性签名" 
						count
						:maxlength="50"
						height="80"
					></u--textarea>
				</u-form-item>
				
				<!-- 提交按钮：渐变主题色 -->
				<view class="submit-btn-wrapper">
					<u-button type="primary" text="确认修改" formType="submit" @click="show = true" :customStyle="{background: 'linear-gradient(135deg, #0173de, #4cd964)', borderRadius: '44rpx', height: '88rpx'}"></u-button>
				</view>
			</u--form>
		</view>
		
		<u-toast ref="notice"></u-toast>
		
		<!-- 确认修改弹窗 -->
		<u-modal :show="show" title="修改提醒" content="是否确认修改资料？" showCancelButton :closeOnClickOverlay="true" @cancel="show = false" @close="show = false" @confirm="submit" confirmColor="#0173de"></u-modal>
			</block>
	</view>
</template>

<script>
/**
 * business/profile.vue - 基本资料编辑页
 *
 * 功能说明：
 * - 编辑用户昵称、邮箱、密码、性别、地区、个性签名
 * - 头像更换（支持相册选择和拍照）
 * - 密码可见性切换
 * - 地区选择器（省市区三级联动）
 * - 表单验证与提交（区分有/无图片上传两种提交方式）
 * - 修改成功后自动同步 Vuex 状态
 */
import pickRegions from './components/pick-regions/pick-regions.vue'
import { getUserInfo } from '@/utils/auth.js'

export default {
	components: { pickRegions },

	/**
	 * 页面生命周期 - onReady
	 * 页面初次渲染完成时触发，用于初始化用户数据和表单验证规则
	 */
	onReady() {
		const userInfo = getUserInfo()

		this.business = {
			...userInfo,
			lable: userInfo.lable || '',
			region_code: userInfo.region_code || [],
			gender: userInfo.gender || '0',
			password: ''
		}

		this.avatar = [{
			url: this.business.avatar_text || '/static/logo.png'
		}]

		this.loading = false

		this.$nextTick(() => {
			if (this.$refs.profile) {
				this.$refs.profile.setRules(this.rules)
			}
		})
	},

	data() {
		return {
			loading: true,              // 页面加载状态
			region: [],                 // 地区原始数据
			avatar: [],                 // 头像文件列表（用于上传组件）
			business: null,             // 用户信息数据对象
			ShowGender: false,          // 性别选择面板是否显示
			show: false,                // 确认修改弹窗是否显示
			showPassword: false,        // 密码是否可见
			GenderList: [               // 性别选项列表
				{name: '保密', value: '0'},
				{name: '男', value: '1'},
				{name: '女', value: '2'},
			],
			rules: {                    // 表单验证规则
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
						validator: (rule, value, callback) => {
							return uni.$u.test.email(value)
						},
						message: '邮箱不正确',
						trigger: ['change', 'blur'],
					}
				],
			}
		}
	},

	computed: {
		/**
		 * 手机号脱敏处理
		 * 将手机号中间四位替换为****，如 138****1234
		 * @returns {string} 脱敏后的手机号字符串
		 */
		maskedMobile() {
			if (!this.business) return ''
			const mobile = this.business.mobile
			if (!mobile) return ''
			const str = String(mobile)
			if (str.length < 11) return str
			return str.slice(0, 3) + '****' + str.slice(-4)
		},

		/**
		 * 地区选择器的默认值
		 * 从用户信息的 region_code 字段中提取
		 * @returns {Array} 地区编码数组（供 pick-regions 组件使用）
		 */
		defaultRegion() {
			if (!this.business) return []
			const code = this.business.region_code
			if (code && Array.isArray(code) && code.length > 0) {
				return code
			}
			return []
		}
	},

	methods: {
		/**
		 * 性别选择回调
		 * 更新用户的性别值和显示文本
		 * @param {object} e - 选中的性别项 {name: '男', value: '1'}
		 */
		GenderSelect(e) {
			this.business.gender = e.value
			this.business.sex_text = e.name
		},

		/**
		 * 地区选择回调
		 * 将省市区三级数据转换为编码和文本格式
		 * @param {Array} region - 选中的地区数组 [{code, name}, ...]
		 */
		handleGetRegion(region) {
			this.business.region_code = region[2]['code']
			this.business.region_text = region.map(item => item.name).join('/')
		},

		/**
		 * 删除头像图片
		 */
		Del() {
			this.avatar = []
		},

		/**
		 * 读取头像图片回调（uView上传组件触发）
		 * @param {object} event - 上传事件对象，包含 file.thumb 临时路径
		 */
		Read(event) {
			this.avatar = [{
				url: event.file.thumb
			}]
			this.business.avatar_text = event.file.thumb
		},

		/**
		 * 点击头像选择图片
		 * 调用系统图片选择器，支持相册和拍照
		 */
		chooseAvatar() {
			uni.chooseImage({
				count: 1,
				sizeType: ['compressed'],
				sourceType: ['album', 'camera'],
				success: (res) => {
					this.avatar = [{
						url: res.tempFilePaths[0]
					}]
					this.business.avatar_text = res.tempFilePaths[0]
				}
			})
		},

		/**
		 * 表单提交处理函数
		 * 流程：关闭确认弹窗 → 验证表单 → 区分有无图片上传 → 提交请求 → 同步Vuex
		 */
		submit() {
			this.show = false

			this.$refs.profile.validate()
				.then(async res => {
					var data = {}
					var result = {}

					if (this.avatar.length > 0 && this.avatar[0].url != this.business.avatar_text) {
						// 有图片上传：使用 upload 接口（multipart/form-data）
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

						if (this.business.hasOwnProperty('password')) {
							data.formData.password = this.business.password
						}

						data.filePath = this.avatar[0].url
						result = await uni.$u.http.upload('/business/profile', data)
					} else {
						// 无图片上传：使用普通 POST 接口
						data = {
							id: this.business.id,
							mobile: this.business.mobile,
							nickname: this.business.nickname,
							email: this.business.email,
							gender: this.business.gender,
							region: this.business.region_code,
							lable: this.business.lable,
						}

						if (this.business.hasOwnProperty('password')) {
							data.password = this.business.password
						}

						result = await uni.$u.http.post('/business/profile', data)
					}

					if (result.code == 0) {
						uni.$toast.error(result.msg)
						return false
					}

					uni.$toast.success(result.msg, {
						complete: () => {
							this.$store.dispatch('loginSuccess', result.data)
							uni.switchTab({ url: '/pages/business/index' })
						}
					})
				})
				.catch(error => {
					console.log(error)
					uni.$toast.error('请完善个人资料信息')
				})
		}
	}
}
</script>

<style lang="scss">
/* 页面根容器：浅灰背景 */
.profile-container {
	min-height: 100vh;
	background-color: #f7f8fc;
	border: none !important;
	border-top: none !important;
}

.loading-wrapper {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding-top: 200rpx;
}

/* 头像区域：渐变背景 + 底部弧形装饰 */
.user-header {
	width: 100%;
	padding: 60rpx 0 70rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	background: $zl-gradient;
	color: white;
	position: relative;
	cursor: pointer;
	border: none !important;
	border-bottom: none !important;
	outline: none !important;

	/* 底部弧形白色遮罩（与表单区域融合） */
	&::after {
		content: '';
		position: absolute;
		bottom: -1rpx;
		left: 0;
		right: 0;
		height: 40rpx;
		background: #f7f8fc;
		border-radius: 40rpx 40rpx 0 0;
		border-top: none !important;
		box-shadow: none !important;
	}
	
	&::before {
		display: none !important;
	}
	
	&:focus,
	&:active {
		outline: none !important;
		border: none !important;
	}
}

/* 头像容器：圆形 + 相机编辑图标 */
.avatar-wrapper {
	position: relative;

	.avatar {
		width: 150rpx;
		height: 150rpx;
		border-radius: 50%;
		border: 4rpx solid rgba(255, 255, 255, 0.6);
		box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.12);
		background-color: #fff;
	}

	.avatar-edit-icon {
		position: absolute;
		bottom: 0;
		right: 0;
		width: 44rpx;
		height: 44rpx;
		border-radius: 50%;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 10;
	}
}

/* 表单区域 */
.form-section {
	margin-top: 20rpx;
	padding: 0 32rpx;
	background-color: transparent;
	box-sizing: border-box;
	width: 100%;
	border: none !important;
	border-top: none !important;
}

/* 手机号只读卡片（模拟 u-form-item 结构） */
.custom-form-item {
	display: flex;
	align-items: center;
	padding: 20rpx 24rpx;
	background-color: #fff;
	border-radius: 16rpx;
	margin-bottom: 16rpx;
	box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
	box-sizing: border-box;
	width: 100%;
	border: none !important;
	border-top: none !important;
	border-bottom: none !important;
	
	&__label {
		flex-shrink: 0;
		width: 100rpx;
		font-size: 28rpx;
		color: #606266;
		font-weight: 500;
		margin-right: 20rpx;
		line-height: 1.4;
		white-space: nowrap;
	}
	
	&__value {
		flex: 1;
		font-size: 28rpx;
		color: #303133;
		line-height: 40rpx;
		padding: 10rpx 0;
	}
}

/* 深度选择器：覆盖 uView 表单组件内部样式 */
::v-deep .u--form {
	width: 100%;
	border: none !important;
}

::v-deep .u-form-item {
	padding: 20rpx 24rpx !important;
	background-color: #fff !important;
	border-radius: 16rpx !important;
	margin-bottom: 16rpx !important;
	box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04) !important;
	border: none !important;
	border-top: none !important;
	border-bottom: none !important;
	box-sizing: border-box !important;
	width: 100% !important;
	position: relative;
	overflow: visible;
}

::v-deep .u-form-item::after,
::v-deep .u-form-item::before {
	display: none !important;
}

::v-deep .u-form-item__body {
	border: none !important;
	border-top: none !important;
	border-bottom: none !important;
	padding: 0 !important;
	width: 100%;
	display: flex;
	align-items: center;
}

/* 提交按钮容器 */
.submit-btn-wrapper {
	margin-top: 40rpx;
	padding: 0;
	width: 100%;
	display: flex;
	justify-content: center;
}

::v-deep .u-button--primary {
	width: 100% !important;
}

/* 表单项标签样式覆盖 */
::v-deep .u-form-item__body__left {
	flex-shrink: 0;
	width: 100rpx !important;
	margin-right: 20rpx !important;
}

::v-deep .u-form-item__body__left__content {
	width: auto !important;
}

::v-deep .u-form-item__body__left__content__label {
	font-size: 28rpx !important;
	color: #606266 !important;
	font-weight: 500 !important;
	width: auto !important;
	line-height: 1.4 !important;
	white-space: nowrap !important;
}

/* 表单项右侧内容区 */
::v-deep .u-form-item__body__right {
	flex: 1;
	display: flex;
	align-items: center;
}

::v-deep .u-form-item__body__right__content {
	flex: 1 !important;
	width: 100%;
	position: relative;
}

/* 验证错误消息偏移（对齐输入框） */
::v-deep .u-form-item__body__right__message {
	margin-left: 0 !important;
	padding-left: 0 !important;
	font-size: 24rpx !important;
	position: relative;
	transform: translateX(118rpx);
}

::v-deep .u-input {
	background-color: transparent !important;
	font-size: 28rpx !important;
	color: #303133 !important;
	padding: 0 !important;
	border: none !important;
}

::v-deep .u-input__content {
	border: none !important;
}

::v-deep .u-form-item {
	border-bottom: none !important;
}

::v-deep .u-input--disabled {
	color: #909399 !important;
}

/* 签名文本域样式 */
::v-deep .u-textarea {
	background-color: #fafbfc !important;
	border-radius: 12rpx !important;
	padding: 20rpx !important;
	margin-top: 10rpx;
	font-size: 27rpx !important;
	line-height: 1.6;
}

::v-deep .u-textarea__word-count {
	font-size: 22rpx !important;
	color: #c0c4cc !important;
}

/* 确认修改弹窗样式 */
::v-deep .u-modal {
	text-align: center;
	border-radius: 20rpx;
	overflow: hidden;
}

::v-deep .u-modal__title {
	font-weight: 600;
	font-size: 32rpx;
	padding-top: 30rpx;
}

::v-deep .u-modal__content__text {
	flex: none !important;
	padding: 20rpx 40rpx 30rpx;
	color: #666;
	line-height: 1.6;
}
</style>