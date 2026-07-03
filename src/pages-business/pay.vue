<template>
	<view class="container">
		<view class="header">
			<view class="balance-card">
				<view class="balance-label">当前积分</view>
				<view class="balance-value">
					<u-icon name="integral-fill" size="36" color="#fff" style="margin-right: 12rpx"></u-icon>
					<text>{{ business.point || pay.current }}</text>
				</view>
			</view>
		</view>

		<view class="form-card">
			<u-notice-bar :text="message" type="warning" fontSize="24rpx"></u-notice-bar>

			<view class="section-title">快捷充值</view>
			<view class="quick-list">
				<view
					class="quick-item"
					v-for="(item, index) in quickList"
					:key="index"
					:class="{ active: selectQuick === index && !isCustom }"
					@click="selectQuickItem(index, item)"
				>
					<view class="quick-num">{{ item }}</view>
					<view class="quick-unit">积分</view>
				</view>
				<view class="quick-item custom-item" :class="customItemClass" @click="selectCustom">
					<input
						class="custom-input-inner custom-input--hide"
						type="number"
						v-model="pay.money"
						placeholder=""
						placeholder-class="input-placeholder"
						:focus="customInputFocus"
					/>
					<text class="custom-unit custom-input--hide">积分</text>
					<text class="custom-text custom-label--show">自定义</text>
				</view>
			</view>

			<view class="section-title">支付方式</view>
			<view class="pay-type-list">
				<view
					class="pay-type-item"
					v-for="(item, index) in TypeList"
					:key="index"
					:class="{ active: pay.type === item.value }"
					@click="TypeSelect(item)"
				>
					<image
						class="pay-icon"
						:src="item.value === 'wx' ? '/static/icons/wx.svg' : '/static/icons/zfb.svg'"
						mode="aspectFit"
					></image>
					<view class="pay-info">
						<text class="pay-name">{{ item.name }}</text>
					</view>
					<view class="check-circle">
						<u-icon v-if="pay.type === item.value" name="checkbox-mark" color="#0173de" size="28"></u-icon>
					</view>
				</view>
			</view>

			<view class="btn-wrap">
				<u-button
					type="primary"
					text="立即充值"
					formType="submit"
					@click="submit"
					shape="circle"
					size="large"
					:customStyle="{ background: 'var(--zl-gradient)', height: '96rpx' }"
				></u-button>
			</view>
		</view>

		<u-toast ref="notice"></u-toast>
	</view>
</template>

<script>
import { checkLogin, getUserInfo } from '@/utils/auth.js'

export default {
	onLoad() {
		if (!checkLogin()) return

		this.business = getUserInfo()

		if (this.business && this.business.point !== undefined) {
			this.pay.current = this.business.point || 0
		}
	},
	data() {
		return {
			business: {},
			message: '积分可用于悬赏提问，平台提供各种充值优惠',
			selectQuick: null,
			isCustom: false,
			quickList: [10, 30, 50, 100, 200, 500],
			TypeList: [
				{ name: '微信支付', value: 'wx' },
				{ name: '支付宝支付', value: 'zfb' }
			],
			pay: {
				current: 0,
				money: '',
				type: 'wx',
				type_text: '微信支付'
			}
		}
	},
	computed: {
		isCustomMode() {
			return this.isCustom
		},
		customItemClass() {
			return this.isCustom ? 'active' : ''
		},
		customInputFocus() {
			return this.isCustom
		}
	},

	methods: {
		selectQuickItem(index, value) {
			this.selectQuick = index
			this.isCustom = false
			this.pay.money = String(value)
		},
		selectCustom() {
			this.pay.money = ''
			// 延迟切换状态，等待快捷选项的 active 样式先清除，避免过渡抖动
			setTimeout(() => {
				this.isCustom = true
			}, 50)
		},
		TypeSelect(item) {
			this.pay.type = item.value
			this.pay.type_text = item.name
		},
		async submit() {
			if (!checkLogin()) return

			if (!this.pay.money) {
				uni.$toast.error('请选择或输入充值积分')
				return
			}

			const num = Number(this.pay.money)
			if (isNaN(num) || num <= 0) {
				uni.$toast.error('请输入有效的积分数量')
				return
			}

			try {
				const data = {
					busid: this.business.id,
					money: this.pay.money,
					paytype: this.pay.type
				}

				const result = await uni.$u.http.post('/pay/pay', data)

				if (result.code == 0) {
					uni.$toast.error(result.msg)
					return false
				}

				uni.$toast.success(result.msg)

				// 后端返回格式不固定：可能是跳转URL、HTML表单、错误信息或支付参数对象
				if (typeof result.data === 'string') {
					if (result.data.indexOf('Not Found') !== -1 || result.data.indexOf('404') !== -1) {
						uni.$toast.error('支付服务维护中，请稍后重试')
					} else if (result.data.indexOf('http') === 0) {
						// H5支付：直接跳转支付链接
						// #ifdef H5
						window.location.href = result.data
						// #endif
					} else if (result.data.indexOf('<form') !== -1 || result.data.indexOf('<!DOCTYPE') !== -1) {
						// H5支付表单：使用 iframe 承载避免 document.write 销毁应用状态
						// #ifdef H5
						const iframe = document.createElement('iframe')
						iframe.style.cssText =
							'position:fixed;top:0;left:0;width:100%;height:100%;border:none;z-index:99999;background:#fff'
						iframe.srcdoc = result.data
						document.body.appendChild(iframe)
						// #endif
					} else {
						uni.$toast.error('支付参数异常')
					}
				} else if (typeof result.data === 'object' && result.data !== null) {
					uni.$toast.info('请使用对应平台完成支付')
				}

				// #ifdef MP-WEIXIN || APP-PLUS
				uni.$toast.info('请在对应平台完成支付')
				// #endif
			} catch (error) {
				console.error('pay submit error:', error)
				uni.$toast.error('支付请求失败，请稍后重试')
			}
		}
	}
}
</script>

<style lang="scss">
.container {
	background-color: #f5f7fa;
	min-height: 100vh;
}

.header {
	padding: 60rpx 40rpx 80rpx;
	background: $zl-gradient;
	position: relative;

	&::after {
		content: '';
		position: absolute;
		bottom: -50rpx;
		left: 0;
		width: 100%;
		height: 100rpx;
		background: #f5f7fa;
		border-radius: 50% 50% 0 0;
	}

	.balance-card {
		text-align: center;
		color: white;
		position: relative;
		z-index: 1;

		.balance-label {
			font-size: 26rpx;
			opacity: 0.85;
			margin-bottom: 16rpx;
			letter-spacing: 2rpx;
		}

		.balance-value {
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 64rpx;
			font-weight: bold;
			line-height: 1.2;
		}
	}
}

.form-card {
	margin: -40rpx 30rpx 0;
	padding: 36rpx 30rpx;
	background: white;
	border-radius: 24rpx;
	box-shadow: 0 8rpx 40rpx rgba(0, 0, 0, 0.06);
	position: relative;
	z-index: 2;
}

.section-title {
	font-size: 28rpx;
	font-weight: 600;
	color: #303133;
	margin-top: 36rpx;
	margin-bottom: 20rpx;
	padding-left: 8rpx;
}

.quick-list {
	display: flex;
	flex-wrap: wrap;
	gap: 16rpx;

	.quick-item {
		width: 31%;
		height: 120rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		border-radius: 16rpx;
		border: 2rpx solid #e8e8e8;
		background: #fafafa;
		transition: all 0.25s ease;

		&.active {
			border-color: #0173de;
			background: linear-gradient(135deg, rgba(1, 115, 222, 0.06), rgba(76, 217, 100, 0.08));
			transform: scale(1.02);

			.quick-num {
				color: #0173de;
				font-weight: bold;
			}
		}

		&:active {
			transform: scale(0.97);
		}

		.quick-num {
			font-size: 38rpx;
			font-weight: 600;
			color: #303133;
			line-height: 1.2;
		}

		.quick-unit {
			font-size: 22rpx;
			color: #909399;
			margin-top: 6rpx;
		}

		&.custom-item {
			.custom-text {
				font-size: 28rpx;
				color: #909399;
				font-weight: 500;
			}

			/* 默认状态：隐藏输入框和积分，显示自定义文字 */
			.custom-input--hide {
				display: none;
			}
			.custom-label--show {
				display: inline;
			}

			/* 选中后：显示输入框和积分，隐藏自定义文字 */
			&.active {
				.custom-input--hide {
					display: block;
				}
				.custom-label--show {
					display: none;
				}

				.custom-input-inner {
					width: 100%;
					text-align: center;
					font-size: 38rpx;
					font-weight: 600;
					color: #0173de;
					background: transparent;
				}

				.custom-unit {
					display: block;
					margin-top: 6rpx;
					font-size: 22rpx;
					color: #0173de;
				}
			}
		}
	}
}

.pay-type-list {
	.pay-type-item {
		display: flex;
		align-items: center;
		padding: 24rpx 20rpx;
		border-radius: 16rpx;
		margin-bottom: 16rpx;
		border: 2rpx solid #e8e8e8;
		transition: all 0.25s ease;

		&.active {
			border-color: #0173de;
			background: linear-gradient(135deg, rgba(1, 115, 222, 0.04), rgba(76, 217, 100, 0.06));
		}

		&:last-child {
			margin-bottom: 0;
		}

		.pay-icon {
			width: 56rpx;
			height: 56rpx;
			margin-right: 20rpx;
			flex-shrink: 0;
		}

		.pay-info {
			flex: 1;

			.pay-name {
				font-size: 30rpx;
				color: #303133;
				font-weight: 500;
			}
		}

		.check-circle {
			width: 44rpx;
			height: 44rpx;
			border-radius: 50%;
			border: 2rpx solid #dcdfe6;
			display: flex;
			align-items: center;
			justify-content: center;
			transition: all 0.25s ease;

			.active & {
				border-color: #0173de;
				background: #0173de;
			}
		}
	}
}

.btn-wrap {
	margin-top: 48rpx;
	padding-bottom: 20rpx;
}
</style>
