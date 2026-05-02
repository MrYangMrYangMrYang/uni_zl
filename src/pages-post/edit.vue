<template>
	<view class="page-container">
		<!-- 头部区域：渐变背景 + 标题描述 -->
		<view class="header-section">
			<view class="header-content">
				<text class="header-title">修改提问</text>
				<text class="header-desc">更新您的问题信息，让更多小伙伴来帮您解答</text>
			</view>
		</view>

		<!-- 表单区域 -->
		<view class="form-section" v-if="loaded">
			<!-- 标题输入项 -->
			<view class="form-item">
				<text class="form-label">提问标题</text>
				<u--input
					v-model="post.title"
					placeholder="请输入提问标题，让更多人看到"
					border="surround"
				></u--input>
			</view>

			<!-- 描述输入项：多行文本域 -->
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

			<!-- 分类选择项 -->
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

			<!-- 分类选择器弹出面板 -->
			<u-picker :defaultIndex="CateDefault" :show="CateShow" :columns="CateData" keyName="name" @cancel="CateShow = false" @confirm="CateCheck"></u-picker>

			<!-- 积分输入项 -->
			<view class="form-item">
				<text class="form-label">悬赏积分</text>
				<u--input
					v-model="post.point"
					placeholder="请输入悬赏积分"
					border="surround"
					type="number"
				>
					<template slot="suffix">
						<text class="point-unit">积分</text>
					</template>
				</u--input>
			</view>

			<!-- 提交按钮 -->
			<view class="submit-btn">
				<u-button type="primary" shape="circle" text="提交修改" formType="submit" @click="submit" size="large" :loading="submitting" :customStyle="{background: 'linear-gradient(135deg, #0173de, #4cd964)'}"></u-button>
			</view>
		</view>

		<!-- 加载状态 -->
		<view v-else class="loading-wrap">
			<u-loading-icon mode="circle" size="40"></u-loading-icon>
			<text class="loading-text">加载中...</text>
		</view>

		<u-toast ref="notice"></u-toast>
	</view>
</template>

<script>
/**
 * post/edit.vue - 修改提问（编辑帖子）
 *
 * 功能说明：
 * - 加载已有帖子数据并回填表单
 * - 修改标题、描述、分类、悬赏积分
 * - 分类选择器自动定位到当前分类
 * - 手动表单验证
 * - 修改成功后自动跳转到帖子详情页
 */
import { checkLogin, getUserInfo } from '@/utils/auth.js'

export default {
	onLoad(option) {
		if (!checkLogin(false)) {
			uni.$u.route({ type: 'navigateBack', delta: 1 })
			return
		}

		this.business = getUserInfo()
		var postid = option.postid ? option.postid : 0
		this.postid = postid

		this.initData()
	},

	data() {
		return {
			postid: 0,
			business: {},
			CateShow: false,
			CateData: [[]],
			CateDefault: [0],
			submitting: false,
			loaded: false,
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
		async initData() {
			try {
				await this.CateList()
				await this.PostData()
			} catch (error) {
				console.error('initData error:', error)
				uni.$toast.error('页面加载失败，请返回重试')
			}
			this.loaded = true
		},

		async CateList() {
			try {
				var result = await uni.$u.http.post('/post/cate')

				if (result.code == 0) {
					uni.$toast.error(result.msg)
					return false
				}

				this.CateData = [result.data]
			} catch (error) {
				console.error('CateList error:', error)
				uni.$toast.error('加载失败，请稍后重试')
			}
		},

		async PostData() {
			try {
				var result = await uni.$u.http.post('/post/info', { postid: this.postid })

				if (result.code == 0) {
					uni.$toast.error(result.msg, {
						complete: () => {
							uni.$u.route({ type: 'navigateBack', delta: 1 })
						}
					})
					return false
				}

				this.post = result.data.post
				this.post.cate = result.data.post.category.name

				this.CateData[0].map((item, index) => {
					if (item.id == this.post.cateid) {
						this.CateDefault = [index]
					}
				})
			} catch (error) {
				console.error('PostData error:', error)
				uni.$toast.error('加载失败，请稍后重试')
			}
		},

		CateCheck(e) {
			this.CateShow = false
			this.post.cate = e.value[0].name
			this.post.cateid = e.value[0].id
		},

		submit() {
			if (!this.post.title || !this.post.title.trim()) {
				uni.$toast.error('请填写提问标题')
				return
			}
			if (!this.post.content || !this.post.content.trim()) {
				uni.$toast.error('请描述一下问题的详细内容')
				return
			}
			if (!this.post.cateid) {
				uni.$toast.error('请选择正确的提问分类')
				return
			}
			if (!this.post.point || isNaN(this.post.point)) {
				uni.$toast.error('请填写正确的悬赏积分')
				return
			}

			if (!checkLogin()) return

			this.submitting = true

			var currentPostid = this.postid

			uni.$u.http.post('/post/edit', this.post)
				.then(result => {
					this.submitting = false

					if (result.code == 0) {
						uni.$toast.error(result.msg)
						return false
					}

					uni.$toast.successAndBack('修改成功')
				})
				.catch(error => {
					this.submitting = false
					uni.$toast.error('提交失败，请稍后重试')
				})
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
		margin-top: -20rpx;
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

	.loading-wrap {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding-top: 200rpx;
		gap: 16rpx;
	}

	.loading-text {
		font-size: 26rpx;
		color: #999;
	}
</style>
