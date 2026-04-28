<template>
	<!-- 登录页根容器：使用全局背景色变量 -->
	<view class="container">
		<!-- 头部区域：渐变背景 + 头像 + 欢迎文字 -->
		<view class="header">
			<!-- 头像外层容器：带半透明边框的圆形 -->
			<view class="avatar-wrap">
				<!-- 头像内层容器：白色背景的圆形 -->
				<view class="avatar">
					<!-- 条件编译：H5环境或APP环境显示静态Logo图片 -->
					<!-- #ifdef H5 || APP-PLUS -->
						<!-- Logo图片：使用 aspectFill 模式裁剪填充 -->
						<image src="/static/zl.png" mode="aspectFill"></image>
					<!-- #endif -->
					<!-- 条件编译：微信小程序环境显示用户微信头像 -->
					<!-- #ifdef MP-WEIXIN -->
						<!-- 使用微信开放组件获取用户头像（需用户授权） -->
						<open-data type="userAvatarUrl"></open-data>
					<!-- #endif -->
				</view>
			</view>
			<!-- 欢迎标题文本：大字号加粗 -->
			<view class="welcome">欢迎回来</view>
			<!-- 副标题说明文本：小字号半透明白色 -->
			<view class="sub-title">请填写已有账号或新注册账号</view>
		</view>

		<!-- 表单卡片区域：白色圆角卡片 -->
		<view class="form-card">
			<!-- uView表单组件：用于数据收集和验证 -->
			<u-form
			labelPosition="left"
			labelWidth="70"
			:model="business"
			:rules="rules"
			ref="bind"
		>
				<!-- 手机号输入项 -->
				<u-form-item
				label="手机号"
				prop="mobile"
				borderBottom
				ref="mobile"
			>
					<!-- 手机号输入框：无边框样式 -->
					<u-input v-model="business.mobile" border="none" placeholder="请输入手机号码"></u-input>
				</u-form-item>

				<!-- 密码输入项 -->
				<u-form-item
				label="密码"
				prop="password"
				borderBottom
				ref="password"
			>
					<u-input
						:type="showPassword ? 'text' : 'password'"
						v-model="business.password"
						border="none"
						placeholder="请输入密码"
					>
						<!-- 自定义后缀插槽：放置密码可见性切换按钮 -->
						<template #suffix>
							<!-- 眼睛图标：点击切换密码可见性 -->
							<u-icon
							:name="showPassword ? 'eye' : 'eye-fill'"
							size="20"
							color="#999"
							@click="showPassword = !showPassword"
						></u-icon>
						</template>
					</u-input>
				</u-form-item>

				<!-- 提交按钮区域 -->
				<view class="btn-wrap">
					<!-- #ifdef MP-WEIXIN -->
						<u-button
							text="确认绑定"
							formType="submit"
							@click="submit"
							shape="circle"
							size="large"
							:customStyle="{background: 'linear-gradient(135deg, #0173de, #4cd964)', border: 'none'}"
						></u-button>
					<!-- #endif -->
					<!-- #ifdef H5 || APP-PLUS -->
						<u-button
							text="登 录"
							formType="submit"
							@click="submit"
							shape="circle"
							size="large"
							:customStyle="{background: 'linear-gradient(135deg, #0173de, #4cd964)', border: 'none'}"
						></u-button>
					<!-- #endif -->
				</view>
			</u-form>
		</view>

		<!-- 全局Toast提示组件：用于显示操作反馈信息 -->
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
			showPassword: false,        // 密码是否可见（false=密文显示，true=明文显示）
			openid: null,               // 用户openid（微信授权标识或平台标识）
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
			// 第一步：手动触发表单验证
			this.$refs.bind.validate()
				.then(async res => {
					// 验证通过：构造请求数据对象
					var data = {
						openid: this.openid,                      // 平台标识或微信openid
						mobile: this.business.mobile,             // 用户输入的手机号
						password: this.business.password         // 用户输入的密码
					}

					// 条件编译：根据不同平台调用不同的登录接口
					// #ifdef MP-WEIXIN
					// 微信小程序：调用绑定接口（将微信账号与手机号绑定）
					var result = await uni.$u.http.post('/business/bind', data)
					// #endif

					// #ifdef H5 || APP-PLUS
					// H5或APP：调用普通登录接口
					var result = await uni.$u.http.post('/business/signin', data)
					// #endif

					// 判断登录是否成功（code==0表示失败）
					if (result.code == 0) {
						// 登录失败：显示后端返回的错误信息
						uni.$toast.error(result.msg)
						return false  // 终止后续操作
					}

					// 登录成功：显示成功提示
					uni.$toast.success(result.msg)

					// 将用户信息同步到Vuex状态管理中（包括token、用户信息等）
					this.$store.dispatch('loginSuccess', result.data)

					// 延迟1.5秒后返回上一页（让用户看到成功提示）
					setTimeout(() => {
						uni.navigateBack({ delta: 1 })  // delta=1 表示返回上一页
					}, 1500)
				})
				.catch(error => {
					// 表单验证失败：显示通用错误提示
					uni.$toast.error('请填写正确的手机号和密码')
				})
		}
	}
}
</script>

<style lang="scss">
/* ==================== 登录页根容器 ==================== */
.container {
	background-color: $zl-bg-color;    /* 使用全局SCSS变量：页面背景色 */
	min-height: 100vh;                 /* 最小高度占满整屏 */
}

/* ==================== 头部区域样式 ==================== */
.header {
	width: 100%;                       /* 宽度撑满父容器 */
	padding: 80rpx 0 100rpx;          /* 内边距：上80 左右0 下100 */
	display: flex;                    /* 弹性布局 */
	flex-direction: column;           /* 纵向排列子元素 */
	align-items: center;              /* 水平居中对齐 */
	background: $zl-gradient;         /* 使用全局变量：渐变背景色 */
	color: white;                     /* 文字颜色为白色 */
	position: relative;               /* 相对定位（为伪元素做准备） */
}

/* 头部底部的弧形装饰效果（使用::after伪元素实现） */
.header::after {
	content: '';                      /* 伪元素必须设置content属性 */
	position: absolute;               /* 绝对定位 */
	bottom: -40rpx;                   /* 定位到底部下方40rpx处 */
	left: 0;                          /* 左边缘对齐 */
	width: 100%;                      /* 宽度撑满 */
	height: 80rpx;                    /* 弧形高度 */
	background: $zl-bg-color;        /* 与页面背景同色（形成融合效果） */
	border-radius: 50% 50% 0 0;      /* 上半部分圆角（形成向下凸的弧形） */
}

/* 头像外层容器：半透明边框效果 */
.avatar-wrap {
	width: 180rpx;                    /* 容器宽度 */
	height: 180rpx;                   /* 容器高度 */
	border-radius: 50%;              /* 圆形 */
	padding: 8rpx;                    /* 内边距（形成边框厚度） */
	background: rgba(255, 255, 255, 0.2);  /* 半透明白色背景（20%不透明度） */
	margin-bottom: 30rpx;             /* 与下方标题的间距 */
}

/* 头像内层容器：白色背景圆形 */
.avatar {
	width: 100%;                      /* 宽度继承父容器 */
	height: 100%;                     /* 高度继承父容器 */
	border-radius: 50%;              /* 圆形 */
	overflow: hidden;                /* 隐藏溢出内容（保证图片不超出圆形） */
	background: white;              /* 白色背景 */
}

/* 头像图片样式 */
.avatar image {
	width: 100%;                      /* 宽度撑满容器 */
	height: 100%;                     /* 高度撑满容器 */
}

/* 欢迎标题文本 */
.welcome {
	font-size: 40rpx;                 /* 大字号 */
	font-weight: bold;               /* 加粗 */
	margin-bottom: 16rpx;            /* 与副标题的间距 */
	z-index: 1;                      /* 层级高于伪元素（确保文字在装饰之上） */
}

/* 副标题说明文本 */
.sub-title {
	font-size: 26rpx;                 /* 小字号 */
	color: rgba(255, 255, 255, 0.9); /* 90%不透明度的白色（略浅于标题） */
	z-index: 1;                      /* 层级高于伪元素 */
}

/* ==================== 表单卡片样式 ==================== */
.form-card {
	background-color: white;         /* 白色背景 */
	margin: -40rpx 40rpx 0;          /* 外边距：负上边距（与头部重叠）+ 左右各40 */
	padding: 40rpx;                   /* 内边距 */
	border-radius: 24rpx;            /* 大圆角效果 */
	box-shadow: 0 8rpx 40rpx rgba(0, 0, 0, 0.08);  /* 轻微阴影（增加层次感） */
	position: relative;              /* 相对定位 */
	z-index: 1;                      /* 层级高于头部的伪元素 */
}

/* 提交按钮容器 */
.btn-wrap {
	margin-top: 60rpx;               /* 与上方表单项的间距 */
}
</style>
