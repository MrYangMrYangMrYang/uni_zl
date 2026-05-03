<template>
	<!-- 个人主页根容器：浅灰背景色 -->
	<view class="content">
		<!-- 头部区域：用户信息 + 统计数据 + 标签栏 -->
		<view class='header' v-if="business">
			<!-- 用户基本信息区域 -->
			<view class='person'>
				<!-- 左侧：头像 + 昵称 + 简介 -->
				<view class="info">
					<!-- 头像外层容器 -->
					<view class="avatar-wrapper">
						<!-- 头像内层容器：圆形带边框 -->
						<view class="avatar">
							<!-- 条件编译：H5或APP环境显示用户头像图片 -->
							<!-- #ifdef H5 || APP-PLUS -->
								<!-- 头像图片：优先使用用户头像，无则使用默认Logo -->
								<image :src="business.avatar_text || '/static/logo.png'" mode="aspectFill"></image>
							<!-- #endif -->

							<!-- 条件编译：微信小程序环境（处理空值情况） -->
							<!-- #ifdef MP-WEIXIN -->
								<image :src="(business.avatar && business.avatar) ? business.avatar_text : '/static/logo.png'" mode="aspectFill"></image>
							<!-- #endif -->
						</view>
					</view>

					<!-- 用户文字信息区：昵称 + 简介 -->
					<view class="base">
						<!-- 用户昵称：无昵称时显示默认文本"用户" -->
						<view class="nickname">{{business.nickname || '用户'}}</view>
						<!-- 个人简介：无简介时显示默认文案"这家伙很懒，啥都没写" -->
						<view class="desc">{{business.lable || '这家伙很懒，啥都没写'}}</view>
					</view>

					<!-- 关注按钮区域：仅对非自己的主页显示（需要登录且不是本人） -->
					<view class="btnlist" v-if="business.id != ybusiness.id && ybusiness.hasOwnProperty('id')">
						<u-button
							v-if="attention"
							@click="toggleFollow(busid)"
							type="success"
							icon="man-add"
							text="取消关注"
							size="small"
							:customStyle="{height: '60rpx', borderRadius: '30rpx', fontSize: '24rpx'}">
						</u-button>
						<u-button
							v-else
							@click="toggleFollow(busid)"
							type="warning"
							icon="man-add"
							text="关注"
							size="small"
							:customStyle="{height: '60rpx', borderRadius: '30rpx', fontSize: '24rpx'}">
						</u-button>
					</view>
				</view>

				<!-- 统计数据卡片：提问数 / 回答数 / 收藏数 -->
				<view class="stats-card">
					<!-- 统计项1：提问数量 -->
					<view class="stat-item" @click="$emit('tab-change', 0)">
						<view class="stat-value">{{business.quest_count || 0}}</view>  <!-- 提问数（无则显示0） -->
						<view class="stat-label">提问</view>  <!-- 标签文本 -->
					</view>
					<!-- 分隔线 -->
					<view class="stat-divider"></view>
					<!-- 统计项2：回答数量 -->
					<view class="stat-item" @click="$emit('tab-change', 1)">
						<view class="stat-value">{{business.answer_count || 0}}</view>  <!-- 回答数 -->
						<view class="stat-label">回答</view>
					</view>
					<!-- 分隔线 -->
					<view class="stat-divider"></view>
					<!-- 统计项3：收藏数量 -->
					<view class="stat-item" @click="$emit('tab-change', 2)">
						<view class="stat-value">{{business.collect_count || 0}}</view>  <!-- 收藏数 -->
						<view class="stat-label">收藏</view>
					</view>
				</view>
			</view>

			<!-- 页面加载状态：用户数据未加载完成时显示loading动画 -->
			<view class="loading-wrapper" v-if="!business">
				<u-loading-icon mode="circle" size="40"></u-loading-icon>  <!-- 圆形加载动画 -->
				<view style="margin-top: 20rpx; color: #999; font-size: 26rpx;">加载中...</view>  <!-- 加载提示文字 -->
			</view>

			<!-- 标签栏：用于切换"我的提问"、"我的回答"、"我的收藏"三个视图 -->
			<view class='nav' v-if="business">
				<u-tabs
					class="nav-item"
					:list="cate"
					@click="handleTabSwitch"
					lineWidth="75"
					:is-scroll="false"
					:activeStyle="{
						color: '#303133',
						fontWeight: 'bold',
						transform: 'scale(1.05)'
					}"
					:inactiveStyle="{
						color: '#606266',
						transform: 'scale(1)'
					}"
					itemStyle="flex: 1; height: 50px;"
				>
				</u-tabs>
			</view>
		</view>

		<!-- 标签切换时的加载遮罩层：防止用户重复点击并提升用户体验 -->
		<view v-if="switchingTab && business" class="tab-loading-overlay">
			<u-loading-icon mode="circle" size="40"></u-loading-icon>  <!-- 圆形加载动画 -->
			<view style="margin-top: 16rpx; color: #999; font-size: 26rpx;">切换中...</view>  <!-- 切换提示 -->
		</view>

		<!-- ==================== 列表区域1：我的提问 ==================== -->
		<!-- 显示条件：激活了"我的提问"标签 且 用户数据已加载 且 不处于切换状态 -->
		<view class="list-container" v-if="(active == '0' || active == '') && business && !switchingTab">
			<!-- 循环渲染每条提问记录 -->
			<view class="post-card" v-for="(item, index) in questpost" :key="index">
				<!-- 整个卡片可点击：跳转到帖子详情页 -->
				<navigator :url="`/pages-post/info?postid=${item.id}`" class="card-content">
					<!-- 卡片头部：作者信息 + 发布时间 -->
					<view class="card-header">
						<view class="author-info">
							<!-- 作者头像：无则使用默认Logo -->
							<image class="author-avatar" :src="item.business.avatar_text || '/static/logo.png'" mode="aspectFill"></image>
							<!-- 作者昵称 -->
							<text class="author-name">{{item.business.nickname}}</text>
						</view>
						<!-- 发布时间：右对齐 -->
						<view class="post-time">{{item.createtime_text}}</view>
					</view>
					<!-- 卡片主体：标题 + 分类 -->
					<view class="card-body">
						<view class="post-title">{{item.title}}</view>  <!-- 帖子标题 -->
						<view class="post-category">{{item.category.name}}</view>  <!-- 分类名称 -->
					</view>
					<!-- 卡片底部：解决状态 + 悬赏积分 + 回复人数 -->
					<view class="card-footer">
						<!-- 解决状态标签：根据帖子状态动态切换样式和文字 -->
						<view class="status-tag" :class="{solved: item.status == '1' && item.accept}">
							{{item.status == '1' && item.accept ? '已解决' : '未解决'}}  <!-- 已解决/未解决 -->
						</view>
						<!-- 悬赏积分显示 -->
						<view class="reward">
							<text class="reward-icon">￥</text>  <!-- 人民币符号 -->
							<text class="reward-value">{{item.point}}</text>  <!-- 积分数值 -->
						</view>
						<!-- 回复人数统计 -->
						<view class="reply-count">
							<text>{{item.comment_count}}人回复</text>  <!-- 评论数量 -->
						</view>
					</view>
				</navigator>
			</view>
			<!-- 空状态：没有提问数据时显示 -->
			<u-empty v-if="questpost.length === 0" mode="list" text="暂无提问"></u-empty>
			<view class="list-count" v-if="questpost.length > 0">没有更多数据了</view>
		</view>

		<!-- ==================== 列表区域2：我的回答 ==================== -->
		<!-- 显示条件：激活了"我的回答"标签 且 数据已加载 -->
		<view class="list-container" v-if="active == '1' && business && !switchingTab">
			<!-- 循环渲染每条回答记录 -->
			<view class="post-card" v-for="(item, index) in answerpost" :key="index">
				<!-- 点击跳转到被评论的帖子详情页 -->
				<navigator :url="`/pages-post/info?postid=${item.postid}`" class="card-content">
					<!-- 卡片头部：回答者信息 + 时间 -->
					<view class="card-header">
						<view class="author-info">
							<image class="author-avatar" :src="item.business.avatar_text || '/static/logo.png'" mode="aspectFill"></image>
							<text class="author-name">{{item.business.nickname}}</text>
						</view>
						<view class="post-time">{{item.createtime_text}}</view>
					</view>
					<!-- 卡片主体：评论的帖子标题 + 回答内容预览 -->
					<view class="card-body answer-body">
						<view class="post-title">评论帖子：{{item.post.title}}</view>  <!-- 被评论帖子的标题 -->
						<view class="answer-preview">{{item.content}}</view>  <!-- 回答内容预览 -->
					</view>
					<!-- 卡片底部：点赞数统计 -->
					<view class="card-footer">
						<view class="like-count">
							<u-icon name="thumb-up" size="28" color="#999"></u-icon>  <!-- 点赞图标 -->
							<text>{{item.likes_count}}</text>  <!-- 点赞数量 -->
						</view>
					</view>
				</navigator>
			</view>
			<!-- 空状态：没有回答数据时显示 -->
			<u-empty v-if="answerpost.length === 0" mode="list" text="暂无回答"></u-empty>
			<view class="list-count" v-if="answerpost.length > 0">没有更多数据了</view>
		</view>

		<!-- ==================== 列表区域3：我的收藏 ==================== -->
		<!-- 显示条件：激活了"我的收藏"标签 且 数据已加载 -->
		<view class="list-container" v-if="active == '2' && business && !switchingTab">
			<!-- 循环渲染每条收藏记录 -->
			<view class="post-card" v-for="(item, index) in collectpost" :key="index">
				<!-- 点击跳转到收藏的帖子详情页 -->
				<navigator :url="`/pages-post/info?postid=${item.post.id}`" class="card-content">
					<!-- 卡片头部：收藏者信息 + 帖子发布时间 -->
					<view class="card-header">
						<view class="author-info">
							<image class="author-avatar" :src="item.business.avatar_text || '/static/logo.png'" mode="aspectFill"></image>
							<text class="author-name">{{item.business.nickname}}</text>
						</view>
						<view class="post-time">{{item.post.createtime_text}}</view>  <!-- 使用帖子的创建时间 -->
					</view>
					<!-- 卡片主体：帖子标题 + 分类 -->
					<view class="card-body">
						<view class="post-title">{{item.post.title}}</view>  <!-- 收藏的帖子标题 -->
						<view class="post-category">{{item.category.name}}</view>  <!-- 帖子分类 -->
					</view>
					<!-- 卡片底部：解决状态 + 悬赏积分 + 回复数 -->
					<view class="card-footer">
						<!-- 解决状态（使用帖子的状态字段） -->
						<view class="status-tag" :class="{solved: item.post.status == '1' && item.post.accept}">
							{{item.post.status == '1' && item.post.accept ? '已解决' : '未解决'}}
						</view>
						<!-- 悬赏积分（使用帖子的积分字段） -->
						<view class="reward">
							<text class="reward-icon">￥</text>
							<text class="reward-value">{{item.post.point}}</text>
						</view>
						<!-- 回复人数（使用帖子的评论数字段） -->
						<view class="reply-count">
							<text>{{item.post.comment_count}}人回复</text>
						</view>
					</view>
				</navigator>
			</view>
			<!-- 空状态：没有收藏数据时显示 -->
			<u-empty v-if="collectpost.length === 0" mode="list" text="暂无收藏"></u-empty>
			<view class="list-count" v-if="collectpost.length > 0">没有更多数据了</view>
		</view>

		<!-- 全局Toast提示组件引用 -->
		<u-toast ref="notice"></u-toast>
	</view>
</template>

<script>
/**
 * business/user.vue - 个人主页
 *
 * 功能说明：
 * - 展示用户公开信息（头像、昵称、简介、个人签名）
 * - 用户统计数据（提问数、回答数、收藏数）
 * - Tab标签切换：我的提问 / 我的回答 / 我的收藏
 * - 关注/取关操作（非自己的主页才显示）
 * - 支持查看他人的主页（通过busid参数）
 *
 * 页面流程：
 * 1. onLoad 接收 busid 参数（可选）
 * 2. 有busid → 加载他人用户信息 + 提问列表 + 检查关注状态
 * 3. 无busid → 需要登录，加载自己的提问列表
 * 4. 用户切换Tab时动态加载对应的数据（带缓存优化）
 */

import { getUserInfo, checkLogin } from '@/utils/auth.js'
import { followMixin } from '@/mixins/followMixin'
import { tabCacheMixin } from '@/mixins/tabCacheMixin'

export default {
	mixins: [followMixin, tabCacheMixin],
	/**
	 * 页面生命周期 - onLoad
	 * 当页面加载时触发，根据是否有busid参数决定加载模式
	 * @param {object} option - 路由参数对象
	 */
	onLoad(option) {
		var busid = option.busid ? option.busid : 0

		this.initTabCache(['0', '1', '2'])

		if (busid) {
			this.ybusiness = getUserInfo()
			this.busid = busid
			this.UserData()
			this.checkFollowState(busid)
		}
		else {
			if (!checkLogin()) return
			this.business = getUserInfo()
			this.QuestData()
		}
	},

	/**
	 * 数据定义
	 * 包含页面所有的响应式数据和配置
	 */
	data() {
		return {
			busid: 0,              // 目标用户ID（查看他人主页时使用）
			ybusiness: {},          // 当前登录用户的信息对象
			business: null,         // 当前展示的用户信息（初始为null，显示loading状态）
			// 标签栏配置数据
			cate: [
				{name: '我的提问', id: '0'},  // 标签1：提问列表
				{name: '我的回答', id: '1'},  // 标签2：回答列表
				{name: '我的收藏', id: '2'}   // 标签3：收藏列表
			],
			questpost: [],          // 提问列表数据数组
			answerpost: [],         // 回答列表数据数组
			collectpost: []
		}
	},

	methods: {
		/**
		 * 加载他人用户的基本信息和提问列表
		 * 用于查看其他用户的主页时调用
		 */
		async UserData() {
			try {
				// 第一步：请求用户基本信息
				var result = await uni.$u.http.post('/user/info', { busid: this.busid })

				// 判断用户是否存在
				if (result.code == 0) {
					// 用户不存在或已被删除：显示错误提示并返回
					uni.$toast.error(result.msg, {
						complete: () => {
							uni.$u.route({ type: 'navigateBack', delta: 1 })
						}
					})
					return false
				}

				// 保存用户基本信息到data
				this.business = result.data.business

				// 第二步：自动加载该用户的提问列表（作为默认显示的内容）
				var result = await uni.$u.http.post('/user/question', { busid: this.business.id }, { custom: { toast: false } })

				// 将提问数据保存到列表和缓存中
				this.questpost = result.data || []
				this.tabCache['0'] = this.questpost
			} catch (error) {
				console.error('UserData error:', error)
				// 出错时清空数据
				this.questpost = []
				this.tabCache['0'] = []
			}
		},

		/**
		 * 加载提问列表数据
		 * 可用于加载自己或他人的提问记录
		 */
		async QuestData() {
			try {
				// 构造请求参数
				var data = { busid: this.business.id }
				// 发送请求获取提问列表
				var result = await uni.$u.http.post('/user/question', data, { custom: { toast: false } })

				// 判断请求是否成功
				if (result.code == 0) {
					// 请求失败或无数据：清空列表和缓存
					this.questpost = []
					this.tabCache['0'] = []
					return false
				}

				// 保存数据到列表和缓存
				this.questpost = result.data || []
				this.tabCache['0'] = this.questpost
			} catch (error) {
				console.error('QuestData error:', error)
				this.questpost = []
				this.tabCache['0'] = []
			} finally {
				// 无论成功失败都执行：关闭切换loading状态
				this.switchingTab = false
			}
		},

		/**
		 * 加载回答列表数据
		 * 获取用户发表过的所有回答/评论记录
		 */
		async AnswerData() {
			try {
				// 构造请求参数
				var data = { busid: this.business.id }
				// 发送请求获取回答列表
				var result = await uni.$u.http.post('/user/answer', data, { custom: { toast: false } })

				// 判断请求是否成功
				if (result.code == 0) {
					this.answerpost = []
					this.tabCache['1'] = []
					return false
				}

				// 保存数据到列表和缓存
				this.answerpost = result.data || []
				this.tabCache['1'] = this.answerpost
			} catch (error) {
				console.error('AnswerData error:', error)
				this.answerpost = []
				this.tabCache['1'] = []
			} finally {
				// 关闭切换loading状态
				this.switchingTab = false
			}
		},

		onTabCacheHit(tabId) {
			this.questpost = this.tabCache['0'] || []
			this.answerpost = this.tabCache['1'] || []
			this.collectpost = this.tabCache['2'] || []
		},

		async loadTabData(tabId) {
			if (tabId == '0') this.QuestData()
			if (tabId == '1') this.AnswerData()
			if (tabId == '2') this.CollectData()
		},

		async CollectData() {
			try {
				// 构造请求参数
				var data = { busid: this.business.id }
				// 发送请求获取收藏列表
				var result = await uni.$u.http.post('/user/collect', data, { custom: { toast: false } })

				// 判断请求是否成功
				if (result.code == 0) {
					this.collectpost = []
					this.tabCache['2'] = []
					return false
				}

				// 保存数据到列表和缓存
				this.collectpost = result.data || []
				this.tabCache['2'] = this.collectpost
			} catch (error) {
				console.error('CollectData error:', error)
				this.collectpost = []
				this.tabCache['2'] = []
			} finally {
				// 关闭切换loading状态
				this.switchingTab = false
			}
		},

	}
}
</script>


<style lang="scss">
/* ==================== 个人主页根容器 ==================== */
.content {
	width: 100%;                /* 宽度撑满屏幕 */
	background-color: #f5f7fa; /* 浅灰色背景 */
	min-height: 100vh;          /* 最小高度占满整屏 */
}

/* ==================== 头部区域 ==================== */
.header {
	position: relative;         /* 相对定位（为装饰元素做准备） */
}

/* 用户信息区域 */
.person {
	padding: 80rpx 36rpx 60rpx; /* 内边距：上80 左右36 下60 */
	background: $zl-gradient;  /* 渐变背景色（全局变量） */
	color: white;              /* 文字颜色为白色 */
	position: relative;        /* 相对定位 */
	overflow: hidden;          /* 隐藏溢出的装饰圆圈 */

	/* 右上角装饰性半透明圆圈 */
	&::before {
		content: '';                     /* 伪元素内容为空 */
		position: absolute;              /* 绝对定位 */
		top: -50%;                       /* 定位到上方外部 */
		right: -20%;                     /* 定位到右方外部 */
		width: 300rpx;                   /* 圆圈直径 */
		height: 300rpx;
		border-radius: 50%;              /* 圆形 */
		background: rgba(255, 255, 255, 0.08);  /* 8%不透明度的白色 */
	}

	/* 左下角装饰性半透明圆圈（更小更淡） */
	&::after {
		content: '';
		position: absolute;
		bottom: -30%;                    /* 定位到下方外部 */
		left: -10%;                      /* 定位到左方外部 */
		width: 200rpx;
		height: 200rpx;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.05);  /* 5%不透明度的白色 */
	}

	/* 头像 + 昵称 + 关注按钮的横向排列 */
	.info {
		display: flex;                   /* 弹性布局 */
		align-items: center;             /* 垂直居中对齐 */
		margin-bottom: 48rpx;           /* 与下方统计卡片的间距 */
		position: relative;              /* 相对定位 */
		z-index: 1;                      /* 层级高于装饰圆圈 */

		/* 头像外层容器 */
		.avatar-wrapper {
			margin-right: 28rpx;         /* 与右侧昵称区域的间距 */

			/* 头像圆形容器 */
			.avatar {
				width: 130rpx;            /* 头像尺寸 */
				height: 130rpx;
				border-radius: 50%;      /* 圆形 */
				overflow: hidden;        /* 隐藏溢出（保证图片不超出圆形） */
				border: 4rpx solid rgba(255, 255, 255, 0.35);  /* 半透明白色边框 */
				box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.15);  /* 阴影效果 */
				background-color: #fff;  /* 白色背景 */

				image {
					width: 100%;         /* 图片撑满容器 */
					height: 100%;
				}
			}
		}

		/* 昵称和简介区域 */
		.base {
			flex: 1;                     /* 占据剩余空间 */
			min-width: 0;                /* 允许缩小（防止flex子项溢出） */

			/* 用户昵称 */
			.nickname {
				font-size: 38rpx;         /* 大字号 */
				font-weight: bold;       /* 加粗 */
				margin-bottom: 10rpx;    /* 与简介的间距 */
				line-height: 1.3;        /* 行高 */
				overflow: hidden;        /* 超出隐藏 */
				text-overflow: ellipsis; /* 省略号 */
				white-space: nowrap;     /* 不换行（单行显示） */
			}

			/* 个人简介/签名 */
			.desc {
				font-size: 24rpx;         /* 小字号 */
				opacity: 0.85;           /* 85%不透明度（略淡于纯白） */
				line-height: 1.4;        /* 行高 */
				display: -webkit-box;    /* 弹性盒子模型（用于多行截断） */
				-webkit-line-clamp: 2;   /* 最多显示2行 */
				line-clamp: 2;           /* 标准属性（兼容新版浏览器） */
				-webkit-box-orient: vertical;  /* 垂直排列 */
				overflow: hidden;        /* 超出隐藏 */
				text-overflow: ellipsis; /* 省略号 */
			}
		}
	}
}

/* ==================== 统计数据卡片 ==================== */
.stats-card {
	display: flex;                     /* 弹性布局 */
	align-items: center;               /* 垂直居中 */
	justify-content: space-around;     /* 均匀分布 */
	background: rgba(255, 255, 255, 0.15);  /* 15%不透明白色背景（半透明毛玻璃效果） */
	border-radius: 20rpx;              /* 圆角 */
	padding: 28rpx 16rpx;              /* 内边距 */
	backdrop-filter: blur(12rpx);      /* 背景模糊滤镜（增强毛玻璃效果） */
	position: relative;                /* 相对定位 */
	z-index: 1;                        /* 层级高于装饰圆圈 */

	/* 单个统计项 */
	.stat-item {
		flex: 1;                        /* 等分宽度 */
		text-align: center;             /* 居中对齐 */
		padding: 8rpx 0;                /* 内边距 */

		/* 统计数值（如"12"） */
		.stat-value {
			font-size: 42rpx;            /* 大字号 */
			font-weight: bold;          /* 加粗 */
			color: #fff;                /* 白色 */
			line-height: 1.2;           /* 行高 */
			margin-bottom: 6rpx;        /* 与标签的间距 */
		}

		/* 统计标签（如"提问"） */
		.stat-label {
			font-size: 23rpx;            /* 小字号 */
			color: rgba(255, 255, 255, 0.8);  /* 80%不透明白色 */
			letter-spacing: 2rpx;       /* 字间距（增加可读性） */
		}
	}

	/* 统计项之间的分隔线 */
	.stat-divider {
		width: 1rpx;                     /* 极细线条 */
		height: 46rpx;                   /* 高度 */
		background: rgba(255, 255, 255, 0.25);  /* 25%不透明白色 */
	}
}

/* ==================== 标签栏样式 ==================== */
.nav {
	background-color: white;          /* 白色背景 */
	border-bottom: 1rpx solid #eee;   /* 底部分隔线 */
	position: sticky;                 /* 粘性定位（滚动时固定在顶部） */
	top: 0;                            /* 距离顶部0 */
	z-index: 10;                       /* 层级（确保在其他内容之上） */

	/* 深度选择器：覆盖uView Tabs组件的内部样式 */
	::v-deep .u-tabs {
		/* 强制导航栏容器占满整行 */
		.u-tabs__wrapper__nav {
			display: flex !important;    /* 弹性布局 */
			width: 100% !important;      /* 撑满宽度 */
		}

		/* 强制每个标签项等分宽度 */
		.u-tabs__wrapper__nav__item {
			flex: 1 !important;          /* 等分空间 */
			display: flex !important;    /* 弹性布局 */
			justify-content: center !important;  /* 水平居中 */
			align-items: center !important;       /* 垂直居中 */
		}
	}
}

/* ==================== 标签切换加载遮罩 ==================== */
.tab-loading-overlay {
	display: flex;                     /* 弹性布局 */
	flex-direction: column;            /* 纵向排列 */
	align-items: center;               /* 水平居中 */
	justify-content: center;           /* 垂直居中 */
	padding: 120rpx 0;                 /* 上下内边距 */
	background-color: rgba(255, 255, 255, 0.95);  /* 95%不透明白色（几乎不透明） */
	position: relative;                /* 相对定位 */
	z-index: 5;                        /* 层级 */
}

/* 页面初始化加载状态 */
.loading-wrapper {
	display: flex;                     /* 弹性布局 */
	flex-direction: column;            /* 纵向排列 */
	align-items: center;               /* 居中对齐 */
	padding: 120rpx 0;                 /* 内边距 */
}

/* ==================== 列表容器 ==================== */
.list-container {
	padding: 20rpx 24rpx;             /* 内边距 */
}

/* 列表底部提示文字 */
.list-count {
	text-align: center;               /* 居中对齐 */
	color: #999;                      /* 灰色文字 */
	font-size: 26rpx;                 /* 小字号 */
	padding: 30rpx 0 20rpx;           /* 上下内边距 */
}

/* ==================== 帖子卡片通用样式 ==================== */
.post-card {
	background: white;                /* 白色背景 */
	border-radius: 20rpx;              /* 圆角 */
	margin-bottom: 20rpx;             /* 卡片之间的间距 */
	overflow: hidden;                  /* 隐藏溢出内容（保证圆角生效） */
	box-shadow: 0 2rpx 16rpx rgba(0, 0, 0, 0.06);  /* 轻微阴影 */
	transition: all 0.2s ease;        /* 过渡动画（用于交互反馈） */

	/* 点击按下时的缩放效果 */
	&:active {
		transform: scale(0.98);         /* 缩小到98% */
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);  /* 阴影变淡 */
	}

	/* 卡片内容区域 */
	.card-content {
		display: block;                 /* 块级元素 */
		padding: 28rpx;                 /* 内边距 */
	}

	/* 卡片头部：作者信息 + 时间 */
	.card-header {
		display: flex;                  /* 弹性布局 */
		align-items: center;            /* 垂直居中 */
		justify-content: space-between;  /* 两端对齐 */
		margin-bottom: 18rpx;           /* 与主体的间距 */

		/* 作者信息组 */
		.author-info {
			display: flex;              /* 弹性布局 */
			align-items: center;        /* 垂直居中 */

			/* 作者头像 */
			.author-avatar {
				width: 56rpx;            /* 尺寸 */
				height: 56rpx;
				border-radius: 50%;      /* 圆形 */
				margin-right: 14rpx;     /* 与昵称的间距 */
				background-color: #f5f7fa;  /* 浅灰背景（图片加载前的底色） */
			}

			/* 作者昵称 */
			.author-name {
				font-size: 26rpx;        /* 字号 */
				color: #0173de;         /* 主题蓝色 */
				font-weight: 500;       /* 中等粗细 */
			}
		}

		/* 发布时间 */
		.post-time {
			font-size: 22rpx;            /* 小字号 */
			color: #b0b0b0;             /* 浅灰色 */
		}
	}

	/* 卡片主体：标题 + 分类/内容 */
	.card-body {
		margin-bottom: 18rpx;           /* 与底部的间距 */

		/* 帖子标题 */
		.post-title {
			font-size: 30rpx;            /* 较大字号 */
			color: #303133;             /* 深灰色 */
			font-weight: 600;           /* 半粗体 */
			line-height: 1.5;           /* 行高 */
			margin-bottom: 10rpx;       /* 与分类的间距 */
			display: -webkit-box;       /* 多行截断容器 */
			-webkit-line-clamp: 2;      /* 最多显示2行 */
			line-clamp: 2;
			-webkit-box-orient: vertical;  /* 垂直排列 */
			overflow: hidden;           /* 超出隐藏 */
		}

		/* 分类标签 */
		.post-category {
			display: inline-block;      /* 行内块级元素 */
			font-size: 22rpx;           /* 小字号 */
			color: #909399;             /* 中灰色 */
			background: #f5f7fa;        /* 浅灰背景 */
			padding: 4rpx 14rpx;        /* 内边距 */
			border-radius: 6rpx;        /* 小圆角 */
		}

		/* 回答列表的特殊样式（与提问列表略有不同） */
		&.answer-body {
			.post-title {
				font-size: 27rpx;        /* 字号略小于提问列表 */
				color: #606266;         /* 颜色略浅 */
				margin-bottom: 12rpx;   /* 间距略大 */
			}

			/* 回答内容预览 */
			.answer-preview {
				font-size: 25rpx;        /* 字号 */
				color: #909399;         /* 中灰色 */
				line-height: 1.6;       /* 行高（内容可能较长） */
				display: -webkit-box;   /* 多行截断 */
				-webkit-line-clamp: 2;  /* 最多2行 */
				line-clamp: 2;
				-webkit-box-orient: vertical;
				overflow: hidden;
			}
		}
	}

	/* 卡片底部：状态标签 + 积分 + 回复数 */
	.card-footer {
		display: flex;                  /* 弹性布局 */
		align-items: center;            /* 垂直居中 */
		justify-content: space-between;  /* 两端对齐 */
		padding-top: 18rpx;            /* 顶部分隔 */
		border-top: 1rpx solid #f5f5f5;  /* 顶部分隔线 */

		/* 解决状态标签 */
		.status-tag {
			font-size: 22rpx;            /* 小字号 */
			padding: 6rpx 16rpx;        /* 内边距 */
			border-radius: 8rpx;        /* 圆角 */
			background: #fef0f0;        /* 浅红色背景（未解决） */
			color: #f56c6c;             /* 红色文字 */

			/* 已解决状态的绿色样式 */
			&.solved {
				background: #f0f9eb;    /* 浅绿色背景 */
				color: #67c23a;         /* 绿色文字 */
			}
		}

		/* 悬赏积分显示 */
		.reward {
			display: flex;              /* 弹性布局 */
			align-items: baseline;      /* 基线对齐（让￥符号和数字对齐） */

			/* 人民币符号 */
			.reward-icon {
				font-size: 22rpx;        /* 小字号 */
				color: #e6a23c;         /* 橙黄色 */
				font-weight: 600;       /* 半粗体 */
			}

			/* 积分数值 */
			.reward-value {
				font-size: 28rpx;        /* 较大字号 */
				color: #e6a23c;         /* 橙黄色 */
				font-weight: bold;      /* 加粗突出 */
			}
		}

		/* 回复人数统计 */
		.reply-count {
			font-size: 22rpx;            /* 小字号 */
			color: #b0b0b0;             /* 浅灰色 */
		}

		/* 点赞数统计（仅在回答列表中使用） */
		.like-count {
			display: flex;              /* 弹性布局 */
			align-items: center;        /* 垂直居中 */
			gap: 8rpx;                  /* 图标和文字的间距 */
			font-size: 24rpx;           /* 字号 */
			color: #909399;             /* 中灰色 */
		}
	}
}
</style>
