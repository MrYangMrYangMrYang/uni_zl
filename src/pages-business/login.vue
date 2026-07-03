<template>
	<view class="login-page">
		<view class="header">
			<view class="avatar-wrap">
				<view class="avatar">
					<!-- #ifdef H5 || APP-PLUS -->
					<image src="/static/icons/zl.svg" mode="aspectFill"></image>
					<!-- #endif -->
					<!-- #ifdef MP-WEIXIN -->
					<open-data type="userAvatarUrl"></open-data>
					<!-- #endif -->
				</view>
			</view>
			<text class="welcome">欢迎回来</text>
			<text class="sub-title">登录后享受更多精彩内容</text>
		</view>

		<view class="form-card">
			<u-form labelPosition="left" labelWidth="0" :model="business" :rules="rules" ref="bind">
				<view class="input-group">
					<view class="input-icon">
						<u-icon name="phone" size="20" color="#999"></u-icon>
					</view>
					<u-form-item prop="mobile" :borderBottom="false" class="form-item-inner">
						<u-input
							v-model="business.mobile"
							border="none"
							placeholder="请输入手机号码"
							clearable
						></u-input>
					</u-form-item>
				</view>

				<view class="input-divider"></view>

				<view class="input-group">
					<view class="input-icon">
						<u-icon name="lock" size="20" color="#999"></u-icon>
					</view>
					<u-form-item prop="password" :borderBottom="false" class="form-item-inner">
						<u-input
							:type="showPassword ? 'text' : 'password'"
							v-model="business.password"
							border="none"
							placeholder="请输入密码"
						>
							<template #suffix>
								<view
									class="eye-icon"
									:class="{ 'eye-open': showPassword }"
									@click="showPassword = !showPassword"
								>
									<view class="eye-open-shape" v-if="showPassword">
										<view class="eye-outer"></view>
										<view class="eye-iris"></view>
										<view class="eye-pupil"></view>
									</view>
									<view class="eye-closed-shape" v-else>
										<view class="eye-closed-arc"></view>
										<view class="eye-lashes"></view>
									</view>
								</view>
							</template>
						</u-input>
					</u-form-item>
				</view>

				<view class="btn-wrap">
					<!-- #ifdef MP-WEIXIN -->
					<u-button
						text="确认绑定"
						formType="submit"
						@click="submit"
						shape="circle"
						size="large"
						:loading="loading"
						:customStyle="{
							background: 'var(--zl-gradient)',
							border: 'none',
							height: '96rpx'
						}"
					></u-button>
					<!-- #endif -->
					<!-- #ifdef H5 || APP-PLUS -->
					<u-button
						text="登  录"
						formType="submit"
						@click="submit"
						shape="circle"
						size="large"
						:loading="loading"
						:customStyle="{
							background: 'var(--zl-gradient)',
							border: 'none',
							height: '96rpx'
						}"
					></u-button>
					<!-- #endif -->
				</view>
			</u-form>

			<view class="form-footer">
				<text class="footer-text">未注册手机号验证后自动创建账号</text>
			</view>
		</view>

		<u-toast ref="notice"></u-toast>
	</view>
</template>

<script>
export default {
	onLoad(params) {
		const openid = params.openid ? params.openid : ''

		// #ifdef MP-WEIXIN
		if (!openid) {
			uni.$toast.error('openid参数不存在', {
				complete: () => {
					uni.$u.route({ type: 'navigateBack', delta: 1 })
				}
			})
		} else {
			this.openid = openid
		}
		// #endif

		// #ifdef H5 || APP-PLUS
		// H5环境使用固定的openid值'h5'标识平台类型
		this.openid = openid || 'h5'
		// #endif
	},

	onReady() {
		this.$nextTick(() => {
			if (this.$refs.bind) {
				this.$refs.bind.setRules(this.rules)
			}
		})
	},

	data() {
		return {
			loading: false,
			showPassword: false,
			openid: null,
			business: {
				mobile: '',
				password: ''
			},
			rules: {
				mobile: [
					{
						type: 'string',
						required: true,
						message: '请填写手机号码',
						trigger: ['blur', 'change']
					},
					{
						validator: (rule, value) => {
							return uni.$u.test.mobile(value)
						},
						message: '手机号码不正确',
						trigger: ['change', 'blur']
					}
				],
				password: {
					type: 'string',
					required: true,
					message: '请填写密码',
					trigger: ['blur', 'change']
				}
			}
		}
	},

	methods: {
		submit() {
			if (this.loading) return
			this.loading = true

			if (!this.$refs.bind) return

			this.$refs.bind
				.validate()
				.then(async () => {
					const data = {
						openid: this.openid,
						mobile: this.business.mobile,
						password: this.business.password
					}

					let result
					// #ifdef MP-WEIXIN
					result = await uni.$u.http.post('/business/bind', data)
					// #endif

					// #ifdef H5 || APP-PLUS
					result = await uni.$u.http.post('/business/signin', data)
					// #endif

					if (result.code == 0) {
						this.loading = false
						uni.$toast.error(result.msg)
						return false
					}

					uni.$toast.success(result.msg)
					this.$store.dispatch('loginSuccess', result.data)

					setTimeout(() => {
						this.loading = false
						uni.navigateBack({ delta: 1 })
					}, 1500)
				})
				.catch(() => {
					this.loading = false
					uni.$toast.error('请填写正确的手机号和密码')
				})
		}
	}
}
</script>

<style lang="scss">
.login-page {
	background-color: $zl-bg-color;
	min-height: 100vh;
}

.header {
	width: 100%;
	padding: 120rpx 0 140rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	background: $zl-gradient;
	color: white;
	position: relative;
	overflow: hidden;
}

.header::before {
	content: '';
	position: absolute;
	top: -60rpx;
	right: -80rpx;
	width: 300rpx;
	height: 300rpx;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.08);
}

.header::after {
	content: '';
	position: absolute;
	bottom: -50rpx;
	left: -40rpx;
	width: 200rpx;
	height: 200rpx;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.06);
}

.avatar-wrap {
	width: 170rpx;
	height: 170rpx;
	border-radius: 50%;
	padding: 6rpx;
	background: rgba(255, 255, 255, 0.25);
	margin-bottom: 32rpx;
	box-shadow: 0 8rpx 30rpx rgba(0, 0, 0, 0.1);
}

.avatar {
	width: 100%;
	height: 100%;
	border-radius: 50%;
	overflow: hidden;
	background: white;
}

.avatar image {
	width: 100%;
	height: 100%;
}

.welcome {
	font-size: 44rpx;
	font-weight: bold;
	margin-bottom: 16rpx;
	z-index: 1;
	letter-spacing: 4rpx;
}

.sub-title {
	font-size: 26rpx;
	color: rgba(255, 255, 255, 0.85);
	z-index: 1;
}

.form-card {
	background-color: white;
	margin: -56rpx 48rpx 0;
	padding: 56rpx 40rpx 40rpx;
	border-radius: 28rpx;
	box-shadow: 0 8rpx 40rpx rgba(0, 0, 0, 0.06), 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
	position: relative;
	z-index: 2;
}

.input-group {
	display: flex;
	align-items: center;
	padding: 20rpx 0;
}

.input-icon {
	width: 56rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 16rpx;
	flex-shrink: 0;
}

.form-item-inner {
	flex: 1;
	padding-left: 0 !important;
}

.input-divider {
	height: 1rpx;
	background: linear-gradient(90deg, transparent, #e8e8e8, transparent);
	margin: 0 8rpx;
}

.btn-wrap {
	margin-top: 64rpx;
}

.form-footer {
	text-align: center;
	margin-top: 36rpx;
	padding-top: 24rpx;
}

.footer-text {
	font-size: 24rpx;
	color: #bbb;
}

.eye-icon {
	width: 44rpx;
	height: 44rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	position: relative;
	padding: 6rpx;
}

.eye-open-shape {
	position: relative;
	width: 36rpx;
	height: 22rpx;
}

.eye-outer {
	width: 100%;
	height: 20rpx;
	border: 3rpx solid #999;
	border-radius: 50%;
	box-sizing: border-box;
	position: absolute;
	top: 0;
}

.eye-iris {
	width: 12rpx;
	height: 12rpx;
	background: #999;
	border-radius: 50%;
	position: absolute;
	top: 4rpx;
	left: 50%;
	transform: translateX(-50%);
}

.eye-pupil {
	width: 5rpx;
	height: 5rpx;
	background: white;
	border-radius: 50%;
	position: absolute;
	top: 7.5rpx;
	left: 50%;
	transform: translateX(-50%);
	z-index: 1;
}

.eye-closed-shape {
	position: relative;
	width: 36rpx;
	height: 18rpx;
}

.eye-closed-arc {
	width: 32rpx;
	height: 16rpx;
	border-top: 3.5rpx solid #999;
	border-radius: 50% 50% 0 0;
	position: absolute;
	top: 2rpx;
	left: 2rpx;
}

.eye-lashes::before,
.eye-lashes::after {
	content: '';
	position: absolute;
	width: 3.5rpx;
	height: 8rpx;
	background: #999;
	border-radius: 2rpx;
	top: -4rpx;
}

.eye-lashes::before {
	left: 4rpx;
	transform: rotate(-25deg);
}

.eye-lashes::after {
	right: 4rpx;
	transform: rotate(25deg);
}
</style>
