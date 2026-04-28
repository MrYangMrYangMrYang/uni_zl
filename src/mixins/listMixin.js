/**
 * 通用列表分页 Mixin
 *
 * 职责：封装分页加载逻辑（下拉刷新、上拉加载更多）、管理加载状态
 *
 * @module mixins/listMixin
 *
 * @example
 * import { listMixin } from '@/mixins/listMixin'
 * export default {
 *   mixins: [listMixin],
 *   methods: {
 *     async getListData() { ... }  // 必须实现此方法
 *   }
 * }
 */
export const listMixin = {

	data() {
		return {
			list: [],                  // 列表数据数组
			page: 1,                   // 当前页码，从1开始
			pagesize: 10,              // 每页加载数量
			total: 0,                  // 数据总条数（由后端返回）
			loadStatus: 'loadmore',    // 加载状态：loadmore / loading / nomore
			isLoading: false,          // 是否正在请求中（防止重复请求）
			extraParams: {}            // 额外请求参数（如搜索关键词、分类ID等）
		}
	},

	/** 监听用户下拉刷新 */
	onPullDownRefresh() {
		this.refreshList()
	},

	/** 监听用户上拉触底 */
	onReachBottom() {
		this.loadMore()
	},

	methods: {

		/**
		 * 刷新列表（重置所有状态并重新加载第一页）
		 * 通常在下拉刷新时调用
		 * @returns {Promise<void>}
		 */
		async refreshList() {
			this.page = 1
			this.total = 0
			this.list = []
			this.loadStatus = 'loadmore'
			await this.getListData()
			uni.stopPullDownRefresh()  // 停止下拉刷新动画
		},

		/**
		 * 加载下一页数据
		 * 通常在上拉触底时调用
		 * @returns {Promise<void>}
		 */
		async loadMore() {
			// 正在请求或已无更多数据时直接返回
			if (this.isLoading || this.loadStatus === 'nomore') return

			// 已加载数据量达到总条数，标记为无更多
			if (this.list.length >= this.total && this.total > 0) {
				this.loadStatus = 'nomore'
				return
			}

			this.page++  // 页码自增
			await this.getListData()
		},

		/**
		 * 获取列表数据的抽象方法（需在组件内覆盖实现）
		 * 子组件必须实现此方法来调用具体的接口
		 * @abstract
		 * @returns {Promise<void>}
		 */
		async getListData() {
			console.warn('请在页面组件中实现 getListData 方法')
		},

		/**
		 * 处理接口返回的数据（统一处理逻辑）
		 * @param {object} result - 接口返回的数据对象
		 * @param {number} result.code - 状态码（1=成功）
		 * @param {Array} result.data - 当前页数据数组
		 * @param {number} [result.total] - 数据总条数
		 */
		handleResponse(result) {
			this.isLoading = false

			if (result.code === 1) {
				const newData = result.data || []
				this.list = [...this.list, ...newData]  // 合并新旧数据

				// 计算总条数：优先后端返回值，否则根据数据量估算
				this.total = result.total || (this.list.length + (newData.length < this.pagesize ? 0 : 1))

				// 判断是否还有更多数据
				if (this.list.length >= this.total || newData.length < this.pagesize) {
					this.loadStatus = 'nomore'
				} else {
					this.loadStatus = 'loadmore'
				}
			} else {
				this.loadStatus = 'loadmore'  // 失败时重置状态允许重试
				uni.$u.toast(result.msg || '数据加载失败')
			}
		}
	}
}
