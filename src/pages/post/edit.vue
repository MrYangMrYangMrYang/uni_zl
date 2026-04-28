<template>
	<view>
		<!-- 头部区域：渐变背景 + 标题描述 -->
		<view class="info">
		  <text class="title">修改提问</text>
		  <text class="desc">
			您可以在本页录入您的提问信息，录入成功后将会出现在首页的悬赏大厅中，等待其他用户的回复。
		  </text>
		</view>
	  
		<!-- 表单区域：使用 uView 表单组件自带验证 -->
		<view class="post">
			<u--form labelPosition="top" labelWidth="150" :model="post" :rules="rules" ref="post">
				<!-- 标题输入项 -->
				<u-form-item
					label="提问标题："
					prop="title"
					ref="title"
				>
					<u--input v-model="post.title" placeholder="请输入提问标题"></u--input>
				</u-form-item>

				<!-- 描述输入项 -->
				<u-form-item
					label="提问描述："
					prop="content"
					ref="content"
				>
					<u--textarea v-model="post.content" placeholder="请输入提问描述"></u--textarea>
				</u-form-item>

				<!-- 分类选择项：点击弹出选择器 -->
				<u-form-item
					label="提问分类："
					prop="cate"
					ref="cate"
					@click="CateShow = true"
				>
					<u--input v-model="post.cate" placeholder="请选择提问分类" readonly></u--input>
				</u-form-item>
				
				<!-- 分类选择器：设置默认选中项 -->
				<u-picker :defaultIndex="CateDefault" :show="CateShow" :columns="CateData" keyName="name" @cancel="CateShow = false" @confirm="CateCheck"></u-picker>

				<!-- 积分输入项 -->
				<u-form-item
					label="悬赏积分："
					prop="point"
					ref="point"
				>
					<u--input v-model="post.point" placeholder="请输入悬赏积分"></u--input>
				</u-form-item>

				<!-- 提交按钮：渐变主题色 -->
				<view class="btn">
					<u-button type="primary" text="提交修改" formType="submit" @click="submit" :customStyle="{background: 'linear-gradient(135deg, #0173de, #4cd964)'}"></u-button>
				</view>
			</u--form>
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
 * - 使用 uView 表单验证规则
 * - 修改成功后自动跳转到帖子详情页
 */
import { checkLogin, getUserInfo } from '@/utils/auth.js'

export default {
	/**
	 * 页面生命周期 - onLoad
	 * 按顺序执行：登录检查 → 获取用户信息 → 加载分类 → 加载帖子数据
	 * @param {object} option - 路由参数对象，包含 postid
	 */
	async onLoad(option) {
		if (!checkLogin(false)) {
			uni.$u.route({ type: 'navigateBack', delta: 1 })
			return
		}

		this.business = getUserInfo()

		var postid = option.postid ? option.postid : 0
		this.postid = postid

		await this.CateList()
		await this.PostData()
	},

	/**
	 * 页面生命周期 - onReady
	 * 页面初次渲染完成时设置表单验证规则
	 */
	onReady() {
		this.$refs.post.setRules(this.rules)
	},

	data() {
		return {
			postid: 0,                // 要编辑的帖子ID
			business: {},             // 当前登录用户信息
			CateShow: false,          // 分类选择器是否显示
			CateData: [[]],           // 分类选择器数据源
			CateDefault: [0],         // 分类选择器默认选中索引
			post: {                   // 帖子表单数据（回填后使用）
				title: '',
				content: '',
				point: '',
				cateid: '',
				cate: ''
			},
			rules: {                  // uView 表单验证规则
				title: {
					type: 'string',
					required: true,
					message: '请填写提问标题',
					trigger: ['blur', 'change']
				},
				content: {
					type: 'string',
					required: true,
					message: '请描述一下问题的详细内容',
					trigger: ['blur', 'change']
				},
				point: {
					type: 'number',
					required: true,
					message: '请填写悬赏积分',
					trigger: ['blur', 'change']
				},
				cate: {
					type: 'string',
					required: true,
					message: '请选择提问分类',
					trigger: ['blur', 'change']
				},
			}
		}
	},

	methods: {
		/**
		 * 加载分类列表数据
		 * @returns {Promise<void>}
		 */
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

		/**
		 * 加载帖子详情数据并回填表单
		 * 同时根据帖子的分类ID定位选择器的默认选中项
		 * @returns {Promise<void>}
		 */
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

				// 回填帖子数据到表单
				this.post = result.data.post
				this.post.cate = result.data.post.category.name

				// 遍历分类列表，找到当前帖子分类对应的索引
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

		/**
		 * 分类选择确认回调
		 * @param {object} e - 选择器返回的对象 {value: [{name, id}]}
		 */
		CateCheck(e) {
			this.CateShow = false
			this.post.cate = e.value[0].name
			this.post.cateid = e.value[0].id
		},

		/**
		 * 表单提交处理函数
		 * 流程：登录检查 → uView表单验证 → 发送修改请求 → 跳转详情页
		 */
		submit() {
			if (!checkLogin()) return

			this.$refs.post.validate()
				.then(async res => {
					var result = await uni.$u.http.post('/post/edit', this.post)

					if (result.code == 0) {
						uni.$toast.error(result.msg)
						return false
					}

					uni.$toast.successAndNavigate(result.msg, result.url, false, { postid: result.data.postid })
				})
				.catch(error => {
					console.log(error)
					uni.$toast.error('请完善帖子标题、分类和内容')
				})
		}
	}
}
</script>

<style>
	/* 头部区域：渐变背景 */
	.info {
		width: 100%;
		padding:40px;
		display: flex;
		flex-direction: column;
		align-items: left;
		background: linear-gradient(rgb(1,115,222), rgb(78,169,245));
		color:white;
	}

	.info .title{
		font-size:1.2em;
	}

	.info .desc{
		width: 85%;
		font-size:.9em;
	}

	/* 表单区域 */
	.post{
		width:95%;
		margin:10px auto;
	}

	/* 提交按钮 */
	.btn{
		width:60%;
		margin:0 auto;
		margin-top:10px;
	}
</style>