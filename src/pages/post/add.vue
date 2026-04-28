<template>
	<view class="page-container">
		<!-- 头部区域：渐变背景 + 标题描述 -->
		<view class="header-section">
			<view class="header-content">
				<text class="header-title">发布提问</text>
				<text class="header-desc">描述您的问题，让社区的小伙伴来帮您解答</text>
			</view>
		</view>
	  
		<!-- 表单区域 -->
		<view class="form-section">
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

			<!-- 分类选择项：点击弹出选择器 -->
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
			<u-picker :show="CateShow" :columns="CateData" keyName="name" @cancel="CateShow = false" @confirm="CateCheck"></u-picker>

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

			<!-- 提交按钮：渐变主题色 -->
			<view class="submit-btn">
				<u-button type="primary" shape="circle" text="发布提问" formType="submit" @click="submit" size="large" :customStyle="{background: 'linear-gradient(135deg, #0173de, #4cd964)'}"></u-button>
			</view>
		</view>

		<u-toast ref="notice"></u-toast>
	</view>
</template>

<script>
/**
 * post/add.vue - 发布提问页
 *
 * 功能说明：
 * - 填写提问标题、问题描述、选择分类、设置悬赏积分
 * - 分类数据从后端动态加载
 * - 表单手动验证（标题/内容/分类/积分非空校验）
 * - 发布成功后自动跳转到帖子详情页
 */
import { checkLogin, getUserInfo } from '@/utils/auth.js'

export default {
	/**
	 * 页面生命周期 - onLoad
	 * 获取当前用户信息并加载分类列表
	 */
	onLoad() {
		this.business = getUserInfo()
		this.CateList()
	},

	data() {
		return {
			business: {},             // 当前登录用户信息
			CateShow: false,          // 分类选择器是否显示
			CateData: [[]],           // 分类选择器数据源（二维数组格式）
			post: {                   // 帖子表单数据
				title: '',            // 提问标题
				content: '',          // 问题描述
				point: '',            // 悬赏积分
				cateid: '',           // 分类ID（提交用）
				cate: ''              // 分类名称（显示用）
			}
		}
	},

	methods: {
		/**
		 * 加载分类列表数据
		 * 从后端获取所有帖子分类，供选择器使用
		 * @returns {Promise<void>}
		 */
		async CateList() {
			try {
				var result = await uni.$u.http.post('/post/cate')

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

		/**
		 * 分类选择确认回调
		 * 将选中的分类名称和ID分别保存到表单数据中
		 * @param {object} e - 选择器返回的对象 {value: [{name, id}]}
		 */
		CateCheck(e) {
			this.CateShow = false
			this.post.cate = e.value[0].name
			this.post.cateid = e.value[0].id
		},

		/**
		 * 表单提交处理函数
		 * 流程：手动验证各字段 → 登录检查 → 组装数据 → 发送请求 → 跳转详情页
		 */
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

			this.post.busid = this.business.id

			uni.$u.http.post('/post/add', this.post)
				.then(result => {
					if (result.code == 0) {
						uni.$toast.error(result.msg)
						return false
					}

					uni.$toast.successAndNavigate(result.msg, result.url, false, { postid: result.data.postid })
				})
				.catch(error => {
					uni.$toast.error('发布失败，请稍后重试')
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

	/* 头部区域 */
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

	/* 表单区域 */
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