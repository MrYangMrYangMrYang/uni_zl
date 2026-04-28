<template>
	<view class="comlist">
		<view class="list" v-if="comlist.length > 0">
			<view class="item" v-for="(item, index) in comlist" :key="index">
				<!-- 评论头部：头像 + 用户信息 + 时间 -->
				<view class="item-header">
					<navigator :url="`/pages/business/user?busid=${item.busid}`" class="avatar-link">
						<image class="avatar" mode="aspectFill" :src="item.business.avatar_text"></image>
					</navigator>
					<view class="item-author">
						<view class="author-name-row">
							<text class="author-name">{{item.business.nickname}}</text>
							<!-- 楼主标识 -->
							<u-tag v-if="item.busid == ftrid" text="楼主" type="error" plain size="mini"></u-tag>
							<!-- 已采纳标识 -->
							<u-tag v-else-if="status == '1' && cnrid && item.status =='1'" text="已采纳" type="success" plain size="mini"></u-tag>
						</view>
						<text class="author-desc">{{item.business.lable || '暂无简介'}}</text>
					</view>
					<text class="item-time">{{item.createtime_text}}</text>
				</view>

				<!-- 评论内容 -->
				<view class="item-content">
					<text v-if="item.parent_text" class="reply-to">@{{item.parent_text}}：</text>{{item.content}}
				</view>

				<!-- 底部操作栏：点赞 + 展开/收起回复 + 更多 -->
				<view class="item-footer">
					<view class="footer-left">
						<view class="action-btn like-btn" @click="LikeToggle(item)">
							<u-icon :name="item.like_status ? 'thumb-up-fill' : 'thumb-up'" :color="item.like_status ? '#19be6b' : '#999'" size="18"></u-icon>
							<text :class="{ 'active': item.like_status }">{{ item.likes_count > 0 ? item.likes_count : '点赞' }}</text>
						</view>
						<view class="action-btn comment-btn" @click="CommentToggle(index)">
							<u-icon name="chat" :color="item.show ? '#19be6b' : '#999'" size="18"></u-icon>
							<text v-if="item.comment_count > 0">展开{{item.comment_count}}条回复</text>
							<text v-else>暂无回复</text>
							<u-icon :name="item.show ? 'arrow-up' : 'arrow-down'" size="12" color="#999"></u-icon>
						</view>
					</view>
					<view class="footer-right">
						<view class="more-btn" @click="answers(item)">
							<u-icon name="more-dot-fill" size="22" color="#999"></u-icon>
						</view>
					</view>
				</view>

				<!-- 递归渲染子评论 -->
				<comment 
					v-if="item.comment_count > 0 && item.show" 
					:postid="item.postid"
					:pid="item.id"
					:busid="item.busid"
					:brid="brid"
					:ftrid="ftrid"
					:status="status"
					:cnrid="cnrid"
				></comment>
			</view>
		</view>

		<!-- 操作菜单弹出层 -->
		<u-popup :show="MenuShow" @close="MenuShow = false" round="10">
			<view class="menu">
				<view class="menu-grid">
					<!-- 评论按钮（不能评论自己） -->
					<view class="menu-item" @click="AnswerShow = true; MenuShow = false" v-if="brid != accept">
						<view class="menu-icon comment-icon">
							<u-icon name="edit-pen-fill" size="28" color="#ffffff"></u-icon>
						</view>
						<text class="menu-text">评论</text>
					</view>
					<!-- 采纳按钮（仅帖子作者可见，且不能采纳自己） -->
					<view class="menu-item" v-if="brid == ftrid && accept != ftrid">
						<view class="menu-icon accept-icon">
							<u-icon name="checkmark" size="28" color="#ffffff"></u-icon>
						</view>
						<text class="menu-text" v-if="status == '1' && cnrid && comstatus =='1'">已采纳</text>
						<text class="menu-text" v-else-if="status == '1' && cnrid">已解决</text>
						<text class="menu-text" v-else @click="select">采纳</text>
					</view>
					<!-- 删除按钮（帖子作者或评论者本人可删除） -->
					<view class="menu-item" v-if="brid == ftrid || brid == accept" @click="delcom">
						<view class="menu-icon delete-icon">
							<u-icon name="trash-fill" size="28" color="#ffffff"></u-icon>
						</view>
						<text class="menu-text">删除</text>
					</view>
				</view>
				<u-button :customStyle="{color: '#0173de', border: '2rpx solid #0173de', backgroundColor: '#fff'}" shape="circle" text="取消" @click="MenuShow = false"></u-button>
			</view>
		</u-popup>

		<!-- 评论输入弹出层 -->
		<u-popup :show="AnswerShow" @close="AnswerShow = false" round="10">
            <view class="answer">
				<view class="answer-header">
					<text class="answer-title">撰写评论</text>
					<u-icon name="close" size="20" color="#999" @click="AnswerShow = false"></u-icon>
				</view>
				<u--form labelPosition="top" :model="answer" :rules="rules" ref="answer">
					<u-form-item prop="content" ref="content">
						<u--textarea v-model="answer.content" placeholder="请输入您的评论..." count height="150"></u--textarea>
					</u-form-item>
					<u-button type="primary" shape="circle" @click="submit" :disabled="!answer.content" :customStyle="{background: 'linear-gradient(135deg, #0173de, #4cd964)'}">提交评论</u-button>
				</u--form>
			</view>
		</u-popup>

		<u-toast ref="notice"></u-toast>
	</view>
</template>

<script>
/**
 * @component comment
 * @description 评论组件（支持递归嵌套二级评论）
 * 功能：展示评论列表、点赞/回复/采纳/删除操作、递归渲染子评论
 * @example <comment :postid="1" :pid="0" :busid="1" :brid="1" :ftrid="1" :status="'0'" :cnrid="0"></comment>
 */
	import Vue from 'vue'

	export default {
		components: {
			comment: () => import('@/components/comment/comment.vue')
		},
		
		props: {
			show: {
				type: Boolean,
				default: false
			},
			/** @type {number} 帖子ID */
			postid: {
				type: Number,
				require: true,
				default: 0,
			},
			/** @type {number} 父级评论ID，0表示一级评论 */
			pid: {
				type: Number,
				require: true,
				default: 0,
			},
			/** @type {number} 被评论的用户ID（用于@提醒） */
			busid: {
				type: Number,
				require: true,
				default: 0,
			},
			/** @type {number} 当前登录用户ID */
			brid: {
				type: Number,
				require: true,
				default: 0,
			},
			/** @type {number} 帖子作者（楼主）的用户ID */
			ftrid: {
				type: Number,
				require: true,
				default: 0,
			},
			/** @type {number} 已采纳的评论ID，0表示未采纳 */
			cnrid: {
				type: Number,
				require: true,
				default: 0,
			},
			/** @type {string} 帖子解决状态：'0'未解决 / '1'已解决 */
			status: {
				type: String,
				require: true,
				default: 0,
			},
		},

		created()
		{
			this.CommentData()
		},

		data()
		{
			return {
				MenuShow: false,
				AnswerShow: false,
				comid: 0,
				accept: 0,
				comstatus: '',
				answer: {
					content: '',
				},
				comlist: [],
				rules: {
					content: {
						type: 'string',
						required: true,
						message: '内容不能为空',
						trigger: ['blur', 'change']
					},
				}
			}
		},

		methods:{
			
			/**
			 * 切换子评论展开/收起状态
			 * @param {number} index - 当前评论在列表中的索引
			 */
			CommentToggle(index)
			{
				this.comlist[index].show = !this.comlist[index].show
			},

			/**
			 * 获取评论列表数据
			 * 从后端接口加载指定帖子和父级下的评论
			 * @returns {Promise<void>}
			 */
			async CommentData()
			{
				try {
					var data = {
						postid: this.postid,
						pid: this.pid,
						busid: this.busid ? this.busid : 0
					}

					var result = await uni.$u.http.post('/comment/index', data)

					this.comlist = result.data.length > 0 ? result.data : []

					// 为每条评论添加show属性控制子评论展开状态，Vue.set确保响应式
					this.comlist.map((item) => {
						Vue.set(item, 'show', false)
					})
				} catch (error) {
					console.error('CommentData error:', error)
				}
			},

			/**
			 * 切换点赞状态
			 * @param {object} comment - 当前操作的评论对象
			 * @param {number} comment.id - 评论ID
			 * @param {boolean} comment.like_status - 当前点赞状态
			 * @param {number} comment.likes_count - 当前点赞数
			 */
			async LikeToggle(comment)
			{	
				if(!this.brid)
				{
					uni.$toast.error('请先登录')
					return false
				}
				
				try {
					var data = {
						comid: comment.id,
						postid: this.postid,
						busid: this.brid
					}
					
					var result = await uni.$u.http.post('/comment/like', data)
					
					if(result.code == 0)
					{
						uni.$toast.error(result.msg)
						return false
					}
					
					uni.$toast.success(result.msg)
				
					// 乐观更新UI：立即切换点赞状态和计数
					comment.like_status = !comment.like_status
					comment.likes_count = comment.like_status ? ++comment.likes_count : --comment.likes_count
				} catch (error) {
					console.error('LikeToggle error:', error)
					uni.$toast.error('操作失败，请稍后重试')
				}
			},

			/**
			 * 显示操作菜单
			 * @param {object} comment - 点击的评论对象
			 * @param {number} comment.id - 评论ID
			 * @param {number} comment.busid - 评论发布者ID
			 * @param {string} comment.status - 评论状态
			 */
			answers(comment)
			{
				if(!this.brid)
				{
					uni.$toast.error('请先登录')
					return false
				}
				
				this.MenuShow = true
				// 记录当前操作的评论信息，供后续删除/采纳使用
				this.comid = comment.id
				this.accept = comment.busid
				this.comstatus = comment.status
			},

			/**
			 * 删除评论
			 * 仅评论作者或被评论者可以删除
			 * @returns {Promise<void>}
			 */
			async delcom()
			{
				if(!this.brid)
				{
					uni.$toast.error('请先登录')
					return false
				}
				
				try {
					var data = {
						postid: this.postid,
						busid: this.brid,
						comid: this.comid,
					}
					
					var result = await uni.$u.http.post('/comment/del', data)
					
					if(result.code == 0)
					{
						uni.$toast.error(result.msg)
						return false
					}
					
					uni.$toast.success(result.msg)
							
					this.MenuShow = false
					this.AnswerShow = false
				} catch (error) {
					console.error('delcom error:', error)
					uni.$toast.error('删除失败，请稍后重试')
				}
			},

			/**
			 * 采纳评论（标记为最佳答案）
			 * 仅帖子作者可以采纳他人的回答
			 * @returns {Promise<void>}
			 */
			async select()
			{
				if(!this.brid)
				{
					uni.$toast.error('请先登录')
					return false
				}
				
				try {
					var data = {
						postid: this.postid,
						comid: this.comid,
						accept: this.accept
					}
					
					var result = await uni.$u.http.post('/post/select',data)
					
					if(result.code == 0)
					{
						uni.$toast.error(result.msg)
						return false
					}
					
					uni.$toast.success(result.msg)
				
					this.MenuShow = false
					this.AnswerShow = false
				} catch (error) {
					console.error('select error:', error)
					uni.$toast.error('操作失败，请稍后重试')
				}
			},

			/**
			 * 提交评论
			 * 先进行表单验证，通过后才发送请求
			 * @returns {Promise<void>}
			 */
			submit()
			{
				if(!this.brid)
				{
					uni.$toast.error('请先登录')
					return false
				}

				this.$refs.answer.validate()
				.then(async res => {
					try {
						var data = {
							postid: this.postid,
							pid: this.pid,
							content:this.answer.content,
							busid: this.busid
						}
						
						var result = await uni.$u.http.post('/post/answer',data)
						
						if(result.code == 0)
						{
							uni.$toast.error(result.msg)
							return false
						}
						
						uni.$toast.success(result.msg)
						
						this.MenuShow = false
						this.AnswerShow = false
					} catch (error) {
						console.error('submit error:', error)
						uni.$toast.error('提交失败，请稍后重试')
					}
				})
				.catch(error => {
					console.log(error)
					uni.$toast.error('内容不能为空')
				})
			}
		}
	}
</script>

<style lang="scss">
	/* 评论列表 */
	.comlist {
		margin-top: 16rpx;
	}

	.list .item {
		margin-bottom: 20rpx;
		padding: 30rpx;
		background: #fff;
		border-radius: 16rpx;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
	}

	/* 评论头部 */
	.item-header {
		display: flex;
		align-items: flex-start;

		.avatar-link {
			flex-shrink: 0;

			.avatar {
				width: 72rpx;
				height: 72rpx;
				border-radius: 50%;
				overflow: hidden;
				background-color: #f5f7fa;
			}
		}

		.item-author {
			flex: 1;
			margin-left: 20rpx;

			.author-name-row {
				display: flex;
				align-items: center;

				.author-name {
					font-size: 28rpx;
					font-weight: bold;
					color: #303133;
				}
			}

			.author-desc {
				font-size: 24rpx;
				color: #909399;
				margin-top: 8rpx;
				display: block;
			}
		}

		.item-time {
			font-size: 22rpx;
			color: #c0c4cc;
			flex-shrink: 0;
		}
	}

	/* 评论内容 */
	.item-content {
		padding: 24rpx 0;
		font-size: 28rpx;
		color: #303133;
		line-height: 1.6;
		word-break: break-all;

		.reply-to {
			color: #3c9cff;
		}
	}

	/* 底部操作栏 */
	.item-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-top: 20rpx;
		border-top: 1rpx solid #f5f5f5;

		.footer-left {
			display: flex;
			align-items: center;

			.action-btn {
				display: flex;
				align-items: center;
				padding: 10rpx 20rpx;
				border-radius: 8rpx;
				background: #f7f8fa;

				text {
					font-size: 24rpx;
					color: #909399;
					margin-left: 6rpx;

					&.active {
						color: #19be6b;
					}
				}
			}
		}

		.footer-right {
			.more-btn {
				width: 52rpx;
				height: 52rpx;
				display: flex;
				align-items: center;
				justify-content: center;
				border-radius: 50%;

				&:active {
					background: #f5f5f5;
				}
			}
		}
	}

	/* 操作菜单 */
	.menu {
		padding: 30rpx 30rpx 20rpx;
	}

	.menu-grid {
		display: flex;
		justify-content: center;
	}

	.menu-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 20rpx 50rpx;
	}

	/* 菜单图标：圆形渐变背景 */
	.menu-icon {
		width: 90rpx;
		height: 90rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		margin-bottom: 12rpx;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);
	}

	.comment-icon {
		background: linear-gradient(135deg, #0173de, #4cd964);
	}

	.accept-icon {
		background: linear-gradient(135deg, #19be6b, #0e9b55);
	}

	.delete-icon {
		background: linear-gradient(135deg, #ed4014, #c9360e);
	}

	.menu-text {
		font-size: 26rpx;
		color: #303133;
		font-weight: 500;
	}

	/* 评论输入框 */
	.answer {
		padding: 40rpx 30rpx;
	}

	.answer-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 30rpx;
	}

	.answer-title {
		font-size: 34rpx;
		font-weight: bold;
		color: #303133;
	}

	.answer :deep(.u-form) .u-button {
		margin-top: 40rpx;
	}
</style>
