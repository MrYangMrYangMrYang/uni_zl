<template>
	<view class="profile-container">
		<view class="loading-wrapper" v-if="loading">
			<u-skeleton
				:loading="true"
				:animate="true"
				avatar
				:avatarSize="80"
				:rows="3"
				:rowsWidth="['40%', '70%', '50%']"
				:rowsHeight="['32rpx', '24rpx', '24rpx']"
				:title="false"
			></u-skeleton>
		</view>

		<block v-else>
			<view class="user-header">
				<view class="avatar-wrapper" @click="chooseAvatar">
					<view class="avatar-edit-icon">
						<u-icon name="camera" color="#fff" size="28"></u-icon>
					</view>
					<!-- #ifdef H5 || APP-PLUS -->
					<image class="avatar" :src="business.avatar_text || '/static/logo.png'" mode="aspectFill"></image>
					<!-- #endif -->

					<!-- #ifdef MP-WEIXIN -->
					<image
						v-if="business.hasOwnProperty('avatar') && business.avatar"
						class="avatar"
						:src="business.avatar_text"
						mode="aspectFill"
					></image>
					<image v-else class="avatar" src="/static/logo.png" mode="aspectFill"></image>
					<!-- #endif -->
				</view>
			</view>

			<view class="form-section">
				<!-- 手机号脱敏处理 -->
				<view class="custom-form-item">
					<view class="custom-form-item__label">手机:</view>
					<view class="custom-form-item__value">{{ maskedMobile }}</view>
				</view>

				<u--form labelPosition="left" labelWidth="75" :model="business" :rules="rules" ref="profile">
					<u-form-item label="昵称:" prop="nickname">
						<u--input v-model="business.nickname" border="none" placeholder="请输入昵称"></u--input>
					</u-form-item>

					<u-form-item label="邮箱:" prop="email">
						<u--input v-model="business.email" border="none" placeholder="请输入邮箱"></u--input>
					</u-form-item>

					<u-form-item label="密码:" prop="password">
						<u--input
							:type="showPassword ? 'text' : 'password'"
							v-model="business.password"
							border="none"
							placeholder="不修改则留空"
							:customStyle="{ fontSize: '26rpx' }"
						>
							<u-icon
								slot="suffix"
								:name="showPassword ? 'eye-fill' : 'eye'"
								color="#c0c4cc"
								size="22"
								@click="showPassword = !showPassword"
							></u-icon>
						</u--input>
					</u-form-item>

					<u-form-item label="性别:" prop="sex_text" @click="ShowGender = true">
						<u--input
							v-model="business.sex_text"
							readonly
							border="none"
							placeholder="请选择性别"
						></u--input>
						<u-icon slot="right" name="arrow-right" color="#c0c4cc" size="22"></u-icon>
					</u-form-item>

					<u-action-sheet
						:show="ShowGender"
						:actions="GenderList"
						title="请选择性别"
						@close="ShowGender = false"
						@select="GenderSelect"
					></u-action-sheet>

					<pick-regions :defaultRegion="defaultRegion" @getRegion="handleGetRegion">
						<u-form-item label="地区:" prop="region_text">
							<u--input
								v-model="business.region_text"
								readonly
								border="none"
								placeholder="请选择地区"
							></u--input>
							<u-icon slot="right" name="arrow-right" color="#c0c4cc" size="22"></u-icon>
						</u-form-item>
					</pick-regions>

					<u-form-item label="签名:" prop="lable">
						<u--textarea
							v-model="business.lable"
							placeholder="请输入您的个性签名"
							count
							:maxlength="50"
							height="80"
						></u--textarea>
					</u-form-item>

					<view class="submit-btn-wrapper">
						<u-button
							type="primary"
							text="确认修改"
							formType="submit"
							@click="show = true"
							:customStyle="{
								background: 'linear-gradient(135deg, #0173de, #4cd964)',
								borderRadius: '44rpx',
								height: '88rpx'
							}"
						></u-button>
					</view>
				</u--form>
			</view>

			<u-toast ref="notice"></u-toast>

			<u-modal
				:show="show"
				title="修改提醒"
				content="是否确认修改资料？"
				showCancelButton
				:closeOnClickOverlay="true"
				@cancel="show = false"
				@close="show = false"
				@confirm="submit"
				confirmColor="#0173de"
			></u-modal>
		</block>
	</view>
</template>

<script>
import pickRegions from './components/pick-regions/pick-regions.vue'
import { getUserInfo } from '@/utils/auth.js'

export default {
	components: { pickRegions },

	onReady() {
		const userInfo = getUserInfo()

		this.business = {
			...userInfo,
			lable: userInfo.lable || '',
			region_code: userInfo.region_code || [],
			gender: userInfo.gender || '0',
			password: ''
		}

		this.avatar = [
			{
				url: this.business.avatar_text || '/static/logo.png'
			}
		]

		this.loading = false

		this.$nextTick(() => {
			if (this.$refs.profile) {
				this.$refs.profile.setRules(this.rules)
			}
		})
	},

	data() {
		return {
			loading: true,
			region: [],
			avatar: [],
			business: null,
			ShowGender: false,
			show: false,
			showPassword: false,
			GenderList: [
				{ name: '保密', value: '0' },
				{ name: '男', value: '1' },
				{ name: '女', value: '2' }
			],
			rules: {
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
						validator: (rule, value) => {
							return uni.$u.test.email(value)
						},
						message: '邮箱不正确',
						trigger: ['change', 'blur']
					}
				]
			}
		}
	},

	computed: {
		// 手机号脱敏处理
		maskedMobile() {
			if (!this.business) return ''
			const mobile = this.business.mobile
			if (!mobile) return ''
			const str = String(mobile)
			if (str.length < 11) return str
			return str.slice(0, 3) + '****' + str.slice(-4)
		},

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
		GenderSelect(e) {
			this.business.gender = e.value
			this.business.sex_text = e.name
		},

		handleGetRegion(region) {
			// region 为[省, 市, 区]三级数组，取末级区县code作为存储值
			this.business.region_code = region[2]['code']
			this.business.region_text = region.map(item => item.name).join('/')
		},

		chooseAvatar() {
			uni.chooseImage({
				count: 1,
				sizeType: ['compressed'],
				sourceType: ['album', 'camera'],
				success: res => {
					this.avatar = [
						{
							url: res.tempFilePaths[0]
						}
					]
					this.business.avatar_text = res.tempFilePaths[0]
				}
			})
		},

		async submit() {
			this.show = false

			try {
				await this.$refs.profile.validate()

				let data = {}
				let result = {}

				if (this.avatar.length > 0 && this.avatar[0].url != this.business.avatar_text) {
					// 有图片上传：使用 upload 接口
					data = {
						name: 'avatar',
						formData: {
							id: this.business.id,
							mobile: this.business.mobile,
							nickname: this.business.nickname,
							email: this.business.email,
							gender: this.business.gender,
							region: this.business.region_code,
							lable: this.business.lable
						}
					}

					if (Object.prototype.hasOwnProperty.call(this.business, 'password')) {
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
						lable: this.business.lable
					}

					if (Object.prototype.hasOwnProperty.call(this.business, 'password')) {
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
			} catch (error) {
				console.log(error)
				uni.$toast.error('请完善个人资料信息')
			}
		}
	}
}
</script>

<style lang="scss">
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

.form-section {
	margin-top: 20rpx;
	padding: 0 32rpx;
	background-color: transparent;
	box-sizing: border-box;
	width: 100%;
	border: none !important;
	border-top: none !important;
}

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
