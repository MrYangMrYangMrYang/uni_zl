<template>
	<view class="content">
		<u-notice-bar :text="message"></u-notice-bar>

		<JCalendar :yearMonth="current" :dataSource="list" @dateChange="getData" @clickChange="clickSign"></JCalendar>

		<view class="count">
			<view>
				本月累积打卡
				<text class="sum">{{ list.length }}</text>
				天，请再接再厉，继续努力!
			</view>
		</view>
	</view>
</template>

<script>
import JCalendar from './components/calendar/j-calendar.vue'
import { authMixin } from '@/mixins/authMixin'

export default {
	mixins: [authMixin],

	components: {
		JCalendar
	},
	created() {
		this.getData(this.current)
	},
	data() {
		return {
			message: '每日签到可以获得超值优惠大奖，并且会获得相应积分',
			current: this.getCurrentMonth(),
			list: []
		}
	},
	methods: {
		getCurrentMonth() {
			const now = new Date()
			return now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0')
		},
		async clickSign(day) {
			if (this.list.includes(day)) {
				uni.$toast.error('今日已签到，请勿重复签到')
				return
			}

			uni.$toast.loading('签到中...')

			try {
				const userInfo = this.currentUser
				const result = await uni.$u.http.post('/checkin/sign', {
					busid: userInfo.id,
					date: day
				})

				if (result.code == 0) {
					uni.$toast.hideLoading()
					uni.$toast.error(result.msg)
					return
				}

				this.list.push(day)
				uni.$toast.successAndNavigate('签到成功，积分 +5', '/pages/business/index', true)
			} catch (error) {
				console.error('clickSign error:', error)
				// 后端接口未实现时的友好提示
				if (
					error.statusCode === 404 ||
					(error.data && typeof error.data === 'string' && error.data.indexOf('Not Found') !== -1)
				) {
					uni.$toast.error('签到功能暂未开放')
				} else {
					uni.$toast.error('签到失败，请稍后重试')
				}
			}
		},
		async getData(date) {
			try {
				const userInfo = this.currentUser
				if (!userInfo.id) {
					this.list = []
					return
				}

				const result = await uni.$u.http.post(
					'/checkin/list',
					{
						busid: userInfo.id,
						month: date
					},
					{ custom: { toast: false } }
				)

				if (result.code == 1 && result.data) {
					this.list = result.data
				} else {
					this.list = []
				}
			} catch (error) {
				console.error('getData error:', error)
				this.list = []
			}
		}
	}
}
</script>

<style lang="scss">
.content {
	background-color: $zl-bg-color;
	min-height: 100vh;
	padding-bottom: 40rpx;
}

.count {
	margin: 30rpx;
	padding: 40rpx;
	background-color: white;
	border-radius: 20rpx;
	box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
	text-align: center;
	font-size: $uni-font-size-base;
	color: $uni-text-color;

	.sum {
		color: #f56c6c;
		font-size: 48rpx;
		font-weight: bold;
		margin: 0 10rpx;
	}

	view {
		line-height: 1.6;
	}
}
</style>
