<template>
	<view class="page-container">
		<view class="header-section">
			<view class="header-content">
				<text class="header-title">发布提问</text>
				<text class="header-desc">描述您的问题，让社区的小伙伴来帮您解答</text>
			</view>
		</view>

		<view class="form-section">
			<view class="form-item">
				<text class="form-label">提问标题</text>
				<u--input
					v-model="post.title"
					placeholder="请输入提问标题，让更多人看到"
					border="surround"
					maxlength="50"
					clearable
				></u--input>
			</view>

			<view class="form-item">
				<text class="form-label">问题描述</text>
				<u--textarea
					v-model="post.content"
					placeholder="请详细描述您的问题，便于他人理解并提供帮助"
					height="200"
					count
					maxlength="500"
					border="surround"
				></u--textarea>
			</view>

			<view class="form-item" @click="CateShow = true">
				<text class="form-label">问题分类</text>
				<u--input
					v-model="post.cate"
					placeholder="请选择问题分类"
					readonly
					border="surround"
					@click.stop="CateShow = true"
				>
					<template slot="suffix">
						<u-icon name="arrow-right" color="#c0c4cc" size="16"></u-icon>
					</template>
				</u--input>
			</view>

			<u-picker
				:show="CateShow"
				:columns="CateData"
				keyName="name"
				@cancel="CateShow = false"
				@confirm="CateCheck"
			></u-picker>

			<view class="form-item">
				<text class="form-label">悬赏积分</text>
				<u--input v-model="post.point" placeholder="请输入悬赏积分" border="surround" type="number">
					<template slot="suffix">
						<text class="point-unit">积分</text>
					</template>
				</u--input>
			</view>

			<view class="submit-btn">
				<u-button
					type="primary"
					shape="circle"
					text="发布提问"
					formType="submit"
					@click="submit"
					size="large"
					:customStyle="{ background: 'linear-gradient(135deg, #0173de, #4cd964)' }"
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
		this.business = getUserInfo()
		this.CateList()
	},

	data() {
		return {
			business: {},
			CateShow: false,
			CateData: [[]],
			post: {
				title: '',
				content: '',
				point: '',
				cateid: '',
				cate: ''
			}
		}
	},

	methods: {
		async CateList() {
			try {
				const result = await uni.$u.http.post('/post/cate')

				if (result.code == 0) {
					uni.$toast.error(result.msg)
					return false
				}

				// uView picker 组件要求二维数组格式
				this.CateData = [result.data]
			} catch (error) {
				console.error('CateList error:', error)
				uni.$toast.error('加载失败，请稍后重试')
			}
		},

		CateCheck(e) {
			this.CateShow = false
			this.post.cate = e.value[0].name
			this.post.cateid = e.value[0].id
		},

		async submit() {
			const title = (this.post.title || '').trim()
			const content = (this.post.content || '').trim()
			const point = Number(this.post.point)

			if (!title) {
				uni.$toast.error('请填写提问标题')
				return
			}
			if (title.length < 5) {
				uni.$toast.error('标题至少需要5个字符')
				return
			}
			if (!content) {
				uni.$toast.error('请描述一下问题的详细内容')
				return
			}
			if (content.length < 10) {
				uni.$toast.error('问题描述至少需要10个字符')
				return
			}
			if (!this.post.cateid) {
				uni.$toast.error('请选择正确的提问分类')
				return
			}
			if (isNaN(point) || point < 0) {
				uni.$toast.error('悬赏积分必须为非负整数')
				return
			}
			if (point > 10000) {
				uni.$toast.error('悬赏积分不能超过10000')
				return
			}

			if (!checkLogin()) return

			this.post.busid = this.business.id

			try {
				const result = await uni.$u.http.post('/post/add', this.post)

				if (result.code == 0) {
					uni.$toast.error(result.msg)
					return false
				}

				getApp().globalData.needRefreshHome = true
				uni.$toast.successAndNavigate('发布成功', '/pages/index/index', true)
			} catch (error) {
				uni.$toast.error('发布失败，请稍后重试')
			}
		}
	}
}
</script>

<style lang="scss">
.page-container {
	min-height: 100vh;
	background-color: #f5f7fa;
}

.header-section {
	background: $zl-gradient;
	padding: 40rpx 40rpx 60rpx;
	position: relative;
	overflow: hidden;

	&::before {
		content: '';
		position: absolute;
		top: -50%;
		right: -20%;
		width: 400rpx;
		height: 400rpx;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 50%;
	}

	&::after {
		content: '';
		position: absolute;
		bottom: -30%;
		left: -10%;
		width: 300rpx;
		height: 300rpx;
		background: rgba(255, 255, 255, 0.08);
		border-radius: 50%;
	}
}

.header-content {
	position: relative;
	z-index: 1;
}

.header-title {
	font-size: 44rpx;
	font-weight: bold;
	color: #fff;
	display: block;
	margin-bottom: 16rpx;
}

.header-desc {
	font-size: 26rpx;
	color: rgba(255, 255, 255, 0.9);
	line-height: 1.5;
}

.form-section {
	padding: 30rpx;
}

.form-item {
	background: #fff;
	border-radius: 16rpx;
	padding: 30rpx;
	margin-bottom: 20rpx;
	box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);

	.form-label {
		font-size: 32rpx;
		font-weight: 600;
		color: #303133;
		display: block;
		margin-bottom: 20rpx;
	}

	:deep(.u-input) {
		background: #f5f7fa;
		border-radius: 12rpx;
	}

	:deep(.u-textarea) {
		background: #f5f7fa;
		border-radius: 12rpx;
	}
}

.point-unit {
	font-size: 26rpx;
	color: #909399;
	margin-left: 8rpx;
}

.submit-btn {
	margin-top: 40rpx;
	padding: 0 40rpx;

	:deep(.u-button) {
		background: linear-gradient(135deg, #0173de, #4cd964) !important;
		box-shadow: 0 8rpx 24rpx rgba(1, 115, 222, 0.35);
		font-size: 32rpx;
		font-weight: 600;
		height: 90rpx;
	}
}
</style>
