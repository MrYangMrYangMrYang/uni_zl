<template>
	<view class="page-container">
		<view class="header-section">
			<view class="header-content">
				<text class="header-title">{{ mode === 'create' ? '发布提问' : '修改提问' }}</text>
				<text class="header-desc">
					{{
						mode === 'create'
							? '描述您的问题，让社区的小伙伴来帮您解答'
							: '更新您的问题信息，让更多小伙伴来帮您解答'
					}}
				</text>
			</view>
		</view>

		<!-- 编辑模式：数据未加载完成时显示 spinner -->
		<view v-if="mode === 'edit' && !loaded" class="loading-wrap">
			<u-loading-icon mode="circle" size="40"></u-loading-icon>
			<text class="loading-text">加载中...</text>
		</view>

		<view class="form-section" v-else>
			<u--form labelPosition="top" :model="post" :rules="rules" ref="postForm">
				<view class="form-item">
					<text class="form-label">提问标题</text>
					<u-form-item prop="title" borderBottom>
						<u--input
							v-model="post.title"
							placeholder="请输入提问标题，让更多人看到"
							border="surround"
							maxlength="50"
							clearable
						></u--input>
					</u-form-item>
				</view>

				<view class="form-item">
					<text class="form-label">问题描述</text>
					<u-form-item prop="content" borderBottom>
						<u--textarea
							v-model="post.content"
							placeholder="请详细描述您的问题，便于他人理解并提供帮助"
							height="200"
							count
							maxlength="500"
							border="surround"
						></u--textarea>
					</u-form-item>
				</view>

				<view class="form-item" @click="CateShow = true">
					<text class="form-label">问题分类</text>
					<u-form-item prop="cateid" borderBottom>
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
					</u-form-item>
				</view>

				<u-picker
					:defaultIndex="CateDefault"
					:show="CateShow"
					:columns="CateData"
					keyName="name"
					@cancel="CateShow = false"
					@confirm="CateCheck"
				></u-picker>

				<view class="form-item">
					<text class="form-label">悬赏积分</text>
					<u-form-item prop="point" borderBottom>
						<u--input v-model="post.point" placeholder="请输入悬赏积分" border="surround" type="number">
							<template slot="suffix">
								<text class="point-unit">积分</text>
							</template>
						</u--input>
					</u-form-item>
				</view>
			</u--form>

			<view class="submit-btn">
				<u-button
					type="primary"
					shape="circle"
					:text="mode === 'create' ? '发布提问' : '提交修改'"
					@click="submit"
					size="large"
					:loading="submitting"
					:customStyle="{ background: 'var(--zl-gradient)' }"
				></u-button>
			</view>
		</view>

		<u-toast ref="notice"></u-toast>
	</view>
</template>

<script>
import { authMixin } from '@/mixins/authMixin'

export default {
	name: 'PostForm',

	mixins: [authMixin],

	props: {
		mode: {
			type: String,
			default: 'create',
			validator: val => ['create', 'edit'].includes(val)
		},
		// 编辑模式下的帖子 ID
		postid: {
			type: [Number, String],
			default: 0
		}
	},

	data() {
		return {
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
			},
			rules: {
				title: [
					{ required: true, message: '请填写提问标题', trigger: ['blur', 'change'] },
					{ min: 5, message: '标题至少需要5个字符', trigger: ['blur', 'change'] }
				],
				content: [
					{ required: true, message: '请描述一下问题的详细内容', trigger: ['blur', 'change'] },
					{ min: 10, message: '问题描述至少需要10个字符', trigger: ['blur', 'change'] }
				]
			}
		}
	},

	created() {
		this.business = this.currentUser
		this.initData()
	},

	methods: {
		async initData() {
			// 编辑模式：加载分类列表 + 当前帖子数据
			if (this.mode === 'edit') {
				try {
					await this.CateList()
					await this.fetchPost()
					this.loaded = true
				} catch (error) {
					console.error('initData error:', error)
					uni.$toast.error('页面加载失败，请返回重试')
				}
			} else {
				// 创建模式：只加载分类列表
				await this.CateList()
			}
		},

		async CateList() {
			try {
				const result = await uni.$u.http.post('/post/cate')

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

		async fetchPost() {
			try {
				const result = await uni.$u.http.post('/post/info', { postid: this.postid })

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

				this.CateData[0].forEach((item, index) => {
					if (item.id == this.post.cateid) {
						this.CateDefault = [index]
					}
				})
			} catch (error) {
				console.error('fetchPost error:', error)
				uni.$toast.error('加载失败，请稍后重试')
			}
		},

		CateCheck(e) {
			this.CateShow = false
			this.post.cate = e.value[0].name
			this.post.cateid = e.value[0].id
		},

		async submit() {
			// uView 表单校验
			try {
				await this.$refs.postForm.validate()
			} catch (errors) {
				// 校验失败：uView 会自动提示第一个错误字段
				return
			}

			if (!this.post.cateid) {
				uni.$toast.error('请选择正确的提问分类')
				return
			}

			const pointVal = Number(this.post.point)
			if (
				this.post.point === '' ||
				this.post.point === undefined ||
				this.post.point === null ||
				isNaN(pointVal) ||
				pointVal < 0 ||
				pointVal > 10
			) {
				uni.$toast.error('悬赏积分必须为0~10之间的整数')
				return
			}

			if (!this.requireLogin(false)) return

			this.submitting = true

			try {
				this.post.busid = this.business.id

				const apiPath = this.mode === 'create' ? '/post/add' : '/post/edit'
				const result = await uni.$u.http.post(apiPath, this.post)

				if (result.code == 0) {
					this.submitting = false
					uni.$toast.error(result.msg)
					return false
				}

				this.submitting = false

				if (this.mode === 'create') {
					this.post = { title: '', content: '', point: '', cateid: '', cate: '' }
					getApp().globalData.needRefreshHome = true
					uni.$toast.successAndNavigate('发布成功', '/pages/index/index', true)
				} else {
					getApp().globalData.needRefreshHome = true
					uni.$toast.successAndBack('修改成功')
				}
			} catch (error) {
				this.submitting = false
				uni.$toast.error(this.mode === 'create' ? '发布失败，请稍后重试' : '提交失败，请稍后重试')
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
		background: $zl-gradient !important;
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
