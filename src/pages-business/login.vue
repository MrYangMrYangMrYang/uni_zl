<template>
	<view class="login-page">
		<!-- 头部区域 -->
		<view class="header">
			<view class="avatar-wrap">
				<view class="avatar">
					<!-- #ifdef H5 || APP-PLUS -->
						<image src="/static/zl.svg" mode="aspectFill"></image>
					<!-- #endif -->
					<!-- #ifdef MP-WEIXIN -->
						<open-data type="userAvatarUrl"></open-data>
					<!-- #endif -->
				</view>
			</view>
			<text class="welcome">欢迎回来</text>
			<text class="sub-title">登录后享受更多精彩内容</text>
		</view>

		<!-- 表单卡片 -->
		<view class="form-card">
			<u-form
				labelPosition="left"
				labelWidth="0"
				:model="business"
				:rules="rules"
				ref="bind"
			>
				<!-- 手机号输入项：带图标前缀 -->
				<view class="input-group">
					<view class="input-icon">
						<u-icon name="phone" size="20" color="#999"></u-icon>
					</view>
					<u-form-item prop="mobile" :borderBottom="false" class="form-item-inner">
						<u-input v-model="business.mobile" border="none" placeholder="请输入手机号码" clearable></u-input>
					</u-form-item>
				</view>

				<!-- 分隔线 -->
				<view class="input-divider"></view>

				<!-- 密码输入项：带图标前缀 + 密码可见性切换 -->
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
							<view class="eye-icon" :class="{ 'eye-open': showPassword }" @click="showPassword = !showPassword">
								<!-- 睁眼状态 -->
								<view class="eye-open-shape" v-if="showPassword">
									<view class="eye-outer"></view>
									<view class="eye-iris"></view>
									<view class="eye-pupil"></view>
								</view>
								<!-- 闭眼状态 -->
								<view class="eye-closed-shape" v-else>
									<view class="eye-closed-arc"></view>
									<view class="eye-lashes"></view>
								</view>
							</view>
						</template>
						</u-input>
					</u-form-item>
				</view>

				<!-- 登录按钮 -->
				<view class="btn-wrap">
					<!-- #ifdef MP-WEIXIN -->
						<u-button
							text="确认绑定"
							formType="submit"
							@click="submit"
							shape="circle"
							size="large"
							:loading="loading"
							:customStyle="{background: 'linear-gradient(135deg, #0173de, #4cd964)', border: 'none', height: '96rpx'}"
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
							:customStyle="{background: 'linear-gradient(135deg, #0173de, #4cd964)', border: 'none', height: '96rpx'}"
						></u-button>
					<!-- #endif -->
				</view>
			</u-form>

			<!-- 底部提示 -->
			<view class="form-footer">
				<text class="footer-text">未注册手机号验证后自动创建账号</text>
			</view>
		</view>

		<u-toast ref="notice"></u-toast>
	</view>
</template>

<script>
/**
 * business/login.vue - 用户登录页
 *
 * 功能说明：
 * - 手机号 + 密码登录方式
 * - 支持微信小程序授权登录（绑定已有账号）
 * - 完整的表单验证机制（手机号格式、密码非空）
 * - 登录成功后自动存储用户信息到Vuex并跳转回上一页
 *
 * 平台差异：
 * - 微信小程序：调用 /business/bind 接口（绑定微信openid）
 * - H5/APP：调用 /business/signin 接口（普通账号密码登录）
 */
export default {
	/**
	 * 页面生命周期 - onLoad
	 * 当页面加载时触发，接收路由参数中的openid
	 * @param {object} params - 路由参数对象
	 */
	onLoad(params) {
		// 从路由参数中获取openid（微信授权标识）
		var openid = params.openid ? params.openid : ''

		// 条件编译：微信小程序环境的特殊处理
		// #ifdef MP-WEIXIN
		if (!openid) {
			// 如果没有openid参数：显示错误提示并返回上一页
			uni.$toast.error('openid参数不存在', {
				complete: () => {
					// 提示消失后执行回调：返回上一页
					uni.$u.route({ type: 'navigateBack', delta: 1 })
				}
			})
		} else {
			// 有openid：保存到data中供后续使用
			this.openid = openid
		}
		// #endif

		// 条件编译：H5或APP环境的处理
		// #ifdef H5 || APP-PLUS
		// H5环境使用固定的openid值'h5'标识平台类型
		this.openid = openid || 'h5'
		// #endif
	},

	/**
	 * 页面生命周期 - onReady
	 * 页面初次渲染完成时触发
	 * 用于设置表单验证规则（必须在DOM渲染完成后才能设置）
	 */
	onReady() {
		// 使用$nextTick确保DOM完全渲染完成后再设置验证规则
		this.$nextTick(() => {
			if (this.$refs.bind) {
				// 调用uView表单组件的setRules方法，将定义的规则应用到表单上
				this.$refs.bind.setRules(this.rules)
			}
		})
	},

	/**
	 * 数据定义
	 * 包含登录表单所需的所有响应式数据和验证规则
	 */
	data() {
		return {
			loading: false,              // 登录按钮加载状态
			showPassword: false,
			openid: null,
			// 表单数据模型：双向绑定到输入框
			business: {
				mobile: '',             // 手机号码字段
				password: ''            // 密码字段
			},
			// 表单验证规则配置
			rules: {
				mobile: [
					// 规则1：必填校验
					{
						type: 'string',                    // 字段类型为字符串
						required: true,                    // 设置为必填项
						message: '请填写手机号码',          // 验证失败时的错误提示
						trigger: ['blur', 'change']        // 触发时机：失焦和内容变化时都验证
					},
					// 规则2：手机号格式校验
					{
						// 自定义验证器函数
						validator: (rule, value, callback) => {
							// 使用uView内置的手机号格式测试方法
							return uni.$u.test.mobile(value)
						},
						message: '手机号码不正确',          // 格式不正确时的提示
						trigger: ['change', 'blur'],        // 触发时机
					}
				],
				password: {
					// 密码规则：仅做非空校验
					type: 'string',                    // 字符串类型
					required: true,                    // 必填项
					message: '请填写密码',             // 错误提示
					trigger: ['blur', 'change']        // 验证时机
				}
			}
		}
	},

	methods: {
		/**
		 * 表单提交处理函数
		 * 流程：验证表单 → 发送请求 → 存储用户信息 → 跳转页面
		 */
		submit() {
			if (this.loading) return
			this.loading = true

			this.$refs.bind.validate()
				.then(async res => {
					var data = {
						openid: this.openid,
						mobile: this.business.mobile,
						password: this.business.password
					}

					// #ifdef MP-WEIXIN
					var result = await uni.$u.http.post('/business/bind', data)
					// #endif

					// #ifdef H5 || APP-PLUS
					var result = await uni.$u.http.post('/business/signin', data)
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
				.catch(error => {
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

/* ========== 头部区域 ========== */
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

/* ========== 表单卡片 ========== */
.form-card {
	background-color: white;
	margin: -56rpx 48rpx 0;
	padding: 56rpx 40rpx 40rpx;
	border-radius: 28rpx;
	box-shadow:
		0 8rpx 40rpx rgba(0, 0, 0, 0.06),
		0 2rpx 12rpx rgba(0, 0, 0, 0.04);
	position: relative;
	z-index: 2;
}

/* 输入项容器：图标 + 输入框 横向排列 */
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

/* 分隔线 */
.input-divider {
	height: 1rpx;
	background: linear-gradient(90deg, transparent, #e8e8e8, transparent);
	margin: 0 8rpx;
}

/* 登录按钮 */
.btn-wrap {
	margin-top: 64rpx;
}

/* 底部提示文字 */
.form-footer {
	text-align: center;
	margin-top: 36rpx;
	padding-top: 24rpx;
}

.footer-text {
	font-size: 24rpx;
	color: #bbb;
}

/* ========== 密码眼睛图标 ========== */
.eye-icon {
	width: 44rpx;
	height: 44rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	position: relative;
	padding: 6rpx;
}

/* ---- 睁眼状态 ---- */
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

/* ---- 闭眼状态 ---- */
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
