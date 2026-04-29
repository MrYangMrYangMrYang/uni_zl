<template>
	<!-- 页面主容器：全宽背景色，最小高度占满整个视口 -->
	<view class="content">
		<!-- 顶部固定区域：包含搜索框和标签栏 -->
		<view class='header'>
			<!-- 搜索框区域：渐变背景 + 圆角搜索框 -->
			<view class='search'>
			  <!-- uView搜索组件配置：
			       - showAction: false → 隐藏右侧搜索按钮
			       - placeholder: 占位提示文字
			       - v-model: 双向绑定搜索关键词
			       - @search: 搜索事件回调
			       - shape: "round" → 圆角形状
			       - bgColor: 白色半透明背景（在渐变上更协调）
			       - borderColor: transparent → 无边框
			  -->
			  <u-search 
			    :showAction="false" 
			    placeholder="搜索你想知道的用户..." 
			    v-model="keywords" 
			    @search="search" 
			    shape="round" 
			    bgColor="rgba(255,255,255,0.95)" 
			    borderColor="transparent"
			  ></u-search>
			</view>
			
			<!-- 标签导航栏：我的关注 / 我的粉丝 -->
			<view class='nav'>
				<!-- uView标签组件配置：
				     - list: 标签数据源（关注/粉丝两个选项）
				     - @click: 标签点击事件回调
				     - lineWidth: 75 → 下划线宽度75rpx
				     - is-scroll: false → 禁止横向滚动（等分显示）
				     - current: 当前选中索引（active为'1'时显示粉丝，否则显示关注）
				     - activeStyle: 选中状态的文字样式（加粗、放大1.05倍）
				     - inactiveStyle: 未选中状态的文字样式（灰色、正常大小）
				     - itemStyle: 每个标签项的样式（flex:1等分，高度50px）
				-->
				<u-tabs 
					class="nav-item" 
					:list="cate"
					@click="CateToggle"
					lineWidth="75"
					:is-scroll="false"
					:current="active === '1' ? 1 : 0"
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

		<!-- 标签切换加载遮罩：切换标签时显示loading动画 -->
		<!-- v-if条件：switchingTab为true时显示 -->
		<view v-if="switchingTab" class="tab-loading-overlay">
			<!-- 圆形旋转loading图标，尺寸40rpx -->
			<u-loading-icon mode="circle" size="40"></u-loading-icon>
			<!-- 加载提示文字：灰色小字，距离图标16rpx -->
			<view style="margin-top: 16rpx; color: #999; font-size: 26rpx;">切换中...</view>
		</view>

		<!-- 初始加载遮罩：首次进入页面时显示loading动画 -->
		<!-- v-if条件：pageLoading为true时显示 -->
		<view v-if="pageLoading" class="tab-loading-overlay">
			<u-loading-icon mode="circle" size="40"></u-loading-icon>
			<view style="margin-top: 16rpx; color: #999; font-size: 26rpx;">加载中...</view>
		</view>

		<!-- ==================== 关注列表区域 ==================== -->
		<view class="list" v-if="(active === '0' || active === '') && !switchingTab && !pageLoading">
			<view v-for="(item, index) in attenlist" :key="index" v-if="attenlist.length > 0" class="swipe-action u-border-top u-border-bottom">
				<view class="item">
					<view class="business">
						<navigator :url="`/pages-business/user?busid=${item.business.id}`" class="avatar">
							<image mode="aspectFit" :src="item.business.avatar_text"></image>
						</navigator>
					</view>
					<view class="info">
						<navigator :url="`/pages-business/user?busid=${item.business.id}`" class="name">{{item.business.nickname}}</navigator>
						<view class="desc" v-if="item.business.lable">{{item.business.lable}}</view>
					</view>
				</view>
			</view>

			<u-empty v-if="attenlist.length === 0" mode="list" text="暂无关注"></u-empty>
			<view class="list-count" v-if="attenlist.length > 0">没有更多数据了</view>
		</view>

		<!-- ==================== 粉丝列表区域 ==================== -->
		<view class="list" v-if="active === '1' && !switchingTab && !pageLoading">
			<view v-for="(item, index) in fanslist" :key="index" v-if="fanslist.length > 0" class="swipe-action u-border-top u-border-bottom">
				<view class="item">
					<view class="business">
						<navigator :url="`/pages-business/user?busid=${item.business.id}`" class="avatar">
							<image mode="aspectFit" :src="item.business.avatar_text"></image>
						</navigator>
					</view>
					<view class="info">
						<navigator :url="`/pages-business/user?busid=${item.business.id}`" class="name">{{item.business.nickname}}</navigator>
						<view class="desc" v-if="item.business.lable">{{item.business.lable}}</view>
					</view>
				</view>
			</view>

			<u-empty v-if="fanslist.length === 0" mode="list" text="暂无粉丝"></u-empty>
			<view class="list-count" v-if="fanslist.length > 0">没有更多数据了</view>
		</view>

		<!-- 全局提示组件：用于显示操作反馈消息（成功/错误/警告） -->
		<u-toast ref="notice"></u-toast>
	</view>
</template>

<script>
/**
 * business/follow.vue - 关注/粉丝列表页
 *
 * 功能说明：
 * 1. 展示当前用户的关注列表或粉丝列表（通过 type 参数区分）
 * 2. 支持标签切换（关注 ↔ 粉丝），带缓存优化避免重复请求
 * 3. 支持关键词搜索过滤用户列表
 * 4. 数据去重处理（避免后端返回重复记录导致UI异常）
 * 5. 点击用户卡片可跳转到该用户的个人主页
 */

// 导入认证工具函数：登录检查、获取用户ID
import { checkLogin, getUserId } from '@/utils/auth.js'

export default {
	/**
	 * 页面生命周期：onLoad（页面加载时触发）
	 * 执行流程：
	 * 1. 检查用户是否已登录（未登录则阻止后续操作）
	 * 2. 获取当前登录用户的ID
	 * 3. 解析页面路由参数（判断是查看关注还是粉丝）
	 * 4. 根据参数自动切换到对应标签并加载数据
	 */
	onLoad() {
		// 第一步：调用工具函数检查登录状态
		if(!checkLogin()) {
			// 未登录：直接返回，不执行后续代码
			return
		}

		// 第二步：从本地存储获取当前登录用户的ID
		this.busid = getUserId()
		
		// 第三步：获取当前页面的路由参数
		// getCurrentPages()：获取当前页面栈数组
		const pages = getCurrentPages()
		// 取出栈顶页面（当前页面实例）
		const currentPage = pages[pages.length - 1]
		// 获取页面参数对象（URL查询参数）
		const options = currentPage.options || {}
		
		// 第四步：根据tab参数决定默认显示哪个列表
		if(options.tab === 'fans'){
			// 参数为'fans'：切换到粉丝标签并加载数据
			this.active = '1'
			this.FansData()
		} else {
			// 默认情况：显示关注标签并加载数据
			this.active = '0'
			this.AttentionData()
		}
	},
	
	/**
	 * 组件响应式数据定义
	 * 包含页面所需的所有状态变量
	 */
	data() {
		return {
			busid: 0,                    // 当前登录用户的ID（从auth工具获取）
			cate: [                       // 标签栏配置数据
				{name: '我的关注', id: '0'},   // 关注标签
				{name: '我的粉丝', id: '1'}    // 粉丝标签
			],
			active: '',                   // 当前选中的标签ID（'0'=关注，'1'=粉丝）
			attenlist: [],                // 关注列表数据（数组，每项包含business对象）
			fanslist: [],                 // 粉丝列表数据（数组结构同上）
			keywords: '',                 // 搜索关键词（双向绑定到搜索框）
			switchingTab: false,          // 标签切换loading状态（true=显示遮罩）
			pageLoading: true,            // 初始页面加载状态（true=显示初始loading）
			tabCache: {                   // 标签数据缓存（避免重复请求）
				'0': null,                // 关注列表缓存（null=未加载）
				'1': null                 // 粉丝列表缓存（null=未加载）
			}
		}
	},
	
	methods: {
		/**
		 * 加载关注列表数据
		 * 异步方法：向后端API请求当前用户的关注列表
		 * 
		 * 执行流程：
		 * 1. 构建请求参数（用户ID + 搜索关键词）
		 * 2. 发送POST请求到 /user/myattention 接口
		 * 3. 处理响应数据（成功/失败/异常）
		 * 4. 对数据进行去重处理
		 * 5. 缓存结果以供标签切换时复用
		 */
		async AttentionData() {
			try {
				// 构建请求体：包含当前用户ID和搜索关键词
				var data = {
					busid: this.busid,           // 当前登录用户ID
					keywords: this.keywords      // 搜索框输入的关键词
				}
				
				// 发送异步POST请求
				// custom: { toast: false } → 禁用全局错误提示（自行处理错误）
				var result = await uni.$u.http.post('/user/myattention', data, { custom: { toast: false } })
				
				// 判断业务逻辑是否成功（code==0表示失败）
				if(result.code == 0) {
					// 请求失败：清空关注列表
					this.attenlist = []
					// 同步更新缓存为空数组
					this.tabCache['0'] = []
					// 提前返回，不执行后续代码
					return false
				}
				
				// 请求成功：对返回数据进行去重处理
				// deduplicateList() 方法会根据用户ID去除重复记录
				this.attenlist = this.deduplicateList(result.data || [])
				// 将去重后的结果缓存起来（下次切换回此标签时直接使用）
				this.tabCache['0'] = this.attenlist
				
			} catch (error) {
				// 异常捕获：打印错误日志便于调试
				console.error('AttentionData error:', error)
				// 清空数据和缓存（保持一致性）
				this.attenlist = []
				this.tabCache['0'] = []
				
			} finally {
				// 无论成功还是失败都会执行：关闭所有loading状态
				this.switchingTab = false    // 关闭切换遮罩
				this.pageLoading = false     // 关闭初始加载遮罩
			}
		},

		/**
		 * 加载粉丝列表数据
		 * 结构与 AttentionData 完全对称，仅接口路径不同
		 * 
		 * @see AttentionData() - 逻辑完全相同，仅API端点为 /user/myfans
		 */
		async FansData() {
			try {
				// 构建请求参数（与关注列表相同）
				var data = {
					busid: this.busid,
					keywords: this.keywords
				}
				
				// 请求粉丝列表接口
				var result = await uni.$u.http.post('/user/myfans', data, { custom: { toast: false } })
				
				// 处理失败情况
				if(result.code == 0) {
					this.fanslist = []
					this.tabCache['1'] = []
					return false
				}
				
				// 成功：去重 + 缓存
				this.fanslist = this.deduplicateList(result.data || [])
				this.tabCache['1'] = this.fanslist
				
			} catch (error) {
				console.error('FansData error:', error)
				this.fanslist = []
				this.tabCache['1'] = []
				
			} finally {
				// 统一关闭loading状态
				this.switchingTab = false
				this.pageLoading = false
			}
		},

		/**
		 * 处理标签栏点击事件（带缓存优化机制）
		 * 
		 * 核心优化思路：
		 * - 首次切换到某个标签时：发送网络请求加载数据
		 * - 再次切回已加载过的标签时：直接从缓存恢复数据（无需重新请求）
		 * 
		 * @param {object} item - 被点击的标签对象 {name: 标签名, id: 标签ID}
		 */
		CateToggle(item) {
			// 提取被点击标签的ID
			const newActive = item.id
			
			// 如果点击的是当前已选中的标签，直接返回（不做任何处理）
			if (this.active === newActive) return

			// 更新当前激活的标签ID（触发视图重新渲染）
			this.active = newActive

			// 检查目标标签是否有缓存数据（null表示从未加载过）
			if (this.tabCache[newActive] !== null) {
				// ✅ 有缓存：直接从缓存恢复两个列表的数据
				// （虽然只显示一个列表，但需要同时恢复两个以保持数据完整性）
				this.attenlist = this.tabCache['0'] || []   // 恢复关注列表缓存
				this.fanslist = this.tabCache['1'] || []    // 恢复粉丝列表缓存
				
			} else {
				// ❌ 无缓存：开启切换loading遮罩，然后请求数据
				this.switchingTab = true

				// 根据选中的标签ID调用对应的数据加载方法
				if (newActive == '0') {
					// 点击"我的关注"：加载关注列表
					this.AttentionData()
				}
				if (newActive == '1') {
					// 点击"我的粉丝"：加载粉丝列表
					this.FansData()
				}
			}
		},

		/**
		 * 搜索功能处理函数
		 * 当用户在搜索框输入关键词并触发搜索时调用
		 * 
		 * 执行逻辑：
		 * 1. 清空当前列表数据（避免新旧数据混合）
		 * 2. 根据当前活跃标签重新请求数据（携带新的关键词）
		 * 3. 新数据会自动覆盖旧数据，实现搜索过滤效果
		 */
		search() {
			// 判断当前处于哪个标签页
			if(this.active == '0'){
				// 关注标签：先清空再重新加载
				this.attenlist = []
				this.AttentionData()
			}
			else if(this.active == '1'){
				// 粉丝标签：先清空再重新加载
				this.fanslist = []
				this.FansData()
			}
		},

		/**
		 * 数据去重工具方法
		 * 解决问题：后端可能因数据库异常返回重复的关注/粉丝记录
		 * 
		 * 去重策略：
		 * - 使用 Map 数据结构记录已出现的用户ID
		 * - 遍历列表时检查每个用户的ID是否已存在
		 * - 存在则过滤掉（return false），不存在则保留并记录
		 * 
		 * @param {Array} list - 原始数据列表（可能包含重复项）
		 * @returns {Array} 去重后的新数组
		 * 
		 * 使用示例：
		 * this.attenlist = this.deduplicateList(result.data)
		 */
		deduplicateList(list) {
			// 边界检查：空数组或null直接返回空数组
			if (!list || list.length === 0) return []
			
			// 创建Map用于记录已出现的用户ID（键值对：ID→布尔值）
			const seen = new Map()
			
			// 使用filter方法过滤重复项
			return list.filter(item => {
				// 提取去重关键字段（优先级：business.id > busid > id）
				const key = item.business?.id || item.busid || item.id
				
				// 检查该ID是否已经存在
				if (seen.has(key)) {
					// 已存在：返回false，过滤掉这条重复数据
					return false
				}
				
				// 不存在：将ID标记为已出现，保留这条数据
				seen.set(key, true)
				return true
			})
		}
	}
}
</script>

<style lang="scss">
/* ==================== 页面主容器样式 ==================== */
.content {
	width: 100%;                          /* 宽度撑满父容器 */
	background-color: $zl-bg-color;       /* 使用SCSS变量：浅灰背景色 */
	min-height: 100vh;                    /* 最小高度占满整个视口（确保滚动正常） */
}

/* ==================== Loading遮罩层样式 ==================== */
.tab-loading-overlay {
	display: flex;                        /* 弹性布局 */
	flex-direction: column;               /* 主轴方向：垂直排列（图标在上，文字在下） */
	align-items: center;                  /* 交叉轴居中：水平居中 */
	justify-content: center;              /* 主轴居中：垂直居中 */
	padding: 120rpx 0;                    /* 内边距：上下120rpx，左右0 */
	background-color: rgba(255, 255, 255, 0.95);  /* 白色半透明背景（轻微透明度） */
	position: relative;                   /* 相对定位（作为z-index的参考点） */
	z-index: 5;                           /* 层级高于列表内容但低于顶部导航 */
}

/* ==================== 顶部固定头部样式 ==================== */
.header {
	background-color: white;              /* 白色背景 */
	position: sticky;                     /* 粘性定位：滚动到顶部时固定不动 */
	top: 0;                               /* 距离顶部0（紧贴屏幕顶端） */
	z-index: 10;                          /* 最高层级（确保在所有内容之上） */
}

/* ==================== 搜索框区域样式 ==================== */
.search {
	height: 120rpx;                       /* 固定高度120rpx */
	background: $zl-gradient;             /* 使用SCSS变量：主题渐变色背景 */
	padding: 0 40rpx;                     /* 内边距：左右各40rpx */
	display: flex;                        /* 弹性布局 */
	align-items: center;                  /* 垂直居中对齐（让搜索框垂直居中） */
	box-shadow: 0 4rpx 12rpx rgba(60, 156, 255, 0.3);  /* 底部阴影：蓝色系，增加层次感 */
}

/* ==================== 标签导航栏样式 ==================== */
.nav {
	background-color: white;              /* 白色背景 */
	border-bottom: 1rpx solid $zl-border-color;  /* 底部分割线：使用SCSS变量颜色 */
}

/* ==================== 列表容器样式 ==================== */
.list {
	padding: 20rpx;                       /* 外边距：四周20rpx间距 */

	/* 单个用户卡片样式 */
	.item {
		display: flex;                     /* 弹性布局：水平排列头像和信息 */
		align-items: center;               /* 垂直居中对齐 */
		background-color: white;           /* 卡片白色背景 */
		padding: 24rpx;                    /* 内边距24rpx */
		margin-bottom: 20rpx;              /* 卡片之间间距20rpx */
		border-radius: 16rpx;              /* 圆角半径16rpx */
		box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);  /* 轻微阴影：增加卡片悬浮感 */
	}
}

/* ==================== 头像区域样式 ==================== */
.business {
	width: 100rpx;                        /* 固定宽度100rpx */
	height: 100rpx;                       /* 固定高度100rpx（正方形） */
	flex-shrink: 0;                       /* 禁止压缩（确保头像不被挤压变形） */
	margin-right: 24rpx;                  /* 右侧间距24rpx（与信息区的间隔） */

	/* 头像图片容器 */
	.avatar {
		width: 100%;                       /* 宽度继承父元素100% */
		height: 100%;                      /* 高度继承父元素100% */
		border-radius: $uni-border-radius-circle;  /* 圆形裁剪（使用SCSS变量） */
		overflow: hidden;                 /* 隐藏超出圆形范围的部分 */
		background-color: $uni-bg-color-grey;     /* 图片加载前的占位背景色（灰色） */

		/* 头像图片本身 */
		image {
			width: 100%;                   /* 宽度填满容器 */
			height: 100%;                  /* 高度填满容器 */
		}
	}
}

/* ==================== 用户信息区域样式 ==================== */
.info {
	flex: 1;                              /* 弹性增长：占据剩余的所有空间 */
	display: flex;                        /* 弹性布局 */
	flex-direction: column;               /* 垂直排列（昵称在上，简介在下） */
	justify-content: center;              /* 垂直居中（让内容在卡片内垂直居中） */

	/* 用户昵称样式 */
	.nickname {
		font-size: $uni-font-size-base;    /* 字体大小：使用SCSS基础字号变量 */
		font-weight: bold;                 /* 加粗字体（突出显示） */
		color: $uni-text-color;            /* 文字颜色：主文本色（深色） */
		margin-bottom: 8rpx;              /* 与下方简介的间距8rpx */
	}

	/* 用户简介/标签样式 */
	.desc {
		font-size: 24rpx;                  /* 字体较小：24rpx（次要信息） */
		color: $uni-text-color-grey;       /* 灰色文字（次要信息用浅色） */
		overflow: hidden;                 /* 隐藏溢出内容 */
		white-space: nowrap;              /* 禁止换行（强制单行显示） */
		text-overflow: ellipsis;          /* 文本溢出时显示省略号(...) */
	}
}

/* ==================== 列表底部提示样式 ==================== */
.list-count {
	text-align: center;                   /* 文字居中对齐 */
	font-size: 24rpx;                     /* 小字号：24rpx */
	color: $uni-text-color-grey;         /* 灰色文字（弱化显示） */
	padding: 20rpx 0;                    /* 上下内边距20rpx */
}

/* ==================== 标签栏深度样式覆盖 ==================== */
/* 使用 ::v-deep 穿透组件作用域，修改uView内部样式 */
.nav {
	::v-deep .u-tabs {
		/* 标签导航条容器：强制等分布局 */
		.u-tabs__wrapper__nav {
			display: flex !important;      /* 弹性布局 */
			width: 100% !important;        /* 宽度100%（撑满整行） */
		}

		/* 单个标签项：等分且居中 */
		.u-tabs__wrapper__nav__item {
			flex: 1 !important;            /* 等分剩余空间 */
			display: flex !important;       /* 弹性布局 */
			justify-content: center !important;  /* 水平居中 */
			align-items: center !important;     /* 垂直居中 */
		}
	}
}
</style>
