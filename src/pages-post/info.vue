<template>
	<!-- 帖子详情页根容器：使用浅灰背景色 -->
	<view class="post">
		<!-- 帖子主体信息区域：白色卡片背景 -->
		<view class="info">
			<!-- 头部区域：包含标签、标题、作者信息 -->
			<view class="header-section">
				<!-- 标签行：展示分类标签、解决状态、收藏按钮 -->
				<view class="tag-row">
					<!-- 分类标签：显示帖子所属分类名称 -->
					<view class="item">
						<u-tag :text="post.category.name" type="success" plain icon="tags-fill" size="mini"></u-tag>
					</view>
					<!-- 解决状态标签：根据帖子状态和是否被采纳显示不同样式 -->
					<view class="item">
						<!-- 已解决：绿色成功标签 + 对勾图标 -->
						<u-tag v-if="post.status == '1' && post.accept" text="已解决" type="success" plain icon="checkmark" size="mini"></u-tag>
						<!-- 未解决：橙色警告标签 + 时钟图标 -->
						<u-tag v-else text="未解决" type="warning" plain icon="clock" size="mini"></u-tag>
					</view>
					<!-- 收藏按钮：仅对非自己的帖子显示（自己不能收藏自己的帖子） -->
					<view class="item collect-btn" v-if="business.id != post.busid">
						<!-- 收藏状态未加载时：透明占位符（防止布局抖动） -->
						<u-tag v-if="!collectLoaded" text=" " type="info" plain icon="star" size="mini" :customStyle="{opacity: 0}"></u-tag>
						<!-- 已收藏状态：红色实心星标 + "已收藏"文字，点击可取消收藏 -->
						<u-tag v-else-if="collect" @click="toggleCollect(postid, post.business.id, post.cateid)" text="已收藏" type="error" icon="star-fill" size="mini"></u-tag>
						<!-- 未收藏状态：灰色空心星标 + "收藏"文字，点击可收藏 -->
						<u-tag v-else @click="toggleCollect(postid, post.business.id, post.cateid)" text="收藏" type="info" plain icon="star" size="mini"></u-tag>
					</view>
				</view>

				<!-- 帖子标题：大字体显示 -->
				<view class="title">{{post.title}}</view>

				<!-- 作者信息行：头像 + 昵称/关注按钮 + 发布时间 -->
				<view class="author-row">
					<!-- 作者头像链接：点击可跳转到作者个人主页 -->
					<navigator :url="`/pages-business/user?busid=${post.business.id}`" class="avatar-link">
						<!-- 头像图片：使用 aspectFill 模式裁剪填充 -->
						<image class="avatar" mode="aspectFill" :src="post.business.avatar_text"></image>
					</navigator>
					<!-- 作者详细信息区 -->
					<view class="author-info">
						<!-- 上半部分：昵称 + 关注按钮 -->
						<view class="author-top">
							<!-- 作者昵称文本 -->
							<text class="nickname">{{post.business.nickname}}</text>
							<!-- 关注按钮：仅对非自己的帖子显示 -->
							<view class="follow-btn" v-if="business.id != post.busid">
								<!-- 关注状态未加载时：显示占位符 -->
								<u-tag v-if="!attentionLoaded" text=" " type="primary" plain size="mini" :customStyle="{opacity: 0}"></u-tag>
								<!-- 已关注状态：绿色边框 + "已关注"文字，点击可取关 -->
								<u-tag v-else-if="attention" @click="toggleFollow(post.business.id)" text="已关注" type="success" plain size="mini"></u-tag>
								<!-- 未关注状态：蓝色边框 + "关注"文字，点击可关注 -->
								<u-tag v-else @click="toggleFollow(post.business.id)" text="关注" type="primary" plain size="mini"></u-tag>
							</view>
						</view>
						<!-- 发布时间：灰色小字 -->
						<text class="createtime">{{post.createtime_text}}</text>
					</view>
				</view>
			</view>

			<!-- 帖子内容区域：支持富文本解析 -->
			<view class="content-section">
				<!-- 使用 u-parse 组件解析 HTML 内容 -->
				<u-parse :content="post.content"></u-parse>
			</view>

			<!-- 统计数据区域：收藏量、讨论数、悬赏积分 -->
			<view class="stats-section">
				<!-- 统计项1：收藏量 -->
				<view class="stat-item">
					<view class="stat-icon">
						<!-- 星形图标，橙黄色 -->
						<u-icon name="star" size="20" color="#faa755"></u-icon>
					</view>
					<view class="stat-info">
						<text class="stat-label">收藏量</text>
						<text class="stat-value">{{post.collect_count}}</text>
					</view>
				</view>
				<!-- 分隔线 -->
				<view class="stat-divider"></view>
				<!-- 统计项2：讨论数（评论数量） -->
				<view class="stat-item">
					<view class="stat-icon">
						<!-- 聊天气泡图标，绿色 -->
						<u-icon name="chat" size="20" color="#19be6b"></u-icon>
					</view>
					<view class="stat-info">
						<text class="stat-label">讨论数</text>
						<text class="stat-value">{{post.comment_count}}</text>
					</view>
				</view>
				<!-- 分隔线 -->
				<view class="stat-divider"></view>
				<!-- 统计项3：悬赏积分 -->
				<view class="stat-item">
					<view class="stat-icon">
						<!-- 红包图标，红色 -->
						<u-icon name="red-packet" size="20" color="#ed4014"></u-icon>
					</view>
					<view class="stat-info">
						<text class="stat-label">悬赏积分</text>
						<text class="stat-value">{{post.point}}</text>
					</view>
				</view>
			</view>

			<!-- 操作按钮区域：回答或编辑 -->
			<view class="action-section">
				<!-- 回答按钮：非作者且帖子未解决时显示 -->
				<view class="action-btn-wrap" v-if="post.busid != business.id && post.status == '0'" @click="showAnswer">
					<u-icon name="edit-pen" size="18" color="#fff"></u-icon>
					<text>我来回答</text>
				</view>
				<!-- 编辑按钮：仅作者且帖子未解决时显示 -->
				<view class="action-btn-wrap" v-if="post.busid == business.id && post.status == '0'" @click="edit">
					<u-icon name="edit-pen-fill" size="18" color="#fff"></u-icon>
					<text>修改提问</text>
				</view>
			</view>
		</view>

		<!-- ==================== 评论区域开始 ==================== -->
		<view class="comment-section">
			<!-- 评论展开触发器：评论未加载时显示（优化首屏性能） -->
			<view v-if="!commentsLoaded" class="divider-section expand-trigger" @click="toggleComments()">
				<view class="expand-divider">
					<!-- 左侧装饰线 -->
					<view class="expand-line"></view>
					<!-- 中间内容区：图标 + 文字 + 箭头 -->
					<view class="expand-content">
						<u-icon name="chat" size="14" color="#909399"></u-icon>
						<text class="expand-text">全部评论 {{post.comment_count || 0}} · 点击展开</text>
						<u-icon name="arrow-down" size="12" color="#909399"></u-icon>
					</view>
					<!-- 右侧装饰线 -->
					<view class="expand-line"></view>
				</view>
			</view>

			<!-- 评论收起触发器：评论已加载时显示 -->
			<view v-else class="divider-section expand-trigger collapse-trigger" @click="toggleComments()">
				<view class="expand-divider">
					<view class="expand-line"></view>
					<view class="expand-content">
						<u-icon name="chat" size="14" color="#909399"></u-icon>
						<text class="expand-text">全部评论 {{post.comment_count || 0}} · 点击收起</text>
						<u-icon name="arrow-up" size="12" color="#909399"></u-icon>
					</view>
					<view class="expand-line"></view>
				</view>
			</view>

			<!-- 评论列表容器：仅在评论已加载时渲染 -->
			<template v-if="commentsLoaded">
				<!-- 有评论数据时：循环渲染每条一级评论 -->
				<view class="list" v-if="comlist.length > 0">
					<view class="item" v-for="(item, index) in comlist" :key="index">
						<!-- 评论头部：头像 + 昵称/标签 + 时间 -->
						<view class="item-header">
							<!-- 评论者头像链接：跳转到其主页 -->
							<navigator :url="`/pages-business/user?busid=${item.busid}`" class="avatar-link">
								<image class="avatar" mode="aspectFill" :src="item.business.avatar_text"></image>
							</navigator>
							<!-- 评论者信息区 -->
							<view class="item-author">
								<!-- 昵称行：昵称 + 身份标签 -->
								<view class="author-name-row">
									<!-- 评论者昵称 -->
									<text class="author-name">{{item.business.nickname}}</text>
									<!-- 楼主标签：如果是帖子作者发的评论 -->
									<u-tag v-if="item.busid == post.busid" text="楼主" type="error" plain size="mini"></u-tag>
									<!-- 已采纳标签：如果帖子已解决且该评论被采纳 -->
									<u-tag v-else-if="post.status == '1' && post.accept && item.status == '1'" text="已采纳" type="success" plain size="mini"></u-tag>
								</view>
								<!-- 个人简介：显示评论者的简介信息 -->
								<text class="author-desc">{{item.business.lable || '暂无简介'}}</text>
							</view>
							<!-- 发布时间：右对齐 -->
							<text class="item-time">{{item.createtime_text}}</text>
						</view>

						<!-- 评论内容文本 -->
						<view class="item-content">{{item.content}}</view>

						<!-- 评论底部操作栏：点赞 + 回复 + 更多 -->
						<view class="item-footer">
							<!-- 左侧操作组 -->
							<view class="footer-left">
								<!-- 点赞按钮 -->
								<view class="action-btn like-btn" @click="LikeToggle(item)">
									<!-- 图标：根据点赞状态切换实心/空心 -->
									<u-icon :name="item.like_status ? 'thumb-up-fill' : 'thumb-up'" :color="item.like_status ? '#19be6b' : '#999'" size="18"></u-icon>
									<!-- 点赞数或"点赞"文字：根据状态变色 -->
									<text :class="{ 'active': item.like_status }">{{ item.likes_count > 0 ? item.likes_count : '点赞' }}</text>
								</view>
								<!-- 展开/收起回复按钮 -->
								<view class="action-btn comment-btn" @click="CommentToggle(index)">
									<!-- 聊天图标：根据展开状态变色 -->
									<u-icon name="chat" :color="item.show ? '#3cc51f' : '#999'" size="18"></u-icon>
									<!-- 有回复时显示数量，无回复时提示 -->
									<text v-if="item.comment_count > 0">展开{{item.comment_count}}条回复</text>
									<text v-else>暂无回复</text>
									<!-- 箭头方向：展开向上，收起向下 -->
									<u-icon :name="item.show ? 'arrow-up' : 'arrow-down'" size="12" color="#999"></u-icon>
								</view>
							</view>
							<!-- 右侧更多操作按钮 -->
							<view class="footer-right">
								<!-- 更多菜单按钮（三个点） -->
								<view class="more-btn" @click="answer(item)">
									<u-icon name="more-dot-fill" size="22" color="#999"></u-icon>
								</view>
							</view>
						</view>

						<!-- 二级评论组件：递归渲染该评论下的所有回复 -->
						<!-- 条件：有回复数据 且 当前处于展开状态 -->
						<comment v-if="item.comment_count > 0 && item.show" :postid="item.postid" :pid="item.id" :busid="item.busid" :brid="business.id" :ftrid="post.busid" :status="post.status" :cnrid="post.accept" class="sub-comment"></comment>
					</view>
				</view>

				<!-- 加载中状态：正在请求评论数据时显示 -->
				<view class="loading-state" v-else-if="loading">
					<u-loading-icon text="评论加载中..." size="22" textSize="16"></u-loading-icon>
				</view>

				<!-- 空状态：没有评论数据时显示 -->
				<view class="empty-list" v-else>
					<u-empty text="暂无回答，来说两句吧" icon="chat"></u-empty>
				</view>

			</template>
		</view>

		<!-- ==================== 操作菜单弹窗 ==================== -->
		<action-menu
			v-model="MenuShow"
			:showComment="showCommentBtn"
			:showAccept="showAcceptBtn"
			:showDelete="showDeleteBtn"
			@comment="AnswerShow = true"
			@accept="select"
			@delete="delcom"
		></action-menu>

		<!-- ==================== 回答/评论输入弹窗 ==================== -->
		<u-popup mode="bottom" :show="AnswerShow" @close="AnswerShow = false" round="10">
			<view class="answer">
				<!-- 弹窗头部：标题 + 关闭按钮 -->
				<view class="answer-header">
					<!-- 标题根据类型动态切换："撰写回答" 或 "撰写评论" -->
					<text class="answer-title">{{answerType === 'answer' ? '撰写回答' : '撰写评论'}}</text>
					<!-- 关闭按钮 -->
					<u-icon name="close" size="20" color="#999" @click="AnswerShow = false"></u-icon>
				</view>
				<!-- 表单区域：包含输入框和提交按钮 -->
				<u--form labelPosition="top" :model="comment" :rules="rules" ref="answer">
					<!-- 内容输入框：多行文本域 -->
					<u-form-item prop="content" ref="content">
						<!-- textarea：高度150，带字数统计，placeholder 根据类型切换 -->
						<u--textarea v-model="comment.content" :placeholder="answerType === 'answer' ? '请输入您的回答...' : '请输入您的评论...'" count height="150"></u--textarea>
					</u-form-item>
					<!-- 提交按钮：渐变主题色，禁用状态（内容为空时） -->
					<u-button type="primary" shape="circle" @click="submit" :disabled="!comment.content" :customStyle="{background: 'linear-gradient(135deg, #0173de, #4cd964)'}">{{answerType === 'answer' ? '提交回答' : '提交评论'}}</u-button>
				</u--form>
			</view>
		</u-popup>

		<!-- 全局 Toast 提示组件引用 -->
		<u-toast ref="notice"></u-toast>
	</view>
</template>

<script>
/**
 * post/info.vue - 帖子详情页
 *
 * 功能说明：
 * - 展示帖子完整内容（标题、描述、作者、状态）
 * - 评论懒加载（点击展开/收起，优化首屏渲染速度）
 * - 互动功能：点赞、评论、采纳、收藏、关注
 * - 支持一级/二级评论递归展示
 *
 * 页面流程：
 * 1. onLoad 接收 postid 参数
 * 2. 加载帖子基本信息 (PostData)
 * 3. 并行检查收藏状态 (CollectState) 和关注状态 (AttentionState)
 * 4. 用户点击"展开评论"后加载评论列表 (CommentData)
 */

import comment from '@/components/comment/comment.vue'
import ActionMenu from '@/components/comment/ActionMenu.vue'
import { getUserInfo } from '@/utils/auth.js'
import { followMixin } from '@/mixins/followMixin'
import { collectMixin } from '@/mixins/collectMixin'
import { authMixin } from '@/mixins/authMixin'

export default {
	mixins: [followMixin, collectMixin, authMixin],

	components: {
		comment,
		ActionMenu
	},

	/**
	 * 页面生命周期 - onLoad
	 * 当页面加载时触发，接收路由参数并初始化数据
	 * @param {object} option - 路由参数对象
	 */
	onLoad(option) {
		// 从路由参数中获取帖子ID，默认为0（防止undefined）
		var postid = option.postid ? option.postid : 0
		// 将帖子ID保存到 data 中供后续使用
		this.postid = postid

		// 从本地存储中获取当前登录用户的信息
		this.business = getUserInfo()

		// 调用初始化方法，加载页面所需的所有数据
		this.initPageData()
	},

	/**
	 * 页面显示时触发（从其他页面返回时也会触发）
	 * 每次显示都重新加载最新数据
	 */
	onShow() {
		if (this.postid) {
			this.PostData()
			this.CommentData()
		}
	},

	/**
	 * 数据定义
	 * 包含页面所有的响应式数据
	 */
	data() {
		return {
			show: false,              // 是否显示某个弹出层（预留字段）
			postid: 0,                // 当前查看的帖子ID
			pid: 0,                   // 当前操作的父级评论ID（0表示一级评论）
			comid: 0,                 // 当前选中的评论ID（用于删除/采纳等操作）
			accept: 0,                // 当前选中评论的作者ID
			status: '',               // 当前选中评论的状态
			business: {},             // 当前登录用户的信息对象
			// 帖子数据对象：初始化为空对象，防止模板访问时报错
			post: {
				category: {},         // 分类信息（name属性用于显示标签）
				business: {}          // 作者信息（avatar_text, nickname等）
			},
			MenuShow: false,          // 是否显示操作菜单弹窗（评论/采纳/删除）
			AnswerShow: false,        // 是否显示回答/评论输入弹窗
			// 弹窗类型标识：决定表单的标题和提交逻辑
			answerType: 'answer',     // 'answer'=回答帖子, 'comment'=评论某条评论
			// 输入框绑定的数据模型
			comment: {
				content: '',          // 用户输入的回答/评论内容
			},
			comlist: [],              // 一级评论列表数组
			loading: true,            // 评论是否正在加载中
			commentsLoaded: false,    // 评论是否已加载（控制懒加载展开/收起）
			// 表单验证规则
			rules: {
				content: {
					type: 'string',           // 字段类型为字符串
					required: true,          // 必填项
					message: '内容不能为空',   // 验证失败时的提示信息
					trigger: ['blur', 'change']  // 触发时机：失焦和输入变化时都验证
				}
			}
		}
	},

	computed: {
		showCommentBtn() {
			return this.business.id != this.accept
		},
		showAcceptBtn() {
			return this.post.busid == this.business.id
				&& this.accept != this.post.busid
				&& this.post.status != '1'
		},
		showDeleteBtn() {
			return this.post.busid == this.business.id || this.business.id == this.accept
		}
	},

	methods: {
		/**
		 * 初始化页面数据
		 * 按顺序执行：先加载帖子信息，再并行检查收藏和关注状态
		 * 使用 async/await 确保 PostData 完成后再执行后续操作
		 */
		async initPageData() {
			await this.PostData()
			this.checkFollowState(this.post.business.id)
			this.checkCollectState(this.postid)
		},

		/**
		 * 切换评论区域的展开/收起状态
		 * 实现评论懒加载的核心方法
		 */
		toggleComments() {
			if (this.commentsLoaded) {
				// 如果评论已加载：点击收起，隐藏评论列表
				this.commentsLoaded = false
			} else {
				// 如果评论未加载：先请求评论数据，再标记为已加载
				this.CommentData()       // 发起API请求获取评论
				this.commentsLoaded = true  // 立即标记为已加载（用户体验更好，不用等请求完成）
			}
		},

		/**
		 * 切换某条评论下二级回复的展开/收起状态
		 * @param {number} index - 一级评论在 comlist 数组中的索引
		 */
		CommentToggle(index) {
			// 使用 Vue.set 的语法糖 this.$set 来确保响应式更新
			// 直接修改数组元素的属性可能不会触发视图更新
			this.comlist[index].show = !this.comlist[index].show
		},

		/**
		 * 请求评论列表数据
		 * 从后端获取指定帖子的所有一级评论
		 */
		async CommentData() {
			try {
				// 构造请求参数对象
				var data = {
					postid: this.postid,                    // 帖子ID（必填）
					pid: 0,                                  // 父级评论ID（0表示查询一级评论）
					busid: this.business.id ? this.business.id : 0  // 当前用户ID（用于判断点赞状态）
				}

				// 发送POST请求获取评论列表
				// custom: { toast: false } 表示请求失败时不自动弹出错误提示
				var result = await uni.$u.http.post('/comment/index', data, {
					custom: { toast: false }
				})

				// 将返回的数据赋值给评论列表
				// 如果返回空数组则直接使用空数组，避免 undefined 导致的渲染问题
				this.comlist = result.data.length > 0 ? result.data : []

				// 遍历每条评论，为其添加 show 属性（控制二级回复的展开/收起）
				// 使用 $set 确保新增的属性是响应式的
				this.comlist.map((item) => {
					this.$set(item, 'show', false)  // 默认所有二级回复都是收起状态
				})
			} catch (error) {
				// 请求失败时的错误处理
				console.error('CommentData error:', error)
				this.comlist = []  // 清空评论列表，显示空状态
			} finally {
				// 无论成功失败都会执行：关闭加载中的 loading 状态
				this.loading = false
			}
		},

		/**
		 * 切换评论的点赞状态
		 * @param {object} comment - 要操作的评论对象（从v-for中传入）
		 */
		async LikeToggle(comment) {
			if (!this.requireLogin(false)) return false

			try {
				// 构造点赞请求参数
				var data = {
					comid: comment.id,          // 被点赞的评论ID
					postid: this.postid,        // 所属帖子ID
					busid: this.business.id,    // 点赞人ID（当前用户）
				}

				// 发送点赞/取消点赞请求
				var result = await uni.$u.http.post('/comment/like', data)

				// 业务逻辑判断：code==0 表示操作失败
				if (result.code == 0) {
					uni.$toast.error(result.msg)  // 显示后端返回的错误信息
					return false
				}

				// 操作成功：显示成功提示
				uni.$toast.success(result.msg)

				// 更新前端数据：切换点赞状态
				comment.like_status = !comment.like_status  // true↔false 切换

				// 更新点赞数量：点赞+1，取消点赞-1
				comment.likes_count = comment.like_status ? ++comment.likes_count : --comment.likes_count
			} catch (error) {
				console.error('LikeToggle error:', error)
				uni.$toast.error('操作失败，请稍后重试')
			}
		},

		/**
		 * 显示更多操作菜单（评论/采纳/删除）
		 * @param {object} comment - 被点击的评论对象
		 */
		answer(comment) {
			if (!this.requireLogin(false)) return false

			this.pid = comment.id
			this.comid = comment.id
			this.status = comment.status
			this.accept = comment.busid

			this.MenuShow = true
			this.answerType = 'comment'
			this.comment.content = ''
		},

		/**
		 * 显示"我来回答"输入弹窗
		 * 用于对整个帖子进行一级回答
		 */
		showAnswer() {
			if (!this.requireLogin(false)) return false

			// 设置弹窗类型为"回答"模式
			this.answerType = 'answer'
			// 重置父级评论ID为0（表示这是一级回答）
			this.pid = 0
			// 打开输入弹窗
			this.AnswerShow = true
		},

		/**
		 * 从菜单跳转到评论输入弹窗
		 * 关闭菜单弹窗，打开评论输入弹窗
		 */
		showComment() {
			// 先关闭操作菜单弹窗
			this.MenuShow = false
			// 设置弹窗类型为"评论"
			this.answerType = 'comment'
			// 打开评论输入弹窗
			this.AnswerShow = true
		},

		/**
		 * 删除评论
		 * 权限：帖子作者可删任何评论，评论者可删自己的评论
		 */
		async delcom() {
			if (!this.requireLogin(false)) return false

			try {
				// 构造删除请求参数
				var data = {
					postid: this.postid,        // 所属帖子ID
					busid: this.business.id,    // 操作人ID（当前用户）
					comid: this.comid,          // 要删除的评论ID
				}

				// 发送删除请求
				var result = await uni.$u.http.post('/comment/del', data)

				// 判断是否删除成功
				if (result.code == 0) {
					uni.$toast.error(result.msg)  // 显示后端返回的错误信息
					return false
				}

				// 删除成功：显示提示
				uni.$toast.success(result.msg)

				// 关闭所有弹窗
				this.MenuShow = false
				this.AnswerShow = false

				// 清空当前评论列表
				this.comlist = []
				// 重新请求评论列表（刷新数据）
				this.CommentData()
			} catch (error) {
				console.error('delcom error:', error)
				uni.$toast.error('删除失败，请稍后重试')
			}
		},

		/**
		 * 加载帖子基本信息
		 * 包括：标题、内容、作者、统计数据等
		 */
		async PostData() {
			try {
				// 发送请求获取帖子详情
				// custom: { toast: false } 防止自动弹出错误提示（我们自定义处理）
				var result = await uni.$u.http.post('/post/info', { postid: this.postid }, {
					custom: { toast: false }
				})

				// 判断帖子是否存在
				if (result.code == 0) {
					// 帖子不存在或已被删除：显示错误提示
					uni.$toast.error(result.msg, {
						complete: () => {
							// 提示消失后自动返回上一页
							uni.$u.route({ type: 'navigateBack', delta: 1 })
						}
					})
					return false
				}

				// 将返回的帖子数据保存到 data 中
				this.post = result.data.post
			} catch (error) {
				console.error('PostData error:', error)
				uni.$toast.error('加载失败，请稍后重试')
			}
		},

		/**
		 * 跳转到帖子编辑页面
		 * 仅帖子作者且帖子未解决时可调用
		 */
		edit() {
			// 使用 uView 的路由方法进行页面跳转
			uni.$u.route({
				type: 'navigateTo',           // 跳转类型：保留当前页（可返回）
				url: '/pages-post/edit',      // 目标页面路径
				params: {
					postid: this.postid        // 传递帖子ID参数给编辑页
				}
			})
		},

		/**
		 * 采纳评论
		 * 将某条评论设为最佳答案（仅帖子作者可操作）
		 */
		async select() {
			if (!this.requireLogin(false)) return false

			try {
				// 构造采纳请求参数
				var data = {
					postid: this.postid,        // 帖子ID
					comid: this.comid,          // 被采纳的评论ID
					accept: this.accept         // 被采纳评论的作者ID
				}

				// 发送采纳请求
				var result = await uni.$u.http.post('/post/select', data)

				// 判断采纳是否成功
				if (result.code == 0) {
					uni.$toast.error(result.msg)
					return false
				}

				// 采纳成功：显示提示
				uni.$toast.success(result.msg)

				// 关闭所有弹窗
				this.MenuShow = false
				this.AnswerShow = false

				// 清空评论列表并重新加载（刷新采纳状态）
				this.comlist = []
				this.CommentData()
			} catch (error) {
				console.error('select error:', error)
				uni.$toast.error('操作失败，请稍后重试')
			}
		},

		/**
		 * 提交回答或评论
		 * 先验证表单，通过后发送请求
		 */
		submit() {
			if (!this.requireLogin(false)) return false

			// 手动触发表单验证
			this.$refs.answer.validate()
				.then(async res => {
					// 验证通过：执行提交逻辑
					try {
						// 构造提交参数
						var data = {
							postid: this.postid,              // 帖子ID
							pid: this.pid,                    // 父级评论ID（0=一级回答）
							content: this.comment.content,    // 内容文本
							busid: this.business.id,         // 提交人ID
						}

						// 发送提交请求
						var result = await uni.$u.http.post('/post/answer', data)

						// 判断提交是否成功
						if (result.code == 0) {
							uni.$toast.error(result.msg)
							return false
						}

						// 提交成功：显示提示
						uni.$toast.success(result.msg)

						// 关闭所有弹窗
						this.MenuShow = false
						this.AnswerShow = false

						// 清空评论列表并重新加载（显示新提交的内容）
						this.comlist = []
						this.CommentData()
					} catch (error) {
						console.error('submit error:', error)
						uni.$toast.error('提交失败，请稍后重试')
					}
				})
				.catch(error => {
					// 表单验证失败
					console.log(error)
					uni.$toast.error('内容不能为空')
				})
		}
	}
}
</script>

<style lang="scss">
/* ==================== SCSS变量定义 ==================== */
$primary-color: #3cc51f;    /* 主题绿色（用于强调元素） */
$text-color: #303133;       /* 主文本颜色（深灰色） */
$text-grey: #909399;        /* 次要文本颜色（浅灰色） */
$border-color: #f0f2f3;     /* 边框颜色（极浅灰） */
$bg-color: #f4f6f8;         /* 页面背景颜色 */
$white: #ffffff;            /* 白色（卡片背景） */

/* ==================== 帖子详情页根容器 ==================== */
.post {
	background: $bg-color;           /* 浅灰背景色 */
	min-height: 100vh;               /* 最小高度占满整屏 */
	padding-bottom: 40rpx;           /* 底部内边距（留出空间） */
}

/* ==================== 帖子信息卡片 ==================== */
.info {
	width: 710rpx;                   /* 卡片宽度（适配屏幕） */
	margin: 20rpx auto 0;           /* 居中对齐，顶部间距 */
	padding: 30rpx;                  /* 内边距 */
	background: $white;             /* 白色背景 */
	border-radius: 16rpx;           /* 圆角效果 */
	box-sizing: border-box;         /* 盒模型：padding计入宽度 */
}

/* 头部区域 */
.header-section {
	margin-bottom: 24rpx;           /* 与下方内容的间距 */
}

/* 标签行：横向排列多个标签 */
.tag-row {
	display: flex;                  /* 弹性布局 */
	flex-direction: row;            /* 横向排列 */
	align-items: center;            /* 垂直居中对齐 */
	gap: 12rpx;                     /* 标签之间的间距 */
	margin-bottom: 20rpx;           /* 与标题的间距 */
	flex-wrap: wrap;                /* 允许换行（标签过多时） */
}

/* 单个标签容器 */
.tag-row .item {
	display: inline-flex;           /* 行内弹性布局 */
	align-items: center;            /* 垂直居中 */
}

/* 收藏按钮特殊样式：固定宽度防止抖动 */
.tag-row .collect-btn {
	min-width: 120rpx;              /* 最小宽度 */
}

/* 帖子标题样式 */
.title {
	font-size: 36rpx;               /* 大字号 */
	font-weight: bold;              /* 加粗 */
	color: $text-color;            /* 深灰色文本 */
	line-height: 1.4;              /* 行高（增加可读性） */
	margin-bottom: 24rpx;          /* 与作者信息的间距 */
	word-break: break-all;         /* 允许长单词换行 */
}

/* 作者信息行 */
.author-row {
	display: flex;                  /* 弹性布局 */
	flex-direction: row;            /* 横向排列 */
	align-items: center;            /* 垂直居中 */
	gap: 16rpx;                     /* 元素之间的间距 */
}

/* 作者头像链接容器 */
.avatar-link {
	flex-shrink: 0;                /* 不允许缩小（保持圆形） */
}

/* 头像图片 */
.avatar {
	width: 80rpx;                   /* 头像尺寸 */
	height: 80rpx;
	border-radius: 50%;            /* 圆形头像 */
	border: 2rpx solid $border-color;  /* 浅灰边框 */
}

/* 作者详细信息区 */
.author-info {
	flex: 1;                       /* 占据剩余空间 */
	display: flex;                  /* 弹性布局 */
	flex-direction: column;        /* 纵向排列 */
	gap: 6rpx;                      /* 昵称和时间之间的间距 */
}

/* 昵称行：昵称 + 关注按钮 */
.author-top {
	display: flex;                  /* 弹性布局 */
	flex-direction: row;            /* 横向排列 */
	align-items: center;            /* 垂直居中 */
	gap: 12rpx;                     /* 昵称和按钮之间的间距 */
}

/* 作者昵称文本 */
.nickname {
	font-size: 28rpx;               /* 字号 */
	color: $text-color;            /* 深灰色 */
	font-weight: 500;              /* 中等粗细 */
}

/* 关注按钮容器 */
.follow-btn {
	margin-left: auto;             /* 自动靠右对齐 */
}

/* 发布时间文本 */
.createtime {
	font-size: 24rpx;               /* 小字号 */
	color: $text-grey;             /* 浅灰色 */
}

/* ==================== 帖子内容区域 ==================== */
.content-section {
	margin-bottom: 24rpx;           /* 与下方统计区的间距 */
	padding: 20rpx;                 /* 内边距 */
	background: $bg-color;         /* 浅灰背景（区分于卡片白底） */
	border-radius: 12rpx;          /* 圆角 */
	line-height: 1.8;              /* 行高（富文本内容需要更大行高） */
}

/* ==================== 统计数据区域 ==================== */
.stats-section {
	display: flex;                  /* 弹性布局 */
	flex-direction: row;            /* 横向排列 */
	align-items: center;            /* 垂直居中 */
	justify-content: space-around;  /* 均匀分布 */
	padding: 24rpx 0;              /* 上下内边距 */
	margin-bottom: 20rpx;          /* 与操作按钮的间距 */
	border-top: 1rpx solid $border-color;  /* 顶部边框分隔 */
	border-bottom: 1rpx solid $border-color;  /* 底部边框分隔 */
}

/* 单个统计项 */
.stat-item {
	display: flex;                  /* 弹性布局 */
	flex-direction: row;            /* 横向排列 */
	align-items: center;            /* 垂直居中 */
	gap: 12rpx;                     /* 图标和文字之间的间距 */
}

/* 统计图标容器 */
.stat-icon {
	width: 48rpx;                   /* 图标尺寸 */
	height: 48rpx;
	display: flex;                  /* 居中显示图标 */
	align-items: center;
	justify-content: center;
	background: $bg-color;         /* 浅灰背景 */
	border-radius: 10rpx;          /* 圆角 */
}

/* 统计信息（标签+数值） */
.stat-info {
	display: flex;                  /* 弹性布局 */
	flex-direction: column;        /* 纵向排列 */
	gap: 4rpx;                      /* 标签和数值之间的间距 */
}

/* 统计标签文本（如"收藏量"） */
.stat-label {
	font-size: 22rpx;               /* 小字号 */
	color: $text-grey;             /* 浅灰色 */
}

/* 统计数值（如数字） */
.stat-value {
	font-size: 30rpx;               /* 较大字号 */
	color: $text-color;            /* 深灰色 */
	font-weight: bold;             /* 加粗突出显示 */
}

/* 统计项之间的分隔线 */
.stat-divider {
	width: 1rpx;                    /* 极细线条 */
	height: 40rpx;                  /* 高度 */
	background: $border-color;     /* 浅灰色 */
}

/* ==================== 操作按钮区域 ==================== */
.action-section {
	display: flex;
	flex-direction: row;
	justify-content: center;
	gap: 16rpx;
	margin-top: 20rpx;
}

/* 操作按钮通用样式 */
.action-btn-wrap {
	display: flex;                  /* 弹性布局 */
	flex-direction: row;            /* 横向排列 */
	align-items: center;            /* 垂直居中 */
	justify-content: center;        /* 水平居中 */
	padding: 16rpx 32rpx;          /* 内边距 */
	background: linear-gradient(135deg, #0173de, #4cd964);  /* 渐变背景（主题色） */
	border-radius: 32rpx;          /* 圆角胶囊形状 */
	gap: 8rpx;                      /* 图标和文字之间的间距 */
}

/* 警告样式的操作按钮（如"修改提问"） */
.action-btn-wrap.warning {
	background: linear-gradient(135deg, #faa755, #ed4014);  /* 橙红渐变 */
}

/* 按钮内的图标和文字继承白色 */
.action-btn-wrap u-icon,
.action-btn-wrap text {
	color: $white;                /* 白色 */
	font-size: 26rpx;             /* 字号 */
}

/* ==================== 评论区域 ==================== */
.comment-section {
	margin-top: 20rpx;             /* 与上方卡片的间距 */
}

/* 展开/收起触发器通用样式 */
.divider-section {
	padding: 20rpx 0;             /* 上下内边距 */
}

.expand-trigger {
	cursor: pointer;              /* 鼠标指针样式 */
}

/* 展开/收起的分割线容器 */
.expand-divider {
	display: flex;                 /* 弹性布局 */
	flex-direction: row;           /* 横向排列 */
	align-items: center;           /* 垂直居中 */
	gap: 16rpx;                    /* 各元素之间的间距 */
}

/* 左右两侧的装饰线 */
.expand-line {
	flex: 1;                       /* 占据剩余空间 */
	height: 1rpx;                   /* 极细线条 */
	background: $border-color;    /* 浅灰色 */
}

/* 中间的展开/收起内容区 */
.expand-content {
	display: flex;                 /* 弹性布局 */
	flex-direction: row;           /* 横向排列 */
	align-items: center;           /* 垂直居中 */
	gap: 8rpx;                     /* 图标、文字、箭头的间距 */
}

/* 展开/收起文字 */
.expand-text {
	font-size: 26rpx;              /* 字号 */
	color: $text-grey;            /* 浅灰色 */
}

/* ==================== 评论列表样式 ==================== */
.list {
	padding: 0 10rpx;              /* 左右内边距 */
}

/* 单条评论卡片 */
.item {
	background: $white;           /* 白色背景 */
	padding: 24rpx;                /* 内边距 */
	margin-bottom: 16rpx;          /* 条目之间的间距 */
	border-radius: 12rpx;         /* 圆角 */
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);  /* 轻微阴影 */
}

/* 评论头部：头像 + 信息 + 时间 */
.item-header {
	display: flex;                 /* 弹性布局 */
	flex-direction: row;           /* 横向排列 */
	align-items: flex-start;       /* 顶部对齐 */
	gap: 16rpx;                    /* 元素之间的间距 */
	margin-bottom: 16rpx;          /* 与评论内容的间距 */
}

/* 评论者头像 */
.item-header .avatar {
	width: 64rpx;                  /* 尺寸略小于帖子作者的 */
	height: 64rpx;
	border-radius: 50%;           /* 圆形 */
}

/* 评论者信息区 */
.item-author {
	flex: 1;                      /* 占据剩余空间 */
	display: flex;                 /* 弹性布局 */
	flex-direction: column;       /* 纵向排列 */
	gap: 6rpx;                     /* 昵称和简介之间的间距 */
}

/* 昵称行：昵称 + 身份标签 */
.author-name-row {
	display: flex;                 /* 弹性布局 */
	flex-direction: row;           /* 横向排列 */
	align-items: center;           /* 垂直居中 */
	gap: 10rpx;                    /* 昵称和标签之间的间距 */
	flex-wrap: wrap;              /* 允许换行 */
}

/* 评论者昵称 */
.author-name {
	font-size: 28rpx;              /* 字号 */
	color: $text-color;           /* 深灰色 */
	font-weight: 500;             /* 中等粗细 */
}

/* 个人简介文本 */
.author-desc {
	font-size: 22rpx;              /* 小字号 */
	color: $text-grey;            /* 浅灰色 */
	overflow: hidden;             /* 超出隐藏 */
	text-overflow: ellipsis;      /* 省略号 */
	white-space: nowrap;          /* 不换行 */
	max-width: 400rpx;            /* 最大宽度限制 */
}

/* 评论发布时间：右对齐 */
.item-time {
	font-size: 22rpx;              /* 小字号 */
	color: $text-grey;            /* 浅灰色 */
	margin-left: auto;            /* 自动靠右 */
	white-space: nowrap;          /* 不换行 */
	flex-shrink: 0;              /* 不允许缩小 */
}

/* 评论内容文本 */
.item-content {
	font-size: 28rpx;              /* 正常字号 */
	color: $text-color;           /* 深灰色 */
	line-height: 1.6;            /* 行高 */
	margin-bottom: 16rpx;         /* 与操作栏的间距 */
	word-break: break-word;       /* 允许长单词换行 */
}

/* 评论底部操作栏 */
.item-footer {
	display: flex;                 /* 弹性布局 */
	flex-direction: row;           /* 横向排列 */
	align-items: center;           /* 垂直居中 */
	justify-content: space-between;  /* 两端对齐 */
	padding-top: 16rpx;           /* 顶部分隔 */
	border-top: 1rpx solid $border-color;  /* 顶部边框 */
}

/* 左侧操作组（点赞 + 回复） */
.footer-left {
	display: flex;                 /* 弹性布局 */
	flex-direction: row;           /* 横向排列 */
	gap: 24rpx;                    /* 按钮之间的间距 */
}

/* 操作按钮通用样式 */
.action-btn {
	display: flex;                 /* 弹性布局 */
	flex-direction: row;           /* 横向排列 */
	align-items: center;           /* 垂直居中 */
	gap: 6rpx;                     /* 图标和文字之间的间距 */
	padding: 8rpx 16rpx;          /* 内边距 */
	border-radius: 20rpx;         /* 圆角 */
	transition: all 0.3s ease;   /* 过渡动画 */
}

/* 操作按钮文字 */
.action-btn text {
	font-size: 24rpx;              /* 小字号 */
	color: $text-grey;            /* 默认浅灰色 */
	transition: color 0.3s ease;  /* 颜色过渡动画 */
}

/* 激活状态的操作按钮文字（如已点赞） */
.action-btn text.active {
	color: $primary-color;        /* 主题绿色 */
	font-weight: 500;             /* 加粗 */
}

/* 右侧更多操作按钮 */
.footer-right {
	display: flex;                 /* 弹性布局 */
	align-items: center;           /* 垂直居中 */
}

.more-btn {
	padding: 8rpx;                 /* 内边距（增大点击区域） */
}

/* 二级评论容器的左边距缩进 */
.sub-comment {
	margin-left: 40rpx;            /* 相对于一级评论缩进 */
	margin-top: 16rpx;            /* 顶部间距 */
}

/* ==================== 加载状态样式 ==================== */
.loading-state {
	display: flex;
	justify-content: center;
	align-items: center;
	padding: 40rpx 0;
	gap: 12rpx;
}

.loading-state :deep(.u-loading-icon__text) {
	color: #999 !important;
}

/* ==================== 空状态样式 ==================== */
.empty-list {
	padding: 60rpx 0;             /* 上下内边距 */
}

/* ==================== 回答/评论输入弹窗样式 ==================== */
.answer {
	padding: 30rpx;                /* 内边距 */
}

/* 弹窗头部 */
.answer-header {
	display: flex;                 /* 弹性布局 */
	flex-direction: row;           /* 横向排列 */
	align-items: center;           /* 垂直居中 */
	justify-content: space-between;  /* 两端对齐 */
	margin-bottom: 24rpx;          /* 与表单的间距 */
}

/* 弹窗标题 */
.answer-title {
	font-size: 32rpx;              /* 较大字号 */
	color: $text-color;           /* 深灰色 */
	font-weight: bold;             /* 加粗 */
}

/* 提交按钮的自定义渐变背景 */
.answer .u-button {
	margin-top: 20rpx;            /* 与输入框的间距 */
}
</style>
