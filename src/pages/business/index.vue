<template>
	<view class="container">
		<view class="user">
			<view class="avatar">
				<!-- #ifdef H5 || APP-PLUS -->
				<image v-if="!isLogin" src="/static/icons/zl.svg"></image>
				<image v-else :src="userInfo.avatar_text"></image>
				<!-- #endif -->

				<!-- #ifdef MP-WEIXIN -->
				<image v-if="isLogin && userInfo.avatar" :src="userInfo.avatar_text"></image>
				<open-data v-else type="userAvatarUrl"></open-data>
				<!-- #endif -->
			</view>

			<!-- <view class="nickname">{{isLogin ? userInfo.nickname : '未登录'}}</view> -->

			<!-- #ifdef H5 || APP-PLUS -->
			<button v-if="!isLogin" class="login" @click="signin">登录</button>
			<!-- #endif -->

			<!-- #ifdef MP-WEIXIN -->
			<button v-if="!isLogin" class="login" @click="login">授权登录</button>
			<!-- #endif -->
		</view>

		<view v-if="isLogin">
			<view class="asset-card">
				<view class="asset-item" @click="navTo('/pages-business/pay')">
					<view class="value">{{ userInfo.score || 0 }}</view>
					<view class="label">我的积分</view>
				</view>
				<view class="asset-divider"></view>
				<view class="asset-item" @click="navTo('/pages-business/follow')">
					<view class="value">{{ userInfo.follow_count || 0 }}</view>
					<view class="label">我的关注</view>
				</view>
				<view class="asset-divider"></view>
				<view class="asset-item" @click="navTo('/pages-business/follow?tab=fans')">
					<view class="value">{{ userInfo.fans_count || 0 }}</view>
					<view class="label">我的粉丝</view>
				</view>
			</view>

			<view class="grid-menu">
				<u-grid :border="false" col="2">
					<u-grid-item @click="navTo('/pages-business/user')">
						<u-icon name="account" :size="26" color="#ff9900"></u-icon>
						<text class="grid-text">个人主页</text>
					</u-grid-item>
					<u-grid-item @click="navTo('/pages-business/profile')">
						<u-icon name="edit-pen" :size="26" color="#0173de"></u-icon>
						<text class="grid-text">基本资料</text>
					</u-grid-item>
					<u-grid-item @click="navTo('/pages-business/checkin')">
						<u-icon name="calendar" :size="26" color="#19be6b"></u-icon>
						<text class="grid-text">每日签到</text>
					</u-grid-item>
					<u-grid-item @click="confirmLogout">
						<u-icon name="share-square" :size="26" color="#909399"></u-icon>
						<text class="grid-text">退出登录</text>
					</u-grid-item>
				</u-grid>
			</view>
		</view>

		<view v-else>
			<view class="asset-card" @click="toast">
				<view class="asset-item">
					<view class="value">--</view>
					<view class="label">我的积分</view>
				</view>
				<view class="asset-divider"></view>
				<view class="asset-item">
					<view class="value">--</view>
					<view class="label">我的关注</view>
				</view>
				<view class="asset-divider"></view>
				<view class="asset-item">
					<view class="value">--</view>
					<view class="label">我的粉丝</view>
				</view>
			</view>

			<view class="grid-menu">
				<u-grid :border="false" col="2">
					<u-grid-item @click="toast">
						<u-icon name="account" :size="26" color="#ff9900"></u-icon>
						<text class="grid-text">个人主页</text>
					</u-grid-item>
					<u-grid-item @click="toast">
						<u-icon name="edit-pen" :size="26" color="#0173de"></u-icon>
						<text class="grid-text">基本资料</text>
					</u-grid-item>
					<u-grid-item @click="toast">
						<u-icon name="calendar" :size="26" color="#19be6b"></u-icon>
						<text class="grid-text">每日签到</text>
					</u-grid-item>
				</u-grid>
			</view>
		</view>

		<u-toast ref="notice"></u-toast>
	</view>
</template>

<script>
import { mapState, mapActions } from 'vuex'
import { dedupeById } from '@/utils/dedupe.js'

export default {
	data() {
		return {}
	},
	computed: {
		...mapState(['userInfo', 'isLogin'])
	},
	onShow() {
		if (this.isLogin) {
			this.refreshUserInfo()
			this.fetchFollowData()
		}
	},
	methods: {
		...mapActions(['logout']),
		navTo(url) {
			uni.navigateTo({ url })
		},
		async refreshUserInfo() {
			if (!this.isLogin) return
			try {
				const res = await uni.$u.http.post('/user/info', { busid: this.userInfo.id })
				if (res.code === 1 && res.data.business) {
					const updated = {
						...res.data.business,
						follow_count: this.userInfo.follow_count || 0,
						fans_count: this.userInfo.fans_count || 0
					}
					this.$store.dispatch('loginSuccess', updated)
				}
			} catch (error) {
				console.error('refreshUserInfo error:', error)
			}
		},
		async fetchFollowData() {
			if (!this.isLogin || !this.userInfo.id) return

			try {
				const busid = this.userInfo.id

				const followRes = await uni.$u.http.post('/user/myattention', { busid }, { custom: { toast: false } })
				if (followRes.code === 1) {
					this.$set(this.userInfo, 'follow_count', dedupeById(followRes.data).length)
				}

				const fansRes = await uni.$u.http.post('/user/myfans', { busid }, { custom: { toast: false } })
				if (fansRes.code === 1) {
					this.$set(this.userInfo, 'fans_count', dedupeById(fansRes.data).length)
				}
			} catch (error) {
				console.error('fetchFollowData error:', error)
			}
		},
		signin() {
			uni.$u.route({
				url: '/pages-business/login',
				params: { openid: 'h5' }
			})
		},
		async login() {
			//微信小程序登录
			uni.login({
				provider: 'weixin',
				success: async res => {
					try {
						//先获取code凭证
						const code = res.code ? res.code : ''

						if (!code) {
							uni.$toast.error('获取登录临时凭证失败')
							return false
						}

						//有code就发送请求
						const result = await uni.$u.http.post('/business/login', { code })

						if (result.code == 0) {
							uni.$toast.error(result.msg)
							return false
						}

						const openid = result.data.Openid ? result.data.Openid : ''

						if (openid) {
							// 首次登录：返回 openid 但无用户信息，跳转绑定页绑定手机号
							uni.$toast.success(result.msg, {
								complete: () => {
									uni.$u.route({
										url: result.url,
										params: { openid: openid }
									})
								}
							})
						} else {
							// 已绑定：返回完整用户信息，直接登录成功
							this.$store.dispatch('loginSuccess', result.data)

							uni.$toast.success(result.msg, {
								complete: () => {
									uni.$u.route({ type: 'navigateBack', delta: 1 })
								}
							})
						}
					} catch (error) {
						console.error('login error:', error)
						uni.$toast.error('登录失败，请稍后重试')
					}
				},
				fail: res => {
					console.error('login fail:')
					console.error('login fail detail:', res)
					uni.$toast.error('微信登录失败')
				}
			})
		},
		confirmLogout() {
			uni.showModal({
				title: '退出提醒',
				content: '是否确认退出',
				success: res => {
					if (res.confirm) {
						this.logout()
					}
				}
			})
		},
		toast() {
			uni.$toast.error('请先登录访问')
		}
	}
}
</script>

<style lang="scss">
.container {
	background-color: $zl-bg-color;
	min-height: 100vh;
}

.user {
	width: 100%;
	padding: 60rpx 0;
	display: flex;
	flex-direction: column;
	align-items: center;
	background: $zl-gradient;
	color: white;
}

.avatar {
	width: 160rpx;
	height: 160rpx;
	border-radius: $uni-border-radius-circle;
	overflow: hidden;
	border: 4rpx solid rgba(255, 255, 255, 0.3);
	box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
}

.avatar image {
	width: 100%;
	height: 100%;
}

.nickname {
	font-size: $uni-font-size-lg;
	font-weight: bold;
	margin: 20rpx 0;
}

.login {
	width: 240rpx !important;
	color: $zl-primary;
	background-color: white;
	margin-top: 20rpx;
	font-size: $uni-font-size-base;
	border-radius: 40rpx;
	border: none;
}

.asset-card {
	display: flex;
	background-color: white;
	margin: -40rpx 30rpx 0;
	padding: 30rpx 0;
	border-radius: 16rpx;
	box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
	position: relative;
	z-index: 1;

	.asset-item {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;

		.value {
			font-size: 36rpx;
			font-weight: bold;
			color: $zl-primary;
			margin-bottom: 8rpx;
		}

		.label {
			font-size: 24rpx;
			color: $uni-text-color-grey;
		}
	}

	.asset-divider {
		width: 1rpx;
		height: 60rpx;
		background-color: #eee;
		align-self: center;
	}
}

.grid-menu {
	background-color: white;
	margin: 20rpx 30rpx;
	padding: 30rpx 20rpx;
	border-radius: 16rpx;

	::v-deep .u-grid-item {
		padding: 30rpx 0 !important;
	}

	.grid-text {
		font-size: 26rpx;
		color: $uni-text-color;
		margin-top: 16rpx;
	}
}
</style>
